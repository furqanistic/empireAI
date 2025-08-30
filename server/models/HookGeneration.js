// File: models/HookGeneration.js
import mongoose from 'mongoose'

const HookGenerationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['instagram', 'tiktok', 'twitter', 'linkedin', 'email', 'youtube'],
    },
    niche: {
      type: String,
      required: true,
      enum: [
        'entrepreneurship',
        'fitness',
        'relationships',
        'finance',
        'self-improvement',
        'technology',
        'marketing',
        'health',
        'travel',
        'education',
        'fashion',
        'food',
      ],
    },
    tone: {
      type: String,
      required: true,
      enum: [
        'urgent',
        'controversial',
        'curiosity',
        'emotional',
        'authority',
        'storytelling',
      ],
    },
    customPrompt: {
      type: String,
      default: '',
    },
    generatedHooks: [
      {
        content: {
          type: String,
          required: true,
        },
        position: {
          type: Number,
          required: true,
        },
        copied: {
          type: Boolean,
          default: false,
        },
        copiedAt: {
          type: Date,
        },
      },
    ],
    // API Usage Stats
    modelUsed: {
      type: String,
      default: 'llama-3.3-70b-versatile',
    },
    tokenUsage: {
      promptTokens: {
        type: Number,
        default: 0,
      },
      completionTokens: {
        type: Number,
        default: 0,
      },
      totalTokens: {
        type: Number,
        default: 0,
      },
    },
    processingTime: {
      type: Number, // in milliseconds
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    error: {
      message: String,
      code: String,
    },
    // User Engagement
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
    },
    // Metadata
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better performance
HookGenerationSchema.index({ user: 1 })
HookGenerationSchema.index({ user: 1, createdAt: -1 })
HookGenerationSchema.index({ platform: 1, niche: 1 })
HookGenerationSchema.index({ status: 1 })
HookGenerationSchema.index({ createdAt: -1 })

// Virtual for generation age
HookGenerationSchema.virtual('generationAge').get(function () {
  return Date.now() - this.createdAt
})

// Instance method to mark hook as copied
HookGenerationSchema.methods.markHookCopied = async function (hookIndex) {
  if (this.generatedHooks[hookIndex]) {
    this.generatedHooks[hookIndex].copied = true
    this.generatedHooks[hookIndex].copiedAt = new Date()
    await this.save()
    return true
  }
  return false
}

// Instance method to add rating and feedback
HookGenerationSchema.methods.addFeedback = async function (rating, feedback) {
  this.rating = rating
  this.feedback = feedback
  await this.save()
  return this
}

// Static method to get user stats
HookGenerationSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGenerations: { $sum: 1 },
        totalHooks: { $sum: { $size: '$generatedHooks' } },
        totalTokens: { $sum: '$tokenUsage.totalTokens' },
        avgProcessingTime: { $avg: '$processingTime' },
        platformBreakdown: {
          $push: '$platform',
        },
        nicheBreakdown: {
          $push: '$niche',
        },
        toneBreakdown: {
          $push: '$tone',
        },
      },
    },
  ])

  return (
    stats[0] || {
      totalGenerations: 0,
      totalHooks: 0,
      totalTokens: 0,
      avgProcessingTime: 0,
      platformBreakdown: [],
      nicheBreakdown: [],
      toneBreakdown: [],
    }
  )
}

// Static method to get platform analytics
HookGenerationSchema.statics.getPlatformAnalytics = async function () {
  return await this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$platform',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        avgTokens: { $avg: '$tokenUsage.totalTokens' },
        avgProcessingTime: { $avg: '$processingTime' },
      },
    },
    { $sort: { count: -1 } },
  ])
}

// Pre-save middleware for validation
HookGenerationSchema.pre('save', function (next) {
  if (this.generatedHooks.length > 0) {
    // Ensure position numbers are correct
    this.generatedHooks.forEach((hook, index) => {
      if (!hook.position) {
        hook.position = index + 1
      }
    })
  }
  next()
})

export default mongoose.model('HookGeneration', HookGenerationSchema)
