// File: client/src/hooks/useChat.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useState } from 'react'
import { chatService } from '../services/chatService.js'

// Send message and get AI response
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: (data) => {
      // Invalidate and refetch chat-related queries
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'stats'] })

      // Update specific conversation if we have the ID
      if (data.data?.conversation?.id) {
        queryClient.setQueryData(
          ['chat', 'conversation', data.data.conversation.id],
          data
        )
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to send message'
      console.error('Send message error:', error)
    },
  })
}

// Get user's conversation list
export const useConversations = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['chat', 'conversations', params],
    queryFn: () => chatService.getConversations(params),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get specific conversation by ID
export const useConversation = (id, enabled = true) => {
  return useQuery({
    queryKey: ['chat', 'conversation', id],
    queryFn: () => chatService.getConversation(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Update conversation
export const useUpdateConversation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...updateData }) =>
      chatService.updateConversation(id, updateData),
    onSuccess: (data, variables) => {
      // Update the specific conversation cache
      queryClient.setQueryData(['chat', 'conversation', variables.id], data)
      // Invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
    onError: (error) => {
      console.error('Failed to update conversation:', error)
    },
  })
}

// Delete conversation
export const useDeleteConversation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.deleteConversation,
    onSuccess: (data, deletedId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({
        queryKey: ['chat', 'conversation', deletedId],
      })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error)
    },
  })
}

// Clear all conversations
export const useClearAllConversations = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.clearAllConversations,
    onSuccess: () => {
      // Clear all conversation-related cache
      queryClient.removeQueries({ queryKey: ['chat', 'conversations'] })
      queryClient.removeQueries({ queryKey: ['chat', 'conversation'] })
      queryClient.invalidateQueries({ queryKey: ['chat', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to clear conversations:', error)
    },
  })
}

// Archive/unarchive conversation
export const useToggleArchiveConversation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.toggleArchiveConversation,
    onSuccess: (data, conversationId) => {
      // Update the specific conversation and conversations list
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversation', conversationId],
      })
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] })
    },
    onError: (error) => {
      console.error('Failed to toggle archive:', error)
    },
  })
}

// Add feedback to message
export const useAddMessageFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, messageId, ...feedbackData }) =>
      chatService.addMessageFeedback(conversationId, messageId, feedbackData),
    onSuccess: (data, variables) => {
      // Update the specific conversation
      queryClient.invalidateQueries({
        queryKey: ['chat', 'conversation', variables.conversationId],
      })
    },
    onError: (error) => {
      console.error('Failed to add message feedback:', error)
    },
  })
}

// Get user's chat statistics
export const useChatStats = (enabled = true) => {
  return useQuery({
    queryKey: ['chat', 'stats'],
    queryFn: chatService.getUserChatStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get suggested questions
export const useSuggestedQuestions = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['chat', 'suggestions', params],
    queryFn: () => chatService.getSuggestedQuestions(params),
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Test chat service connection
export const useTestChatService = () => {
  return useMutation({
    mutationFn: chatService.testChatService,
    onSuccess: (data) => {
      console.log('Chat service test successful:', data)
    },
    onError: (error) => {
      console.error('Chat service test failed:', error)
    },
  })
}

// Admin: Get chat analytics
export const useChatAnalytics = (enabled = true) => {
  return useQuery({
    queryKey: ['chat', 'admin', 'analytics'],
    queryFn: chatService.getChatAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Custom hook for streaming chat functionality
export const useStreamingChat = () => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [error, setError] = useState(null)
  const queryClient = useQueryClient()
  const abortControllerRef = useRef(null)

  const sendStreamingMessage = useCallback(
    async (messageData) => {
      setIsStreaming(true)
      setStreamingMessage('')
      setError(null)

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      try {
        const result = await chatService.streaming.sendStreamingMessage(
          messageData,
          (eventType, data) => {
            switch (eventType) {
              case 'conversation':
                // Handle conversation start
                break
              case 'bot_start':
                setStreamingMessage('')
                break
              case 'content':
                setStreamingMessage(data.fullContent || data.content || '')
                break
              case 'complete':
                setIsStreaming(false)
                // Invalidate relevant queries
                queryClient.invalidateQueries({
                  queryKey: ['chat', 'conversations'],
                })
                if (data.conversation?.id) {
                  queryClient.invalidateQueries({
                    queryKey: ['chat', 'conversation', data.conversation.id],
                  })
                }
                break
              case 'error':
                setError(data.error)
                setIsStreaming(false)
                break
            }
          }
        )

        return result
      } catch (err) {
        setError(err.message)
        setIsStreaming(false)
        throw err
      }
    },
    [queryClient]
  )

  const cancelStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setStreamingMessage('')
    }
  }, [])

  return {
    sendStreamingMessage,
    cancelStreaming,
    isStreaming,
    streamingMessage,
    error,
  }
}

// Custom hook for typing indicators
export const useTypingIndicator = () => {
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef(null)

  const sendTypingIndicator = useCallback(
    async (conversationId, typing = true) => {
      try {
        await chatService.streaming.sendTypingIndicator(conversationId, typing)
        setIsTyping(typing)

        // Auto-stop typing after 3 seconds
        if (typing) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          timeoutRef.current = setTimeout(() => {
            setIsTyping(false)
            chatService.streaming.sendTypingIndicator(conversationId, false)
          }, 3000)
        }
      } catch (error) {
        console.error('Failed to send typing indicator:', error)
      }
    },
    []
  )

  const stopTyping = useCallback(
    (conversationId) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      sendTypingIndicator(conversationId, false)
    },
    [sendTypingIndicator]
  )

  return {
    isTyping,
    sendTypingIndicator,
    stopTyping,
  }
}

// Custom hook for managing chat UI state
export const useChatUI = () => {
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [currentView, setCurrentView] = useState('chat') // 'chat' | 'history'
  const [unreadCount, setUnreadCount] = useState(0)

  const openChat = useCallback((conversationId = null) => {
    setIsOpen(true)
    setIsMinimized(false)
    setCurrentView('chat')
    setUnreadCount(0)
    if (conversationId) {
      setCurrentConversationId(conversationId)
    }
  }, [])

  const closeChat = useCallback(() => {
    setIsOpen(false)
    setCurrentView('chat')
  }, [])

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev)
  }, [])

  const switchToHistory = useCallback(() => {
    setCurrentView('history')
  }, [])

  const switchToChat = useCallback((conversationId = null) => {
    setCurrentView('chat')
    if (conversationId) {
      setCurrentConversationId(conversationId)
    }
  }, [])

  const addUnreadMessage = useCallback(() => {
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1)
    }
  }, [isOpen])

  return {
    currentConversationId,
    setCurrentConversationId,
    isOpen,
    isMinimized,
    currentView,
    unreadCount,
    openChat,
    closeChat,
    toggleMinimize,
    switchToHistory,
    switchToChat,
    addUnreadMessage,
  }
}
