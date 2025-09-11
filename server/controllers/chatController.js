// File: controllers/chatController.js
import { createError } from '../error.js'
import Chat from '../models/Chat.js'
import User from '../models/User.js'
import chatService from '../services/chatService.js'

// Create a new chat conversation
export const createChat = async (req, res, next) => {
  try {
    const { title, initialMessage, category } = req.body
    const userId = req.user.id

    // Validate initial message if provided
    if (initialMessage) {
      const validation = chatService.validateMessage(initialMessage)
      if (!validation.isValid) {
        return next(createError(400, validation.reason))
      }
    }

    // Create new chat
    const newChat = new Chat({
      user: userId,
      title: title || 'New Conversation',
      category: category || 'other',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
    })

    // Add initial message if provided
    if (initialMessage) {
      await newChat.addMessage('user', initialMessage)

      // Generate AI response
      try {
        const userContext = await getUserContext(userId)
        const aiResponse = await chatService.generateChatResponse({
          messages: newChat.getRecentMessages(1),
          userContext,
        })

        await newChat.addMessage('bot', aiResponse.content, {
          model: aiResponse.model,
          processingTime: aiResponse.processingTime,
          tokenUsage: aiResponse.usage,
        })
      } catch (aiError) {
        console.error('AI Response Error:', aiError)
        // Still save the chat even if AI fails
        await newChat.addMessage(
          'bot',
          "I apologize, but I'm experiencing technical difficulties. Let me help you once the issue is resolved."
        )
      }
    }

    await newChat.save()

    res.status(201).json({
      status: 'success',
      data: {
        chat: newChat,
      },
    })
  } catch (error) {
    console.error('Create Chat Error:', error)
    next(createError(500, 'Failed to create new chat conversation'))
  }
}

// Send a message and get AI response
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params
    const { message, quickAction } = req.body
    const userId = req.user.id

    if (!message && !quickAction) {
      return next(
        createError(400, 'Message content or quick action is required')
      )
    }

    // Find the chat
    const chat = await Chat.findOne({
      _id: id,
      user: userId,
      isActive: true,
    })

    if (!chat) {
      return next(createError(404, 'Chat conversation not found'))
    }

    let userMessage = message
    let aiResponse

    try {
      // Handle quick actions
      if (quickAction) {
        const userContext = await getUserContext(userId)
        aiResponse = await chatService.generateQuickActionResponse(
          quickAction,
          userContext
        )
        userMessage = getQuickActionMessage(quickAction)
      } else {
        // Validate user message
        const validation = chatService.validateMessage(message)
        if (!validation.isValid) {
          return next(createError(400, validation.reason))
        }

        // Add user message
        await chat.addMessage('user', userMessage)

        // Generate AI response
        const userContext = await getUserContext(userId)
        const recentMessages = chat.getRecentMessages(10) // Get last 10 messages for context

        aiResponse = await chatService.generateChatResponse({
          messages: recentMessages,
          userContext,
          temperature: chat.aiConfig.temperature,
          maxTokens: chat.aiConfig.maxTokens,
        })
      }

      // Add AI response
      await chat.addMessage('bot', aiResponse.content, {
        model: aiResponse.model,
        processingTime: aiResponse.processingTime,
        tokenUsage: aiResponse.usage,
      })

      // Generate follow-up suggestions
      const category = chatService.categorizeMessage(userMessage)
      const followUpSuggestions = chatService.generateFollowUpSuggestions(
        chat.messages,
        category
      )

      res.status(200).json({
        status: 'success',
        data: {
          chat,
          lastMessage: chat.lastMessage,
          aiResponse: {
            content: aiResponse.content,
            processingTime: aiResponse.processingTime,
            tokenUsage: aiResponse.usage,
          },
          followUpSuggestions,
        },
      })
    } catch (aiError) {
      console.error('AI Response Error:', aiError)

      // Add user message even if AI fails
      if (message && !quickAction) {
        await chat.addMessage('user', userMessage)
      }

      // Add error response
      await chat.addMessage(
        'bot',
        "I apologize, but I'm experiencing technical difficulties right now. Please try sending your message again in a moment."
      )

      res.status(200).json({
        status: 'success',
        data: {
          chat,
          lastMessage: chat.lastMessage,
          error: 'AI response temporarily unavailable',
        },
      })
    }
  } catch (error) {
    console.error('Send Message Error:', error)
    next(createError(500, 'Failed to send message'))
  }
}

// Get user's chat history
export const getChatHistory = async (req, res, next) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const category = req.query.category
    const search = req.query.search
    const skip = (page - 1) * limit

    // Build query
    const query = {
      user: userId,
      isActive: true,
    }

    if (category && category !== 'all') {
      query.category = category
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'messages.content': { $regex: search, $options: 'i' } },
      ]
    }

    // Get chats with pagination
    const chats = await Chat.find(query)
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit)
      .select('title lastActivity messageCount category lastMessage tags')
      .lean()

    const totalChats = await Chat.countDocuments(query)

    res.status(200).json({
      status: 'success',
      results: chats.length,
      totalResults: totalChats,
      totalPages: Math.ceil(totalChats / limit),
      currentPage: page,
      data: {
        chats,
      },
    })
  } catch (error) {
    console.error('Get Chat History Error:', error)
    next(createError(500, 'Failed to retrieve chat history'))
  }
}

// Get specific chat conversation
export const getChat = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const messagesLimit = parseInt(req.query.messagesLimit) || 50

    const chat = await Chat.findOne({
      _id: id,
      user: userId,
      isActive: true,
    })

    if (!chat) {
      return next(createError(404, 'Chat conversation not found'))
    }

    // Limit messages if requested
    if (messagesLimit > 0 && chat.messages.length > messagesLimit) {
      chat.messages = chat.messages.slice(-messagesLimit)
    }

    res.status(200).json({
      status: 'success',
      data: {
        chat,
      },
    })
  } catch (error) {
    console.error('Get Chat Error:', error)
    next(createError(500, 'Failed to retrieve chat conversation'))
  }
}

// Update chat settings
export const updateChat = async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, category, tags, aiConfig } = req.body
    const userId = req.user.id

    const chat = await Chat.findOne({
      _id: id,
      user: userId,
      isActive: true,
    })

    if (!chat) {
      return next(createError(404, 'Chat conversation not found'))
    }

    // Update allowed fields
    if (title) chat.title = title
    if (category) chat.category = category
    if (tags) chat.tags = tags
    if (aiConfig) {
      // Validate AI config values
      if (aiConfig.temperature !== undefined) {
        if (aiConfig.temperature < 0 || aiConfig.temperature > 2) {
          return next(createError(400, 'Temperature must be between 0 and 2'))
        }
        chat.aiConfig.temperature = aiConfig.temperature
      }
      if (aiConfig.maxTokens !== undefined) {
        if (aiConfig.maxTokens < 100 || aiConfig.maxTokens > 2000) {
          return next(
            createError(400, 'Max tokens must be between 100 and 2000')
          )
        }
        chat.aiConfig.maxTokens = aiConfig.maxTokens
      }
    }

    await chat.save()

    res.status(200).json({
      status: 'success',
      data: {
        chat,
      },
    })
  } catch (error) {
    console.error('Update Chat Error:', error)
    next(createError(500, 'Failed to update chat conversation'))
  }
}

// Delete chat conversation
export const deleteChat = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const chat = await Chat.findOneAndDelete({
      _id: id,
      user: userId,
    })

    if (!chat) {
      return next(createError(404, 'Chat conversation not found'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Chat conversation deleted successfully',
    })
  } catch (error) {
    console.error('Delete Chat Error:', error)
    next(createError(500, 'Failed to delete chat conversation'))
  }
}

// Get user's chat statistics
export const getUserChatStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    const stats = await Chat.getUserStats(userId)

    // Get recent activity
    const recentChats = await Chat.find({
      user: userId,
      isActive: true,
      lastActivity: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    }).countDocuments()

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          ...stats,
          recentActivity: recentChats,
        },
      },
    })
  } catch (error) {
    console.error('Get User Chat Stats Error:', error)
    next(createError(500, 'Failed to retrieve chat statistics'))
  }
}

// Clear chat messages (keep chat but remove messages)
export const clearChat = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const chat = await Chat.findOne({
      _id: id,
      user: userId,
      isActive: true,
    })

    if (!chat) {
      return next(createError(404, 'Chat conversation not found'))
    }

    // Clear messages and reset counters
    chat.messages = []
    chat.messageCount = 0
    chat.totalTokensUsed = 0
    chat.totalProcessingTime = 0
    chat.lastActivity = new Date()

    // Add welcome message
    await chat.addMessage(
      'bot',
      "Chat cleared! I'm ready to help you with your empire-building goals. What would you like to work on?"
    )

    await chat.save()

    res.status(200).json({
      status: 'success',
      message: 'Chat cleared successfully',
      data: {
        chat,
      },
    })
  } catch (error) {
    console.error('Clear Chat Error:', error)
    next(createError(500, 'Failed to clear chat conversation'))
  }
}

// Get chat categories with counts
export const getChatCategories = async (req, res, next) => {
  try {
    const userId = req.user.id

    const categories = await Chat.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    const formattedCategories = categories.map((cat) => ({
      category: cat._id,
      count: cat.count,
    }))

    res.status(200).json({
      status: 'success',
      data: {
        categories: formattedCategories,
      },
    })
  } catch (error) {
    console.error('Get Chat Categories Error:', error)
    next(createError(500, 'Failed to retrieve chat categories'))
  }
}

// Admin: Get all chats
export const getAllChats = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const chats = await Chat.find()
      .populate('user', 'name email subscription.plan')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-messages') // Exclude messages for performance

    const totalChats = await Chat.countDocuments()

    res.status(200).json({
      status: 'success',
      results: chats.length,
      totalResults: totalChats,
      totalPages: Math.ceil(totalChats / limit),
      currentPage: page,
      data: {
        chats,
      },
    })
  } catch (error) {
    console.error('Get All Chats Error:', error)
    next(createError(500, 'Failed to retrieve all chats'))
  }
}

// Admin: Get chat analytics
export const getChatAnalytics = async (req, res, next) => {
  try {
    const analytics = await Chat.aggregate([
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          activeChats: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
          },
          totalMessages: { $sum: '$messageCount' },
          totalTokens: { $sum: '$totalTokensUsed' },
          avgMessagesPerChat: { $avg: '$messageCount' },
          avgTokensPerChat: { $avg: '$totalTokensUsed' },
        },
      },
    ])

    const categoryBreakdown = await Chat.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        analytics: analytics[0] || {},
        categoryBreakdown,
      },
    })
  } catch (error) {
    console.error('Get Chat Analytics Error:', error)
    next(createError(500, 'Failed to retrieve chat analytics'))
  }
}

// Test chat service connection
export const testChatConnection = async (req, res, next) => {
  try {
    const connectionTest = await chatService.testConnection()

    res.status(200).json({
      status: 'success',
      message: 'Chat service connection successful',
      data: connectionTest,
    })
  } catch (error) {
    console.error('Chat Connection Test Error:', error)
    next(createError(500, `Chat service connection failed: ${error.message}`))
  }
}

// Helper function to get user context for AI
const getUserContext = async (userId) => {
  try {
    const user = await User.findById(userId)
      .select('subscription points referralStats discord')
      .lean()

    return {
      subscription: user?.subscription || {},
      pointsBalance: user?.points || 0,
      referralStats: user?.referralStats || {},
      hasDiscord: user?.discord?.isConnected || false,
    }
  } catch (error) {
    console.error('Error getting user context:', error)
    return {}
  }
}

// Helper function to get quick action message
const getQuickActionMessage = (quickAction) => {
  const actionMessages = {
    product_creation: 'Help me create a digital product',
    growth_strategy: 'Show me strategies to optimize my revenue streams',
    affiliate_marketing:
      'Help me set up and optimize my affiliate marketing system',
    viral_content: 'I need help creating viral content hooks',
  }

  return actionMessages[quickAction] || 'Quick action request'
}
