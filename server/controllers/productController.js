// File: controllers/productController.js
import { createError } from '../error.js'
import ProductGeneration from '../models/ProductGeneration.js'
import exportService from '../services/exportService.js'
import productService from '../services/productService.js'
// Generate complete digital product
// Complete generateProduct function for controllers/productController.js

export const generateProduct = async (req, res, next) => {
  try {
    const {
      productType,
      niche,
      audience,
      priceRange,
      complexity,
      customContext,
      detailLevel = 'standard', // New parameter for detail level
    } = req.body
    const userId = req.user.id

    // Validate required fields
    const requiredFields = {
      productType,
      niche,
      audience,
      priceRange,
      complexity,
    }
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    if (missingFields.length > 0) {
      return next(
        createError(400, `Missing required fields: ${missingFields.join(', ')}`)
      )
    }

    // Validate enum values with detailed error messages
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

    // Validation with specific error messages
    if (!validProductTypes.includes(productType)) {
      return next(
        createError(
          400,
          `Invalid product type "${productType}". Valid types: ${validProductTypes.join(
            ', '
          )}`
        )
      )
    }

    if (!validNiches.includes(niche)) {
      return next(
        createError(
          400,
          `Invalid niche "${niche}". Valid niches: ${validNiches.join(', ')}`
        )
      )
    }

    if (!validAudiences.includes(audience)) {
      return next(
        createError(
          400,
          `Invalid audience "${audience}". Valid audiences: ${validAudiences.join(
            ', '
          )}`
        )
      )
    }

    if (!validPriceRanges.includes(priceRange)) {
      return next(
        createError(
          400,
          `Invalid price range "${priceRange}". Valid ranges: ${validPriceRanges.join(
            ', '
          )}`
        )
      )
    }

    if (!validComplexity.includes(complexity)) {
      return next(
        createError(
          400,
          `Invalid complexity "${complexity}". Valid levels: ${validComplexity.join(
            ', '
          )}`
        )
      )
    }

    if (!validDetailLevels.includes(detailLevel)) {
      return next(
        createError(
          400,
          `Invalid detail level "${detailLevel}". Valid levels: ${validDetailLevels.join(
            ', '
          )}`
        )
      )
    }

    // Validate custom context length
    if (customContext && typeof customContext === 'string') {
      if (customContext.length > 10000) {
        return next(
          createError(400, 'Custom context must be less than 10,000 characters')
        )
      }
    }

    // Create initial generation record WITHOUT generatedProduct field
    // This prevents validation errors if the AI generation fails
    const productGeneration = new ProductGeneration({
      user: userId,
      productType,
      niche,
      audience,
      priceRange,
      complexity,
      customContext: customContext || '',
      status: 'pending',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    })

    try {
      await productGeneration.save()
    } catch (saveError) {
      return next(createError(500, 'Failed to initialize product generation'))
    }

    try {
      // Generate product using AI service with all parameters
      const generationResult = await productService.generateCompleteProduct({
        productType,
        niche,
        audience,
        priceRange,
        complexity,
        customContext,
        detailLevel, // Pass the detail level to the service
      })

      // Comprehensive validation of AI response
      if (!generationResult.product) {
        throw new Error('AI service returned empty product data')
      }

      if (
        !generationResult.product.title ||
        !generationResult.product.overview
      ) {
        throw new Error(
          'AI generated incomplete product data - missing title or overview'
        )
      }

      if (
        !generationResult.product.outline ||
        !generationResult.product.outline.modules ||
        generationResult.product.outline.modules.length === 0
      ) {
        throw new Error(
          'AI generated incomplete product data - missing or empty modules'
        )
      }

      // Validate that we have essential product components
      const requiredComponents = [
        'pricing',
        'marketing',
        'sales',
        'technical',
        'revenue',
      ]
      const missingComponents = requiredComponents.filter(
        (component) => !generationResult.product[component]
      )

      if (missingComponents.length > 0) {
        console.warn('⚠️  Missing components:', missingComponents)
        // Don't fail for missing components, just log the warning
      }

      // Update the generation record with successful results
      productGeneration.generatedProduct = generationResult.product
      productGeneration.tokenUsage = generationResult.usage
      productGeneration.processingTime = generationResult.processingTime
      productGeneration.modelUsed = generationResult.model
      productGeneration.status = 'completed'

      try {
        await productGeneration.save()
      } catch (saveError) {
        // Don't fail the request, just log the error since we have the data
      }

      // Return comprehensive success response
      res.status(200).json({
        status: 'success',
        message: 'Product blueprint generated successfully',
        data: {
          id: productGeneration._id,
          product: generationResult.product,
          metadata: {
            productType,
            niche,
            audience,
            priceRange,
            complexity,
            customContext: customContext || null,
            detailLevel: generationResult.detailLevel,
            processingTime: generationResult.processingTime,
            tokenUsage: generationResult.usage,
            model: generationResult.model,
            timestamp: new Date().toISOString(),
          },
          generation: productGeneration,
        },
      })
    } catch (aiError) {
      // Update generation record with error details
      productGeneration.status = 'failed'
      productGeneration.error = {
        message: aiError.message,
        code: 'AI_GENERATION_ERROR',
        timestamp: new Date().toISOString(),
      }

      // Save the failed record (this helps with debugging and analytics)
      try {
        await productGeneration.save()
      } catch (saveError) {
        console.log('❌ Failed to save error record:', saveError.message)
      }

      // Return specific error messages based on the error type
      if (
        aiError.message.includes('GROQ_API_KEY') ||
        aiError.message.includes('API key')
      ) {
        return next(
          createError(
            500,
            'AI service authentication error. Please contact support if this persists.'
          )
        )
      }

      if (
        aiError.message.includes('fetch') ||
        aiError.message.includes('network') ||
        aiError.message.includes('ENOTFOUND')
      ) {
        return next(
          createError(
            500,
            'Network error connecting to AI service. Please check your internet connection and try again.'
          )
        )
      }

      if (aiError.message.includes('401')) {
        return next(
          createError(
            500,
            'AI service authentication failed. API key may be invalid or expired.'
          )
        )
      }

      if (aiError.message.includes('429')) {
        return next(
          createError(
            429,
            'AI service rate limit reached. Please wait a few minutes before trying again.'
          )
        )
      }

      if (aiError.message.includes('timeout')) {
        return next(
          createError(
            504,
            'AI generation timed out. Please try again with a simpler request.'
          )
        )
      }

      if (aiError.message.includes('incomplete product data')) {
        return next(
          createError(
            500,
            'AI generated incomplete data. Please try again with more specific requirements.'
          )
        )
      }

      if (aiError.message.includes('Invalid response format')) {
        return next(
          createError(
            500,
            'AI service returned invalid data format. Please try again.'
          )
        )
      }

      // Generic error fallback
      return next(
        createError(
          500,
          `Product generation failed: ${aiError.message}. Please try again or contact support if the issue persists.`
        )
      )
    }
  } catch (error) {
    // Handle different types of unexpected errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors || {})
        .map((key) => error.errors[key].message)
        .join(', ')
      return next(createError(400, `Validation error: ${validationErrors}`))
    }

    if (error.name === 'CastError') {
      return next(createError(400, 'Invalid data format provided'))
    }

    if (error.code === 11000) {
      return next(
        createError(
          409,
          'Duplicate generation request. Please wait before trying again.'
        )
      )
    }

    // Generic unexpected error
    next(
      createError(
        500,
        'An unexpected error occurred while generating the product. Please try again or contact support.'
      )
    )
  }
}

// Get user's product generation history
export const getProductHistory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const productGenerations = await ProductGeneration.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalGenerations = await ProductGeneration.countDocuments({
      user: userId,
    })

    res.status(200).json({
      status: 'success',
      results: productGenerations.length,
      totalResults: totalGenerations,
      totalPages: Math.ceil(totalGenerations / limit),
      currentPage: page,
      data: {
        generations: productGenerations,
      },
    })
  } catch (error) {
    console.error('Get Product History Error:', error)
    next(createError(500, 'Failed to retrieve product generation history'))
  }
}

// Get specific product generation by ID
export const getProductGeneration = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const productGeneration = await ProductGeneration.findOne({
      _id: id,
      user: userId,
    })

    if (!productGeneration) {
      return next(createError(404, 'Product generation not found'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        generation: productGeneration,
      },
    })
  } catch (error) {
    console.error('Get Product Generation Error:', error)
    next(createError(500, 'Failed to retrieve product generation'))
  }
}

// Mark content as copied (for analytics)
export const markContentCopied = async (req, res, next) => {
  try {
    const { id } = req.params
    const { section } = req.body
    const userId = req.user.id

    if (!section) {
      return next(createError(400, 'Section name is required'))
    }

    const productGeneration = await ProductGeneration.findOne({
      _id: id,
      user: userId,
    })

    if (!productGeneration) {
      return next(createError(404, 'Product generation not found'))
    }

    await productGeneration.markContentCopied(section)

    res.status(200).json({
      status: 'success',
      message: 'Content marked as copied',
      data: {
        generation: productGeneration,
      },
    })
  } catch (error) {
    console.error('Mark Content Copied Error:', error)
    next(createError(500, 'Failed to mark content as copied'))
  }
}

// Mark product as downloaded
export const markProductDownloaded = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const productGeneration = await ProductGeneration.findOne({
      _id: id,
      user: userId,
    })

    if (!productGeneration) {
      return next(createError(404, 'Product generation not found'))
    }

    await productGeneration.markDownloaded()

    res.status(200).json({
      status: 'success',
      message: 'Product marked as downloaded',
      data: {
        generation: productGeneration,
      },
    })
  } catch (error) {
    console.error('Mark Product Downloaded Error:', error)
    next(createError(500, 'Failed to mark product as downloaded'))
  }
}

// Add feedback to a product generation
export const addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params
    const { rating, feedback } = req.body
    const userId = req.user.id

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return next(createError(400, 'Rating must be between 1 and 5'))
    }

    const productGeneration = await ProductGeneration.findOne({
      _id: id,
      user: userId,
    })

    if (!productGeneration) {
      return next(createError(404, 'Product generation not found'))
    }

    await productGeneration.addFeedback(rating, feedback)

    res.status(200).json({
      status: 'success',
      message: 'Feedback added successfully',
      data: {
        generation: productGeneration,
      },
    })
  } catch (error) {
    console.error('Add Feedback Error:', error)
    next(createError(500, 'Failed to add feedback'))
  }
}

// Get user's product generation statistics
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    const stats = await ProductGeneration.getUserStats(userId)

    // Calculate additional stats
    const recentGenerations = await ProductGeneration.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    }).countDocuments()

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          ...stats,
          recentGenerations,
        },
      },
    })
  } catch (error) {
    console.error('Get User Stats Error:', error)
    next(createError(500, 'Failed to retrieve user statistics'))
  }
}

// Delete a product generation
export const deleteProductGeneration = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const productGeneration = await ProductGeneration.findOneAndDelete({
      _id: id,
      user: userId,
    })

    if (!productGeneration) {
      return next(createError(404, 'Product generation not found'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Product generation deleted successfully',
    })
  } catch (error) {
    console.error('Delete Product Generation Error:', error)
    next(createError(500, 'Failed to delete product generation'))
  }
}

// Admin: Get product analytics
export const getProductAnalytics = async (req, res, next) => {
  try {
    const analytics = await ProductGeneration.getProductAnalytics()

    res.status(200).json({
      status: 'success',
      data: {
        analytics,
      },
    })
  } catch (error) {
    console.error('Get Product Analytics Error:', error)
    next(createError(500, 'Failed to retrieve product analytics'))
  }
}

// Admin: Get all product generations
export const getAllProductGenerations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const productGenerations = await ProductGeneration.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalGenerations = await ProductGeneration.countDocuments()

    res.status(200).json({
      status: 'success',
      results: productGenerations.length,
      totalResults: totalGenerations,
      totalPages: Math.ceil(totalGenerations / limit),
      currentPage: page,
      data: {
        generations: productGenerations,
      },
    })
  } catch (error) {
    console.error('Get All Product Generations Error:', error)
    next(createError(500, 'Failed to retrieve all product generations'))
  }
}

// Test AI service connection
export const testAIConnection = async (req, res, next) => {
  try {
    const connectionTest = await productService.testConnection()

    res.status(200).json({
      status: 'success',
      message: 'AI service connection successful',
      data: connectionTest,
    })
  } catch (error) {
    console.error('AI Connection Test Error:', error)
    next(createError(500, `AI service connection failed: ${error.message}`))
  }
}

// Test GROQ connection specifically
export const testGroqConnection = async (req, res, next) => {
  try {
    const result = await productService.testConnection()

    res.status(200).json({
      status: 'success',
      message: 'GROQ connection successful',
      data: result,
    })
  } catch (error) {
    next(createError(500, `GROQ connection failed: ${error.message}`))
  }
}

export const exportProduct = async (req, res, next) => {
  try {
    const { generationId, format } = req.body
    const userId = req.user.id
    const userEmail = req.user.email

    // Validate required parameters
    if (!generationId || !format) {
      return next(createError(400, 'Generation ID and format are required'))
    }

    // Validate format
    const validFormats = ['pdf', 'docx', 'xlsx', 'pptx']
    if (!validFormats.includes(format)) {
      return next(
        createError(
          400,
          `Invalid format. Supported formats: ${validFormats.join(', ')}`
        )
      )
    }

    // Find the product generation
    const productGeneration = await ProductGeneration.findOne({
      _id: generationId,
      user: userId,
      status: 'completed',
    })

    if (!productGeneration) {
      return next(
        createError(404, 'Product generation not found or not completed')
      )
    }

    if (!productGeneration.generatedProduct) {
      return next(createError(400, 'Product data is not available for export'))
    }

    try {
      // Generate the export using the exportService
      const result = await exportService.exportProduct(
        productGeneration.generatedProduct,
        generationId,
        format,
        userEmail
      )

      // Mark as downloaded (optional - for analytics)
      try {
        await productGeneration.markDownloaded()
      } catch (markError) {
        console.warn('Failed to mark as downloaded:', markError.message)
        // Don't fail the request for this
      }

      // Set response headers for file download
      res.setHeader('Content-Type', result.contentType)
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${result.filename}"`
      )
      res.setHeader('Content-Length', result.buffer.length)
      res.setHeader('Cache-Control', 'no-cache')

      // Send the file buffer
      res.send(result.buffer)
    } catch (exportError) {
      console.error('❌ Export generation error:', exportError)

      // Provide specific error messages based on the error type
      if (exportError.message.includes('PDF')) {
        return next(
          createError(500, 'PDF generation failed. Please try again.')
        )
      } else if (exportError.message.includes('Excel')) {
        return next(
          createError(500, 'Excel generation failed. Please try again.')
        )
      } else if (exportError.message.includes('timeout')) {
        return next(
          createError(504, 'Export generation timed out. Please try again.')
        )
      } else {
        return next(createError(500, `Export failed: ${exportError.message}`))
      }
    }
  } catch (error) {
    console.error('❌ Export controller error:', error)
    next(createError(500, 'Export failed due to server error'))
  }
}

// Track export analytics
export const trackExport = async (req, res, next) => {
  try {
    const { generationId, format } = req.body
    const userId = req.user.id

    // You could save this to a separate analytics collection if needed
    // await ExportAnalytics.create({ userId, generationId, format, timestamp: new Date() })

    next()
  } catch (error) {
    console.warn('Export tracking failed:', error.message)
    next() // Don't fail the request for tracking errors
  }
}
