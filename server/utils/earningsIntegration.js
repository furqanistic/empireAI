// File: utils/earningsIntegration.js - COMPLETE WITH SUB-AFFILIATE SYSTEM
import { calculateCommission, getCommissionRate } from '../config/stripe.js'
import Earnings from '../models/Earnings.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import NotificationService from '../services/notificationService.js'

// Sub-affiliate commission rate (10% of the referrer's earning)
const SUB_AFFILIATE_RATE = 0.1

// Create earning when a user subscribes - WITH SUB-AFFILIATE SUPPORT
export const createEarningForSubscription = async (
  subscriptionData,
  userId
) => {
  try {
    // CRITICAL: Check if this is a gifted subscription - NO EARNINGS FOR GIFTED
    if (subscriptionData.isGifted === true) {
      console.log(
        `⚠️ Skipping earnings creation for gifted subscription (User: ${userId})`
      )
      return null
    }

    // Get the user who subscribed
    const subscribedUser = await User.findById(userId).populate('referredBy')
    if (!subscribedUser || !subscribedUser.referredBy) {
      console.log('No referrer found - no earnings to create')
      return null
    }

    // Get the referrer (direct referral - Level 1)
    const referrer = subscribedUser.referredBy
    if (!referrer) {
      console.log('Referrer not found')
      return null
    }

    // Calculate commission for direct referrer
    const commissionRate = getCommissionRate(subscriptionData.plan)
    const commissionAmount = calculateCommission(
      subscriptionData.amount,
      subscriptionData.plan
    )

    if (commissionAmount === 0) {
      console.warn('Commission amount is 0 - skipping earning creation')
      return null
    }

    // Create earning record for direct referrer (Level 1)
    const earning = new Earnings({
      user: referrer._id,
      referredUser: subscribedUser._id,
      source: 'subscription_purchase',
      subscription: subscriptionData._id,
      grossAmount: subscriptionData.amount,
      commissionRate,
      commissionAmount,
      currency: subscriptionData.currency || 'USD',
      status: subscriptionData.status === 'trialing' ? 'pending' : 'approved',
      description: `${subscriptionData.plan} plan purchase by ${subscribedUser.name}`,
      metadata: {
        planType: subscriptionData.plan,
        billingCycle: subscriptionData.billingCycle,
        isGifted: false,
      },
    })

    await earning.save()

    console.log(
      `✅ Created Level 1 earning for ${referrer.name}: $${(
        commissionAmount / 100
      ).toFixed(2)}`
    )

    // Update referrer's referral stats
    try {
      const existingReferral = referrer.referrals.find(
        (ref) => ref.user.toString() === subscribedUser._id.toString()
      )

      if (existingReferral && !existingReferral.hasSubscribed) {
        existingReferral.hasSubscribed = true
        existingReferral.subscriptionValue = subscriptionData.amount

        if (!referrer.referralStats.paidReferrals) {
          referrer.referralStats.paidReferrals = 0
        }
        referrer.referralStats.paidReferrals += 1

        if (referrer.referralStats.totalReferrals > 0) {
          referrer.referralStats.conversionRate =
            (referrer.referralStats.paidReferrals /
              referrer.referralStats.totalReferrals) *
            100
        }

        await referrer.save()
      }

      // Update referrer's earnings info
      await referrer.updateEarningsInfo()
    } catch (statsError) {
      console.error('Error updating referral stats:', statsError)
      // Don't fail the earning creation if stats update fails
    }

    // Send notification to direct referrer
    try {
      await NotificationService.createNotification(referrer._id, {
        title: '💰 New Commission Earned!',
        message: `You earned $${(commissionAmount / 100).toFixed(2)} from ${
          subscribedUser.name
        }'s ${subscriptionData.plan} plan purchase!`,
        type: 'commission_earned',
        priority: 'high',
        data: {
          earningId: earning._id,
          amount: commissionAmount,
          plan: subscriptionData.plan,
          referredUserName: subscribedUser.name,
        },
      })
    } catch (notifError) {
      console.error('Error sending commission notification:', notifError)
    }

    // ========================================================================
    // SUB-AFFILIATE COMMISSION (Level 2 - 2-tier system)
    // If the referrer was also referred by someone, give them 10% of this earning
    // ========================================================================
    if (referrer.referredBy) {
      try {
        const subAffiliateCommission = Math.floor(
          commissionAmount * SUB_AFFILIATE_RATE
        )

        if (subAffiliateCommission > 0) {
          const subAffiliate = await User.findById(referrer.referredBy)

          if (subAffiliate) {
            // Create sub-affiliate earning (Level 2)
            const subEarning = new Earnings({
              user: subAffiliate._id,
              referredUser: subscribedUser._id,
              source: 'subscription_purchase',
              subscription: subscriptionData._id,
              grossAmount: subscriptionData.amount,
              commissionRate: SUB_AFFILIATE_RATE,
              commissionAmount: subAffiliateCommission,
              currency: subscriptionData.currency || 'USD',
              status:
                subscriptionData.status === 'trialing' ? 'pending' : 'approved',
              description: `Sub-affiliate commission: ${subscribedUser.name} referred by ${referrer.name}`,
              metadata: {
                planType: subscriptionData.plan,
                billingCycle: subscriptionData.billingCycle,
                isGifted: false,
                isSubAffiliate: true,
                originalEarningId: earning._id,
                level: 2,
              },
            })

            await subEarning.save()

            console.log(
              `✅ Created Level 2 (sub-affiliate) earning for ${
                subAffiliate.name
              }: $${(subAffiliateCommission / 100).toFixed(2)}`
            )

            // Update sub-affiliate's earnings info
            await subAffiliate.updateEarningsInfo()

            // Send notification to sub-affiliate
            await NotificationService.createNotification(subAffiliate._id, {
              title: '🎯 Sub-Affiliate Commission!',
              message: `You earned $${(subAffiliateCommission / 100).toFixed(
                2
              )} from your referral network (${referrer.name} → ${
                subscribedUser.name
              })`,
              type: 'commission_earned',
              priority: 'medium',
              data: {
                earningId: subEarning._id,
                amount: subAffiliateCommission,
                level: 2,
                directReferrer: referrer.name,
                subscriber: subscribedUser.name,
              },
            })
          }
        }
      } catch (subAffiliateError) {
        console.error(
          'Error creating sub-affiliate commission:',
          subAffiliateError
        )
        // Don't fail the main earning creation if sub-affiliate fails
      }
    }

    return earning
  } catch (error) {
    console.error('Error creating earning for subscription:', error)
    throw error
  }
}

// Auto-approve earnings when trial period ends or payment succeeds
export const approveEarningAfterPayment = async (
  subscriptionId,
  paymentIntentId
) => {
  try {
    // First check if the subscription is gifted
    const subscription = await Subscription.findById(subscriptionId)

    if (!subscription) {
      console.log(`⚠️ Subscription not found: ${subscriptionId}`)
      return []
    }

    if (subscription.isGifted) {
      console.log(
        `⚠️ Skipping earnings approval for gifted subscription: ${subscriptionId}`
      )
      return []
    }

    // Find all pending earnings for this subscription (includes sub-affiliate)
    const earnings = await Earnings.find({
      subscription: subscriptionId,
      status: 'pending',
    })

    for (const earning of earnings) {
      earning.status = 'approved'
      earning.approvedAt = new Date()
      earning.stripePaymentIntentId = paymentIntentId
      await earning.save()

      // Update user earnings info
      const user = await User.findById(earning.user)
      if (user) {
        await user.updateEarningsInfo()
      }

      console.log(
        `✅ Approved earning ${earning._id} for user ${
          user?.name || earning.user
        }`
      )
    }

    console.log(
      `✅ Approved ${earnings.length} earnings (including sub-affiliates) for subscription ${subscriptionId}`
    )
    return earnings
  } catch (error) {
    console.error('Error approving earnings after payment:', error)
    throw error
  }
}

// Create earning for subscription renewals - WITH SUB-AFFILIATE
export const createRenewalEarning = async (
  subscriptionData,
  paymentIntentId
) => {
  try {
    // CRITICAL: Check if this is a gifted subscription
    if (subscriptionData.isGifted === true) {
      console.log(
        `⚠️ Skipping renewal earnings for gifted subscription: ${subscriptionData._id}`
      )
      return null
    }

    // Find the original subscription earning to get the referrer
    const originalEarning = await Earnings.findOne({
      subscription: subscriptionData._id,
      source: 'subscription_purchase',
      'metadata.isSubAffiliate': { $ne: true }, // Get the direct referral earning
    }).populate('user referredUser')

    if (!originalEarning) {
      console.log('No original earning found for renewal')
      return null
    }

    // Calculate renewal commission (40% same as initial - not 50%)
    const commissionRate = getCommissionRate(subscriptionData.plan)
    const commissionAmount = calculateCommission(
      subscriptionData.amount,
      subscriptionData.plan
    )

    if (commissionAmount === 0) {
      console.warn('Renewal commission amount is 0')
      return null
    }

    // Create renewal earning for direct referrer (Level 1)
    const renewalEarning = new Earnings({
      user: originalEarning.user._id,
      referredUser: originalEarning.referredUser._id,
      source: 'subscription_renewal',
      subscription: subscriptionData._id,
      grossAmount: subscriptionData.amount,
      commissionRate,
      commissionAmount,
      currency: subscriptionData.currency || 'USD',
      status: 'approved', // Auto-approve renewals after successful payment
      stripePaymentIntentId: paymentIntentId,
      description: `Renewal commission for ${subscriptionData.plan} plan`,
      metadata: {
        planType: subscriptionData.plan,
        billingCycle: subscriptionData.billingCycle,
        originalEarningId: originalEarning._id,
        isGifted: false,
        isRenewal: true,
      },
    })

    await renewalEarning.save()

    console.log(
      `✅ Created renewal earning: $${(commissionAmount / 100).toFixed(2)}`
    )

    // Update user earnings info
    const user = await User.findById(originalEarning.user._id)
    if (user) {
      await user.updateEarningsInfo()

      // Send renewal notification
      try {
        await NotificationService.createNotification(user._id, {
          title: '🔄 Renewal Commission!',
          message: `${originalEarning.referredUser.name} renewed their ${
            subscriptionData.plan
          } plan - you earned $${(commissionAmount / 100).toFixed(2)}!`,
          type: 'commission_earned',
          priority: 'medium',
          data: {
            earningId: renewalEarning._id,
            amount: commissionAmount,
            plan: subscriptionData.plan,
            isRenewal: true,
          },
        })
      } catch (notifError) {
        console.error('Error sending renewal notification:', notifError)
      }
    }

    // ========================================================================
    // SUB-AFFILIATE RENEWAL COMMISSION (Level 2)
    // ========================================================================
    if (user && user.referredBy) {
      try {
        const subAffiliateCommission = Math.floor(
          commissionAmount * SUB_AFFILIATE_RATE
        )

        if (subAffiliateCommission > 0) {
          const subAffiliate = await User.findById(user.referredBy)

          if (subAffiliate) {
            // Create sub-affiliate renewal earning
            const subRenewalEarning = new Earnings({
              user: subAffiliate._id,
              referredUser: originalEarning.referredUser._id,
              source: 'subscription_renewal',
              subscription: subscriptionData._id,
              grossAmount: subscriptionData.amount,
              commissionRate: SUB_AFFILIATE_RATE,
              commissionAmount: subAffiliateCommission,
              currency: subscriptionData.currency || 'USD',
              status: 'approved',
              stripePaymentIntentId: paymentIntentId,
              description: `Sub-affiliate renewal: ${originalEarning.referredUser.name} via ${user.name}`,
              metadata: {
                planType: subscriptionData.plan,
                billingCycle: subscriptionData.billingCycle,
                originalEarningId: renewalEarning._id,
                isGifted: false,
                isSubAffiliate: true,
                isRenewal: true,
                level: 2,
              },
            })

            await subRenewalEarning.save()

            console.log(
              `✅ Created Level 2 renewal earning for ${subAffiliate.name}: $${(
                subAffiliateCommission / 100
              ).toFixed(2)}`
            )

            // Update sub-affiliate's earnings info
            await subAffiliate.updateEarningsInfo()
          }
        }
      } catch (subAffiliateError) {
        console.error(
          'Error creating sub-affiliate renewal commission:',
          subAffiliateError
        )
      }
    }

    return renewalEarning
  } catch (error) {
    console.error('Error creating renewal earning:', error)
    throw error
  }
}

// Cancel earnings if subscription is cancelled or refunded - NEW FUNCTION
export const cancelEarningsForSubscription = async (subscriptionId, reason) => {
  try {
    console.log(`Cancelling earnings for subscription: ${subscriptionId}`)

    // Find all pending/approved earnings for this subscription
    const earnings = await Earnings.find({
      subscription: subscriptionId,
      status: { $in: ['pending', 'approved'] },
    })

    if (earnings.length === 0) {
      console.log('No earnings found to cancel')
      return []
    }

    for (const earning of earnings) {
      earning.status = 'cancelled'
      earning.cancelledAt = new Date()
      earning.cancellationReason = reason
      await earning.save()

      // Update user's earnings info
      const user = await User.findById(earning.user)
      if (user) {
        await user.updateEarningsInfo()
      }

      console.log(`✅ Cancelled earning ${earning._id} - Reason: ${reason}`)
    }

    console.log(
      `✅ Cancelled ${earnings.length} earnings (including sub-affiliates)`
    )
    return earnings
  } catch (error) {
    console.error('Error cancelling earnings:', error)
    throw error
  }
}
