// File: controllers/admin.js - FIXED CYCLIC OBJECT ERROR
import {
  createOrRetrieveCustomer,
  stripe,
  SUBSCRIPTION_PLANS,
  validatePlanAndBilling,
} from '../config/stripe.js'
import { createError } from '../error.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'

// Get admin statistics (same as before)
export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ isDeleted: false })
    const activeUsers = await User.countDocuments({
      isDeleted: false,
      isActive: true,
    })
    const newUsersToday = await User.countDocuments({
      isDeleted: false,
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    })

    const activeSubscriptions = await Subscription.countDocuments({
      status: { $in: ['active', 'trialing'] },
    })

    const subscriptions = await Subscription.find({
      status: { $in: ['active', 'trialing'] },
    })

    let totalRevenue = 0
    let totalCommissions = 0
    subscriptions.forEach((sub) => {
      totalRevenue += sub.amount || 0
      totalCommissions += Math.floor((sub.amount || 0) * 0.1)
    })

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        newUsersToday,
        totalRevenue: Math.floor(totalRevenue / 100),
        totalCommissions: Math.floor(totalCommissions / 100),
        pendingPayouts: 0,
        activeSubscriptions,
      },
    })
  } catch (error) {
    console.error('Error getting admin stats:', error)
    next(createError(500, 'Failed to retrieve admin statistics'))
  }
}

// Helper to update User model subscription field
const updateUserSubscriptionField = async (userId, subscriptionData) => {
  try {
    // Handle free/cancelled subscriptions
    if (!subscriptionData || subscriptionData.plan === 'free') {
      await User.findByIdAndUpdate(userId, {
        'subscription.plan': 'free',
        'subscription.status': 'inactive',
        'subscription.isActive': false,
        'subscription.isTrialActive': false,
        'subscription.daysRemaining': 0,
        'subscription.startDate': null,
        'subscription.endDate': null,
        'subscription.trialStartDate': null,
        'subscription.trialEndDate': null,
      })
      return
    }

    // Calculate days remaining correctly
    let daysRemaining = 0
    if (subscriptionData.currentPeriodEnd) {
      const now = new Date()
      const endDate = new Date(subscriptionData.currentPeriodEnd)
      daysRemaining = Math.max(
        0,
        Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
      )
    } else if (subscriptionData.trialEnd) {
      // For trial subscriptions
      const now = new Date()
      const trialEnd = new Date(subscriptionData.trialEnd)
      daysRemaining = Math.max(
        0,
        Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
      )
    }

    const statusMapping = {
      trialing: 'trial',
      active: 'active',
      past_due: 'active',
      canceled: 'cancelled',
      unpaid: 'inactive',
      incomplete: 'inactive',
      incomplete_expired: 'inactive',
    }

    await User.findByIdAndUpdate(userId, {
      'subscription.plan': subscriptionData.plan,
      'subscription.status':
        statusMapping[subscriptionData.status] || 'inactive',
      'subscription.startDate': subscriptionData.currentPeriodStart,
      'subscription.endDate': subscriptionData.currentPeriodEnd,
      'subscription.isActive': ['active', 'trialing'].includes(
        subscriptionData.status
      ),
      'subscription.isTrialActive': subscriptionData.status === 'trialing',
      'subscription.trialStartDate': subscriptionData.trialStart,
      'subscription.trialEndDate': subscriptionData.trialEnd,
      'subscription.daysRemaining': daysRemaining,
    })
  } catch (error) {
    console.error('Error updating user subscription field:', error)
  }
}

// Helper function to safely serialize metadata for Stripe
const createSafeMetadata = (metadata) => {
  const safeMetadata = {}

  if (metadata && typeof metadata === 'object') {
    // Convert Map to object if needed
    const metaObj =
      metadata instanceof Map ? Object.fromEntries(metadata) : metadata

    // Only include string values and avoid circular references
    Object.keys(metaObj).forEach((key) => {
      const value = metaObj[key]
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        safeMetadata[key] = String(value)
      }
    })
  }

  return safeMetadata
}

// Update user subscription (enhanced)
export const updateUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params
    const {
      planName,
      billingCycle,
      trialDays = 30,
      skipTrial = false,
    } = req.body

    if (!userId) {
      return next(createError(400, 'User ID is required'))
    }

    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Handle free plan assignment
    if (planName === 'free') {
      // Find any existing subscription
      const subscription = await Subscription.findOne({ user: userId })

      if (subscription) {
        // Cancel existing subscription if it has a Stripe ID
        if (subscription.stripeSubscriptionId) {
          try {
            await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
          } catch (stripeError) {
            console.error('Stripe cancellation error:', stripeError)
          }
        }

        // Update subscription to cancelled/free
        subscription.status = 'canceled'
        subscription.plan = 'free'
        subscription.stripeSubscriptionId = null
        subscription.stripePriceId = null
        subscription.currentPeriodEnd = new Date()
        subscription.canceledAt = new Date()
        subscription.isActive = false
        await subscription.save()
      }

      // Update user to free plan
      await updateUserSubscriptionField(userId, {
        plan: 'free',
        status: 'inactive',
        isActive: false,
      })

      return res.status(200).json({
        status: 'success',
        data: {
          message: 'User subscription cancelled and set to free plan',
          subscription: {
            plan: 'free',
            status: 'inactive',
            isActive: false,
            daysRemaining: 0,
          },
        },
      })
    }

    // Validate paid plan
    if (!planName || !billingCycle) {
      return next(createError(400, 'Plan name and billing cycle are required'))
    }

    validatePlanAndBilling(planName, billingCycle)

    // Find existing subscription
    let subscription = await Subscription.findOne({ user: userId })

    // If subscription exists and has an active Stripe subscription
    if (subscription && subscription.stripeSubscriptionId) {
      try {
        // Try to update existing Stripe subscription
        const priceId =
          SUBSCRIPTION_PLANS[planName].pricing[billingCycle].priceId
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        )

        // Check if subscription is active
        if (
          ['active', 'trialing', 'past_due'].includes(stripeSubscription.status)
        ) {
          const itemId = stripeSubscription.items.data[0].id

          const updated = await stripe.subscriptions.update(
            subscription.stripeSubscriptionId,
            {
              items: [{ id: itemId, price: priceId }],
              proration_behavior: 'create_prorations',
            }
          )

          subscription.plan = planName
          subscription.billingCycle = billingCycle
          subscription.stripePriceId = priceId
          subscription.amount =
            SUBSCRIPTION_PLANS[planName].pricing[billingCycle].amount
          await subscription.updateFromStripe(updated)
          await updateUserSubscriptionField(userId, subscription)

          return res.status(200).json({
            status: 'success',
            data: {
              subscription,
              message: 'Subscription updated successfully',
            },
          })
        }
      } catch (stripeError) {
        console.log(
          'Existing subscription is not active, creating new one:',
          stripeError.message
        )
        // Continue to create new subscription
      }
    }

    // Create new subscription (for free users or cancelled subscriptions)

    // Ensure user has Stripe customer
    const customer = await createOrRetrieveCustomer(user)
    if (!user.stripeCustomerId) {
      user.stripeCustomerId = customer.id
      await user.save()
    }

    const priceId = SUBSCRIPTION_PLANS[planName].pricing[billingCycle].priceId
    const subscriptionOptions = {
      customer: customer.id,
      items: [{ price: priceId }],
      metadata: {
        userId: userId.toString(),
        planName,
        billingCycle,
        createdBy: 'admin',
      },
    }

    if (!skipTrial && trialDays > 0) {
      subscriptionOptions.trial_period_days = trialDays
    }

    const stripeSubscription = await stripe.subscriptions.create(
      subscriptionOptions
    )

    // Create or update subscription in database
    const subscriptionData = {
      user: userId,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      plan: planName,
      billingCycle,
      status: stripeSubscription.status,
      amount: SUBSCRIPTION_PLANS[planName].pricing[billingCycle].amount,
      currentPeriodStart: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
      trialStart: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    }

    if (subscription) {
      // Update existing subscription document
      Object.assign(subscription, subscriptionData)
      await subscription.save()
    } else {
      // Create new subscription document
      subscription = await Subscription.create(subscriptionData)
    }

    await updateUserSubscriptionField(userId, subscription)

    // Calculate days remaining
    const daysRemaining =
      !skipTrial && trialDays > 0
        ? trialDays
        : subscription.currentPeriodEnd
        ? Math.ceil(
            (subscription.currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)
          )
        : 0

    return res.status(200).json({
      status: 'success',
      data: {
        subscription: { ...subscription.toObject(), daysRemaining },
        message: `Created ${planName} subscription${
          !skipTrial && trialDays > 0 ? ` with ${trialDays}-day trial` : ''
        }`,
        trialDays: !skipTrial && trialDays > 0 ? trialDays : 0,
      },
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    next(createError(500, `Failed to update subscription: ${error.message}`))
  }
}

// Cancel user subscription
export const cancelUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { immediate = false } = req.body

    const subscription = await Subscription.findOne({
      user: userId,
    })

    if (!subscription) {
      // No subscription found, just update user to free
      await updateUserSubscriptionField(userId, {
        plan: 'free',
        status: 'inactive',
        isActive: false,
      })

      return res.status(200).json({
        status: 'success',
        data: {
          message: 'User set to free plan',
          subscription: {
            plan: 'free',
            status: 'inactive',
            isActive: false,
            daysRemaining: 0,
          },
        },
      })
    }

    // If subscription has Stripe ID and is active
    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        )

        if (['active', 'trialing'].includes(stripeSubscription.status)) {
          let canceledSubscription
          if (immediate) {
            canceledSubscription = await stripe.subscriptions.cancel(
              subscription.stripeSubscriptionId
            )
          } else {
            canceledSubscription = await stripe.subscriptions.update(
              subscription.stripeSubscriptionId,
              { cancel_at_period_end: true }
            )
          }

          await subscription.updateFromStripe(canceledSubscription)
        }
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError)
        // Continue anyway, mark as cancelled locally
      }
    }

    // Update local subscription status
    if (immediate) {
      subscription.status = 'canceled'
      subscription.canceledAt = new Date()
      subscription.isActive = false
      await subscription.save()

      await updateUserSubscriptionField(userId, {
        plan: 'free',
        status: 'inactive',
        isActive: false,
      })
    } else {
      subscription.cancelAtPeriodEnd = true
      await subscription.save()

      await updateUserSubscriptionField(userId, subscription)
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: immediate
          ? 'Subscription cancelled immediately'
          : 'Subscription will cancel at period end',
      },
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    next(createError(500, 'Failed to cancel subscription'))
  }
}

// Reactivate user subscription
export const reactivateUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params
    const subscription = await Subscription.findOne({ user: userId })

    if (!subscription) {
      return next(createError(404, 'No subscription found'))
    }

    // Only allow reactivation if subscription is set to cancel at period end
    if (!subscription.cancelAtPeriodEnd) {
      // If subscription is cancelled, they need to create a new one
      if (subscription.status === 'canceled') {
        return next(
          createError(
            400,
            'Cancelled subscription cannot be reactivated. Please create a new subscription.'
          )
        )
      }
      return next(createError(400, 'Subscription is not set to cancel'))
    }

    if (!subscription.stripeSubscriptionId) {
      return next(createError(400, 'No Stripe subscription to reactivate'))
    }

    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      { cancel_at_period_end: false }
    )

    await subscription.updateFromStripe(stripeSubscription)
    await updateUserSubscriptionField(userId, subscription)

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
