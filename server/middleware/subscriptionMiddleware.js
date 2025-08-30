// File: middleware/subscriptionMiddleware.js
import { SUBSCRIPTION_PLANS } from '../config/stripe.js'
import { createError } from '../error.js'
import Subscription from '../models/Subscription.js'

// Middleware to attach subscription info to request
export const attachSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return next()
    }

    // Get user's current subscription
    const subscription = await Subscription.findOne({
      user: req.user._id,
    })

    // Attach subscription to request
    req.subscription = subscription
    req.user.subscription = subscription

    next()
  } catch (error) {
    console.error('Error attaching subscription:', error)
    // Don't fail the request, just continue without subscription info
    next()
  }
}

// Middleware to check if user has an active subscription
export const requireActiveSubscription = (req, res, next) => {
  if (!req.subscription) {
    return next(
      createError(
        403,
        'No subscription found. Please subscribe to access this feature.'
      )
    )
  }

  if (!req.subscription.isActive) {
    return next(
      createError(
        403,
        'Your subscription is not active. Please update your payment method or reactivate your subscription.'
      )
    )
  }

  next()
}

// Middleware to check subscription plan level
export const requirePlan = (...allowedPlans) => {
  return (req, res, next) => {
    if (!req.subscription) {
      return next(
        createError(
          403,
          'No subscription found. Please subscribe to access this feature.'
        )
      )
    }

    if (!req.subscription.isActive) {
      return next(
        createError(
          403,
          'Your subscription is not active. Please update your payment method or reactivate your subscription.'
        )
      )
    }

    if (!allowedPlans.includes(req.subscription.plan)) {
      const planNames = allowedPlans
        .map((plan) => SUBSCRIPTION_PLANS[plan]?.name || plan)
        .join(', ')
      return next(
        createError(
          403,
          `This feature requires a ${planNames} subscription or higher.`
        )
      )
    }

    next()
  }
}

// Middleware to check specific subscription limits
export const checkSubscriptionLimit = (limitType) => {
  return (req, res, next) => {
    if (!req.subscription) {
      return next(
        createError(
          403,
          'No subscription found. Please subscribe to access this feature.'
        )
      )
    }

    if (!req.subscription.isActive) {
      return next(
        createError(
          403,
          'Your subscription is not active. Please update your payment method or reactivate your subscription.'
        )
      )
    }

    const planConfig = SUBSCRIPTION_PLANS[req.subscription.plan]
    if (!planConfig) {
      return next(createError(500, 'Invalid subscription plan configuration'))
    }

    const limit = planConfig.limits[limitType]

    // If limit is -1, it means unlimited
    if (limit === -1) {
      req.subscriptionLimit = -1
      return next()
    }

    // Attach the limit to the request for controllers to use
    req.subscriptionLimit = limit
    next()
  }
}

// Middleware to check trial status
export const checkTrialStatus = (req, res, next) => {
  if (!req.subscription) {
    // No subscription at all - allow access for trial
    req.isTrialUser = true
    req.trialExpired = false
    return next()
  }

  if (req.subscription.status === 'trialing') {
    req.isTrialUser = true
    req.trialExpired = false
    req.trialDaysRemaining = Math.ceil(
      (req.subscription.trialEnd - new Date()) / (1000 * 60 * 60 * 24)
    )
  } else if (req.subscription.status === 'active') {
    req.isTrialUser = false
    req.trialExpired = false
  } else {
    // Trial has ended and no active subscription
    req.isTrialUser = false
    req.trialExpired = true
  }

  next()
}

// Middleware to get subscription features
export const attachSubscriptionFeatures = (req, res, next) => {
  if (!req.subscription || !req.subscription.isActive) {
    // Default to starter features for non-subscribers or trial users
    req.subscriptionFeatures = {
      plan: 'trial',
      features: SUBSCRIPTION_PLANS.starter.features,
      limits: SUBSCRIPTION_PLANS.starter.limits,
    }
    return next()
  }

  const planConfig = SUBSCRIPTION_PLANS[req.subscription.plan]
  if (planConfig) {
    req.subscriptionFeatures = {
      plan: req.subscription.plan,
      features: planConfig.features,
      limits: planConfig.limits,
      billingCycle: req.subscription.billingCycle,
      status: req.subscription.status,
    }
  }

  next()
}

// Middleware to check if subscription is past due
export const checkPastDue = (req, res, next) => {
  if (req.subscription && req.subscription.isPastDue) {
    return next(
      createError(
        402,
        'Your subscription payment is past due. Please update your payment method to continue using our services.'
      )
    )
  }
  next()
}

// Middleware to warn about subscription expiring soon
export const checkExpiringSubscription = (req, res, next) => {
  if (
    req.subscription &&
    req.subscription.daysRemaining <= 7 &&
    req.subscription.daysRemaining > 0
  ) {
    // Add warning to response headers
    res.set(
      'X-Subscription-Warning',
      `Your subscription expires in ${req.subscription.daysRemaining} days`
    )
  }
  next()
}

// Helper function to get subscription status for responses
export const getSubscriptionStatus = (subscription) => {
  if (!subscription) {
    return {
      hasSubscription: false,
      isActive: false,
      plan: null,
      status: 'none',
      trialActive: false,
    }
  }

  return {
    hasSubscription: true,
    isActive: subscription.isActive,
    plan: subscription.plan,
    status: subscription.status,
    trialActive: subscription.isTrialActive,
    daysRemaining: subscription.daysRemaining,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  }
}
