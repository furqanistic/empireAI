// File: middleware/businessPlanMiddleware.js
import { createError } from '../error.js'
import BusinessPlan from '../models/BusinessPlan.js'

// Rate limiting for business plan generation
export const businessPlanRateLimit = async (req, res, next) => {
  try {
    const userId = req.user.id
    const now = new Date()
    const oneHourAgo = new Date(now - 60 * 60 * 1000) // 1 hour ago
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000) // 24 hours ago

    // Check hourly limit
    const hourlyCount = await BusinessPlan.countDocuments({
      user: userId,
      createdAt: { $gte: oneHourAgo },
    })

    const hourlyLimit = parseInt(process.env.BUSINESS_PLAN_RATE_LIMIT) || 3
    if (hourlyCount >= hourlyLimit) {
      return next(
        createError(
          429,
          `Rate limit exceeded. You can generate ${hourlyLimit} business plans per hour. Try again later.`
        )
      )
    }

    // Check daily limit
    const dailyCount = await BusinessPlan.countDocuments({
      user: userId,
      createdAt: { $gte: oneDayAgo },
    })

    const dailyLimit = parseInt(process.env.BUSINESS_PLAN_DAILY_LIMIT) || 10
    if (dailyCount >= dailyLimit) {
      return next(
        createError(
          429,
          `Daily limit exceeded. You can generate ${dailyLimit} business plans per day. Try again tomorrow.`
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
    console.error('Business Plan Rate Limit Error:', error)
    next(createError(500, 'Failed to check rate limits'))
  }
}

// Validate business plan request
export const validateBusinessPlanRequest = (req, res, next) => {
  try {
    const { niche, businessModel, targetMarket, customContext } = req.body

    // Check required fields
    if (!niche || !businessModel || !targetMarket) {
      return next(
        createError(
          400,
          'Niche, business model, and target market are required'
        )
      )
    }

    // Validate data types
    if (
      typeof niche !== 'string' ||
      typeof businessModel !== 'string' ||
      typeof targetMarket !== 'string'
    ) {
      return next(
        createError(
          400,
          'Niche, business model, and target market must be strings'
        )
      )
    }

    // Validate enum values
    const validNiches = [
      'fitness',
      'tech',
      'finance',
      'education',
      'ecommerce',
      'food',
      'travel',
      'fashion',
      'pets',
      'home',
      'entertainment',
      'creative',
    ]

    const validBusinessModels = [
      'saas',
      'ecommerce',
      'marketplace',
      'coaching',
      'subscription',
      'content',
    ]

    const validTargetMarkets = ['b2c', 'b2b', 'b2b2c']

    if (!validNiches.includes(niche.trim().toLowerCase())) {
      return next(createError(400, 'Invalid niche selected'))
    }

    if (!validBusinessModels.includes(businessModel.trim().toLowerCase())) {
      return next(createError(400, 'Invalid business model selected'))
    }

    if (!validTargetMarkets.includes(targetMarket.trim().toLowerCase())) {
      return next(createError(400, 'Invalid target market selected'))
    }

    // Validate custom context length if provided
    if (customContext && typeof customContext === 'string') {
      if (customContext.length > 1000) {
        return next(
          createError(400, 'Custom context must be less than 1000 characters')
        )
      }
    }

    // Trim and lowercase the input
    req.body.niche = niche.trim().toLowerCase()
    req.body.businessModel = businessModel.trim().toLowerCase()
    req.body.targetMarket = targetMarket.trim().toLowerCase()

    if (customContext) {
      req.body.customContext = customContext.trim()
    }

    next()
  } catch (error) {
    console.error('Business Plan Request Validation Error:', error)
    next(createError(400, 'Invalid request format'))
  }
}

// Check if user has an active subscription for business plan generation
export const checkBusinessPlanAccess = (req, res, next) => {
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
    console.error('Business Plan Access Check Error:', error)
    // Don't block the request, just mark as basic user
    req.isBasicUser = true
    next()
  }
}

// Apply subscription-based limits for business plan generation
export const applyBusinessPlanLimits = (req, res, next) => {
  try {
    const isBasicUser = req.isBasicUser
    const plan = req.subscriptionPlan

    if (isBasicUser) {
      // Basic users get fewer generations
      process.env.BUSINESS_PLAN_RATE_LIMIT = '1' // 1 per hour
      process.env.BUSINESS_PLAN_DAILY_LIMIT = '3' // 3 per day
    } else {
      // Subscription users get more generations based on plan
      switch (plan) {
        case 'starter':
          process.env.BUSINESS_PLAN_RATE_LIMIT = '3'
          process.env.BUSINESS_PLAN_DAILY_LIMIT = '10'
          break
        case 'pro':
          process.env.BUSINESS_PLAN_RATE_LIMIT = '5'
          process.env.BUSINESS_PLAN_DAILY_LIMIT = '20'
          break
        case 'empire':
          process.env.BUSINESS_PLAN_RATE_LIMIT = '10'
          process.env.BUSINESS_PLAN_DAILY_LIMIT = '50'
          break
        default:
          process.env.BUSINESS_PLAN_RATE_LIMIT = '3'
          process.env.BUSINESS_PLAN_DAILY_LIMIT = '10'
      }
    }

    next()
  } catch (error) {
    console.error('Business Plan Limits Error:', error)
    next() // Don't block the request
  }
}

// Log business plan generation activity
export const logBusinessPlanActivity = (req, res, next) => {
  const startTime = Date.now()

  // Log the request
  console.log(
    `[${new Date().toISOString()}] Business Plan Generation Request:`,
    {
      userId: req.user?.id,
      userEmail: req.user?.email,
      niche: req.body?.niche,
      businessModel: req.body?.businessModel,
      targetMarket: req.body?.targetMarket,
      hasCustomContext: !!req.body?.customContext,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    }
  )

  // Override res.json to log the response
  const originalJson = res.json

  res.json = function (data) {
    const processingTime = Date.now() - startTime

    // Log the response
    console.log(
      `[${new Date().toISOString()}] Business Plan Generation Response:`,
      {
        userId: req.user?.id,
        status: data?.status,
        success: data?.status === 'success',
        processingTime: processingTime + 'ms',
        planId: data?.data?.id,
        error: data?.message,
      }
    )

    return originalJson.call(this, data)
  }

  next()
}

// Validate business plan ID parameter
export const validateBusinessPlanId = (req, res, next) => {
  try {
    const { id } = req.params

    if (!id) {
      return next(createError(400, 'Business plan ID is required'))
    }

    // Check if ID is valid MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(createError(400, 'Invalid business plan ID format'))
    }

    next()
  } catch (error) {
    console.error('Business Plan ID Validation Error:', error)
    next(createError(400, 'Invalid business plan ID'))
  }
}

// Check if user owns the business plan
export const checkBusinessPlanOwnership = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const businessPlan = await BusinessPlan.findById(id)

    if (!businessPlan) {
      return next(createError(404, 'Business plan not found'))
    }

    if (businessPlan.user.toString() !== userId) {
      return next(
        createError(403, 'Access denied. You do not own this business plan')
      )
    }

    // Add the business plan to the request object for use in the controller
    req.businessPlan = businessPlan

    next()
  } catch (error) {
    console.error('Business Plan Ownership Check Error:', error)
    next(createError(500, 'Failed to verify business plan ownership'))
  }
}
