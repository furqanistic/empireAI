// File: src/services/stripeServices.js
import axiosInstance from '../config/config.js'

export const stripeService = {
  // Get all available subscription plans
  getPlans: async () => {
    const response = await axiosInstance.get('/stripe/plans')
    return response.data
  },

  // Create checkout session for new subscription
  createCheckoutSession: async (planData) => {
    const response = await axiosInstance.post(
      '/stripe/create-checkout-session',
      planData
    )
    return response.data
  },

  // Verify checkout session after successful payment
  verifyCheckoutSession: async (sessionId) => {
    const response = await axiosInstance.post(
      '/stripe/verify-checkout-session',
      {
        sessionId,
      }
    )
    return response.data
  },

  // Get current user's subscription
  getCurrentSubscription: async () => {
    const response = await axiosInstance.get('/stripe/subscription')
    return response.data
  },

  // Update subscription (change plan)
  updateSubscription: async (updateData) => {
    const response = await axiosInstance.put('/stripe/subscription', updateData)
    return response.data
  },

  // Cancel subscription
  cancelSubscription: async (immediate = false) => {
    const response = await axiosInstance.post('/stripe/cancel-subscription', {
      immediate,
    })
    return response.data
  },

  // Reactivate subscription (if canceled at period end)
  reactivateSubscription: async () => {
    const response = await axiosInstance.post('/stripe/reactivate-subscription')
    return response.data
  },

  // Create billing portal session
  createBillingPortalSession: async () => {
    const response = await axiosInstance.post(
      '/stripe/create-billing-portal-session'
    )
    return response.data
  },

  // Sync subscription with Stripe
  syncWithStripe: async () => {
    const response = await axiosInstance.post('/stripe/sync-with-stripe')
    return response.data
  },

  // Admin: Get all subscriptions
  getAllSubscriptions: async (params = {}) => {
    const response = await axiosInstance.get('/stripe/admin/subscriptions', {
      params,
    })
    return response.data
  },
}
