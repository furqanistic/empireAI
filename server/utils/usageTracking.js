// File: server/utils/usageTracking.js
import GenerationUsage from '../models/GenerationUsage.js'
import { PLAN_FEATURES } from './planConfig.js'

// Get current month in format "2025-01"
const getCurrentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// Track a generation
export const trackGeneration = async (userId, type) => {
  const month = getCurrentMonth()

  try {
    const usage = await GenerationUsage.findOneAndUpdate(
      { user: userId, month, type },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    )

    return usage
  } catch (error) {
    console.error('Error tracking generation:', error)
    throw error
  }
}

// Check if user has reached their limit
export const checkGenerationLimit = async (userId, userPlan) => {
  const month = getCurrentMonth()
  const planConfig = PLAN_FEATURES[userPlan]

  // Unlimited for empire plan
  if (planConfig?.maxGenerations === -1) {
    return { allowed: true, unlimited: true, used: 0, limit: -1 }
  }

  const maxGenerations = planConfig?.maxGenerations || 0

  // Get total usage for current month
  const usageRecords = await GenerationUsage.find({
    user: userId,
    month,
  })

  const totalUsed = usageRecords.reduce((sum, record) => sum + record.count, 0)

  const allowed = totalUsed < maxGenerations

  return {
    allowed,
    unlimited: false,
    used: totalUsed,
    limit: maxGenerations,
    remaining: Math.max(0, maxGenerations - totalUsed),
  }
}

// Get user's usage stats
export const getUserUsageStats = async (userId) => {
  const month = getCurrentMonth()

  const usageRecords = await GenerationUsage.find({
    user: userId,
    month,
  })

  const stats = {
    month,
    viralHooks: 0,
    productGenerator: 0,
    nicheLaunchpad: 0,
    total: 0,
  }

  usageRecords.forEach((record) => {
    stats.total += record.count
    if (record.type === 'viral-hooks') stats.viralHooks = record.count
    if (record.type === 'product-generator')
      stats.productGenerator = record.count
    if (record.type === 'niche-launchpad') stats.nicheLaunchpad = record.count
  })

  return stats
}
