// File: client/src/hooks/useChat.js - ENHANCED WITH OPTIMISTIC UPDATES
import { chatService } from '@/services/chatServices'
import { useEffect, useState } from 'react'

export const useChat = (currentChatId = null) => {
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [localMessages, setLocalMessages] = useState([]) // NEW: For optimistic updates
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory()
  }, [])

  // Load specific chat when currentChatId changes
  useEffect(() => {
    if (currentChatId) {
      console.log('useChat: Loading chat with ID:', currentChatId) // Debug log
      loadChat(currentChatId)
    } else {
      console.log('useChat: No currentChatId, clearing chat') // Debug log
      setCurrentChat(null)
      setLocalMessages([]) // Clear local messages when no chat selected
    }
  }, [currentChatId])

  // NEW: Sync local messages with current chat messages
  useEffect(() => {
    if (currentChat?.messages) {
      setLocalMessages(currentChat.messages)
    } else {
      setLocalMessages([])
    }
  }, [currentChat])

  const loadChatHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await chatService.getChatHistory()

      if (response.success) {
        setChats(response.data || [])
      } else {
        throw new Error(response.message || 'Failed to load chat history')
      }
    } catch (err) {
      console.error('Error loading chat history:', err)
      setError(err.message || 'Failed to load chat history')
      setChats([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadChat = async (chatId) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await chatService.getChat(chatId)

      if (response.success) {
        setCurrentChat(response.data)
        // Local messages will be synced via useEffect
      } else {
        throw new Error(response.message || 'Failed to load chat')
      }
    } catch (err) {
      console.error('Error loading chat:', err)
      setError(err.message || 'Failed to load chat')
      setCurrentChat(null)
      setLocalMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  const createNewChat = async () => {
    try {
      setError(null)
      const response = await chatService.createChat()

      if (response.success) {
        const newChat = response.data
        setChats((prev) => [newChat, ...prev])
        setCurrentChat(newChat)
        setLocalMessages([]) // Clear local messages for new chat
        return newChat
      } else {
        throw new Error(response.message || 'Failed to create new chat')
      }
    } catch (err) {
      console.error('Error creating new chat:', err)
      setError(err.message || 'Failed to create new chat')
      throw err
    }
  }

  // ENHANCED: Send message with optimistic updates
  const sendMessage = async (message) => {
    // Create optimistic user message
    const optimisticUserMessage = {
      _id: `temp-user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      isTemporary: true,
    }

    try {
      setIsSending(true)
      setError(null)

      // Immediately add user message to local state (optimistic update)
      setLocalMessages((prev) => [...prev, optimisticUserMessage])

      // Use current chat ID or 'new' for new chats
      const chatId = currentChatId || 'new'
      const response = await chatService.sendMessage(chatId, message)

      if (response.success) {
        // If this was a new chat, we got a chatId back
        const resultChatId = response.data?.chatId

        // Remove temporary message and reload chat to get real messages
        setLocalMessages((prev) => prev.filter((msg) => !msg.isTemporary))

        if (resultChatId) {
          await loadChat(resultChatId)
        }

        // Refresh chat history to show updated lastActivity
        await loadChatHistory()

        return { chatId: resultChatId }
      } else {
        throw new Error(
          response.error || response.message || 'Failed to send message'
        )
      }
    } catch (err) {
      console.error('Error sending message:', err)

      // Remove temporary message on error
      setLocalMessages((prev) => prev.filter((msg) => !msg.isTemporary))

      setError(err.message || 'Failed to send message')
      throw err
    } finally {
      setIsSending(false)
    }
  }

  const deleteChat = async (chatId) => {
    try {
      setError(null)
      const response = await chatService.deleteChat(chatId)

      if (response.success) {
        // Remove from local state
        setChats((prev) => prev.filter((chat) => chat._id !== chatId))

        // Clear current chat if it was deleted
        if (currentChatId === chatId) {
          setCurrentChat(null)
          setLocalMessages([])
        }
      } else {
        throw new Error(response.message || 'Failed to delete chat')
      }
    } catch (err) {
      console.error('Error deleting chat:', err)
      setError(err.message || 'Failed to delete chat')
      throw err
    }
  }

  const clearAllChats = async () => {
    try {
      setError(null)
      const response = await chatService.clearAllChats()

      if (response.success) {
        setChats([])
        setCurrentChat(null)
        setLocalMessages([])
      } else {
        throw new Error(response.message || 'Failed to clear chats')
      }
    } catch (err) {
      console.error('Error clearing chats:', err)
      setError(err.message || 'Failed to clear chats')
      throw err
    }
  }

  // ENHANCED: Return enhanced current chat with local messages
  const enhancedCurrentChat = currentChat
    ? {
        ...currentChat,
        messages: localMessages, // Use local messages for real-time updates
      }
    : null

  return {
    chats,
    currentChat: enhancedCurrentChat, // CHANGED: Return enhanced chat with local messages
    isLoading,
    isSending,
    error,
    createNewChat,
    sendMessage,
    loadChat,
    deleteChat,
    clearAllChats,
    refreshHistory: loadChatHistory,
  }
}
