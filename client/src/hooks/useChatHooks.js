// File: client/src/hooks/useChatHooks.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../services/chatServices.js'

// Create a new chat conversation
export const useCreateChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.createChat,
    onSuccess: (data) => {
      // Invalidate and refetch chat-related queries
      queryClient.invalidateQueries({ queryKey: ['chats', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['chats', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['chats', 'categories'] })

      // Set the new chat data in the cache
      queryClient.setQueryData(
        ['chats', 'conversation', data.data.chat._id],
        data
      )
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to create chat'
      console.error('Chat creation error:', error)
    },
  })
}

// Send a message to a chat
export const useSendMessage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, message, quickAction }) =>
      chatService.sendMessage(chatId, { message, quickAction }),
    onSuccess: (data, variables) => {
      // Update the specific chat conversation
      queryClient.setQueryData(
        ['chats', 'conversation', variables.chatId],
        data
      )

      // Invalidate chat history to update last message
      queryClient.invalidateQueries({ queryKey: ['chats', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['chats', 'stats'] })
    },
    onError: (error, variables) => {
      console.error('Send message error:', error)

      // Optimistically revert if needed
      queryClient.invalidateQueries({
        queryKey: ['chats', 'conversation', variables.chatId],
      })
    },
  })
}

// Get user's chat history
export const useChatHistory = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['chats', 'history', params],
    queryFn: () => chatService.getChatHistory(params),
    enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get specific chat conversation
export const useChat = (chatId, params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['chats', 'conversation', chatId, params],
    queryFn: () => chatService.getChat(chatId, params),
    enabled: enabled && !!chatId,
    staleTime: 30 * 1000, // 30 seconds for active chats
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  })
}

// Update chat settings
export const useUpdateChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, updateData }) =>
      chatService.updateChat(chatId, updateData),
    onSuccess: (data, variables) => {
      // Update the specific chat data
      queryClient.setQueryData(
        ['chats', 'conversation', variables.chatId],
        data
      )

      // Invalidate history if title or category changed
      if (variables.updateData.title || variables.updateData.category) {
        queryClient.invalidateQueries({ queryKey: ['chats', 'history'] })
        queryClient.invalidateQueries({ queryKey: ['chats', 'categories'] })
      }
    },
    onError: (error) => {
      console.error('Failed to update chat:', error)
    },
  })
}

// Delete chat conversation
export const useDeleteChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.deleteChat,
    onSuccess: (data, deletedChatId) => {
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({
        queryKey: ['chats', 'conversation', deletedChatId],
      })
      queryClient.invalidateQueries({ queryKey: ['chats', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['chats', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['chats', 'categories'] })
    },
    onError: (error) => {
      console.error('Failed to delete chat:', error)
    },
  })
}

// Clear chat messages
export const useClearChat = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: chatService.clearChat,
    onSuccess: (data, chatId) => {
      // Update the chat with cleared messages
      queryClient.setQueryData(['chats', 'conversation', chatId], data)

      // Invalidate history to update message counts
      queryClient.invalidateQueries({ queryKey: ['chats', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['chats', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to clear chat:', error)
    },
  })
}

// Get user's chat statistics
export const useChatStats = (enabled = true) => {
  return useQuery({
    queryKey: ['chats', 'stats'],
    queryFn: chatService.getUserChatStats,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get chat categories with counts
export const useChatCategories = (enabled = true) => {
  return useQuery({
    queryKey: ['chats', 'categories'],
    queryFn: chatService.getChatCategories,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Send quick action (for quick action buttons)
export const useSendQuickAction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ chatId, quickAction }) =>
      chatService.sendQuickAction(chatId, quickAction),
    onSuccess: (data, variables) => {
      // Update the specific chat conversation
      queryClient.setQueryData(
        ['chats', 'conversation', variables.chatId],
        data
      )

      // Invalidate chat history
      queryClient.invalidateQueries({ queryKey: ['chats', 'history'] })
    },
    onError: (error) => {
      console.error('Quick action error:', error)
    },
  })
}

// Test chat service connection (admin only)
export const useTestChatConnection = () => {
  return useMutation({
    mutationFn: chatService.testChatConnection,
    onSuccess: (data) => {
      console.log('Chat service connection test successful:', data)
    },
    onError: (error) => {
      console.error('Chat service connection test failed:', error)
    },
  })
}

// Get chat analytics (admin only)
export const useChatAnalytics = (enabled = true) => {
  return useQuery({
    queryKey: ['chats', 'admin', 'analytics'],
    queryFn: chatService.getChatAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get all chat conversations (admin only)
export const useAllChats = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['chats', 'admin', 'all', params],
    queryFn: () => chatService.getAllChats(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Custom hook for managing active chat state
export const useActiveChat = () => {
  const queryClient = useQueryClient()

  const setActiveChat = (chatId) => {
    // Store active chat ID in localStorage
    if (chatId) {
      localStorage.setItem('activeChatId', chatId)
    } else {
      localStorage.removeItem('activeChatId')
    }
  }

  const getActiveChat = () => {
    return localStorage.getItem('activeChatId')
  }

  const clearActiveChat = () => {
    localStorage.removeItem('activeChatId')
  }

  return {
    setActiveChat,
    getActiveChat,
    clearActiveChat,
  }
}

// Custom hook for optimistic message updates
export const useOptimisticMessage = () => {
  const queryClient = useQueryClient()

  const addOptimisticMessage = (chatId, message) => {
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
      status: 'sending',
    }

    // Update the chat data optimistically
    queryClient.setQueryData(['chats', 'conversation', chatId], (oldData) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        data: {
          ...oldData.data,
          chat: {
            ...oldData.data.chat,
            messages: [...oldData.data.chat.messages, optimisticMessage],
            messageCount: oldData.data.chat.messageCount + 1,
            lastActivity: new Date(),
          },
        },
      }
    })

    return optimisticMessage.id
  }

  const removeOptimisticMessage = (chatId, tempId) => {
    queryClient.setQueryData(['chats', 'conversation', chatId], (oldData) => {
      if (!oldData) return oldData

      return {
        ...oldData,
        data: {
          ...oldData.data,
          chat: {
            ...oldData.data.chat,
            messages: oldData.data.chat.messages.filter(
              (msg) => msg.id !== tempId
            ),
          },
        },
      }
    })
  }

  return {
    addOptimisticMessage,
    removeOptimisticMessage,
  }
}

// Custom hook for handling message sending with optimistic updates
export const useSendMessageOptimistic = () => {
  const sendMessage = useSendMessage()
  const { addOptimisticMessage, removeOptimisticMessage } =
    useOptimisticMessage()

  const sendMessageWithOptimism = async (chatId, message) => {
    // Add optimistic message immediately
    const tempId = addOptimisticMessage(chatId, message)

    try {
      // Send the actual message
      const result = await sendMessage.mutateAsync({ chatId, message })

      // Remove optimistic message since real data will replace it
      removeOptimisticMessage(chatId, tempId)

      return result
    } catch (error) {
      // Remove optimistic message on error
      removeOptimisticMessage(chatId, tempId)
      throw error
    }
  }

  return {
    sendMessage: sendMessageWithOptimism,
    isLoading: sendMessage.isPending,
    error: sendMessage.error,
  }
}

// Custom hook for chat pagination
export const useChatPagination = (initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    ...initialParams,
  })

  const chatHistory = useChatHistory(params)

  const nextPage = () => {
    if (chatHistory.data?.currentPage < chatHistory.data?.totalPages) {
      setParams((prev) => ({ ...prev, page: prev.page + 1 }))
    }
  }

  const prevPage = () => {
    if (params.page > 1) {
      setParams((prev) => ({ ...prev, page: prev.page - 1 }))
    }
  }

  const goToPage = (page) => {
    setParams((prev) => ({ ...prev, page }))
  }

  const updateFilters = (newFilters) => {
    setParams((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }

  return {
    ...chatHistory,
    params,
    nextPage,
    prevPage,
    goToPage,
    updateFilters,
    hasNextPage: chatHistory.data?.currentPage < chatHistory.data?.totalPages,
    hasPrevPage: params.page > 1,
  }
}
