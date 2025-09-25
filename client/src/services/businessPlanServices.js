// File: client/src/services/businessPlanServices.js - CORRECTED to match server routes
import axiosInstance from '../config/config.js'

export const businessPlanService = {
  // Generate business plan - CORRECTED: matches server route /business-plans/
  generateBusinessPlan: async (planData) => {
    const response = await axiosInstance.post(
      '/business-plans/generate',
      planData
    )
    return response.data
  },

  // Get user's business plan history - CORRECTED
  getBusinessPlanHistory: async (params = {}) => {
    const response = await axiosInstance.get('/business-plans/history', {
      params,
    })
    return response.data
  },

  // Get user's business plan statistics - CORRECTED
  getUserStats: async () => {
    const response = await axiosInstance.get('/business-plans/stats/user')
    return response.data
  },

  // Get specific business plan by ID - CORRECTED
  getBusinessPlan: async (id) => {
    const response = await axiosInstance.get(`/business-plans/${id}`)
    return response.data
  },

  // Mark a business plan as downloaded (for analytics) - CORRECTED
  markAsDownloaded: async (id) => {
    const response = await axiosInstance.post(`/business-plans/${id}/download`)
    return response.data
  },

  // Add feedback to a business plan - CORRECTED
  addFeedback: async (id, feedbackData) => {
    const response = await axiosInstance.post(
      `/business-plans/${id}/feedback`,
      feedbackData
    )
    return response.data
  },

  // Delete a business plan - CORRECTED
  deleteBusinessPlan: async (id) => {
    const response = await axiosInstance.delete(`/business-plans/${id}`)
    return response.data
  },

  // Get niche analytics (admin only) - CORRECTED
  getNicheAnalytics: async () => {
    const response = await axiosInstance.get(
      '/business-plans/admin/analytics/niches'
    )
    return response.data
  },

  // Get all business plans (admin only) - CORRECTED
  getAllBusinessPlans: async (params = {}) => {
    const response = await axiosInstance.get('/business-plans/admin/all', {
      params,
    })
    return response.data
  },

  // Export business plan in various formats - CORRECTED
  exportBusinessPlan: async (generationId, format) => {
    try {
      const response = await axiosInstance.post(
        '/business-plans/export',
        {
          generationId,
          format,
        },
        {
          responseType: 'blob',
          timeout: 60000,
        }
      )

      const contentDisposition = response.headers['content-disposition']
      let filename = `business-plan.${format}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]*)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return {
        success: true,
        filename,
        size: blob.size,
      }
    } catch (error) {
      console.error('Business plan export error:', error)

      if (error.response?.status === 404) {
        throw new Error('Business plan not found')
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to export business plans')
      } else if (error.response?.status === 400) {
        throw new Error('Invalid export request')
      } else if (error.response?.status >= 500) {
        throw new Error('Server error - please try again later')
      } else if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network error - check your connection')
      } else {
        throw new Error(
          error.response?.data?.message || error.message || 'Export failed'
        )
      }
    }
  },
}
