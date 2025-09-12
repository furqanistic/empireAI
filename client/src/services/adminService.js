// File: client/src/services/adminService.js - ENHANCED WITH SUBSCRIPTION MANAGEMENT
import axiosInstance from '../config/config.js'

export const adminService = {
  // Get all users with pagination and filters
  getAllUsers: async (params = {}) => {
    const response = await axiosInstance.get('/auth/all-users', { params })
    return response.data
  },

  // Get admin statistics
  getAdminStats: async () => {
    const response = await axiosInstance.get('/auth/admin/stats')
    return response.data
  },

  // Update user (admin only)
  updateUser: async (userId, userData) => {
    const response = await axiosInstance.put(
      `/auth/admin/users/${userId}`,
      userData
    )
    return response.data
  },

  // NEW: Update user subscription plan (admin only)
  updateUserSubscription: async (userId, subscriptionData) => {
    const response = await axiosInstance.put(
      `/admin/users/${userId}/subscription`,
      subscriptionData
    )
    return response.data
  },

  // NEW: Cancel user subscription (admin only)
  cancelUserSubscription: async (userId, immediate = false) => {
    const response = await axiosInstance.post(
      `/admin/users/${userId}/subscription/cancel`,
      { immediate }
    )
    return response.data
  },

  // NEW: Reactivate user subscription (admin only)
  reactivateUserSubscription: async (userId) => {
    const response = await axiosInstance.post(
      `/admin/users/${userId}/subscription/reactivate`
    )
    return response.data
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/auth/admin/users/${userId}`)
    return response.data
  },

  // Create new user (admin only)
  createUser: async (userData) => {
    const response = await axiosInstance.post('/auth/create-user', userData)
    return response.data
  },

  // Get commission/payout data
  getPayouts: async (params = {}) => {
    const response = await axiosInstance.get('/admin/payouts', { params })
    return response.data
  },

  // Approve payout
  approvePayout: async (payoutId) => {
    const response = await axiosInstance.put(
      `/admin/payouts/${payoutId}/approve`
    )
    return response.data
  },

  // Reject payout
  rejectPayout: async (payoutId, reason) => {
    const response = await axiosInstance.put(
      `/admin/payouts/${payoutId}/reject`,
      { reason }
    )
    return response.data
  },

  // Mark payout as completed
  completePayout: async (payoutId) => {
    const response = await axiosInstance.put(
      `/admin/payouts/${payoutId}/complete`
    )
    return response.data
  },
}
