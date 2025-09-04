// File: client/src/services/businessPlanServices.js
import axiosInstance from '../config/config.js'

export const businessPlanService = {
  // Generate business plan
  generateBusinessPlan: async (planData) => {
    const response = await axiosInstance.post(
      '/business-plans/generate',
      planData
    )
    return response.data
  },

  // Get user's business plan history
  getBusinessPlanHistory: async (params = {}) => {
    const response = await axiosInstance.get('/business-plans/history', {
      params,
    })
    return response.data
  },

  // Get user's business plan statistics
  getUserStats: async () => {
    const response = await axiosInstance.get('/business-plans/stats')
    return response.data
  },

  // Get specific business plan by ID
  getBusinessPlan: async (id) => {
    const response = await axiosInstance.get(`/business-plans/${id}`)
    return response.data
  },

  // Mark a business plan as downloaded (for analytics)
  markAsDownloaded: async (id) => {
    const response = await axiosInstance.post(`/business-plans/${id}/download`)
    return response.data
  },

  // Add feedback to a business plan
  addFeedback: async (id, feedbackData) => {
    const response = await axiosInstance.post(
      `/business-plans/${id}/feedback`,
      feedbackData
    )
    return response.data
  },

  // Delete a business plan
  deleteBusinessPlan: async (id) => {
    const response = await axiosInstance.delete(`/business-plans/${id}`)
    return response.data
  },

  // Get niche analytics (admin only)
  getNicheAnalytics: async () => {
    const response = await axiosInstance.get('/business-plans/admin/analytics')
    return response.data
  },

  // Get all business plans (admin only)
  getAllBusinessPlans: async (params = {}) => {
    const response = await axiosInstance.get('/business-plans/admin/all', {
      params,
    })
    return response.data
  },

  // Health check for business plan API
  healthCheck: async () => {
    const response = await axiosInstance.get('/business-plans/health')
    return response.data
  },
}
