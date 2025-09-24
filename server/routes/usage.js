// File: server/routes/usage.js
import express from 'express'
import { verifyToken } from '../middleware/authMiddleware.js'
import { PLAN_FEATURES } from '../utils/planConfig.js'
import { getUserUsageStats } from '../utils/usageTracking.js'

const router = express.Router()

// Get current user's usage stats
router.get('/stats', verifyToken, async (req, res, next) => {
  try {
    const userId = req.user._id
    const userPlan = req.user.subscription?.isActive
      ? req.user.subscription.plan
      : 'free'

    const usageStats = await getUserUsageStats(userId)
    const planConfig = PLAN_FEATURES[userPlan]

    res.status(200).json({
      success: true,
      data: {
        usage: usageStats,
        plan: {
          name: userPlan,
          maxGenerations: planConfig.maxGenerations,
          unlimited: planConfig.maxGenerations === -1,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    next(error)
  }
})

export default router
