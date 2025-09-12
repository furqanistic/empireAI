// File: controllers/chatController.js
import { createError } from '../error.js'
import Chat from '../models/Chat.js'
import chatService from '../services/chatService.js'

// Create new chat
export const createChat = async (req, res, next) => {
  try {
    const newChat = new Chat({
      user: req.user.id,
      title: 'New Chat',
      messages: [],
    })

    await newChat.save()

    res.status(201).json({
      success: true,
      data: newChat,
    })
  } catch (error) {
    console.error('Create chat error:', error)
    next(createError(500, 'Failed to create chat'))
  }
}

// Send message and get AI response
export const sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params
    const { message } = req.body

    if (!message || !message.trim()) {
      return next(createError(400, 'Message is required'))
    }

    // Find or create chat
    let chat
    if (chatId && chatId !== 'new') {
      chat = await Chat.findOne({ _id: chatId, user: req.user.id })
      if (!chat) {
        return next(createError(404, 'Chat not found'))
      }
    } else {
      // Create new chat
      chat = new Chat({
        user: req.user.id,
        title: 'New Chat',
        messages: [],
      })
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message.trim(),
      timestamp: new Date(),
    }
    chat.messages.push(userMessage)

    // Get recent messages for context (last 10)
    const recentMessages = chat.messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Generate AI response
    try {
      const aiResponse = await chatService.generateResponse(recentMessages)

      // Add AI response
      const botMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      }
      chat.messages.push(botMessage)

      // Update lastActivity
      chat.lastActivity = new Date()

      await chat.save()

      res.json({
        success: true,
        data: {
          chatId: chat._id,
          message: botMessage,
        },
      })
    } catch (aiError) {
      console.error('AI generation error:', aiError)
      // Still save user message even if AI fails
      await chat.save()

      res.json({
        success: false,
        error: 'AI temporarily unavailable',
        data: {
          chatId: chat._id,
        },
      })
    }
  } catch (error) {
    console.error('Send message error:', error)
    next(createError(500, 'Failed to send message'))
  }
}

// Get user's chat history
export const getChatHistory = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      user: req.user.id,
      isActive: true,
    })
      .sort({ lastActivity: -1 })
      .select('title lastActivity createdAt messages')
      .limit(50)

    res.json({
      success: true,
      data: chats,
    })
  } catch (error) {
    console.error('Get history error:', error)
    next(createError(500, 'Failed to get chat history'))
  }
}

// Get specific chat
export const getChat = async (req, res, next) => {
  try {
    const { chatId } = req.params

    const chat = await Chat.findOne({
      _id: chatId,
      user: req.user.id,
    })

    if (!chat) {
      return next(createError(404, 'Chat not found'))
    }

    res.json({
      success: true,
      data: chat,
    })
  } catch (error) {
    console.error('Get chat error:', error)
    next(createError(500, 'Failed to get chat'))
  }
}

// Delete chat
export const deleteChat = async (req, res, next) => {
  try {
    const { chatId } = req.params

    const result = await Chat.findOneAndDelete({
      _id: chatId,
      user: req.user.id,
    })

    if (!result) {
      return next(createError(404, 'Chat not found'))
    }

    res.json({
      success: true,
      message: 'Chat deleted',
    })
  } catch (error) {
    console.error('Delete chat error:', error)
    next(createError(500, 'Failed to delete chat'))
  }
}

// Clear all chats
export const clearAllChats = async (req, res, next) => {
  try {
    await Chat.deleteMany({ user: req.user.id })

    res.json({
      success: true,
      message: 'All chats cleared',
    })
  } catch (error) {
    console.error('Clear chats error:', error)
    next(createError(500, 'Failed to clear chats'))
  }
}

// Test connection
export const testConnection = async (req, res, next) => {
  try {
    const result = await chatService.testConnection()

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Test connection error:', error)
    next(createError(500, error.message))
  }
}
