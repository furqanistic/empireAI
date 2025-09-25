// File: client/src/hooks/usePlanAccess.js
import { selectCurrentUser } from '@/redux/userSlice'
import { useSelector } from 'react-redux'
import { useUsageStats } from './useUsageStats'

export const PLAN_FEATURES = {
  free: {
    aiBuilders: [],
    maxGenerations: 0,
    features: ['Basic access', 'Community support'],
  },
  starter: {
    aiBuilders: ['viral-hooks'],
    maxGenerations: 10,
    features: ['Viral Hook Factory', '10 generations/month', 'Email support'],
  },
  pro: {
    aiBuilders: ['viral-hooks', 'product-generator'],
    maxGenerations: 50,
    features: [
      'Viral Hook Factory',
      'Product Generator',
      '50 generations/month',
      'Priority support',
    ],
  },
  empire: {
    aiBuilders: ['viral-hooks', 'product-generator', 'niche-launchpad'],
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

  // Feature access check
  const hasFeatureAccess =
    planConfig.aiBuilders?.includes(requiredFeature) || false

  // Usage calculations
  const totalUsed = usageData?.data?.usage?.total || 0
  const maxGenerations = planConfig.maxGenerations
  const unlimited = maxGenerations === -1

  // Usage availability check
  const hasUsageAvailable = unlimited || totalUsed < maxGenerations

  // Remaining calculations
  const remaining = unlimited ? -1 : Math.max(0, maxGenerations - totalUsed)

  // Overall access
  const hasAccess = hasFeatureAccess && (unlimited || hasUsageAvailable)

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
    hasFeatureAccess,
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

    // Legacy support (keeping for backwards compatibility)
    usageData: usageData?.data,
  }
}

export const getRequiredPlan = (feature) => {
  for (const [plan, config] of Object.entries(PLAN_FEATURES)) {
    if (config.aiBuilders.includes(feature)) {
      return plan
    }
  }
  return 'empire'
}

export const getPlanFeatures = (plan) => {
  return PLAN_FEATURES[plan]?.features || []
}

export const hasUnlimitedGenerations = (plan) => {
  return PLAN_FEATURES[plan]?.maxGenerations === -1
}

// Additional utility functions
export const getPlanConfig = (plan) => {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free
}

export const canAccessFeature = (userPlan, feature) => {
  const config = getPlanConfig(userPlan)
  return config.aiBuilders.includes(feature)
}

export const getGenerationLimit = (plan) => {
  const config = getPlanConfig(plan)
  return config.maxGenerations
}

export const isFeatureUnlocked = (userPlan, feature) => {
  return canAccessFeature(userPlan, feature)
}
