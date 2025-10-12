// File: controllers/stripe.js - UPDATED: REMOVED TRIAL FUNCTIONALITY
import {
  calculateDiscountedAmount,
  createOrRetrieveCustomer,
  createOrRetrieveReferralCoupon,
  getAllPlans,
  getAmount,
  getPlanDetails,
  getPriceId,
  REFERRAL_DISCOUNT,
  stripe,
  validatePlanAndBilling,
} from '../config/stripe.js'
import { createError } from '../error.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
// Import notification service
import NotificationService from '../services/notificationService.js'
// Import earnings integration
import {
  approveEarningAfterPayment,
  cancelEarningsForSubscription,
  createEarningForSubscription,
  createRenewalEarning,
} from '../utils/earningsIntegration.js'

// Helper function to sync User model subscription field
const updateUserSubscriptionField = async (userId, subscription) => {
  try {
    const statusMapping = {
      active: 'active',
      past_due: 'active',
      canceled: 'cancelled',
      unpaid: 'inactive',
      incomplete: 'inactive',
      incomplete_expired: 'inactive',
    }

    const updateData = {
      subscription: {
        plan: subscription.plan,
        status: statusMapping[subscription.status] || 'inactive',
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
        isActive: subscription.isActive,
        daysRemaining: subscription.daysRemaining,
      },
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true })

    // Automatic Discord role update
    if (user?.discord?.isConnected) {
      try {
        const { updateUserDiscordRoles } = await import('./discordAuth.js')
        const discordResult = await updateUserDiscordRoles(user)
      } catch (discordError) {
        console.error('Error auto-updating Discord roles:', discordError)
      }
    }

    return user
  } catch (error) {
    console.error('Error updating user subscription field:', error)
    return null
  }
}

// Get all available plans
export const getPlans = async (req, res, next) => {
  try {
    const plans = getAllPlans()

    res.status(200).json({
      status: 'success',
      data: {
        plans,
        referralDiscount: {
          percentage: REFERRAL_DISCOUNT.percentage,
          description: REFERRAL_DISCOUNT.description,
          availableFor: 'First month only with valid referral code',
        },
      },
    })
  } catch (error) {
    console.error('Error getting plans:', error)
    next(createError(500, 'Failed to retrieve plans'))
  }
}

// Create a checkout session for new subscription - UPDATED: REMOVED TRIAL FUNCTIONALITY
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { planName, billingCycle = 'monthly' } = req.body
    const user = req.user

    if (!planName) {
      return next(createError(400, 'Plan name is required'))
    }

    // Validate plan and billing cycle
    validatePlanAndBilling(planName, billingCycle)

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active'] }, // Removed 'trialing' status
    })

    if (existingSubscription) {
      return next(createError(400, 'You already have an active subscription'))
    }

    // Create or retrieve Stripe customer
    const customer = await createOrRetrieveCustomer(user)

    // Update user with Stripe customer ID if not already set
    if (!user.stripeCustomerId) {
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customer.id,
      })
    }

    const priceId = getPriceId(planName, billingCycle)

    const successUrl = `${process.env.FRONTEND_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.FRONTEND_URL}/pricing?canceled=true`

    // Check if user has a referral and apply discount
    let discountCoupon = null
    let hasReferralDiscount = false

    // Check if user was referred by someone (and hasn't used a discount before)
    const userWithReferral = await User.findById(user._id).populate(
      'referredBy',
      'name referralCode'
    )

    if (
      userWithReferral.referredBy &&
      !userWithReferral.hasUsedReferralDiscount
    ) {
      console.log(
        `User ${user.email} has referral from ${userWithReferral.referredBy.name}, applying 10% discount`
      )

      try {
        // Create or retrieve the referral discount coupon
        discountCoupon = await createOrRetrieveReferralCoupon()
        hasReferralDiscount = true

        console.log(`✅ Referral discount coupon ready: ${discountCoupon.id}`)
      } catch (couponError) {
        console.error('Error setting up referral discount:', couponError)
        // Continue without discount if there's an error
        hasReferralDiscount = false
      }
    }

    // Create checkout session configuration - REMOVED TRIAL FUNCTIONALITY
    const sessionConfig = {
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        // REMOVED: trial_period_days
        metadata: {
          userId: user._id.toString(),
          planName: planName,
          billingCycle: billingCycle,
          hasReferralDiscount: hasReferralDiscount.toString(),
          referredBy: userWithReferral.referredBy?._id?.toString() || '',
        },
      },
      metadata: {
        userId: user._id.toString(),
        planName: planName,
        billingCycle: billingCycle,
        hasReferralDiscount: hasReferralDiscount.toString(),
        referredBy: userWithReferral.referredBy?._id?.toString() || '',
      },
    }

    // Add discount if user has referral
    if (hasReferralDiscount && discountCoupon) {
      sessionConfig.discounts = [
        {
          coupon: discountCoupon.id,
        },
      ]

      console.log(
        `✅ Applied referral discount to checkout session for ${user.email}`
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    // If we applied a referral discount, mark user as having used it
    if (hasReferralDiscount) {
      try {
        await User.findByIdAndUpdate(user._id, {
          hasUsedReferralDiscount: true,
          referralDiscountUsedAt: new Date(),
        })
        console.log(
          `✅ Marked user ${user.email} as having used referral discount`
        )
      } catch (updateError) {
        console.error('Error marking referral discount as used:', updateError)
        // Don't fail the checkout creation for this
      }
    }

    // Calculate discount info for response
    let discountInfo = null
    if (hasReferralDiscount) {
      const originalAmount = getAmount(planName, billingCycle)
      const discountCalculation = calculateDiscountedAmount(
        originalAmount,
        REFERRAL_DISCOUNT.percentage
      )

      discountInfo = {
        applied: true,
        percentage: REFERRAL_DISCOUNT.percentage,
        originalAmount: (originalAmount / 100).toFixed(2),
        discountAmount: (discountCalculation.discountAmount / 100).toFixed(2),
        finalAmount: (discountCalculation.discountedAmount / 100).toFixed(2),
        referrerName: userWithReferral.referredBy.name,
        description: `10% off first month thanks to ${userWithReferral.referredBy.name}'s referral`,
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        sessionId: session.id,
        url: session.url,
        referralDiscount: discountInfo,
      },
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    next(
      createError(500, `Failed to create checkout session: ${error.message}`)
    )
  }
}

// Verify checkout session and create subscription - UPDATED: REMOVED TRIAL FUNCTIONALITY
export const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body
    const user = req.user

    if (!sessionId) {
      console.error('No session ID provided')
      return next(createError(400, 'Session ID is required'))
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (session.metadata.userId !== user._id.toString()) {
      console.error('User mismatch:', {
        sessionUserId: session.metadata.userId,
        currentUserId: user._id.toString(),
      })
      return next(createError(403, 'Unauthorized access to this session'))
    }

    if (session.status !== 'complete') {
      console.error('Session not complete:', {
        status: session.status,
        payment_status: session.payment_status,
      })
      return next(createError(400, 'Checkout session not completed'))
    }

    if (!session.subscription) {
      console.error('No subscription created in session')
      return next(createError(400, 'No subscription created'))
    }

    // Get subscription details from Stripe
    const stripeSubscription = session.subscription

    // Check if subscription already exists
    let subscription = await Subscription.findOne({
      user: user._id,
    })

    const subscriptionData = {
      user: user._id,
      stripeCustomerId: session.customer.id || session.customer,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      plan: session.metadata.planName,
      billingCycle: session.metadata.billingCycle,
      status: stripeSubscription.status,
      amount: getAmount(
        session.metadata.planName,
        session.metadata.billingCycle
      ),
      // REMOVED: All trial-related fields
      currentPeriodStart: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
      // Track referral discount usage
      metadata: {
        hasReferralDiscount: session.metadata.hasReferralDiscount === 'true',
        referredBy: session.metadata.referredBy || null,
        discountApplied:
          session.metadata.hasReferralDiscount === 'true'
            ? REFERRAL_DISCOUNT.percentage
            : 0,
      },
    }

    try {
      if (subscription) {
        Object.assign(subscription, subscriptionData)
        await subscription.save()
      } else {
        subscription = new Subscription(subscriptionData)
        await subscription.save()
      }

      // Update User model's subscription field
      await updateUserSubscriptionField(user._id, subscription)

      // Send notifications for subscription events
      try {
        const planDisplayName = getPlanDetails(session.metadata.planName).name

        // Send subscription activated notification with discount info
        const notificationData = {
          planName: planDisplayName,
          amount: subscription.amount,
          currency: subscription.currency,
          billingCycle: subscription.billingCycle,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd,
          referralDiscount: subscription.metadata?.hasReferralDiscount
            ? {
                percentage: REFERRAL_DISCOUNT.percentage,
                description: 'First month 10% referral discount applied',
              }
            : null,
        }

        await NotificationService.notifySubscriptionActivated(
          user._id,
          notificationData
        )
        console.log(
          `✅ Subscription activated notification sent to ${user.email}`
        )

        // If referral discount was applied, send special notification
        if (
          subscription.metadata?.hasReferralDiscount &&
          subscription.metadata?.referredBy
        ) {
          try {
            const referrer = await User.findById(
              subscription.metadata.referredBy
            )
            if (referrer) {
              // Notify the new subscriber about their discount
              await NotificationService.createNotification(user._id, {
                title: '🎉 Referral Discount Applied!',
                message: `You saved ${REFERRAL_DISCOUNT.percentage}% on your first month thanks to ${referrer.name}'s referral. Enjoy your discount!`,
                type: 'referral_bonus',
                priority: 'medium',
                data: {
                  discountPercentage: REFERRAL_DISCOUNT.percentage,
                  referrerName: referrer.name,
                  planName: planDisplayName,
                },
              })

              // Notify the referrer that their referral got a discount
              await NotificationService.createNotification(referrer._id, {
                title: '🎁 Your Referral Got a Discount!',
                message: `${user.name} just subscribed to the ${planDisplayName} plan and received a 10% discount thanks to your referral!`,
                type: 'referral_success',
                priority: 'medium',
                data: {
                  referredUserName: user.name,
                  planName: planDisplayName,
                  discountPercentage: REFERRAL_DISCOUNT.percentage,
                },
              })

              console.log(
                `✅ Referral discount notifications sent for ${user.email} -> ${referrer.email}`
              )
            }
          } catch (referralNotificationError) {
            console.error(
              'Error sending referral discount notifications:',
              referralNotificationError
            )
          }
        }
      } catch (notificationError) {
        console.error(
          'Error sending subscription notifications:',
          notificationError
        )
      }

      // Create earning for referral commission
      try {
        await createEarningForSubscription(subscription, user._id)
      } catch (earningError) {
        console.error('Error creating earning:', earningError)
      }
    } catch (saveError) {
      console.error('Error saving subscription to database:', saveError)
      return next(
        createError(500, `Failed to save subscription: ${saveError.message}`)
      )
    }

    // Populate the subscription for response
    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription created successfully',
        referralDiscount: subscription.metadata?.hasReferralDiscount
          ? {
              applied: true,
              percentage: REFERRAL_DISCOUNT.percentage,
              description: 'First month discount applied',
            }
          : null,
      },
    })
  } catch (error) {
    console.error('Error verifying checkout session:', error)
    next(
      createError(500, `Failed to verify checkout session: ${error.message}`)
    )
  }
}

// Handle successful payments (for approving earnings)
export const handleSuccessfulPayment = async (
  paymentIntentId,
  subscriptionId
) => {
  try {
    await approveEarningAfterPayment(subscriptionId, paymentIntentId)
  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

// Get current subscription - UPDATED: REMOVED TRIAL FUNCTIONALITY
export const getCurrentSubscription = async (req, res, next) => {
  try {
    const user = req.user

    const subscription = await Subscription.findOne({
      user: user._id,
    }).populate('user', 'name email')

    if (!subscription) {
      return res.status(200).json({
        status: 'success',
        data: {
          subscription: null,
          message: 'No subscription found',
        },
      })
    }

    // Sync with Stripe to get latest data
    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        )
        await subscription.updateFromStripe(stripeSubscription)

        // Update User model's subscription field
        await updateUserSubscriptionField(user._id, subscription)
      } catch (error) {
        console.error('Error syncing with Stripe:', error)
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
      },
    })
  } catch (error) {
    console.error('Error getting current subscription:', error)
    next(createError(500, 'Failed to retrieve subscription'))
  }
}

// Rest of the file remains the same but with trial references removed...
// I'll continue with the key methods that had trial logic:

// Update subscription (change plan) - UPDATED WITH NOTIFICATIONS
export const updateSubscription = async (req, res, next) => {
  try {
    const { planName, billingCycle } = req.body
    const user = req.user

    if (!planName || !billingCycle) {
      return next(createError(400, 'Plan name and billing cycle are required'))
    }

    // Validate new plan and billing cycle
    validatePlanAndBilling(planName, billingCycle)

    // Get current subscription
    const subscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active'] }, // Removed 'trialing'
    })

    // If no active subscription, redirect to checkout instead of trying to update
    if (!subscription || !subscription.stripeSubscriptionId) {
      // User needs to create a new subscription, not update
      return res.status(400).json({
        status: 'error',
        message:
          'No active subscription found. Please use checkout to start a new subscription.',
        requiresCheckout: true,
        data: {
          planName,
          billingCycle,
        },
      })
    }

    // Don't allow changing to the same plan
    if (
      subscription.plan === planName &&
      subscription.billingCycle === billingCycle
    ) {
      return next(createError(400, 'You are already subscribed to this plan'))
    }

    // Store old plan for notification
    const oldPlanName = getPlanDetails(subscription.plan).name
    const newPlanName = getPlanDetails(planName).name

    // Determine if upgrade or downgrade
    const planHierarchy = { starter: 1, pro: 2, empire: 3 }
    const oldPlanLevel = planHierarchy[subscription.plan] || 0
    const newPlanLevel = planHierarchy[planName] || 0
    const isUpgrade = newPlanLevel > oldPlanLevel

    const newPriceId = getPriceId(planName, billingCycle)

    // Get current subscription item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )
    const currentItemId = stripeSubscription.items.data[0].id

    // Update subscription in Stripe with proper proration
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentItemId,
            price: newPriceId,
          },
        ],
        proration_behavior: isUpgrade ? 'always_invoice' : 'create_prorations',
        payment_behavior: isUpgrade
          ? 'pending_if_incomplete'
          : 'allow_incomplete',
        metadata: {
          userId: user._id.toString(),
          planName: planName,
          billingCycle: billingCycle,
        },
      }
    )

    // If upgrade requires payment, return payment required status
    if (
      updatedStripeSubscription.status === 'incomplete' ||
      updatedStripeSubscription.status === 'past_due'
    ) {
      return res.status(402).json({
        status: 'payment_required',
        message: 'Payment required to complete upgrade',
        data: {
          subscription: updatedStripeSubscription,
          paymentUrl:
            updatedStripeSubscription.latest_invoice?.hosted_invoice_url,
        },
      })
    }

    // Update subscription in database
    subscription.plan = planName
    subscription.billingCycle = billingCycle
    subscription.stripePriceId = newPriceId
    subscription.amount = getAmount(planName, billingCycle)
    await subscription.updateFromStripe(updatedStripeSubscription)

    // Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    // Send notification for plan change
    try {
      const notificationData = {
        oldPlan: oldPlanName,
        newPlan: newPlanName,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      }

      if (isUpgrade) {
        await NotificationService.notifySubscriptionUpgraded(
          user._id,
          oldPlanName,
          newPlanName,
          notificationData
        )
        console.log(`✅ Upgrade notification sent to ${user.email}`)
      } else {
        await NotificationService.notifySubscriptionDowngraded(
          user._id,
          oldPlanName,
          newPlanName,
          notificationData
        )
        console.log(`✅ Downgrade notification sent to ${user.email}`)
      }
    } catch (notificationError) {
      console.error(
        'Error sending subscription update notification:',
        notificationError
      )
    }

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: `Subscription ${
          isUpgrade ? 'upgraded' : 'changed'
        } successfully`,
      },
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    next(createError(500, 'Failed to update subscription'))
  }
}

// Cancel subscription - UPDATED WITH NOTIFICATIONS
export const cancelSubscription = async (req, res, next) => {
  try {
    const { immediate = false } = req.body
    const user = req.user

    // Get current subscription
    const subscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active'] }, // Removed 'trialing'
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return next(createError(404, 'No active subscription found'))
    }

    const planDisplayName = getPlanDetails(subscription.plan).name

    let stripeSubscription

    if (immediate) {
      // Cancel immediately
      stripeSubscription = await stripe.subscriptions.cancel(
        subscription.stripeSubscriptionId
      )
    } else {
      // Cancel at period end
      stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      )
    }

    // Update subscription in database
    await subscription.updateFromStripe(stripeSubscription)

    // Update User model's subscription field - FORCE FREE PLAN FOR IMMEDIATE CANCELLATION
    if (immediate) {
      // For immediate cancellation, set to free plan
      await User.findByIdAndUpdate(user._id, {
        'subscription.plan': 'free',
        'subscription.status': 'inactive',
        'subscription.isActive': false,
        'subscription.daysRemaining': 0,
        'subscription.startDate': null,
        'subscription.endDate': null,
      })
    } else {
      // For cancel at period end, keep current plan until period ends
      const daysRemaining = subscription.currentPeriodEnd
        ? Math.max(
            0,
            Math.ceil(
              (new Date(subscription.currentPeriodEnd) - new Date()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0

      await User.findByIdAndUpdate(user._id, {
        'subscription.plan': subscription.plan, // Keep current plan until period end
        'subscription.status': subscription.isActive ? 'active' : 'inactive',
        'subscription.isActive': subscription.isActive,
        'subscription.daysRemaining': daysRemaining,
        'subscription.startDate': subscription.currentPeriodStart,
        'subscription.endDate': subscription.currentPeriodEnd,
      })
    }

    // Send cancellation notification
    try {
      await NotificationService.notifySubscriptionCancelled(user._id, {
        planName: planDisplayName,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        periodEnd: subscription.currentPeriodEnd,
        immediate,
      })
      console.log(`✅ Cancellation notification sent to ${user.email}`)
    } catch (notificationError) {
      console.error(
        'Error sending cancellation notification:',
        notificationError
      )
    }

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the current period',
      },
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    next(createError(500, 'Failed to cancel subscription'))
  }
}

// Reactivate subscription (if canceled at period end) - UPDATED WITH NOTIFICATIONS
export const reactivateSubscription = async (req, res, next) => {
  try {
    const user = req.user

    // Get current subscription
    const subscription = await Subscription.findOne({
      user: user._id,
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return next(createError(404, 'No subscription found'))
    }

    if (!subscription.cancelAtPeriodEnd) {
      return next(createError(400, 'Subscription is not set to cancel'))
    }

    // Reactivate subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    )

    // Update subscription in database
    await subscription.updateFromStripe(stripeSubscription)

    // Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    // Send reactivation notification
    try {
      const planDisplayName = getPlanDetails(subscription.plan).name
      await NotificationService.notifySubscriptionActivated(user._id, {
        planName: planDisplayName,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        reactivated: true,
      })
      console.log(`✅ Reactivation notification sent to ${user.email}`)
    } catch (notificationError) {
      console.error(
        'Error sending reactivation notification:',
        notificationError
      )
    }

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription reactivated successfully',
      },
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    next(createError(500, 'Failed to reactivate subscription'))
  }
}

// Get billing portal session (for customers to manage their billing)
export const createBillingPortalSession = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeCustomerId) {
      return next(createError(400, 'No Stripe customer found'))
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/subscription`

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    })

    res.status(200).json({
      status: 'success',
      data: {
        url: session.url,
      },
    })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    next(createError(500, 'Failed to create billing portal session'))
  }
}

// Admin: Get all subscriptions
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.status) {
      filter.status = req.query.status
    }
    if (req.query.plan) {
      filter.plan = req.query.plan
    }

    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name email createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalSubscriptions = await Subscription.countDocuments(filter)

    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      totalResults: totalSubscriptions,
      totalPages: Math.ceil(totalSubscriptions / limit),
      currentPage: page,
      data: {
        subscriptions,
      },
    })
  } catch (error) {
    console.error('Error getting all subscriptions:', error)
    next(createError(500, 'Failed to retrieve subscriptions'))
  }
}

// Sync subscription with Stripe (manual sync)
export const syncWithStripe = async (req, res, next) => {
  try {
    const user = req.user

    const subscription = await Subscription.findOne({
      user: user._id,
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return next(createError(404, 'No subscription found'))
    }

    // Get latest data from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )

    // Update local subscription
    await subscription.updateFromStripe(stripeSubscription)

    // Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription synced with Stripe successfully',
      },
    })
  } catch (error) {
    console.error('Error syncing with Stripe:', error)
    next(createError(500, 'Failed to sync with Stripe'))
  }
}

// Event tracking functions
const processedEvents = new Map()

// Clean up old events every hour (keep last 24 hours)
setInterval(() => {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  for (const [eventId, timestamp] of processedEvents.entries()) {
    if (timestamp < oneDayAgo) {
      processedEvents.delete(eventId)
    }
  }
}, 60 * 60 * 1000)

const isEventProcessed = (eventId) => {
  return processedEvents.has(eventId)
}

const markEventAsProcessed = (eventId) => {
  processedEvents.set(eventId, Date.now())
}

// WEBHOOK HANDLER - UPDATED: REMOVED TRIAL LOGIC
export const verifyWebhookPayment = async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`📨 Webhook received: ${event.type} (ID: ${event.id})`)

  // Check if we've already processed this event
  if (isEventProcessed(event.id)) {
    console.log(`⚠️ Event ${event.id} already processed, skipping...`)
    return res
      .status(200)
      .json({ received: true, message: 'Already processed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log(`✅ Checkout session completed: ${session.id}`)

        // Only handle subscription creation here, NOT earnings
        // Earnings will be handled by invoice.payment_succeeded
        const subscription = await Subscription.findOne({
          stripeSubscriptionId: session.subscription,
        })

        if (subscription) {
          console.log(
            `⚠️ Subscription ${session.subscription} already exists, skipping creation`
          )
        } else {
          console.log(
            `📝 Checkout completed, but subscription will be handled by customer.subscription.created`
          )
        }
        break
      }

      case 'customer.subscription.created': {
        const stripeSubscription = event.data.object
        console.log(`🆕 Subscription created: ${stripeSubscription.id}`)

        // Check if subscription already exists (from checkout.session.completed)
        let subscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSubscription.id,
        })

        if (!subscription) {
          console.log(
            `📝 Creating new subscription record: ${stripeSubscription.id}`
          )
          // Create subscription record here
          // DON'T create earnings yet - wait for first payment
        } else {
          console.log(`⚠️ Subscription ${stripeSubscription.id} already exists`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const stripeSubscription = event.data.object
        console.log(`🔄 Subscription updated: ${stripeSubscription.id}`)

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSubscription.id,
        })

        if (subscription) {
          await subscription.updateFromStripe(stripeSubscription)

          // Update User model
          const user = await User.findById(subscription.user)
          if (user) {
            await updateUserSubscriptionField(user._id, subscription)
          }

          console.log(`✅ Updated subscription: ${subscription._id}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log(`💰 Invoice payment succeeded: ${invoice.id}`)

        // Find subscription
        const subscription = await Subscription.findOne({
          stripeSubscriptionId: invoice.subscription,
        })

        if (!subscription) {
          console.log('⚠️ Subscription not found for invoice')
          break
        }

        // Skip if gifted
        if (subscription.isGifted) {
          console.log('⚠️ Skipping earnings - subscription is gifted')
          break
        }

        // Check if this exact payment was already processed
        const paymentAlreadyProcessed = subscription.paymentHistory.some(
          (payment) => payment.stripePaymentIntentId === invoice.payment_intent
        )

        if (paymentAlreadyProcessed) {
          console.log(
            `⚠️ Payment ${invoice.payment_intent} already processed, skipping...`
          )
          break
        }

        // Add payment to history FIRST (this acts as our idempotency check)
        await subscription.addPaymentToHistory({
          id: invoice.payment_intent,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: 'succeeded',
          paidAt: new Date(invoice.status_transitions.paid_at * 1000),
        })

        // Check if this is the first payment or a renewal
        const isFirstPayment = subscription.paymentHistory.length === 1
        const isRenewal = invoice.billing_reason === 'subscription_cycle'

        if (isFirstPayment && !isRenewal) {
          // THIS IS THE FIRST PAYMENT - Create and approve earnings
          console.log(
            '🎯 First payment detected - creating and approving earnings'
          )

          try {
            // Create initial earnings
            await createEarningForSubscription(subscription, subscription.user)

            // Immediately approve them since payment succeeded
            await approveEarningAfterPayment(
              subscription._id,
              invoice.payment_intent
            )

            console.log('✅ First payment earnings created and approved')
          } catch (earningError) {
            console.error(
              '❌ Error processing first payment earnings:',
              earningError
            )
          }
        } else if (isRenewal) {
          // THIS IS A RENEWAL PAYMENT
          console.log('🔄 Renewal payment detected - creating renewal earnings')

          try {
            await createRenewalEarning(subscription, invoice.payment_intent)
            console.log('✅ Renewal earnings created')
          } catch (renewalError) {
            console.error('❌ Error creating renewal earnings:', renewalError)
          }
        } else {
          console.log(
            `ℹ️ Payment processed but no earnings action needed (First: ${isFirstPayment}, Renewal: ${isRenewal})`
          )
        }

        console.log(
          `✅ Payment processed for subscription: ${subscription._id}`
        )
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log(`❌ Invoice payment failed: ${invoice.id}`)
        // Handle failed payments if needed
        break
      }

      case 'customer.subscription.deleted': {
        const stripeSubscription = event.data.object
        console.log(`🗑️ Subscription deleted: ${stripeSubscription.id}`)

        const subscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSubscription.id,
        })

        if (subscription) {
          subscription.status = 'canceled'
          subscription.canceledAt = new Date()
          await subscription.save()

          // Cancel any pending/approved earnings
          await cancelEarningsForSubscription(
            subscription._id,
            'Subscription cancelled'
          )

          // Update User model to free plan
          await User.findByIdAndUpdate(subscription.user, {
            'subscription.plan': 'free',
            'subscription.status': 'inactive',
            'subscription.isActive': false,
            'subscription.daysRemaining': 0,
          })

          console.log(`✅ Cancelled subscription: ${subscription._id}`)
        }
        break
      }

      default:
        console.log(`❓ Unhandled event type: ${event.type}`)
    }

    // Mark event as processed AFTER successful processing
    markEventAsProcessed(event.id)

    console.log(`✅ Event ${event.id} processed successfully`)
    res.status(200).json({ received: true })
  } catch (error) {
    console.error(`❌ Error processing webhook event ${event.id}:`, error)
    // Don't mark as processed if there was an error - allow retry
    res.status(500).json({ error: 'Webhook processing failed' })
  }
}
