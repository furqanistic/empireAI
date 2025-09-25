// File: server/middleware/usageMiddleware.js - FIXED: Prevents double counting
import { PLAN_FEATURES } from '../utils/planConfig.js'
import {
  checkFeatureAndUsageLimit,
  trackGeneration,
} from '../utils/usageTracking.js'

export const checkUsageLimit = (featureType) => {
  return async (req, res, next) => {
    try {
      const userId = req.user._id.toString()
      const userPlan = req.user.subscription?.isActive
        ? req.user.subscription.plan
        : 'free'

      console.log(
        `🔍 Checking usage limit for ${featureType} - User: ${userId}, Plan: ${userPlan}`
      )

      const limitCheck = await checkFeatureAndUsageLimit(
        userId,
        featureType,
        userPlan
      )

      if (!limitCheck.allowed) {
        let message = 'Access denied'
        let statusCode = 403

        if (limitCheck.reason === 'FEATURE_NOT_AVAILABLE') {
          message = `This feature requires a higher plan. Please upgrade to access ${featureType}.`
          statusCode = 403
        } else if (limitCheck.reason === 'USAGE_LIMIT_EXCEEDED') {
          const { used, limit } = limitCheck.usageData
          message = `Monthly generation limit reached (${used}/${limit}). Upgrade your plan or wait until next month.`
          statusCode = 429
        }

        return res.status(statusCode).json({
          success: false,
          error: message,
          details: {
            reason: limitCheck.reason,
            hasFeatureAccess: limitCheck.hasFeatureAccess,
            hasUsageAvailable: limitCheck.hasUsageAvailable,
            usageData: limitCheck.usageData,
          },
        })
      }

      req.limitCheck = limitCheck
      next()
    } catch (error) {
      console.error('Error checking usage limit:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to check usage limits',
      })
    }
  }
}

export const requireAnyAIBuilderAccess = async (req, res, next) => {
  try {
    const userPlan = req.user.subscription?.isActive
      ? req.user.subscription.plan
      : 'free'

    const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free

    if (planConfig.aiBuilders.length === 0) {
      return res.status(403).json({
        success: false,
        error:
          'AI Builder features require a paid plan. Please upgrade to continue.',
        requiresUpgrade: true,
      })
    }

    next()
  } catch (error) {
    console.error('Error checking AI builder access:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to check access permissions',
    })
  }
}

// FIXED: Simplified middleware that prevents double counting
export const logUsageAfterGeneration = (featureType) => {
  return (req, res, next) => {
    const originalJson = res.json
    let hasTracked = false // Prevent double tracking

    res.json = function (body) {
      // Call original method first
      const result = originalJson.call(this, body)

      // Only track once and only on success
      if (
        !hasTracked &&
        body &&
        body.success !== false &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        hasTracked = true // Set flag immediately
        const userId = req.user?._id?.toString()

        if (userId) {
          console.log(
            `📊 Attempting to track generation: ${featureType} for user ${userId}`
          )

          // Use setImmediate to track after response is sent
          setImmediate(async () => {
            try {
              await trackGeneration(userId, featureType)
              console.log(`✅ Successfully tracked generation: ${featureType}`)
            } catch (error) {
              console.error('❌ Error tracking generation:', error)
            }
          })
        }
      } else if (hasTracked) {
        console.log(`⚠️ Skipping duplicate tracking for ${featureType}`)
      } else {
        console.log(
          `❌ Not tracking - Success: ${body?.success}, Status: ${res.statusCode}`
        )
      }

      return result
    }

    next()
  }
}
