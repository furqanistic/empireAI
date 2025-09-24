// File: client/src/hooks/usePlanAccess.js
import { selectCurrentUser } from '@/redux/userSlice'
import { useSelector } from 'react-redux'

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

  // DEBUG: Log the entire user object
  console.log('👤 Current User:', currentUser)
  console.log('📦 Subscription Object:', currentUser?.subscription)

  const userPlan = currentUser?.subscription?.isActive
    ? currentUser.subscription.plan
    : 'free'

  const hasAccess =
    PLAN_FEATURES[userPlan]?.aiBuilders?.includes(requiredFeature) || false

  console.log('✅ Plan Access Check:', {
    requiredFeature,
    userPlan,
    isActive: currentUser?.subscription?.isActive,
    hasAccess,
    availableBuilders: PLAN_FEATURES[userPlan]?.aiBuilders,
  })

  return {
    hasAccess,
    userPlan,
    isActive: currentUser?.subscription?.isActive || false,
    maxGenerations: PLAN_FEATURES[userPlan]?.maxGenerations || 0,
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
