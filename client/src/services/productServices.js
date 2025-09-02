// File: client/src/services/productServices.js
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

  // Get user's product generation statistics
  getUserStats: async () => {
    const response = await axiosInstance.get('/products/stats')
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
}
