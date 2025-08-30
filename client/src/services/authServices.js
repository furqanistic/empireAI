// File: client/src/services/authServices.js - UPDATED WITH STRIPE
import axiosInstance from '../config/config.js'

export const authService = {
  // Sign up user
  signup: async (userData) => {
    const response = await axiosInstance.post('/auth/signup', userData)
    return response.data
  },
  // Sign in user
  signin: async (credentials) => {
    const response = await axiosInstance.post('/auth/signin', credentials)
    return response.data
  },
  // Logout user
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout')
    return response.data
  },
  // Get user profile
  getUserProfile: async (userId) => {
    const response = await axiosInstance.get(`/auth/profile/${userId}`)
    return response.data
  },
  // Update user profile
  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/auth/profile', userData)
    return response.data
  },
  // Change password
  changePassword: async (passwordData) => {
    const response = await axiosInstance.put(
      '/auth/change-password',
      passwordData
    )
    return response.data
  },
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/auth/admin/users/${userId}`)
    return response.data
  },
}

export const referralService = {
  // Validate referral code
  validateReferralCode: async (code) => {
    const response = await axiosInstance.get(`/referral/validate/${code}`)
    return response.data
  },
  // Get referral stats
  getReferralStats: async (userId) => {
    const endpoint = userId ? `/referral/stats/${userId}` : '/referral/my-stats'
    const response = await axiosInstance.get(endpoint)
    return response.data
  },
  // Get referral leaderboard
  getReferralLeaderboard: async (params = {}) => {
    const response = await axiosInstance.get('/referral/leaderboard', {
      params,
    })
    return response.data
  },
  // Generate new referral code
  generateNewReferralCode: async () => {
    const response = await axiosInstance.put('/referral/generate-new-code')
    return response.data
  },
}

export const notificationService = {
  // Get user notifications with pagination and filters
  getNotifications: async (params = {}) => {
    const response = await axiosInstance.get('/notifications', { params })
    return response.data
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread-count')
    return response.data
  },

  // Get notification statistics
  getNotificationStats: async () => {
    const response = await axiosInstance.get('/notifications/stats')
    return response.data
  },

  // Mark specific notification as read
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.put(
      `/notifications/${notificationId}/read`
    )
    return response.data
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axiosInstance.put('/notifications/mark-all-read')
    return response.data
  },

  // Delete specific notification
  deleteNotification: async (notificationId) => {
    const response = await axiosInstance.delete(
      `/notifications/${notificationId}`
    )
    return response.data
  },

  // Clear all read notifications
  clearReadNotifications: async () => {
    const response = await axiosInstance.delete('/notifications/clear-read')
    return response.data
  },
}

// NEW: Stripe Service
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
