// File: server/utils/usageTracking.js - UPDATED FOR SUBSCRIPTION BILLING CYCLES
import GenerationUsage from '../models/GenerationUsage.js'
import Subscription from '../models/Subscription.js'
import { PLAN_FEATURES } from './planConfig.js'

// Get the billing period key based on subscription
// This resets usage on subscription anniversary date, not calendar months
const getBillingPeriodKey = (subscriptionStartDate) => {
  const now = new Date()
  const start = new Date(subscriptionStartDate)

  // Start from subscription date and find current billing cycle
  let currentPeriodStart = new Date(start)
  let currentPeriodEnd = new Date(start)

  // For monthly billing, add 1 month at a time until we find the current period
  while (currentPeriodEnd <= now) {
    currentPeriodStart = new Date(currentPeriodEnd)
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
  }

  // Return a key like "2025-01-15-to-2025-02-15" or just use timestamps
  const startStr = currentPeriodStart.toISOString().split('T')[0]
  const endStr = currentPeriodEnd.toISOString().split('T')[0]
  return `${startStr}_to_${endStr}`
}

// Get current billing period for a user
export const getCurrentBillingPeriod = async (userId) => {
  try {
    const subscription = await Subscription.findOne({ user: userId })

    if (!subscription || !subscription.isActive) {
      // Free users: use calendar month as period
      const now = new Date()
      return {
        periodKey: `calendar_${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, '0')}`,
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
        isPaid: false,
      }
    }

    // Paid users: use subscription billing cycle
    const startDate = subscription.currentPeriodStart || new Date()
    const endDate = subscription.currentPeriodEnd || new Date()

    return {
      periodKey: getBillingPeriodKey(startDate),
      startDate,
      endDate,
      isPaid: true,
      plan: subscription.plan,
    }
  } catch (error) {
    console.error('Error getting billing period:', error)
    // Fallback to calendar month
    const now = new Date()
    return {
      periodKey: `calendar_${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, '0')}`,
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      isPaid: false,
    }
  }
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
  try {
    const billingPeriod = await getCurrentBillingPeriod(userId)
    const periodKey = billingPeriod.periodKey

    console.log(
      `📈 Tracking generation: ${type} for user ${userId} in period ${periodKey}`
    )

    // Find or create usage record for this billing period and type
    const usage = await GenerationUsage.findOneAndUpdate(
      {
        user: userId,
        periodKey, // Use billing period key instead of calendar month
        type,
      },
      {
        $inc: { count: 1 },
        $set: {
          lastGenerated: new Date(),
          periodStart: billingPeriod.startDate,
          periodEnd: billingPeriod.endDate,
        },
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
    return null
  }
}

// Check if user has reached their limit
export const checkGenerationLimit = async (userId, userPlan) => {
  try {
    const billingPeriod = await getCurrentBillingPeriod(userId)
    const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free

    console.log(
      `📅 Checking limit for billing period: ${billingPeriod.periodKey}`
    )

    // Unlimited for empire plan
    if (planConfig?.maxGenerations === -1) {
      return {
        allowed: true,
        unlimited: true,
        used: 0,
        limit: -1,
        remaining: -1,
        periodStart: billingPeriod.startDate,
        periodEnd: billingPeriod.endDate,
      }
    }

    const maxGenerations = planConfig?.maxGenerations || 0

    // Get total usage for current billing period across all types
    const usageRecords = await GenerationUsage.find({
      user: userId,
      periodKey: billingPeriod.periodKey,
    }).lean()

    const totalUsed = usageRecords.reduce(
      (sum, record) => sum + record.count,
      0
    )
    const allowed = totalUsed < maxGenerations
    const remaining = Math.max(0, maxGenerations - totalUsed)

    console.log(
      `📊 Usage: ${totalUsed}/${maxGenerations}, Remaining: ${remaining}`
    )

    return {
      allowed,
      unlimited: false,
      used: totalUsed,
      limit: maxGenerations,
      remaining,
      periodStart: billingPeriod.startDate,
      periodEnd: billingPeriod.endDate,
      resetsOn: billingPeriod.endDate,
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
  try {
    const billingPeriod = await getCurrentBillingPeriod(userId)

    const usageRecords = await GenerationUsage.find({
      user: userId,
      periodKey: billingPeriod.periodKey,
    }).lean()

    const stats = {
      periodKey: billingPeriod.periodKey,
      periodStart: billingPeriod.startDate,
      periodEnd: billingPeriod.endDate,
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
    const billingPeriod = await getCurrentBillingPeriod(userId).catch(() => ({
      periodKey: 'unknown',
      startDate: new Date(),
      endDate: new Date(),
    }))

    return {
      periodKey: billingPeriod.periodKey,
      periodStart: billingPeriod.startDate,
      periodEnd: billingPeriod.endDate,
      viralHooks: 0,
      productGenerator: 0,
      nicheLaunchpad: 0,
      total: 0,
      lastUpdated: new Date(),
    }
  }
}

// Get usage history for multiple billing periods
export const getUserUsageHistory = async (userId, periodsBack = 6) => {
  try {
    // Get all usage records for user
    const allUsageRecords = await GenerationUsage.find({
      user: userId,
    })
      .sort({ periodStart: -1 })
      .lean()

    // Group by period and get the last 6 periods
    const periodMap = new Map()
    allUsageRecords.forEach((record) => {
      if (!periodMap.has(record.periodKey)) {
        periodMap.set(record.periodKey, [])
      }
      periodMap.get(record.periodKey).push(record)
    })

    // Convert to array and sort by date (most recent first)
    const history = Array.from(periodMap.entries())
      .slice(0, periodsBack)
      .map(([periodKey, records]) => {
        const total = records.reduce((sum, record) => sum + record.count, 0)

        return {
          periodKey,
          periodStart: records[0].periodStart,
          periodEnd: records[0].periodEnd,
          total,
          viralHooks: records.find((r) => r.type === 'viral-hooks')?.count || 0,
          productGenerator:
            records.find((r) => r.type === 'product-generator')?.count || 0,
          nicheLaunchpad:
            records.find((r) => r.type === 'niche-launchpad')?.count || 0,
        }
      })

    return history
  } catch (error) {
    console.error('Error getting usage history:', error)
    return []
  }
}

// Reset usage for testing (admin only)
export const resetUserUsage = async (userId, periodKey = null) => {
  try {
    const query = { user: userId }
    if (periodKey) {
      query.periodKey = periodKey
    }

    const result = await GenerationUsage.deleteMany(query)

    console.log(
      `🔄 Reset usage for user ${userId}${
        periodKey ? ` in period ${periodKey}` : ''
      }: ${result.deletedCount} records deleted`
    )
    return result
  } catch (error) {
    console.error('Error resetting usage:', error)
    throw error
  }
}
