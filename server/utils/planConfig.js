// File: server/utils/planConfig.js
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
