// File: client/src/services/chatServices.js
import axiosInstance from '../config/config.js'

export const chatService = {
  // Create a new chat conversation
  createChat: async (chatData) => {
    const response = await axiosInstance.post('/chat/', chatData)
    return response.data
  },

  // Send a message to a chat
  sendMessage: async (chatId, messageData) => {
    const response = await axiosInstance.post(
      `/chat/${chatId}/message`,
      messageData
    )
    return response.data
  },

  // Get user's chat history
  getChatHistory: async (params = {}) => {
    const response = await axiosInstance.get('/chat/history', { params })
    return response.data
  },

  // Get specific chat conversation
  getChat: async (chatId, params = {}) => {
    const response = await axiosInstance.get(`/chat/${chatId}`, { params })
    return response.data
  },

  // Update chat settings
  updateChat: async (chatId, updateData) => {
    const response = await axiosInstance.patch(`/chat/${chatId}`, updateData)
    return response.data
  },

  // Delete chat conversation
  deleteChat: async (chatId) => {
    const response = await axiosInstance.delete(`/chat/${chatId}`)
    return response.data
  },

  // Clear chat messages
  clearChat: async (chatId) => {
    const response = await axiosInstance.post(`/chat/${chatId}/clear`)
    return response.data
  },

  // Get user's chat statistics
  getUserChatStats: async () => {
    const response = await axiosInstance.get('/chat/stats')
    return response.data
  },

  // Get chat categories with counts
  getChatCategories: async () => {
    const response = await axiosInstance.get('/chat/categories')
    return response.data
  },

  // Send quick action message
  sendQuickAction: async (chatId, quickAction) => {
    const response = await axiosInstance.post(`/chat/${chatId}/message`, {
      quickAction,
    })
    return response.data
  },

  // Test chat service connection (admin only)
  testChatConnection: async () => {
    const response = await axiosInstance.get('/chat/test-connection')
    return response.data
  },

  // Get chat analytics (admin only)
  getChatAnalytics: async () => {
    const response = await axiosInstance.get('/chat/admin/analytics')
    return response.data
  },

  // Get all chat conversations (admin only)
  getAllChats: async (params = {}) => {
    const response = await axiosInstance.get('/chat/admin/all', { params })
    return response.data
  },
}
