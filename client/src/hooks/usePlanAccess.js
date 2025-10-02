// File: client/src/hooks/usePlanAccess.js
import { selectCurrentUser } from '@/redux/userSlice'
import { useSelector } from 'react-redux'
import { useUsageStats } from './useUsageStats'

export const PLAN_FEATURES = {
  free: {
    aiBuilders: ['viral-hooks', 'product-generator', 'niche-launchpad'], // All builders
    maxGenerations: 3,
    features: ['All AI Builders', '3 free generations', 'Community support'],
  },
  starter: {
    aiBuilders: ['viral-hooks', 'product-generator', 'niche-launchpad'], // All builders
    maxGenerations: 10,
    features: ['All AI Builders', '10 generations/month', 'Email support'],
  },
  pro: {
    aiBuilders: ['viral-hooks', 'product-generator', 'niche-launchpad'], // All builders
    maxGenerations: 50,
    features: ['All AI Builders', '50 generations/month', 'Priority support'],
  },
  empire: {
    aiBuilders: ['viral-hooks', 'product-generator', 'niche-launchpad'], // All builders
    maxGenerations: -1,
    features: [
      'All AI Builders',
      'Unlimited Generations',
      'Priority Support',
      'Direct Mentor Access',
    ],
  },
}

export const useCheckPlanAccess = (requiredFeature) => {
  const currentUser = useSelector(selectCurrentUser)
  const {
    data: usageData,
    isLoading: usageLoading,
    error: usageError,
  } = useUsageStats()

  const userPlan = currentUser?.subscription?.isActive
    ? currentUser.subscription.plan
    : 'free'

  const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free
  const isActive = currentUser?.subscription?.isActive || false

  // Feature access - everyone has access to all features now
  const hasFeatureAccess = true // Changed: all users have feature access

  // Usage calculations
  const totalUsed = usageData?.data?.usage?.total || 0
  const maxGenerations = planConfig.maxGenerations
  const unlimited = maxGenerations === -1

  // Usage availability check
  const hasUsageAvailable = unlimited || totalUsed < maxGenerations

  // Remaining calculations
  const remaining = unlimited ? -1 : Math.max(0, maxGenerations - totalUsed)

  // Overall access - only depends on usage now
  const hasAccess = unlimited || hasUsageAvailable

  // Create usage stats object
  const usageStats = {
    used: totalUsed,
    limit: maxGenerations,
    remaining,
    unlimited,
    loading: usageLoading,
    error: usageError,
  }

  return {
    // Main access control
    hasAccess,
    hasFeatureAccess, // Always true now
    hasUsageAvailable,

    // User info
    userPlan,
    isActive,

    // Limits info
    maxGenerations,
    unlimited,

    // Usage stats
    usageStats,

    // Loading states
    isLoading: usageLoading,

    // Legacy support
    usageData: usageData?.data,
  }
}

export const getRequiredPlan = (feature) => {
  // Since all features are available to all plans, return free
  return 'free'
}

export const getPlanFeatures = (plan) => {
  return PLAN_FEATURES[plan]?.features || []
}

export const hasUnlimitedGenerations = (plan) => {
  return PLAN_FEATURES[plan]?.maxGenerations === -1
}

export const getPlanConfig = (plan) => {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free
}

export const canAccessFeature = (userPlan, feature) => {
  // Everyone can access all features now
  return true
}

export const getGenerationLimit = (plan) => {
  const config = getPlanConfig(plan)
  return config.maxGenerations
}

export const isFeatureUnlocked = (userPlan, feature) => {
  // All features unlocked for everyone
  return true
}
