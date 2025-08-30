// File: client/src/services/hookServices.js
import axiosInstance from '../config/config.js'

export const hookService = {
  // Generate viral hooks
  generateHooks: async (hookData) => {
    const response = await axiosInstance.post('/hooks/generate', hookData)
    return response.data
  },

  // Get user's hook generation history
  getHookHistory: async (params = {}) => {
    const response = await axiosInstance.get('/hooks/history', { params })
    return response.data
  },

  // Get user's hook generation statistics
  getUserStats: async () => {
    const response = await axiosInstance.get('/hooks/stats')
    return response.data
  },

  // Get specific hook generation by ID
  getHookGeneration: async (id) => {
    const response = await axiosInstance.get(`/hooks/${id}`)
    return response.data
  },

  // Mark a hook as copied (for analytics)
  markHookCopied: async (id, hookIndex) => {
    const response = await axiosInstance.post(`/hooks/${id}/copy`, {
      hookIndex,
    })
    return response.data
  },

  // Add feedback to a hook generation
  addFeedback: async (id, feedbackData) => {
    const response = await axiosInstance.post(
      `/hooks/${id}/feedback`,
      feedbackData
    )
    return response.data
  },

  // Delete a hook generation
  deleteHookGeneration: async (id) => {
    const response = await axiosInstance.delete(`/hooks/${id}`)
    return response.data
  },

  // Test GROQ connection (admin only)
  testGroqConnection: async () => {
    const response = await axiosInstance.get('/hooks/test-connection')
    return response.data
  },

  // Get platform analytics (admin only)
  getPlatformAnalytics: async () => {
    const response = await axiosInstance.get('/hooks/admin/analytics')
    return response.data
  },

  // Get all hook generations (admin only)
  getAllHookGenerations: async (params = {}) => {
    const response = await axiosInstance.get('/hooks/admin/all', { params })
    return response.data
  },
}
