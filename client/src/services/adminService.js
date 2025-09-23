// File: client/src/services/adminService.js - COMPLETE ENHANCED VERSION
import axiosInstance from '../config/config.js'

export const adminService = {
  // ===================================================================
  // USER MANAGEMENT
  // ===================================================================

  // Get all users with pagination and filters
  getAllUsers: async (params = {}) => {
    try {
      console.log('Getting all users with params:', params)
      const response = await axiosInstance.get('/auth/all-users', { params })
      console.log(`Retrieved ${response.data.results || 0} users`)
      return response.data
    } catch (error) {
      console.error('Get all users error:', error)
      throw error
    }
  },

  // Get admin statistics
  getAdminStats: async () => {
    try {
      console.log('Getting admin statistics...')
      const response = await axiosInstance.get('/auth/admin/stats')
      console.log('Admin stats retrieved:', response.data.data)
      return response.data
    } catch (error) {
      console.error('Get admin stats error:', error)
      throw error
    }
  },

  // Update user (admin only)
  updateUser: async (userId, userData) => {
    try {
      console.log(`Updating user ${userId}:`, userData)
      const response = await axiosInstance.put(
        `/auth/admin/users/${userId}`,
        userData
      )
      console.log('User update response:', response.data)
      return response.data
    } catch (error) {
      console.error('Update user error:', error)
      throw error
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    try {
      console.log(`Deleting user ${userId}`)
      const response = await axiosInstance.delete(`/auth/admin/users/${userId}`)
      console.log('User deletion response:', response.data)
      return response.data
    } catch (error) {
      console.error('Delete user error:', error)
      throw error
    }
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    try {
      console.log('Creating new user:', { ...userData, password: '[REDACTED]' })
      const response = await axiosInstance.post('/auth/create-user', userData)
      console.log('User creation response:', response.data)
      return response.data
    } catch (error) {
      console.error('Create user error:', error)
      throw error
    }
  },

  // Get single user details (admin only)
  getUserDetails: async (userId) => {
    try {
      console.log(`Getting details for user ${userId}`)
      const response = await axiosInstance.get(`/auth/admin/users/${userId}`)
      console.log('User details retrieved:', response.data)
      return response.data
    } catch (error) {
      console.error('Get user details error:', error)
      throw error
    }
  },

  // ===================================================================
  // SUBSCRIPTION MANAGEMENT
  // ===================================================================

  // Update user subscription plan (admin only)
  updateUserSubscription: async (userId, subscriptionData) => {
    try {
      console.log(`Updating subscription for user ${userId}:`, subscriptionData)

      const response = await axiosInstance.put(
        `/admin/users/${userId}/subscription`,
        subscriptionData
      )

      console.log('Update subscription API response:', response.data)

      // Log the subscription details for debugging
      if (response.data.data?.subscription) {
        console.log('Updated subscription details:', {
          plan: response.data.data.subscription.plan,
          status: response.data.data.subscription.status,
          isActive: response.data.data.subscription.isActive,
          daysRemaining: response.data.data.subscription.daysRemaining,
        })
      }

      return response.data
    } catch (error) {
      console.error('Update subscription API error:', error)

      // Enhanced error logging
      if (error.response) {
        console.error('Error response data:', error.response.data)
        console.error('Error response status:', error.response.status)
      }

      throw error
    }
  },

  // Cancel user subscription (admin only)
  cancelUserSubscription: async (userId, immediate = false) => {
    try {
      console.log(
        `Cancelling subscription for user ${userId}, immediate: ${immediate}`
      )

      const response = await axiosInstance.post(
        `/admin/users/${userId}/subscription/cancel`,
        { immediate }
      )

      console.log('Cancel subscription API response:', response.data)

      // Log the cancellation result
      if (response.data.data?.subscription) {
        console.log('Cancelled subscription details:', {
          plan: response.data.data.subscription.plan,
          status: response.data.data.subscription.status,
          isActive: response.data.data.subscription.isActive,
          message: response.data.data.message,
        })
      }

      return response.data
    } catch (error) {
      console.error('Cancel subscription API error:', error)

      if (error.response) {
        console.error('Cancellation error details:', {
          status: error.response.status,
          data: error.response.data,
          userId,
        })
      }

      throw error
    }
  },

  // Reactivate user subscription (admin only)
  reactivateUserSubscription: async (userId) => {
    try {
      console.log(`Reactivating subscription for user ${userId}`)

      const response = await axiosInstance.post(
        `/admin/users/${userId}/subscription/reactivate`
      )

      console.log('Reactivate subscription API response:', response.data)

      // Log the reactivation result
      if (response.data.data?.subscription) {
        console.log('Reactivated subscription details:', {
          plan: response.data.data.subscription.plan,
          status: response.data.data.subscription.status,
          isActive: response.data.data.subscription.isActive,
        })
      }

      return response.data
    } catch (error) {
      console.error('Reactivate subscription API error:', error)
      throw error
    }
  },

  // Get all subscriptions (admin only)
  getAllSubscriptions: async (params = {}) => {
    try {
      console.log('Getting all subscriptions with params:', params)
      const response = await axiosInstance.get('/admin/subscriptions', {
        params,
      })
      console.log(`Retrieved ${response.data.results || 0} subscriptions`)
      return response.data
    } catch (error) {
      console.error('Get all subscriptions error:', error)
      throw error
    }
  },

  // Sync user subscription with Stripe (admin only)
  syncUserSubscription: async (userId) => {
    try {
      console.log(`Syncing subscription with Stripe for user ${userId}`)
      const response = await axiosInstance.post(
        `/admin/users/${userId}/subscription/sync`
      )
      console.log('Sync subscription response:', response.data)
      return response.data
    } catch (error) {
      console.error('Sync subscription error:', error)
      throw error
    }
  },

  // ===================================================================
  // PAYOUT & COMMISSION MANAGEMENT
  // ===================================================================

  // Get commission/payout data
  getPayouts: async (params = {}) => {
    try {
      console.log('Getting payouts with params:', params)
      const response = await axiosInstance.get('/admin/payouts', { params })
      console.log(`Retrieved ${response.data.results || 0} payouts`)
      return response.data
    } catch (error) {
      console.error('Get payouts error:', error)
      throw error
    }
  },

  // Get single payout details
  getPayoutDetails: async (payoutId) => {
    try {
      console.log(`Getting payout details for ${payoutId}`)
      const response = await axiosInstance.get(`/admin/payouts/${payoutId}`)
      console.log('Payout details retrieved:', response.data)
      return response.data
    } catch (error) {
      console.error('Get payout details error:', error)
      throw error
    }
  },

  // Approve payout
  approvePayout: async (payoutId) => {
    try {
      console.log(`Approving payout ${payoutId}`)
      const response = await axiosInstance.put(
        `/admin/payouts/${payoutId}/approve`
      )
      console.log('Payout approval response:', response.data)
      return response.data
    } catch (error) {
      console.error('Approve payout error:', error)
      throw error
    }
  },

  // Reject payout
  rejectPayout: async (payoutId, reason) => {
    try {
      console.log(`Rejecting payout ${payoutId} with reason:`, reason)
      const response = await axiosInstance.put(
        `/admin/payouts/${payoutId}/reject`,
        { reason }
      )
      console.log('Payout rejection response:', response.data)
      return response.data
    } catch (error) {
      console.error('Reject payout error:', error)
      throw error
    }
  },

  // Mark payout as completed
  completePayout: async (payoutId) => {
    try {
      console.log(`Completing payout ${payoutId}`)
      const response = await axiosInstance.put(
        `/admin/payouts/${payoutId}/complete`
      )
      console.log('Payout completion response:', response.data)
      return response.data
    } catch (error) {
      console.error('Complete payout error:', error)
      throw error
    }
  },

  // Bulk approve payouts
  bulkApprovePayouts: async (payoutIds) => {
    try {
      console.log(`Bulk approving ${payoutIds.length} payouts`)
      const response = await axiosInstance.put('/admin/payouts/bulk-approve', {
        payoutIds,
      })
      console.log('Bulk approval response:', response.data)
      return response.data
    } catch (error) {
      console.error('Bulk approve payouts error:', error)
      throw error
    }
  },

  // ===================================================================
  // EARNINGS MANAGEMENT
  // ===================================================================

  // Get all earnings
  getAllEarnings: async (params = {}) => {
    try {
      console.log('Getting all earnings with params:', params)
      const response = await axiosInstance.get('/admin/earnings', { params })
      console.log(`Retrieved ${response.data.results || 0} earnings`)
      return response.data
    } catch (error) {
      console.error('Get all earnings error:', error)
      throw error
    }
  },

  // Approve earning
  approveEarning: async (earningId) => {
    try {
      console.log(`Approving earning ${earningId}`)
      const response = await axiosInstance.put(
        `/admin/earnings/${earningId}/approve`
      )
      console.log('Earning approval response:', response.data)
      return response.data
    } catch (error) {
      console.error('Approve earning error:', error)
      throw error
    }
  },

  // Dispute earning
  disputeEarning: async (earningId, reason) => {
    try {
      console.log(`Disputing earning ${earningId} with reason:`, reason)
      const response = await axiosInstance.put(
        `/admin/earnings/${earningId}/dispute`,
        { reason }
      )
      console.log('Earning dispute response:', response.data)
      return response.data
    } catch (error) {
      console.error('Dispute earning error:', error)
      throw error
    }
  },

  // Cancel earning
  cancelEarning: async (earningId, reason) => {
    try {
      console.log(`Cancelling earning ${earningId} with reason:`, reason)
      const response = await axiosInstance.put(
        `/admin/earnings/${earningId}/cancel`,
        { reason }
      )
      console.log('Earning cancellation response:', response.data)
      return response.data
    } catch (error) {
      console.error('Cancel earning error:', error)
      throw error
    }
  },

  // ===================================================================
  // ANALYTICS & REPORTING
  // ===================================================================

  // Get revenue analytics
  getRevenueAnalytics: async (period = '30d') => {
    try {
      console.log(`Getting revenue analytics for period: ${period}`)
      const response = await axiosInstance.get('/admin/analytics/revenue', {
        params: { period },
      })
      console.log('Revenue analytics retrieved')
      return response.data
    } catch (error) {
      console.error('Get revenue analytics error:', error)
      throw error
    }
  },

  // Get user analytics
  getUserAnalytics: async (period = '30d') => {
    try {
      console.log(`Getting user analytics for period: ${period}`)
      const response = await axiosInstance.get('/admin/analytics/users', {
        params: { period },
      })
      console.log('User analytics retrieved')
      return response.data
    } catch (error) {
      console.error('Get user analytics error:', error)
      throw error
    }
  },

  // Get platform overview
  getPlatformOverview: async (period = '30d') => {
    try {
      console.log(`Getting platform overview for period: ${period}`)
      const response = await axiosInstance.get('/admin/analytics/overview', {
        params: { period },
      })
      console.log('Platform overview retrieved')
      return response.data
    } catch (error) {
      console.error('Get platform overview error:', error)
      throw error
    }
  },

  // ===================================================================
  // NOTIFICATION MANAGEMENT
  // ===================================================================

  // Send notification to user
  sendNotificationToUser: async (userId, notification) => {
    try {
      console.log(`Sending notification to user ${userId}:`, notification)
      const response = await axiosInstance.post(
        `/admin/notifications/user/${userId}`,
        notification
      )
      console.log('Notification sent response:', response.data)
      return response.data
    } catch (error) {
      console.error('Send notification error:', error)
      throw error
    }
  },

  // Send broadcast notification
  sendBroadcastNotification: async (notification, filters = {}) => {
    try {
      console.log(
        'Sending broadcast notification:',
        notification,
        'with filters:',
        filters
      )
      const response = await axiosInstance.post(
        '/admin/notifications/broadcast',
        {
          notification,
          filters,
        }
      )
      console.log('Broadcast notification response:', response.data)
      return response.data
    } catch (error) {
      console.error('Send broadcast notification error:', error)
      throw error
    }
  },

  // ===================================================================
  // SYSTEM MANAGEMENT
  // ===================================================================

  // Get system health
  getSystemHealth: async () => {
    try {
      console.log('Getting system health status')
      const response = await axiosInstance.get('/admin/system/health')
      console.log('System health retrieved')
      return response.data
    } catch (error) {
      console.error('Get system health error:', error)
      throw error
    }
  },

  // Clear cache
  clearCache: async (cacheType = 'all') => {
    try {
      console.log(`Clearing cache: ${cacheType}`)
      const response = await axiosInstance.post('/admin/system/clear-cache', {
        type: cacheType,
      })
      console.log('Cache clear response:', response.data)
      return response.data
    } catch (error) {
      console.error('Clear cache error:', error)
      throw error
    }
  },

  // Export data
  exportData: async (dataType, filters = {}) => {
    try {
      console.log(`Exporting data: ${dataType}`, filters)
      const response = await axiosInstance.post(
        '/admin/export',
        {
          type: dataType,
          filters,
        },
        {
          responseType: 'blob', // For file downloads
        }
      )
      console.log('Data export completed')
      return response.data
    } catch (error) {
      console.error('Export data error:', error)
      throw error
    }
  },

  // ===================================================================
  // REFERRAL MANAGEMENT
  // ===================================================================

  // Get referral analytics
  getReferralAnalytics: async (period = '30d') => {
    try {
      console.log(`Getting referral analytics for period: ${period}`)
      const response = await axiosInstance.get('/admin/referrals/analytics', {
        params: { period },
      })
      console.log('Referral analytics retrieved')
      return response.data
    } catch (error) {
      console.error('Get referral analytics error:', error)
      throw error
    }
  },

  // Update referral code
  updateUserReferralCode: async (userId, newCode) => {
    try {
      console.log(`Updating referral code for user ${userId}: ${newCode}`)
      const response = await axiosInstance.put(
        `/admin/users/${userId}/referral-code`,
        { referralCode: newCode }
      )
      console.log('Referral code update response:', response.data)
      return response.data
    } catch (error) {
      console.error('Update referral code error:', error)
      throw error
    }
  },
}
