// File: client/src/services/productServices.js - FIXED with correct endpoints
import axiosInstance from '../config/config.js'

export const productService = {
  // Generate complete digital product
  generateProduct: async (productData) => {
    const response = await axiosInstance.post('/products/generate', productData)
    return response.data
  },

  // Get user's product generation history
  getProductHistory: async (params = {}) => {
    const response = await axiosInstance.get('/products/history', { params })
    return response.data
  },

  // Get user's product generation statistics - FIXED: endpoint
  getUserStats: async () => {
    const response = await axiosInstance.get('/products/stats/user')
    return response.data
  },

  // Get specific product generation by ID
  getProductGeneration: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`)
    return response.data
  },

  // Mark content as copied (for analytics)
  markContentCopied: async (id, section) => {
    const response = await axiosInstance.post(`/products/${id}/copy`, {
      section,
    })
    return response.data
  },

  // Mark product as downloaded (for analytics)
  markProductDownloaded: async (id) => {
    const response = await axiosInstance.post(`/products/${id}/download`)
    return response.data
  },

  // Add feedback to a product generation
  addFeedback: async (id, feedbackData) => {
    const response = await axiosInstance.post(
      `/products/${id}/feedback`,
      feedbackData
    )
    return response.data
  },

  // Delete a product generation
  deleteProductGeneration: async (id) => {
    const response = await axiosInstance.delete(`/products/${id}`)
    return response.data
  },

  // Test AI service connection (admin only)
  testAIConnection: async () => {
    const response = await axiosInstance.get('/products/test-connection')
    return response.data
  },

  // FIXED: Test GROQ connection (admin only) - matches your backend routes
  testGroqConnection: async () => {
    const response = await axiosInstance.get('/products/test-groq')
    return response.data
  },

  // Get product analytics (admin only)
  getProductAnalytics: async () => {
    const response = await axiosInstance.get('/products/admin/analytics')
    return response.data
  },

  // Get all product generations (admin only)
  getAllProductGenerations: async (params = {}) => {
    const response = await axiosInstance.get('/products/admin/all', { params })
    return response.data
  },

  // Export product in various formats
  exportProduct: async (generationId, format) => {
    try {
      ;`Starting export: ${format} for generation: ${generationId}`

      const response = await axiosInstance.post(
        '/products/export',
        {
          generationId,
          format,
        },
        {
          responseType: 'blob', // Important for file downloads
          timeout: 60000, // 60 second timeout for large files
        }
      )

      // Get filename from response headers
      const contentDisposition = response.headers['content-disposition']
      let filename = `product-blueprint.${format}`

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]*)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create blob and download
      const blob = new Blob([response.data], {
        type: response.headers['content-type'],
      })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      return {
        success: true,
        filename,
        size: blob.size,
      }
    } catch (error) {
      console.error('Export error:', error)

      // Handle specific error types
      if (error.response?.status === 404) {
        throw new Error('Product generation not found')
      } else if (error.response?.status === 401) {
        throw new Error('Please log in to export products')
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
