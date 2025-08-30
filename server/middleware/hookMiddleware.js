// File: middleware/hookMiddleware.js
import { createError } from '../error.js'
import HookGeneration from '../models/HookGeneration.js'

// Rate limiting for hook generation
export const hookRateLimit = async (req, res, next) => {
  try {
    const userId = req.user.id
    const now = new Date()
    const oneHourAgo = new Date(now - 60 * 60 * 1000) // 1 hour ago
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000) // 24 hours ago

    // Check hourly limit
    const hourlyCount = await HookGeneration.countDocuments({
      user: userId,
      createdAt: { $gte: oneHourAgo },
    })

    const hourlyLimit = parseInt(process.env.HOOK_GENERATION_RATE_LIMIT) || 10
    if (hourlyCount >= hourlyLimit) {
      return next(
        createError(
          429,
          `Rate limit exceeded. You can generate ${hourlyLimit} hook sets per hour. Try again later.`
        )
      )
    }

    // Check daily limit
    const dailyCount = await HookGeneration.countDocuments({
      user: userId,
      createdAt: { $gte: oneDayAgo },
    })

    const dailyLimit = parseInt(process.env.HOOK_GENERATION_DAILY_LIMIT) || 50
    if (dailyCount >= dailyLimit) {
      return next(
        createError(
          429,
          `Daily limit exceeded. You can generate ${dailyLimit} hook sets per day. Try again tomorrow.`
        )
      )
    }

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Hourly-Limit': hourlyLimit,
      'X-RateLimit-Hourly-Remaining': Math.max(0, hourlyLimit - hourlyCount),
      'X-RateLimit-Daily-Limit': dailyLimit,
      'X-RateLimit-Daily-Remaining': Math.max(0, dailyLimit - dailyCount),
    })

    next()
  } catch (error) {
    console.error('Hook Rate Limit Error:', error)
    next(createError(500, 'Failed to check rate limits'))
  }
}

// Validate hook generation request
export const validateHookRequest = (req, res, next) => {
  try {
    const { platform, niche, tone, customPrompt } = req.body

    // Check required fields
    if (!platform || !niche || !tone) {
      return next(createError(400, 'Platform, niche, and tone are required'))
    }

    // Validate data types
    if (
      typeof platform !== 'string' ||
      typeof niche !== 'string' ||
      typeof tone !== 'string'
    ) {
      return next(createError(400, 'Platform, niche, and tone must be strings'))
    }

    // Validate custom prompt length if provided
    if (customPrompt && typeof customPrompt === 'string') {
      if (customPrompt.length > 1000) {
        return next(
          createError(400, 'Custom prompt must be less than 1000 characters')
        )
      }
    }

    // Trim and lowercase the input
    req.body.platform = platform.trim().toLowerCase()
    req.body.niche = niche.trim().toLowerCase()
    req.body.tone = tone.trim().toLowerCase()

    if (customPrompt) {
      req.body.customPrompt = customPrompt.trim()
    }

    next()
  } catch (error) {
    console.error('Hook Request Validation Error:', error)
    next(createError(400, 'Invalid request format'))
  }
}

// Check if user has an active subscription (optional - for premium features)
export const checkSubscriptionAccess = (req, res, next) => {
  try {
    const user = req.user

    // If no user or user doesn't have subscription info, they get basic access
    if (!user || !user.subscriptionStatus) {
      req.isBasicUser = true
      return next()
    }

    // Check if user has active subscription
    const { hasSubscription, isActive, plan } = user.subscriptionStatus

    if (hasSubscription && isActive) {
      req.subscriptionPlan = plan
      req.isBasicUser = false
    } else {
      req.isBasicUser = true
    }

    next()
  } catch (error) {
    console.error('Subscription Check Error:', error)
    // Don't block the request, just mark as basic user
    req.isBasicUser = true
    next()
  }
}

// Apply subscription-based limits (optional)
export const applySubscriptionLimits = (req, res, next) => {
  try {
    const isBasicUser = req.isBasicUser
    const plan = req.subscriptionPlan

    if (isBasicUser) {
      // Basic users get fewer generations
      process.env.HOOK_GENERATION_RATE_LIMIT = '5' // 5 per hour
      process.env.HOOK_GENERATION_DAILY_LIMIT = '15' // 15 per day
    } else {
      // Subscription users get more generations based on plan
      switch (plan) {
        case 'starter':
          process.env.HOOK_GENERATION_RATE_LIMIT = '15'
          process.env.HOOK_GENERATION_DAILY_LIMIT = '75'
          break
        case 'pro':
          process.env.HOOK_GENERATION_RATE_LIMIT = '30'
          process.env.HOOK_GENERATION_DAILY_LIMIT = '150'
          break
        case 'empire':
          process.env.HOOK_GENERATION_RATE_LIMIT = '100'
          process.env.HOOK_GENERATION_DAILY_LIMIT = '500'
          break
        default:
          process.env.HOOK_GENERATION_RATE_LIMIT = '10'
          process.env.HOOK_GENERATION_DAILY_LIMIT = '50'
      }
    }

    next()
  } catch (error) {
    console.error('Subscription Limits Error:', error)
    next() // Don't block the request
  }
}

// Log hook generation activity
export const logHookActivity = (req, res, next) => {
  const originalSend = res.send

  res.send = function (data) {
    // Log successful generations
    if (res.statusCode === 200 && req.route && req.route.path === '/generate') {
      console.log(
        `Hook Generation: User ${req.user.email} generated hooks for ${req.body.platform}/${req.body.niche}/${req.body.tone}`
      )
    }

    originalSend.call(this, data)
  }

  next()
}
