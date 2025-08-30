// File: controllers/hookController.js
import { createError } from '../error.js'
import HookGeneration from '../models/HookGeneration.js'
import groqService from '../services/groqService.js'

// Generate viral hooks
export const generateHooks = async (req, res, next) => {
  try {
    const { platform, niche, tone, customPrompt } = req.body
    const userId = req.user.id

    // Validate required fields
    if (!platform || !niche || !tone) {
      return next(createError(400, 'Platform, niche, and tone are required'))
    }

    // Validate enum values
    const validPlatforms = [
      'instagram',
      'tiktok',
      'twitter',
      'linkedin',
      'email',
      'youtube',
    ]
    const validNiches = [
      'entrepreneurship',
      'fitness',
      'relationships',
      'finance',
      'self-improvement',
      'technology',
      'marketing',
      'health',
      'travel',
      'education',
      'fashion',
      'food',
    ]
    const validTones = [
      'urgent',
      'controversial',
      'curiosity',
      'emotional',
      'authority',
      'storytelling',
    ]

    if (!validPlatforms.includes(platform)) {
      return next(createError(400, 'Invalid platform selected'))
    }
    if (!validNiches.includes(niche)) {
      return next(createError(400, 'Invalid niche selected'))
    }
    if (!validTones.includes(tone)) {
      return next(createError(400, 'Invalid tone selected'))
    }

    // Create initial generation record
    const hookGeneration = new HookGeneration({
      user: userId,
      platform,
      niche,
      tone,
      customPrompt: customPrompt || '',
      status: 'pending',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    })

    await hookGeneration.save()

    try {
      // Generate hooks using GROQ
      const groqResult = await groqService.generateViralHooks({
        platform,
        niche,
        tone,
        customPrompt,
      })

      // Format hooks for storage
      const formattedHooks = groqResult.hooks.map((content, index) => ({
        content,
        position: index + 1,
        copied: false,
      }))

      // Update the generation record with results
      hookGeneration.generatedHooks = formattedHooks
      hookGeneration.tokenUsage = groqResult.usage
      hookGeneration.processingTime = groqResult.processingTime
      hookGeneration.modelUsed = groqResult.model
      hookGeneration.status = 'completed'

      await hookGeneration.save()

      // Return successful response
      res.status(200).json({
        status: 'success',
        data: {
          id: hookGeneration._id,
          hooks: formattedHooks.map((hook) => hook.content),
          metadata: {
            platform,
            niche,
            tone,
            customPrompt: customPrompt || null,
            processingTime: groqResult.processingTime,
            tokenUsage: groqResult.usage,
          },
          generation: hookGeneration,
        },
      })
    } catch (groqError) {
      // Update generation record with error
      hookGeneration.status = 'failed'
      hookGeneration.error = {
        message: groqError.message,
        code: 'GROQ_API_ERROR',
      }
      await hookGeneration.save()

      console.error('GROQ Generation Error:', groqError)
      return next(
        createError(500, 'Failed to generate hooks. Please try again.')
      )
    }
  } catch (error) {
    console.error('Hook Generation Error:', error)
    next(
      createError(500, 'An unexpected error occurred while generating hooks')
    )
  }
}

// Get user's hook generation history
export const getHookHistory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Get user's hook generations with pagination
    const hookGenerations = await HookGeneration.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalGenerations = await HookGeneration.countDocuments({
      user: userId,
    })

    res.status(200).json({
      status: 'success',
      results: hookGenerations.length,
      totalResults: totalGenerations,
      totalPages: Math.ceil(totalGenerations / limit),
      currentPage: page,
      data: {
        generations: hookGenerations,
      },
    })
  } catch (error) {
    console.error('Get Hook History Error:', error)
    next(createError(500, 'Failed to retrieve hook generation history'))
  }
}

// Get specific hook generation by ID
export const getHookGeneration = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const hookGeneration = await HookGeneration.findOne({
      _id: id,
      user: userId,
    })

    if (!hookGeneration) {
      return next(createError(404, 'Hook generation not found'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        generation: hookGeneration,
      },
    })
  } catch (error) {
    console.error('Get Hook Generation Error:', error)
    next(createError(500, 'Failed to retrieve hook generation'))
  }
}

// Mark a hook as copied (for analytics)
export const markHookCopied = async (req, res, next) => {
  try {
    const { id } = req.params
    const { hookIndex } = req.body
    const userId = req.user.id

    if (hookIndex === undefined || hookIndex < 0 || hookIndex > 4) {
      return next(
        createError(400, 'Invalid hook index. Must be between 0 and 4.')
      )
    }

    const hookGeneration = await HookGeneration.findOne({
      _id: id,
      user: userId,
    })

    if (!hookGeneration) {
      return next(createError(404, 'Hook generation not found'))
    }

    const success = await hookGeneration.markHookCopied(hookIndex)

    if (!success) {
      return next(createError(400, 'Hook index not found'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Hook marked as copied',
      data: {
        generation: hookGeneration,
      },
    })
  } catch (error) {
    console.error('Mark Hook Copied Error:', error)
    next(createError(500, 'Failed to mark hook as copied'))
  }
}

// Add feedback to a hook generation
export const addFeedback = async (req, res, next) => {
  try {
    const { id } = req.params
    const { rating, feedback } = req.body
    const userId = req.user.id

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return next(createError(400, 'Rating must be between 1 and 5'))
    }

    const hookGeneration = await HookGeneration.findOne({
      _id: id,
      user: userId,
    })

    if (!hookGeneration) {
      return next(createError(404, 'Hook generation not found'))
    }

    await hookGeneration.addFeedback(rating, feedback)

    res.status(200).json({
      status: 'success',
      message: 'Feedback added successfully',
      data: {
        generation: hookGeneration,
      },
    })
  } catch (error) {
    console.error('Add Feedback Error:', error)
    next(createError(500, 'Failed to add feedback'))
  }
}

// Get user's hook generation statistics
export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    const stats = await HookGeneration.getUserStats(userId)

    // Calculate additional stats
    const recentGenerations = await HookGeneration.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
    }).countDocuments()

    const totalCopiedHooks = await HookGeneration.aggregate([
      { $match: { user: userId } },
      { $unwind: '$generatedHooks' },
      { $match: { 'generatedHooks.copied': true } },
      { $count: 'totalCopied' },
    ])

    const copiedCount = totalCopiedHooks[0]?.totalCopied || 0

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          ...stats,
          recentGenerations,
          totalCopiedHooks: copiedCount,
          copyRate:
            stats.totalHooks > 0
              ? ((copiedCount / stats.totalHooks) * 100).toFixed(1)
              : 0,
        },
      },
    })
  } catch (error) {
    console.error('Get User Stats Error:', error)
    next(createError(500, 'Failed to retrieve user statistics'))
  }
}

// Delete a hook generation
export const deleteHookGeneration = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const hookGeneration = await HookGeneration.findOneAndDelete({
      _id: id,
      user: userId,
    })

    if (!hookGeneration) {
      return next(createError(404, 'Hook generation not found'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Hook generation deleted successfully',
    })
  } catch (error) {
    console.error('Delete Hook Generation Error:', error)
    next(createError(500, 'Failed to delete hook generation'))
  }
}

// Admin: Get platform analytics
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const analytics = await HookGeneration.getPlatformAnalytics()

    res.status(200).json({
      status: 'success',
      data: {
        analytics,
      },
    })
  } catch (error) {
    console.error('Get Platform Analytics Error:', error)
    next(createError(500, 'Failed to retrieve platform analytics'))
  }
}

// Admin: Get all hook generations
export const getAllHookGenerations = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const hookGenerations = await HookGeneration.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalGenerations = await HookGeneration.countDocuments()

    res.status(200).json({
      status: 'success',
      results: hookGenerations.length,
      totalResults: totalGenerations,
      totalPages: Math.ceil(totalGenerations / limit),
      currentPage: page,
      data: {
        generations: hookGenerations,
      },
    })
  } catch (error) {
    console.error('Get All Hook Generations Error:', error)
    next(createError(500, 'Failed to retrieve all hook generations'))
  }
}

// Test GROQ connection
export const testGroqConnection = async (req, res, next) => {
  try {
    const connectionTest = await groqService.testConnection()

    res.status(200).json({
      status: 'success',
      message: 'GROQ connection successful',
      data: connectionTest,
    })
  } catch (error) {
    console.error('GROQ Connection Test Error:', error)
    next(createError(500, `GROQ connection failed: ${error.message}`))
  }
}
