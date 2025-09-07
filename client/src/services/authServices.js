// File: client/src/services/authServices.js - COMPLETE WITH ALL FEATURES
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
  // Delete user (admin)
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/auth/admin/users/${userId}`)
    return response.data
  },
  // Get all users (admin)
  getAllUsers: async (params = {}) => {
    const response = await axiosInstance.get('/auth/all-users', { params })
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

// Points Service
export const pointsService = {
  // Claim daily points
  claimDailyPoints: async () => {
    const response = await axiosInstance.post('/auth/claim-daily-points')
    return response.data
  },

  // Get points status
  getPointsStatus: async () => {
    const response = await axiosInstance.get('/auth/points-status')
    return response.data
  },

  // Get points leaderboard
  getPointsLeaderboard: async (params = {}) => {
    const response = await axiosInstance.get('/auth/points-leaderboard', {
      params,
    })
    return response.data
  },

  // Spend points (for future use)
  spendPoints: async (amount, description) => {
    const response = await axiosInstance.post('/points/spend', {
      amount,
      description,
    })
    return response.data
  },

  // Get points history
  getPointsHistory: async (params = {}) => {
    const response = await axiosInstance.get('/points/history', { params })
    return response.data
  },
}

// Stripe Service
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

// Earnings Service
export const earningsService = {
  // Get user's earnings with filtering and pagination
  getUserEarnings: async (params = {}) => {
    const response = await axiosInstance.get('/earnings', { params })
    return response.data
  },

  // Get specific earning details
  getEarningDetails: async (earningId) => {
    const response = await axiosInstance.get(`/earnings/${earningId}`)
    return response.data
  },

  // Get earnings analytics
  getEarningsAnalytics: async (period = '30') => {
    const response = await axiosInstance.get('/earnings/analytics', {
      params: { period },
    })
    return response.data
  },

  // Get earnings summary/stats
  getEarningsSummary: async () => {
    const response = await axiosInstance.get('/earnings/summary')
    return response.data
  },

  // Export earnings data
  exportEarnings: async (params = {}) => {
    const response = await axiosInstance.get('/earnings/export', {
      params,
      responseType: 'blob',
    })
    return response
  },

  // Request payout
  requestPayout: async (amount) => {
    const response = await axiosInstance.post('/earnings/request-payout', {
      amount,
    })
    return response.data
  },

  // Get payout history
  getPayoutHistory: async (params = {}) => {
    const response = await axiosInstance.get('/earnings/payouts', { params })
    return response.data
  },

  // Admin functions
  admin: {
    // Get all earnings (admin only)
    getAllEarnings: async (params = {}) => {
      const response = await axiosInstance.get('/earnings/admin/all', {
        params,
      })
      return response.data
    },

    // Approve earning
    approveEarning: async (earningId) => {
      const response = await axiosInstance.put(
        `/earnings/admin/${earningId}/approve`
      )
      return response.data
    },

    // Bulk approve earnings
    bulkApproveEarnings: async (earningIds) => {
      const response = await axiosInstance.put('/earnings/admin/bulk-approve', {
        earningIds,
      })
      return response.data
    },

    // Dispute earning
    disputeEarning: async (earningId, reason) => {
      const response = await axiosInstance.put(
        `/earnings/admin/${earningId}/dispute`,
        {
          reason,
        }
      )
      return response.data
    },

    // Cancel earning
    cancelEarning: async (earningId, reason) => {
      const response = await axiosInstance.put(
        `/earnings/admin/${earningId}/cancel`,
        {
          reason,
        }
      )
      return response.data
    },

    // Process payout
    processPayout: async (payoutId) => {
      const response = await axiosInstance.put(
        `/earnings/admin/payouts/${payoutId}/process`
      )
      return response.data
    },

    // Get payout requests
    getPayoutRequests: async (params = {}) => {
      const response = await axiosInstance.get('/earnings/admin/payouts', {
        params,
      })
      return response.data
    },
  },
}

// Analytics Service
export const analyticsService = {
  // Get dashboard analytics
  getDashboardAnalytics: async (period = '30') => {
    const response = await axiosInstance.get('/analytics/dashboard', {
      params: { period },
    })
    return response.data
  },

  // Get user activity
  getUserActivity: async (params = {}) => {
    const response = await axiosInstance.get('/analytics/activity', { params })
    return response.data
  },

  // Get conversion metrics
  getConversionMetrics: async (period = '30') => {
    const response = await axiosInstance.get('/analytics/conversions', {
      params: { period },
    })
    return response.data
  },

  // Admin analytics
  admin: {
    // Get platform overview
    getPlatformOverview: async (period = '30') => {
      const response = await axiosInstance.get('/analytics/admin/overview', {
        params: { period },
      })
      return response.data
    },

    // Get user metrics
    getUserMetrics: async (params = {}) => {
      const response = await axiosInstance.get('/analytics/admin/users', {
        params,
      })
      return response.data
    },

    // Get revenue metrics
    getRevenueMetrics: async (params = {}) => {
      const response = await axiosInstance.get('/analytics/admin/revenue', {
        params,
      })
      return response.data
    },
  },
}

// Product Service (for future use)
export const productService = {
  // Get all products
  getProducts: async (params = {}) => {
    const response = await axiosInstance.get('/products', { params })
    return response.data
  },

  // Get single product
  getProduct: async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}`)
    return response.data
  },

  // Create product (user)
  createProduct: async (productData) => {
    const response = await axiosInstance.post('/products', productData)
    return response.data
  },

  // Update product
  updateProduct: async (productId, productData) => {
    const response = await axiosInstance.put(
      `/products/${productId}`,
      productData
    )
    return response.data
  },

  // Delete product
  deleteProduct: async (productId) => {
    const response = await axiosInstance.delete(`/products/${productId}`)
    return response.data
  },

  // Get user's products
  getUserProducts: async (params = {}) => {
    const response = await axiosInstance.get('/products/my-products', {
      params,
    })
    return response.data
  },
}

// Support Service
export const supportService = {
  // Create support ticket
  createTicket: async (ticketData) => {
    const response = await axiosInstance.post('/support/tickets', ticketData)
    return response.data
  },

  // Get user's tickets
  getUserTickets: async (params = {}) => {
    const response = await axiosInstance.get('/support/tickets', { params })
    return response.data
  },

  // Get single ticket
  getTicket: async (ticketId) => {
    const response = await axiosInstance.get(`/support/tickets/${ticketId}`)
    return response.data
  },

  // Reply to ticket
  replyToTicket: async (ticketId, message) => {
    const response = await axiosInstance.post(
      `/support/tickets/${ticketId}/reply`,
      { message }
    )
    return response.data
  },

  // Close ticket
  closeTicket: async (ticketId) => {
    const response = await axiosInstance.put(
      `/support/tickets/${ticketId}/close`
    )
    return response.data
  },
}
