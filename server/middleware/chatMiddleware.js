// File: middleware/chatMiddleware.js
import mongoose from 'mongoose'
import { createError } from '../error.js'
import Chat from '../models/Chat.js'

// Rate limiting for chat messages based on subscription plan
export const applyChatRateLimit = async (req, res, next) => {
  try {
    const userId = req.user.id
    const userPlan = req.user.subscription?.plan || 'free'

    // Define rate limits by plan (messages per hour)
    const rateLimits = {
      free: 20, // 20 messages per hour
      starter: 100, // 100 messages per hour
      pro: 500, // 500 messages per hour
      empire: 2000, // 2000 messages per hour (virtually unlimited)
    }

    const hourlyLimit = rateLimits[userPlan] || rateLimits.free

    // Check messages sent in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const recentMessageCount = await Chat.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          'messages.timestamp': { $gte: oneHourAgo },
          'messages.type': 'user', // Only count user messages
        },
      },
      {
        $unwind: '$messages',
      },
      {
        $match: {
          'messages.timestamp': { $gte: oneHourAgo },
          'messages.type': 'user',
        },
      },
      {
        $count: 'totalMessages',
      },
    ])

    const messagesSentThisHour = recentMessageCount[0]?.totalMessages || 0

    if (messagesSentThisHour >= hourlyLimit) {
      const upgradeMessage =
        userPlan === 'free'
          ? 'Upgrade to Starter plan for more messages!'
          : userPlan === 'starter'
          ? 'Upgrade to Pro plan for higher limits!'
          : 'You have reached your hourly message limit.'

      return next(
        createError(
          429,
          `Rate limit exceeded. ${upgradeMessage} You can send ${hourlyLimit} messages per hour on your ${userPlan} plan.`
        )
      )
    }

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit': hourlyLimit,
      'X-RateLimit-Remaining': Math.max(0, hourlyLimit - messagesSentThisHour),
      'X-RateLimit-Reset': new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      'X-RateLimit-Plan': userPlan,
    })

    next()
  } catch (error) {
    console.error('Chat rate limit error:', error)
    next(createError(500, 'Rate limit check failed'))
  }
}

// Check chat access based on subscription
export const checkChatAccess = async (req, res, next) => {
  try {
    const userPlan = req.user.subscription?.plan || 'free'
    const isActive = req.user.subscription?.isActive || false

    // Define chat limits by plan
    const chatLimits = {
      free: {
        maxChats: 3, // Maximum 3 concurrent chats
        maxMessagesPerChat: 50, // Maximum 50 messages per chat
        advancedFeatures: false,
      },
      starter: {
        maxChats: 10,
        maxMessagesPerChat: 200,
        advancedFeatures: false,
      },
      pro: {
        maxChats: 50,
        maxMessagesPerChat: 1000,
        advancedFeatures: true,
      },
      empire: {
        maxChats: -1, // Unlimited
        maxMessagesPerChat: -1, // Unlimited
        advancedFeatures: true,
      },
    }

    const limits = chatLimits[userPlan] || chatLimits.free

    // For paid plans, check if subscription is active
    if (userPlan !== 'free' && !isActive) {
      return next(
        createError(
          403,
          'Your subscription is not active. Please update your payment method to continue using advanced chat features.'
        )
      )
    }

    // Check if creating new chat (POST to /api/chat/)
    if (req.method === 'POST' && req.route.path === '/') {
      if (limits.maxChats !== -1) {
        const userChatCount = await Chat.countDocuments({
          user: req.user.id,
          isActive: true,
        })

        if (userChatCount >= limits.maxChats) {
          const upgradeMessage =
            userPlan === 'free'
              ? 'Upgrade to Starter plan for more chats!'
              : userPlan === 'starter'
              ? 'Upgrade to Pro plan for more chats!'
              : 'Delete some old chats to create new ones.'

          return next(
            createError(
              403,
              `Maximum chat limit reached (${limits.maxChats} chats). ${upgradeMessage}`
            )
          )
        }
      }
    }

    // Add plan info to request for use in controllers
    req.chatLimits = limits
    req.userPlan = userPlan

    next()
  } catch (error) {
    console.error('Chat access check error:', error)
    next(createError(500, 'Chat access check failed'))
  }
}

// Log chat activity for analytics
export const logChatActivity = async (req, res, next) => {
  try {
    const userId = req.user.id
    const action = req.method + ' ' + req.route.path
    const userAgent = req.get('User-Agent')
    const ipAddress = req.ip || req.connection.remoteAddress

    // Log the activity (you can extend this to save to a separate analytics collection)
    console.log(
      `Chat Activity - User: ${userId}, Action: ${action}, IP: ${ipAddress}, Time: ${new Date().toISOString()}`
    )

    // You could also save this to a ChatActivity collection for detailed analytics
    // const ChatActivity = mongoose.model('ChatActivity')
    // await ChatActivity.create({
    //   user: userId,
    //   action,
    //   ipAddress,
    //   userAgent,
    //   timestamp: new Date(),
    // })

    next()
  } catch (error) {
    console.error('Chat activity logging error:', error)
    // Don't fail the request if logging fails
    next()
  }
}

// Validate chat message content length
export const validateMessageLength = (req, res, next) => {
  try {
    const { message } = req.body

    if (message) {
      const maxLength = 5000 // Maximum message length

      if (message.length > maxLength) {
        return next(
          createError(
            400,
            `Message too long. Maximum length is ${maxLength} characters.`
          )
        )
      }

      if (message.trim().length === 0) {
        return next(createError(400, 'Message cannot be empty.'))
      }
    }

    next()
  } catch (error) {
    console.error('Message validation error:', error)
    next(createError(500, 'Message validation failed'))
  }
}

// Check if user can access advanced AI features
export const checkAdvancedFeatures = (req, res, next) => {
  try {
    const userPlan = req.user.subscription?.plan || 'free'
    const advancedPlans = ['pro', 'empire']

    if (!advancedPlans.includes(userPlan)) {
      return next(
        createError(
          403,
          'Advanced AI features require Pro or Empire subscription. Upgrade your plan to access these features.'
        )
      )
    }

    next()
  } catch (error) {
    console.error('Advanced features check error:', error)
    next(createError(500, 'Advanced features check failed'))
  }
}

// Middleware to attach chat usage info
export const attachChatUsage = async (req, res, next) => {
  try {
    const userId = req.user.id
    const userPlan = req.user.subscription?.plan || 'free'

    // Get user's current chat usage
    const [chatCount, recentMessages] = await Promise.all([
      Chat.countDocuments({ user: userId, isActive: true }),
      Chat.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            'messages.timestamp': {
              $gte: new Date(Date.now() - 60 * 60 * 1000),
            },
            'messages.type': 'user',
          },
        },
        { $unwind: '$messages' },
        {
          $match: {
            'messages.timestamp': {
              $gte: new Date(Date.now() - 60 * 60 * 1000),
            },
            'messages.type': 'user',
          },
        },
        { $count: 'totalMessages' },
      ]),
    ])

    const rateLimits = {
      free: 20,
      starter: 100,
      pro: 500,
      empire: 2000,
    }

    const chatLimits = {
      free: 3,
      starter: 10,
      pro: 50,
      empire: -1,
    }

    req.chatUsage = {
      currentChats: chatCount,
      maxChats: chatLimits[userPlan] || chatLimits.free,
      messagesThisHour: recentMessages[0]?.totalMessages || 0,
      hourlyLimit: rateLimits[userPlan] || rateLimits.free,
      plan: userPlan,
    }

    next()
  } catch (error) {
    console.error('Chat usage attachment error:', error)
    // Don't fail the request, just continue without usage info
    req.chatUsage = null
    next()
  }
}

// Middleware for subscription-based feature gating
export const requirePlan = (requiredPlan) => {
  return (req, res, next) => {
    try {
      const userPlan = req.user.subscription?.plan || 'free'
      const planHierarchy = {
        free: 0,
        starter: 1,
        pro: 2,
        empire: 3,
      }

      const userPlanLevel = planHierarchy[userPlan] || 0
      const requiredPlanLevel = planHierarchy[requiredPlan] || 0

      if (userPlanLevel < requiredPlanLevel) {
        return next(
          createError(
            403,
            `This feature requires ${requiredPlan} plan or higher. Please upgrade your subscription.`
          )
        )
      }

      next()
    } catch (error) {
      console.error('Plan requirement check error:', error)
      next(createError(500, 'Plan requirement check failed'))
    }
  }
}

// Middleware to check if chat exists and user owns it
export const checkChatOwnership = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    if (!id) {
      return next(createError(400, 'Chat ID is required'))
    }

    const chat = await Chat.findOne({
      _id: id,
      user: userId,
      isActive: true,
    }).select('_id user')

    if (!chat) {
      return next(
        createError(404, 'Chat not found or you do not have access to it')
      )
    }

    // Add chat to request for use in controllers
    req.chat = chat

    next()
  } catch (error) {
    console.error('Chat ownership check error:', error)
    if (error.name === 'CastError') {
      return next(createError(400, 'Invalid chat ID format'))
    }
    next(createError(500, 'Chat ownership check failed'))
  }
}

// Middleware for admin-only routes
export const requireAdmin = (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return next(createError(403, 'Admin access required'))
    }
    next()
  } catch (error) {
    console.error('Admin check error:', error)
    next(createError(500, 'Admin check failed'))
  }
}

// Rate limiting specifically for AI generations (separate from regular messages)
export const applyAIGenerationLimit = async (req, res, next) => {
  try {
    const userId = req.user.id
    const userPlan = req.user.subscription?.plan || 'free'

    // AI generation limits per day
    const aiLimits = {
      free: 5, // 5 AI generations per day
      starter: 50, // 50 AI generations per day
      pro: 200, // 200 AI generations per day
      empire: -1, // Unlimited
    }

    const dailyLimit = aiLimits[userPlan]

    if (dailyLimit !== -1) {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const todayGenerations = await Chat.aggregate([
        {
          $match: {
            user: new mongoose.Types.ObjectId(userId),
            'messages.timestamp': { $gte: oneDayAgo },
            'messages.type': 'bot',
          },
        },
        {
          $unwind: '$messages',
        },
        {
          $match: {
            'messages.timestamp': { $gte: oneDayAgo },
            'messages.type': 'bot',
          },
        },
        {
          $count: 'totalGenerations',
        },
      ])

      const generationsToday = todayGenerations[0]?.totalGenerations || 0

      if (generationsToday >= dailyLimit) {
        const upgradeMessage =
          userPlan === 'free'
            ? 'Upgrade to Starter for more AI generations!'
            : userPlan === 'starter'
            ? 'Upgrade to Pro for higher AI limits!'
            : 'Daily AI generation limit reached.'

        return next(
          createError(
            429,
            `AI generation limit exceeded. ${upgradeMessage} You can generate ${dailyLimit} AI responses per day on your ${userPlan} plan.`
          )
        )
      }

      // Add AI limit info to response headers
      res.set({
        'X-AI-Limit': dailyLimit,
        'X-AI-Remaining': Math.max(0, dailyLimit - generationsToday),
        'X-AI-Reset': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    next()
  } catch (error) {
    console.error('AI generation limit error:', error)
    next(createError(500, 'AI generation limit check failed'))
  }
}
