// File: src/services/payoutService.js
import axiosInstance from '../config/config.js'

export const payoutService = {
  // ============================================================================
  // STRIPE CONNECT ACCOUNT MANAGEMENT
  // ============================================================================

  // Get Connect account status
  getConnectStatus: async () => {
    try {
      const response = await axiosInstance.get('/payouts/connect/status')
      return response.data
    } catch (error) {
      console.error('Error getting connect status:', error)
      throw error
    }
  },

  // Create Connect account
  createConnectAccount: async (data = { country: 'US' }) => {
    try {
      const response = await axiosInstance.post(
        '/payouts/connect/create-account',
        data
      )
      return response.data
    } catch (error) {
      console.error('Error creating connect account:', error)
      throw error
    }
  },

  // Get onboarding link
  getOnboardingLink: async () => {
    try {
      const response = await axiosInstance.get(
        '/payouts/connect/onboarding-link'
      )
      return response.data
    } catch (error) {
      console.error('Error getting onboarding link:', error)
      throw error
    }
  },

  // Get management link
  getManagementLink: async () => {
    try {
      const response = await axiosInstance.get(
        '/payouts/connect/management-link'
      )
      return response.data
    } catch (error) {
      console.error('Error getting management link:', error)
      throw error
    }
  },

  // Refresh account status
  refreshStatus: async () => {
    try {
      const response = await axiosInstance.post(
        '/payouts/connect/refresh-status'
      )
      return response.data
    } catch (error) {
      console.error('Error refreshing status:', error)
      throw error
    }
  },

  // Reset account (dev only)
  resetAccount: async () => {
    try {
      const response = await axiosInstance.delete('/payouts/connect/reset')
      return response.data
    } catch (error) {
      console.error('Error resetting account:', error)
      throw error
    }
  },

  // ============================================================================
  // EARNINGS MANAGEMENT
  // ============================================================================

  // Get earnings summary
  getEarningsSummary: async () => {
    try {
      const response = await axiosInstance.get('/payouts/earnings/summary')
      return response.data
    } catch (error) {
      console.error('Error getting earnings summary:', error)
      throw error
    }
  },

  // Get user earnings
  getEarnings: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/payouts/earnings', { params })
      return response.data
    } catch (error) {
      console.error('Error getting earnings:', error)
      throw error
    }
  },

  // Get earning details
  getEarningDetails: async (earningId) => {
    try {
      const response = await axiosInstance.get(`/payouts/earnings/${earningId}`)
      return response.data
    } catch (error) {
      console.error('Error getting earning details:', error)
      throw error
    }
  },

  // Get earnings analytics
  getEarningsAnalytics: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/payouts/earnings/analytics', {
        params,
      })
      return response.data
    } catch (error) {
      console.error('Error getting earnings analytics:', error)
      throw error
    }
  },

  // ============================================================================
  // PAYOUT MANAGEMENT
  // ============================================================================

  // Request payout
  requestPayout: async (data) => {
    try {
      const response = await axiosInstance.post('/payouts/request', data)
      return response.data
    } catch (error) {
      console.error('Error requesting payout:', error)
      throw error
    }
  },

  // Get payout history
  getPayoutHistory: async (params = {}) => {
    try {
      const response = await axiosInstance.get('/payouts/history', { params })
      return response.data
    } catch (error) {
      console.error('Error getting payout history:', error)
      throw error
    }
  },

  // Cancel payout
  cancelPayout: async (payoutId) => {
    try {
      const response = await axiosInstance.delete(`/payouts/${payoutId}/cancel`)
      return response.data
    } catch (error) {
      console.error('Error cancelling payout:', error)
      throw error
    }
  },

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  // Get formatted currency
  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100)
  },

  // Get status color
  getStatusColor: (status) => {
    const colors = {
      pending: 'text-yellow-400',
      approved: 'text-blue-400',
      paid: 'text-green-400',
      disputed: 'text-red-400',
      cancelled: 'text-gray-400',
      failed: 'text-red-400',
      processing: 'text-blue-400',
      in_transit: 'text-purple-400',
    }
    return colors[status] || 'text-gray-400'
  },

  // Get status badge classes
  getStatusBadgeClasses: (status) => {
    const classes = {
      pending: 'bg-yellow-500/10 text-yellow-400',
      approved: 'bg-blue-500/10 text-blue-400',
      paid: 'bg-green-500/10 text-green-400',
      disputed: 'bg-red-500/10 text-red-400',
      cancelled: 'bg-gray-500/10 text-gray-400',
      failed: 'bg-red-500/10 text-red-400',
      processing: 'bg-blue-500/10 text-blue-400',
      in_transit: 'bg-purple-500/10 text-purple-400',
    }
    return classes[status] || 'bg-gray-500/10 text-gray-400'
  },

  // Format date
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  },

  // Format date and time
  formatDateTime: (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },
}
