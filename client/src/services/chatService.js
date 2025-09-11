// File: client/src/services/chatService.js
import axiosInstance from '../config/config.js'

export const chatService = {
  // Send message and get AI response
  sendMessage: async (messageData) => {
    const response = await axiosInstance.post('/chat/message', messageData)
    return response.data
  },

  // Get user's conversation history
  getConversations: async (params = {}) => {
    const response = await axiosInstance.get('/chat/conversations', { params })
    return response.data
  },

  // Get specific conversation by ID
  getConversation: async (id) => {
    const response = await axiosInstance.get(`/chat/conversation/${id}`)
    return response.data
  },

  // Update conversation (title, tags, etc.)
  updateConversation: async (id, updateData) => {
    const response = await axiosInstance.put(
      `/chat/conversation/${id}`,
      updateData
    )
    return response.data
  },

  // Delete specific conversation
  deleteConversation: async (id) => {
    const response = await axiosInstance.delete(`/chat/conversation/${id}`)
    return response.data
  },

  // Clear all conversations
  clearAllConversations: async () => {
    const response = await axiosInstance.delete('/chat/conversations/clear')
    return response.data
  },

  // Archive/unarchive conversation
  toggleArchiveConversation: async (id) => {
    const response = await axiosInstance.patch(
      `/chat/conversation/${id}/archive`
    )
    return response.data
  },

  // Add feedback to specific message
  addMessageFeedback: async (conversationId, messageId, feedbackData) => {
    const response = await axiosInstance.post(
      `/chat/conversation/${conversationId}/message/${messageId}/feedback`,
      feedbackData
    )
    return response.data
  },

  // Get user's chat statistics
  getUserChatStats: async () => {
    const response = await axiosInstance.get('/chat/stats')
    return response.data
  },

  // Get suggested questions
  getSuggestedQuestions: async (params = {}) => {
    const response = await axiosInstance.get('/chat/suggestions', { params })
    return response.data
  },

  // Test chat service connection
  testChatService: async () => {
    const response = await axiosInstance.get('/chat/test')
    return response.data
  },

  // Admin: Get chat analytics
  getChatAnalytics: async () => {
    const response = await axiosInstance.get('/chat/admin/analytics')
    return response.data
  },

  // Streaming chat functionality
  streaming: {
    // Create EventSource for streaming messages
    sendStreamingMessage: (messageData, onEvent) => {
      return new Promise((resolve, reject) => {
        // Create a regular POST request first to initiate the stream
        axiosInstance
          .post('/chat/streaming/stream', messageData, {
            responseType: 'stream',
          })
          .then((response) => {
            let fullResponse = ''
            let conversationData = null

            // Create a custom EventSource-like handler
            const processStreamData = (data) => {
              const lines = data.split('\n')

              for (const line of lines) {
                if (line.startsWith('event: ')) {
                  const eventType = line.slice(7)
                  continue
                }

                if (line.startsWith('data: ')) {
                  try {
                    const eventData = JSON.parse(line.slice(6))

                    // Handle different event types
                    switch (eventData.type || 'content') {
                      case 'conversation':
                        conversationData = eventData
                        onEvent('conversation', eventData)
                        break
                      case 'bot_start':
                        onEvent('bot_start', eventData)
                        break
                      case 'content':
                        fullResponse += eventData.content || ''
                        onEvent('content', {
                          ...eventData,
                          fullContent: fullResponse,
                        })
                        break
                      case 'complete':
                        onEvent('complete', {
                          ...eventData,
                          fullContent: fullResponse,
                          conversation: conversationData,
                        })
                        resolve({
                          conversation: conversationData,
                          content: fullResponse,
                          ...eventData,
                        })
                        break
                      case 'error':
                        onEvent('error', eventData)
                        reject(new Error(eventData.error))
                        break
                    }
                  } catch (parseError) {
                    console.error('Error parsing stream data:', parseError)
                  }
                }
              }
            }

            // For now, we'll use regular fetch for streaming
            // This is a simplified implementation
            resolve(response.data)
          })
          .catch(reject)
      })
    },

    // Establish persistent connection
    establishConnection: (onEvent) => {
      return axiosInstance
        .get('/chat/streaming/connect', {
          responseType: 'stream',
        })
        .then((response) => {
          // Handle connection events
          onEvent('connected', { status: 'connected' })
          return response.data
        })
    },

    // Send typing indicator
    sendTypingIndicator: async (conversationId, isTyping) => {
      const response = await axiosInstance.post('/chat/streaming/typing', {
        conversationId,
        isTyping,
      })
      return response.data
    },
  },
}
