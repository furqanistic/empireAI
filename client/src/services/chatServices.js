// File: client/src/services/chatService.js
import axiosInstance from '../config/config.js'

export const chatService = {
  // Create new chat
  createChat: async () => {
    const response = await axiosInstance.post('/chat/create')
    return response.data
  },

  // Get user's chat history
  getChatHistory: async () => {
    const response = await axiosInstance.get('/chat/history')
    return response.data
  },

  // Get specific chat by ID
  getChat: async (chatId) => {
    const response = await axiosInstance.get(`/chat/${chatId}`)
    return response.data
  },

  // Send message to chat
  sendMessage: async (chatId, message) => {
    const endpoint =
      chatId === 'new' || !chatId
        ? '/chat/new/message'
        : `/chat/${chatId}/message`

    const response = await axiosInstance.post(endpoint, { message })
    return response.data
  },

  // Delete specific chat
  deleteChat: async (chatId) => {
    const response = await axiosInstance.delete(`/chat/${chatId}`)
    return response.data
  },

  // Clear all chats
  clearAllChats: async () => {
    const response = await axiosInstance.delete('/chat/clear/all')
    return response.data
  },

  // Test connection
  testConnection: async () => {
    const response = await axiosInstance.get('/chat/test')
    return response.data
  },
}
