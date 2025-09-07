// File: client/src/services/earningsServices.js
import axiosInstance from '../config/config.js'

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
  },
}
