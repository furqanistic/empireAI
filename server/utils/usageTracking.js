// File: server/utils/usageTracking.js
import GenerationUsage from '../models/GenerationUsage.js'
import { PLAN_FEATURES } from './planConfig.js'

// Get current month in format "2025-01"
const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Check if user has access to a feature and usage available
export const checkFeatureAndUsageLimit = async (
  userId,
  featureType,
  userPlan = 'free'
) => {
  try {
    const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free

    console.log(
      `🔍 Checking feature access - Plan: ${userPlan}, Feature: ${featureType}`
    )
    console.log(`📋 Plan config:`, planConfig)

    // First check if plan allows this feature
    const hasFeatureAccess =
      planConfig.aiBuilders?.includes(featureType) || false

    if (!hasFeatureAccess) {
      console.log(`❌ Feature ${featureType} not available in ${userPlan} plan`)
      return {
        allowed: false,
        reason: 'FEATURE_NOT_AVAILABLE',
        hasFeatureAccess: false,
        hasUsageAvailable: false,
        usageData: null,
      }
    }

    // Check usage limits
    const usageCheck = await checkGenerationLimit(userId, userPlan)

    console.log(`📊 Usage check result:`, usageCheck)

    return {
      allowed: hasFeatureAccess && usageCheck.allowed,
      reason: usageCheck.allowed ? null : 'USAGE_LIMIT_EXCEEDED',
      hasFeatureAccess,
      hasUsageAvailable: usageCheck.allowed,
      usageData: usageCheck,
    }
  } catch (error) {
    console.error('Error in checkFeatureAndUsageLimit:', error)
    throw error
  }
}

// Track a generation (called after successful generation)
export const trackGeneration = async (userId, type) => {
  const month = getCurrentMonth()

  try {
    console.log(
      `📈 Tracking generation: ${type} for user ${userId} in ${month}`
    )

    // Find or create usage record for this month and type
    const usage = await GenerationUsage.findOneAndUpdate(
      {
        user: userId,
        month,
        type,
      },
      {
        $inc: { count: 1 },
        $set: { lastGenerated: new Date() },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    )

    console.log(
      `✅ Successfully tracked generation: ${type} for user ${userId} (total count: ${usage.count})`
    )

    return usage
  } catch (error) {
    console.error('Error tracking generation:', error)
    // Don't throw the error - we don't want to break the user flow
    // if tracking fails, but we should log it
    return null
  }
}

// Check if user has reached their limit
export const checkGenerationLimit = async (userId, userPlan) => {
  const month = getCurrentMonth()
  const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free

  try {
    console.log(
      `🔍 Checking generation limit for user ${userId}, plan ${userPlan}`
    )

    // Unlimited for empire plan
    if (planConfig?.maxGenerations === -1) {
      console.log(`♾️ Unlimited generations for ${userPlan} plan`)
      return {
        allowed: true,
        unlimited: true,
        used: 0,
        limit: -1,
        remaining: -1,
      }
    }

    const maxGenerations = planConfig?.maxGenerations || 0

    // Get total usage for current month across all types
    const usageRecords = await GenerationUsage.find({
      user: userId,
      month,
    }).lean()

    const totalUsed = usageRecords.reduce(
      (sum, record) => sum + record.count,
      0
    )
    const allowed = totalUsed < maxGenerations
    const remaining = Math.max(0, maxGenerations - totalUsed)

    console.log(
      `📊 Usage summary for user ${userId}: ${totalUsed}/${maxGenerations} used, remaining: ${remaining}, allowed: ${allowed}`
    )

    return {
      allowed,
      unlimited: false,
      used: totalUsed,
      limit: maxGenerations,
      remaining,
    }
  } catch (error) {
    console.error('Error checking generation limit:', error)
    // On error, be conservative and don't allow generation
    return {
      allowed: false,
      unlimited: false,
      used: 0,
      limit: 0,
      remaining: 0,
    }
  }
}

// Get user's usage stats
export const getUserUsageStats = async (userId) => {
  const month = getCurrentMonth()

  try {
    const usageRecords = await GenerationUsage.find({
      user: userId,
      month,
    }).lean()

    const stats = {
      month,
      viralHooks: 0,
      productGenerator: 0,
      nicheLaunchpad: 0,
      total: 0,
      lastUpdated: new Date(),
    }

    usageRecords.forEach((record) => {
      stats.total += record.count
      switch (record.type) {
        case 'viral-hooks':
          stats.viralHooks = record.count
          break
        case 'product-generator':
          stats.productGenerator = record.count
          break
        case 'niche-launchpad':
          stats.nicheLaunchpad = record.count
          break
      }
    })

    console.log(`📈 Retrieved usage stats for user ${userId}:`, stats)
    return stats
  } catch (error) {
    console.error('Error getting user usage stats:', error)
    return {
      month,
      viralHooks: 0,
      productGenerator: 0,
      nicheLaunchpad: 0,
      total: 0,
      lastUpdated: new Date(),
    }
  }
}

// Get usage history for multiple months
export const getUserUsageHistory = async (userId, monthsBack = 6) => {
  const currentDate = new Date()
  const months = []

  // Generate month strings
  for (let i = 0; i < monthsBack; i++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - i,
      1
    )
    months.push(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    )
  }

  try {
    const usageRecords = await GenerationUsage.find({
      user: userId,
      month: { $in: months },
    })
      .sort({ month: -1 })
      .lean()

    const history = months.map((month) => {
      const monthRecords = usageRecords.filter(
        (record) => record.month === month
      )
      const total = monthRecords.reduce((sum, record) => sum + record.count, 0)

      return {
        month,
        total,
        viralHooks:
          monthRecords.find((r) => r.type === 'viral-hooks')?.count || 0,
        productGenerator:
          monthRecords.find((r) => r.type === 'product-generator')?.count || 0,
        nicheLaunchpad:
          monthRecords.find((r) => r.type === 'niche-launchpad')?.count || 0,
      }
    })

    return history
  } catch (error) {
    console.error('Error getting usage history:', error)
    return []
  }
}

// Reset usage for testing (admin only)
export const resetUserUsage = async (userId, month = null) => {
  const targetMonth = month || getCurrentMonth()

  try {
    const result = await GenerationUsage.deleteMany({
      user: userId,
      month: targetMonth,
    })

    console.log(
      `🔄 Reset usage for user ${userId} in ${targetMonth}: ${result.deletedCount} records deleted`
    )
    return result
  } catch (error) {
    console.error('Error resetting usage:', error)
    throw error
  }
}
