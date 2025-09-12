// File: models/Chat.js
import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
})

const ChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    messages: [MessageSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
ChatSchema.index({ user: 1, createdAt: -1 })

// Pre-save to update title from first message
ChatSchema.pre('save', function (next) {
  if (this.messages.length > 0 && this.title === 'New Chat') {
    const firstMessage = this.messages[0].content
    this.title =
      firstMessage.length > 50
        ? firstMessage.substring(0, 47) + '...'
        : firstMessage
  }

  if (this.messages.length > 0) {
    this.lastActivity = new Date()
  }

  next()
})

export default mongoose.model('Chat', ChatSchema)
