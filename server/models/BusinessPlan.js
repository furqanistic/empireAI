// File: models/BusinessPlan.js - WITH CHART DATA FIELDS
import mongoose from 'mongoose'

const BusinessPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    niche: {
      type: String,
      required: true,
      enum: [
        'fitness',
        'tech',
        'finance',
        'education',
        'ecommerce',
        'food',
        'travel',
        'fashion',
        'pets',
        'home',
        'entertainment',
        'creative',
      ],
    },
    businessModel: {
      type: String,
      required: true,
      enum: [
        'saas',
        'ecommerce',
        'marketplace',
        'coaching',
        'subscription',
        'content',
      ],
    },
    targetMarket: {
      type: String,
      required: true,
      enum: ['b2c', 'b2b', 'b2b2c'],
    },
    customContext: {
      type: String,
      default: '',
      maxLength: 1000,
    },

    // Generated Content (not required initially - populated after AI generation)
    generatedPlan: {
      title: {
        type: String,
        required: false,
      },
      marketAnalysis: {
        type: String,
        required: false,
      },
      roadmap: [
        {
          milestone: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          position: {
            type: Number,
            required: true,
          },
        },
      ],
      revenueProjections: [
        {
          period: {
            type: String,
            required: true,
          },
          revenue: {
            type: String,
            required: true,
          },
          growth: {
            type: String,
            required: true,
          },
          position: {
            type: Number,
            required: true,
          },
        },
      ],
      productLineup: [
        {
          name: {
            type: String,
            required: true,
          },
          description: {
            type: String,
            required: true,
          },
          price: {
            type: String,
            required: true,
          },
          position: {
            type: Number,
            required: true,
          },
        },
      ],
      // NEW: Chart data fields
      marketSegments: [
        {
          name: {
            type: String,
            required: true,
          },
          percentage: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
          },
          description: {
            type: String,
            required: true,
          },
        },
      ],
      competitiveAnalysis: [
        {
          company: {
            type: String,
            required: true,
          },
          marketShare: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
          },
          satisfaction: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
          },
          innovation: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
          },
        },
      ],
    },

    // Generation metadata
    dataSource: {
      type: String,
      enum: ['ai_generated', 'fallback', 'hybrid'],
      default: 'ai_generated',
    },

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
    downloaded: {
      type: Boolean,
      default: false,
    },
    downloadedAt: {
      type: Date,
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
BusinessPlanSchema.index({ user: 1 })
BusinessPlanSchema.index({ user: 1, createdAt: -1 })
BusinessPlanSchema.index({ niche: 1, businessModel: 1 })
BusinessPlanSchema.index({ status: 1 })
BusinessPlanSchema.index({ createdAt: -1 })
BusinessPlanSchema.index({ dataSource: 1 }) // New index for tracking data sources

// Virtual for generation age
BusinessPlanSchema.virtual('generationAge').get(function () {
  return Date.now() - this.createdAt
})

// Virtual for chart data quality assessment
BusinessPlanSchema.virtual('chartDataQuality').get(function () {
  if (!this.generatedPlan) return 'none'

  const hasMarketSegments =
    this.generatedPlan.marketSegments &&
    this.generatedPlan.marketSegments.length >= 3
  const hasCompetitive =
    this.generatedPlan.competitiveAnalysis &&
    this.generatedPlan.competitiveAnalysis.length >= 3

  if (hasMarketSegments && hasCompetitive) return 'complete'
  if (hasMarketSegments || hasCompetitive) return 'partial'
  return 'basic'
})

// Instance method to mark plan as downloaded
BusinessPlanSchema.methods.markAsDownloaded = async function () {
  this.downloaded = true
  this.downloadedAt = new Date()
  await this.save()
  return this
}

// Instance method to add rating and feedback
BusinessPlanSchema.methods.addFeedback = async function (rating, feedback) {
  this.rating = rating
  this.feedback = feedback
  await this.save()
  return this
}

// Instance method to validate chart data
BusinessPlanSchema.methods.validateChartData = function () {
  const plan = this.generatedPlan
  if (!plan) return { valid: false, errors: ['No generated plan found'] }

  const errors = []

  // Validate market segments
  if (plan.marketSegments && plan.marketSegments.length > 0) {
    const totalPercentage = plan.marketSegments.reduce(
      (sum, segment) => sum + segment.percentage,
      0
    )
    if (Math.abs(totalPercentage - 100) > 5) {
      errors.push('Market segments should total approximately 100%')
    }
  }

  // Validate competitive analysis
  if (plan.competitiveAnalysis && plan.competitiveAnalysis.length > 0) {
    const totalMarketShare = plan.competitiveAnalysis.reduce(
      (sum, comp) => sum + comp.marketShare,
      0
    )
    if (totalMarketShare > 110) {
      errors.push('Combined market share exceeds realistic bounds')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: errors.length > 0 ? ['Chart data may need adjustment'] : [],
  }
}

// Static method to get user stats with chart data insights
BusinessPlanSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalGenerations: { $sum: 1 },
        totalTokens: { $sum: '$tokenUsage.totalTokens' },
        avgProcessingTime: { $avg: '$processingTime' },
        totalDownloads: {
          $sum: { $cond: ['$downloaded', 1, 0] },
        },
        aiGeneratedCount: {
          $sum: { $cond: [{ $eq: ['$dataSource', 'ai_generated'] }, 1, 0] },
        },
        fallbackCount: {
          $sum: { $cond: [{ $eq: ['$dataSource', 'fallback'] }, 1, 0] },
        },
        nicheBreakdown: {
          $push: '$niche',
        },
        businessModelBreakdown: {
          $push: '$businessModel',
        },
        marketBreakdown: {
          $push: '$targetMarket',
        },
      },
    },
  ])

  const result = stats[0] || {
    totalGenerations: 0,
    totalTokens: 0,
    avgProcessingTime: 0,
    totalDownloads: 0,
    aiGeneratedCount: 0,
    fallbackCount: 0,
    nicheBreakdown: [],
    businessModelBreakdown: [],
    marketBreakdown: [],
  }

  // Add AI success rate
  result.aiSuccessRate =
    result.totalGenerations > 0
      ? ((result.aiGeneratedCount / result.totalGenerations) * 100).toFixed(1)
      : 0

  return result
}

// Static method to get niche analytics with chart data quality
BusinessPlanSchema.statics.getNicheAnalytics = async function () {
  return await this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$niche',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        avgTokens: { $avg: '$tokenUsage.totalTokens' },
        avgProcessingTime: { $avg: '$processingTime' },
        downloadRate: {
          $avg: { $cond: ['$downloaded', 1, 0] },
        },
        aiSuccessRate: {
          $avg: { $cond: [{ $eq: ['$dataSource', 'ai_generated'] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ])
}

// Static method to get chart data quality metrics
BusinessPlanSchema.statics.getChartQualityMetrics = async function () {
  return await this.aggregate([
    { $match: { status: 'completed' } },
    {
      $project: {
        niche: 1,
        dataSource: 1,
        hasMarketSegments: {
          $and: [
            { $isArray: '$generatedPlan.marketSegments' },
            { $gte: [{ $size: '$generatedPlan.marketSegments' }, 3] },
          ],
        },
        hasCompetitiveAnalysis: {
          $and: [
            { $isArray: '$generatedPlan.competitiveAnalysis' },
            { $gte: [{ $size: '$generatedPlan.competitiveAnalysis' }, 3] },
          ],
        },
      },
    },
    {
      $group: {
        _id: '$niche',
        total: { $sum: 1 },
        withMarketSegments: {
          $sum: { $cond: ['$hasMarketSegments', 1, 0] },
        },
        withCompetitiveAnalysis: {
          $sum: { $cond: ['$hasCompetitiveAnalysis', 1, 0] },
        },
        aiGenerated: {
          $sum: { $cond: [{ $eq: ['$dataSource', 'ai_generated'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        niche: '$_id',
        total: 1,
        marketSegmentsCoverage: {
          $multiply: [{ $divide: ['$withMarketSegments', '$total'] }, 100],
        },
        competitiveAnalysisCoverage: {
          $multiply: [{ $divide: ['$withCompetitiveAnalysis', '$total'] }, 100],
        },
        aiSuccessRate: {
          $multiply: [{ $divide: ['$aiGenerated', '$total'] }, 100],
        },
      },
    },
    { $sort: { total: -1 } },
  ])
}

// Pre-save middleware for validation and data integrity
BusinessPlanSchema.pre('save', function (next) {
  if (this.generatedPlan && this.generatedPlan.roadmap) {
    // Ensure roadmap positions are correct
    this.generatedPlan.roadmap.forEach((item, index) => {
      if (!item.position) {
        item.position = index + 1
      }
    })
  }

  if (this.generatedPlan && this.generatedPlan.revenueProjections) {
    // Ensure revenue projection positions are correct
    this.generatedPlan.revenueProjections.forEach((item, index) => {
      if (!item.position) {
        item.position = index + 1
      }
    })
  }

  if (this.generatedPlan && this.generatedPlan.productLineup) {
    // Ensure product lineup positions are correct
    this.generatedPlan.productLineup.forEach((item, index) => {
      if (!item.position) {
        item.position = index + 1
      }
    })
  }

  // Validate market segments percentages
  if (
    this.generatedPlan &&
    this.generatedPlan.marketSegments &&
    this.generatedPlan.marketSegments.length > 0
  ) {
    const totalPercentage = this.generatedPlan.marketSegments.reduce(
      (sum, segment) => sum + segment.percentage,
      0
    )
    if (Math.abs(totalPercentage - 100) > 10) {
      console.warn(
        `Market segments total ${totalPercentage}% - should be closer to 100%`
      )
    }
  }

  next()
})

export default mongoose.model('BusinessPlan', BusinessPlanSchema)
