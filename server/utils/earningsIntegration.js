// File: utils/earningsIntegration.js
import { calculateCommission, getCommissionRate } from '../config/stripe.js'
import Earnings from '../models/Earnings.js'
import User from '../models/User.js'

// Create earning when a user subscribes (call this from your existing subscription logic)
export const createEarningForSubscription = async (
  subscriptionData,
  userId
) => {
  try {
    // Get the user who subscribed
    const subscribedUser = await User.findById(userId)
    if (!subscribedUser || !subscribedUser.referredBy) {
      return null // No referrer, no commission
    }

    // Get the referrer
    const referrer = await User.findById(subscribedUser.referredBy)
    if (!referrer) {
      console.log('Referrer not found')
      return null
    }

    // Calculate commission
    const commissionRate = getCommissionRate(subscriptionData.plan)
    const commissionAmount = calculateCommission(
      subscriptionData.amount,
      subscriptionData.plan
    )

    // Create earning record
    const earning = new Earnings({
      user: referrer._id,
      referredUser: subscribedUser._id,
      source: 'subscription_purchase',
      subscription: subscriptionData._id,
      grossAmount: subscriptionData.amount,
      commissionRate,
      commissionAmount,
      currency: subscriptionData.currency || 'USD',
      status: subscriptionData.status === 'trialing' ? 'pending' : 'approved', // Auto-approve non-trial subscriptions
      description: `Subscription commission for ${subscriptionData.plan} plan`,
      metadata: {
        planType: subscriptionData.plan,
        billingCycle: subscriptionData.billingCycle,
      },
    })

    await earning.save()

    // Update referrer's referral stats
    const existingReferral = referrer.referrals.find(
      (ref) => ref.user.toString() === subscribedUser._id.toString()
    )

    if (existingReferral && !existingReferral.hasSubscribed) {
      existingReferral.hasSubscribed = true
      existingReferral.subscriptionValue = subscriptionData.amount
      referrer.referralStats.paidReferrals += 1
      referrer.referralStats.conversionRate =
        (referrer.referralStats.paidReferrals /
          referrer.referralStats.totalReferrals) *
        100
      await referrer.save()
    }

    // Update referrer's earnings info
    await referrer.updateEarningsInfo()

    console.log(
      `Created earning for referrer ${referrer.email}: $${
        commissionAmount / 100
      }`
    )
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
    }

    console.log(
      `Approved ${earnings.length} earnings for subscription ${subscriptionId}`
    )
    return earnings
  } catch (error) {
    console.error('Error approving earnings after payment:', error)
    throw error
  }
}

// Create earning for subscription renewals
export const createRenewalEarning = async (
  subscriptionData,
  paymentIntentId
) => {
  try {
    // Find the original subscription earning to get the referrer
    const originalEarning = await Earnings.findOne({
      subscription: subscriptionData._id,
      source: 'subscription_purchase',
    }).populate('user referredUser')

    if (!originalEarning) {
      return null // No original earning found
    }

    // Calculate commission for renewal (you might want different rates for renewals)
    const commissionRate = getCommissionRate(subscriptionData.plan) * 0.5 // 50% of original commission for renewals
    const commissionAmount = Math.floor(
      subscriptionData.amount * commissionRate
    )

    // Create renewal earning
    const renewalEarning = new Earnings({
      user: originalEarning.user._id,
      referredUser: originalEarning.referredUser._id,
      source: 'subscription_renewal',
      subscription: subscriptionData._id,
      grossAmount: subscriptionData.amount,
      commissionRate,
      commissionAmount,
      currency: subscriptionData.currency || 'USD',
      status: 'approved', // Auto-approve renewals
      stripePaymentIntentId: paymentIntentId,
      description: `Renewal commission for ${subscriptionData.plan} plan`,
      metadata: {
        planType: subscriptionData.plan,
        billingCycle: subscriptionData.billingCycle,
        originalEarningId: originalEarning._id,
      },
    })

    await renewalEarning.save()

    // Update user earnings info
    const user = await User.findById(originalEarning.user._id)
    if (user) {
      await user.updateEarningsInfo()
    }

    console.log(`Created renewal earning: $${commissionAmount / 100}`)
    return renewalEarning
  } catch (error) {
    console.error('Error creating renewal earning:', error)
    throw error
  }
}
