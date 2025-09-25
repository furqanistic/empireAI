// File: server/routes/usage.js
import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import { PLAN_FEATURES } from '../utils/planConfig.js'
import {
  checkFeatureAndUsageLimit,
  checkGenerationLimit,
  getUserUsageHistory,
  getUserUsageStats,
} from '../utils/usageTracking.js'

const router = express.Router()

// Get current user's usage stats
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id
    const userPlan = req.user.subscription?.isActive
      ? req.user.subscription.plan
      : 'free'

    // Get usage stats
    const usageStats = await getUserUsageStats(userId)

    // Get plan configuration
    const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free

    // Check current limit status
    const limitStatus = await checkGenerationLimit(userId, userPlan)

    res.status(200).json({
      success: true,
      data: {
        usage: usageStats,
        plan: {
          name: userPlan,
          maxGenerations: planConfig.maxGenerations,
          unlimited: planConfig.maxGenerations === -1,
          aiBuilders: planConfig.aiBuilders,
        },
        limits: limitStatus,
        status: {
          canGenerate: limitStatus.allowed,
          remaining: limitStatus.remaining,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    next(error)
  }
})

// Get usage history
router.get('/history', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id
    const monthsBack = parseInt(req.query.months) || 6

    const history = await getUserUsageHistory(userId, monthsBack)

    res.status(200).json({
      success: true,
      data: {
        history,
        monthsBack,
      },
    })
  } catch (error) {
    console.error('Error fetching usage history:', error)
    next(error)
  }
})

// Check if user can access a specific feature
router.get('/check/:feature', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id
    const feature = req.params.feature
    const userPlan = req.user.subscription?.isActive
      ? req.user.subscription.plan
      : 'free'

    const limitCheck = await checkFeatureAndUsageLimit(
      userId,
      feature,
      userPlan
    )

    res.status(200).json({
      success: true,
      data: {
        feature,
        userPlan,
        allowed: limitCheck.allowed,
        reason: limitCheck.reason,
        hasFeatureAccess: limitCheck.hasFeatureAccess,
        hasUsageAvailable: limitCheck.hasUsageAvailable,
        usageData: limitCheck.usageData,
      },
    })
  } catch (error) {
    console.error('Error checking feature access:', error)
    next(error)
  }
})

// Get all available features for user's plan
router.get('/features', verifyToken, async (req, res, next) => {
  try {
    const userPlan = req.user.subscription?.isActive
      ? req.user.subscription.plan
      : 'free'

    const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free

    res.status(200).json({
      success: true,
      data: {
        plan: userPlan,
        features: planConfig.aiBuilders,
        maxGenerations: planConfig.maxGenerations,
        unlimited: planConfig.maxGenerations === -1,
        description: planConfig.features,
      },
    })
  } catch (error) {
    console.error('Error fetching plan features:', error)
    next(error)
  }
})

export default router
