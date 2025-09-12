// File: client/src/hooks/useChat.js
import { chatService } from '@/services/chatServices'
import { useEffect, useState } from 'react'

export const useChat = (currentChatId = null) => {
  const [chats, setChats] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
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
      loadChat(currentChatId)
    } else {
      setCurrentChat(null)
    }
  }, [currentChatId])

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
      } else {
        throw new Error(response.message || 'Failed to load chat')
      }
    } catch (err) {
      console.error('Error loading chat:', err)
      setError(err.message || 'Failed to load chat')
      setCurrentChat(null)
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

  const sendMessage = async (message) => {
    try {
      setIsSending(true)
      setError(null)

      // Use current chat ID or 'new' for new chats
      const chatId = currentChatId || 'new'
      const response = await chatService.sendMessage(chatId, message)

      if (response.success) {
        // If this was a new chat, we got a chatId back
        const resultChatId = response.data?.chatId

        // Reload the chat to get updated messages
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
      } else {
        throw new Error(response.message || 'Failed to clear chats')
      }
    } catch (err) {
      console.error('Error clearing chats:', err)
      setError(err.message || 'Failed to clear chats')
      throw err
    }
  }

  return {
    chats,
    currentChat,
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
