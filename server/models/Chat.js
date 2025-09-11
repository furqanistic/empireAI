// File: models/Chat.js
import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['user', 'bot'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 10000, // Prevent extremely long messages
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // For tracking AI generation metadata
    aiMetadata: {
      model: String,
      processingTime: Number,
      tokenUsage: {
        promptTokens: Number,
        completionTokens: Number,
        totalTokens: Number,
      },
    },
    // For message status and delivery
    status: {
      type: String,
      enum: ['sending', 'sent', 'failed'],
      default: 'sent',
    },
    error: {
      message: String,
      code: String,
    },
  },
  {
    _id: true,
    timestamps: false, // We're using custom timestamp
  }
)

const ChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    messages: [MessageSchema],

    // Chat metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    messageCount: {
      type: Number,
      default: 0,
    },

    // AI Configuration for this chat
    aiConfig: {
      model: {
        type: String,
        default: 'llama-3.3-70b-versatile',
      },
      temperature: {
        type: Number,
        default: 0.7,
        min: 0,
        max: 2,
      },
      maxTokens: {
        type: Number,
        default: 1000,
      },
      systemPrompt: {
        type: String,
        default: '',
      },
    },

    // Usage statistics
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    totalProcessingTime: {
      type: Number,
      default: 0,
    },

    // Chat categorization
    category: {
      type: String,
      enum: [
        'product_creation',
        'affiliate_marketing',
        'content_strategy',
        'business_planning',
        'general_strategy',
        'troubleshooting',
        'other',
      ],
      default: 'other',
    },

    // Chat tags for organization
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Privacy and sharing
    isPrivate: {
      type: Boolean,
      default: true,
    },

    // Metadata
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better performance
ChatSchema.index({ user: 1, createdAt: -1 })
ChatSchema.index({ user: 1, isActive: 1 })
ChatSchema.index({ user: 1, lastActivity: -1 })
ChatSchema.index({ category: 1 })
ChatSchema.index({ tags: 1 })
ChatSchema.index({ isActive: 1 })

// Virtual for last message
ChatSchema.virtual('lastMessage').get(function () {
  return this.messages.length > 0
    ? this.messages[this.messages.length - 1]
    : null
})

// Virtual for formatted last activity
ChatSchema.virtual('lastActivityFormatted').get(function () {
  const now = new Date()
  const diff = now - this.lastActivity
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return this.lastActivity.toLocaleDateString()
})

// Pre-save middleware to update message count and last activity
ChatSchema.pre('save', function (next) {
  this.messageCount = this.messages.length

  if (this.messages.length > 0) {
    const lastMessage = this.messages[this.messages.length - 1]
    this.lastActivity = lastMessage.timestamp || new Date()
  }

  // Auto-generate title from first user message if not set
  if (!this.title && this.messages.length > 0) {
    const firstUserMessage = this.messages.find((msg) => msg.type === 'user')
    if (firstUserMessage) {
      const content = firstUserMessage.content
      this.title =
        content.length > 50 ? content.substring(0, 47) + '...' : content
    }
  }

  // Categorize chat based on content
  if (this.messages.length >= 2 && this.category === 'other') {
    this.category = this.categorizeChat()
  }

  next()
})

// Method to add a message
ChatSchema.methods.addMessage = async function (
  type,
  content,
  aiMetadata = null
) {
  const message = {
    type,
    content,
    timestamp: new Date(),
    status: 'sent',
  }

  if (aiMetadata) {
    message.aiMetadata = aiMetadata
    this.totalTokensUsed += aiMetadata.tokenUsage?.totalTokens || 0
    this.totalProcessingTime += aiMetadata.processingTime || 0
  }

  this.messages.push(message)
  await this.save()

  return message
}

// Method to get recent messages for context
ChatSchema.methods.getRecentMessages = function (limit = 10) {
  return this.messages.slice(-limit).map((msg) => ({
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: msg.content,
  }))
}

// Method to categorize chat based on content
ChatSchema.methods.categorizeChat = function () {
  const allContent = this.messages
    .map((msg) => msg.content.toLowerCase())
    .join(' ')

  const categories = {
    product_creation: [
      'product',
      'create',
      'course',
      'ebook',
      'digital',
      'build',
      'develop',
    ],
    affiliate_marketing: [
      'affiliate',
      'referral',
      'commission',
      'promote',
      'marketing',
    ],
    content_strategy: [
      'content',
      'viral',
      'hooks',
      'social media',
      'post',
      'engagement',
    ],
    business_planning: [
      'business',
      'plan',
      'strategy',
      'empire',
      'scale',
      'growth',
    ],
    general_strategy: ['help', 'advice', 'strategy', 'optimize', 'improve'],
  }

  let maxScore = 0
  let bestCategory = 'other'

  for (const [category, keywords] of Object.entries(categories)) {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (allContent.includes(keyword) ? 1 : 0)
    }, 0)

    if (score > maxScore) {
      maxScore = score
      bestCategory = category
    }
  }

  return maxScore > 0 ? bestCategory : 'other'
}

// Method to mark message as failed
ChatSchema.methods.markMessageFailed = async function (messageId, error) {
  const message = this.messages.id(messageId)
  if (message) {
    message.status = 'failed'
    message.error = {
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR',
    }
    await this.save()
  }
  return message
}

// Static method to get user's chat statistics
ChatSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
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
        categories: { $push: '$category' },
      },
    },
  ])

  const categoryBreakdown = {}
  if (stats[0]?.categories) {
    stats[0].categories.forEach((cat) => {
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1
    })
  }

  return {
    totalChats: stats[0]?.totalChats || 0,
    activeChats: stats[0]?.activeChats || 0,
    totalMessages: stats[0]?.totalMessages || 0,
    totalTokens: stats[0]?.totalTokens || 0,
    avgMessagesPerChat: Math.round(stats[0]?.avgMessagesPerChat || 0),
    categoryBreakdown,
  }
}

// Static method to clean up old inactive chats
ChatSchema.statics.cleanupOldChats = async function (daysOld = 90) {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

  return await this.deleteMany({
    isActive: false,
    lastActivity: { $lt: cutoffDate },
    messageCount: { $lte: 2 }, // Only delete chats with minimal interaction
  })
}

export default mongoose.model('Chat', ChatSchema)
