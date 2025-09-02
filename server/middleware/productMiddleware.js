// File: middleware/productMiddleware.js
import { createError } from '../error.js'

// Validate product generation request (keep validation, remove limits)
export const validateProductRequest = (req, res, next) => {
  try {
    const {
      productType,
      niche,
      audience,
      priceRange,
      complexity,
      customContext,
      detailLevel,
    } = req.body

    // Check required fields
    if (!productType || !niche || !audience || !priceRange || !complexity) {
      return next(
        createError(
          400,
          'Product type, niche, audience, price range, and complexity are required'
        )
      )
    }

    // Validate data types
    if (
      typeof productType !== 'string' ||
      typeof niche !== 'string' ||
      typeof audience !== 'string' ||
      typeof priceRange !== 'string' ||
      typeof complexity !== 'string'
    ) {
      return next(createError(400, 'All required fields must be strings'))
    }

    // Validate custom context length if provided (increased limit)
    if (customContext && typeof customContext === 'string') {
      if (customContext.length > 5000) {
        // Increased from 2000
        return next(
          createError(400, 'Custom context must be less than 5000 characters')
        )
      }
    }

    // Validate detail level if provided
    if (detailLevel && typeof detailLevel === 'string') {
      if (!['standard', 'detailed'].includes(detailLevel.toLowerCase())) {
        return next(
          createError(
            400,
            'Detail level must be either "standard" or "detailed"'
          )
        )
      }
    }

    // Trim and lowercase the input
    req.body.productType = productType.trim().toLowerCase()
    req.body.niche = niche.trim().toLowerCase()
    req.body.audience = audience.trim().toLowerCase()
    req.body.priceRange = priceRange.trim().toLowerCase()
    req.body.complexity = complexity.trim().toLowerCase()

    if (detailLevel) {
      req.body.detailLevel = detailLevel.trim().toLowerCase()
    }

    if (customContext) {
      req.body.customContext = customContext.trim()
    }

    next()
  } catch (error) {
    console.error('Product Request Validation Error:', error)
    next(createError(400, 'Invalid request format'))
  }
}

// Log product generation activity (keeping this for analytics)
export const logProductActivity = (req, res, next) => {
  const originalSend = res.send

  res.send = function (data) {
    // Log successful generations
    if (res.statusCode === 200 && req.route && req.route.path === '/generate') {
      console.log(
        `Product Generation: User ${req.user.email} generated ${
          req.body.productType
        } for ${req.body.niche}/${req.body.audience} (${
          req.body.detailLevel || 'standard'
        } mode)`
      )
    }

    originalSend.call(this, data)
  }

  next()
}

// Enhanced logging for detailed analytics (optional)
export const enhancedProductLogging = (req, res, next) => {
  const startTime = Date.now()

  // Log request details
  console.log(`📊 Product Request: ${req.user.email} - ${req.body.productType}`)
  console.log(`🎯 Target: ${req.body.audience} in ${req.body.niche}`)
  console.log(`💰 Price Range: ${req.body.priceRange}`)
  console.log(`⚙️ Complexity: ${req.body.complexity}`)
  console.log(`📝 Detail Level: ${req.body.detailLevel || 'standard'}`)
  console.log(`📄 Custom Context: ${req.body.customContext ? 'Yes' : 'No'}`)

  const originalSend = res.send
  res.send = function (data) {
    const processingTime = Date.now() - startTime

    if (res.statusCode === 200) {
      console.log(`✅ Generation completed in ${processingTime}ms`)
    } else {
      console.log(`❌ Generation failed after ${processingTime}ms`)
    }

    originalSend.call(this, data)
  }

  next()
}

// Simple rate info header (informational only, no blocking)
export const addRateInfoHeaders = (req, res, next) => {
  // Just add informational headers, don't block anything
  res.set({
    'X-Rate-Limit-Policy': 'unlimited',
    'X-Feature-Access': 'full',
    'X-Generation-Mode': req.body?.detailLevel || 'standard',
  })

  next()
}

// User context enrichment (adds user info without restrictions)
export const enrichUserContext = (req, res, next) => {
  try {
    if (req.user) {
      // Add user context for potential personalization
      req.userContext = {
        userId: req.user.id,
        email: req.user.email,
        joinDate: req.user.createdAt,
        isAdmin: req.user.role === 'admin',
        // Remove any subscription checks - everyone gets full access
        hasFullAccess: true,
        canUseDetailedMode: true,
        maxCustomContextLength: 5000,
      }
    }

    next()
  } catch (error) {
    console.error('User Context Enrichment Error:', error)
    // Don't block the request, just continue without enrichment
    next()
  }
}

// Request validation with enhanced error messages
export const validateEnhancedProductRequest = (req, res, next) => {
  try {
    const {
      productType,
      niche,
      audience,
      priceRange,
      complexity,
      customContext,
      detailLevel,
    } = req.body

    // Enhanced validation with specific error messages
    const validProductTypes = [
      'course',
      'ebook',
      'template',
      'coaching',
      'software',
      'mastermind',
      'workshop',
      'membership',
    ]

    const validNiches = [
      'business',
      'marketing',
      'fitness',
      'finance',
      'development',
      'technology',
      'design',
      'relationships',
      'productivity',
      'investing',
      'content',
      'spirituality',
    ]

    const validAudiences = [
      'beginners',
      'intermediate',
      'advanced',
      'entrepreneurs',
      'professionals',
      'creators',
    ]

    const validPriceRanges = ['budget', 'mid', 'premium', 'elite']
    const validComplexity = ['simple', 'moderate', 'advanced']
    const validDetailLevels = ['standard', 'detailed']

    // Detailed validation with helpful error messages
    if (!productType) {
      return next(createError(400, 'Product type is required'))
    }
    if (!validProductTypes.includes(productType.toLowerCase())) {
      return next(
        createError(
          400,
          `Invalid product type. Choose from: ${validProductTypes.join(', ')}`
        )
      )
    }

    if (!niche) {
      return next(createError(400, 'Niche is required'))
    }
    if (!validNiches.includes(niche.toLowerCase())) {
      return next(
        createError(
          400,
          `Invalid niche. Choose from: ${validNiches.join(', ')}`
        )
      )
    }

    if (!audience) {
      return next(createError(400, 'Target audience is required'))
    }
    if (!validAudiences.includes(audience.toLowerCase())) {
      return next(
        createError(
          400,
          `Invalid audience. Choose from: ${validAudiences.join(', ')}`
        )
      )
    }

    if (!priceRange) {
      return next(createError(400, 'Price range is required'))
    }
    if (!validPriceRanges.includes(priceRange.toLowerCase())) {
      return next(
        createError(
          400,
          `Invalid price range. Choose from: ${validPriceRanges.join(', ')}`
        )
      )
    }

    if (!complexity) {
      return next(createError(400, 'Complexity level is required'))
    }
    if (!validComplexity.includes(complexity.toLowerCase())) {
      return next(
        createError(
          400,
          `Invalid complexity. Choose from: ${validComplexity.join(', ')}`
        )
      )
    }

    // Validate optional fields
    if (detailLevel && !validDetailLevels.includes(detailLevel.toLowerCase())) {
      return next(
        createError(
          400,
          `Invalid detail level. Choose from: ${validDetailLevels.join(', ')}`
        )
      )
    }

    if (customContext && customContext.length > 5000) {
      return next(
        createError(
          400,
          'Custom context is too long. Maximum 5000 characters allowed.'
        )
      )
    }

    // Sanitize inputs
    req.body.productType = productType.trim().toLowerCase()
    req.body.niche = niche.trim().toLowerCase()
    req.body.audience = audience.trim().toLowerCase()
    req.body.priceRange = priceRange.trim().toLowerCase()
    req.body.complexity = complexity.trim().toLowerCase()
    req.body.detailLevel = detailLevel
      ? detailLevel.trim().toLowerCase()
      : 'standard'
    req.body.customContext = customContext ? customContext.trim() : ''

    next()
  } catch (error) {
    console.error('Enhanced Product Request Validation Error:', error)
    next(createError(400, 'Invalid request format'))
  }
}

// Content validation (ensures appropriate content)
export const validateContentAppropriateNess = (req, res, next) => {
  try {
    const { customContext } = req.body

    if (customContext) {
      // Basic content filtering for inappropriate requests
      const inappropriateKeywords = [
        'illegal',
        'harmful',
        'dangerous',
        'violent',
        'adult content',
        'nsfw',
        'explicit',
      ]

      const lowerContext = customContext.toLowerCase()
      const hasInappropriateContent = inappropriateKeywords.some((keyword) =>
        lowerContext.includes(keyword)
      )

      if (hasInappropriateContent) {
        return next(
          createError(
            400,
            'Custom context contains inappropriate content. Please revise your request.'
          )
        )
      }
    }

    next()
  } catch (error) {
    console.error('Content Validation Error:', error)
    next() // Continue even if validation fails
  }
}

// Request analytics (track usage patterns)
export const trackProductAnalytics = (req, res, next) => {
  try {
    // Track request patterns for analytics
    const analyticsData = {
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
      userEmail: req.user?.email,
      productType: req.body?.productType,
      niche: req.body?.niche,
      audience: req.body?.audience,
      priceRange: req.body?.priceRange,
      complexity: req.body?.complexity,
      detailLevel: req.body?.detailLevel || 'standard',
      hasCustomContext: !!req.body?.customContext,
      customContextLength: req.body?.customContext?.length || 0,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
    }

    // Log for analytics (you could send this to an analytics service)
    console.log(
      '📈 Product Generation Analytics:',
      JSON.stringify(analyticsData, null, 2)
    )

    next()
  } catch (error) {
    console.error('Analytics Tracking Error:', error)
    next() // Continue even if analytics fails
  }
}
