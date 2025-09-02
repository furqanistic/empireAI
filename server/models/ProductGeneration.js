// File: models/ProductGeneration.js
import mongoose from 'mongoose'

const ProductGenerationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productType: {
      type: String,
      required: true,
      enum: [
        'course',
        'ebook',
        'template',
        'coaching',
        'software',
        'mastermind',
        'workshop',
        'membership',
      ],
    },
    niche: {
      type: String,
      required: true,
      enum: [
        'business',
        'marketing',
        'fitness',
        'finance',
        'development',
        'technology',
        'design',
        'relationships',
        'productivity',
        'investing',
        'content',
        'spirituality',
      ],
    },
    audience: {
      type: String,
      required: true,
      enum: [
        'beginners',
        'intermediate',
        'advanced',
        'entrepreneurs',
        'professionals',
        'creators',
      ],
    },
    priceRange: {
      type: String,
      required: true,
      enum: ['budget', 'mid', 'premium', 'elite'],
    },
    complexity: {
      type: String,
      required: true,
      enum: ['simple', 'moderate', 'advanced'],
    },
    customContext: {
      type: String,
      default: '',
    },
    generatedProduct: {
      title: {
        type: String,
        required: function () {
          return this.status === 'completed'
        },
      },
      overview: {
        type: String,
        required: function () {
          return this.status === 'completed'
        },
      },
      outline: {
        modules: [
          {
            title: String,
            description: String,
            lessons: [String],
          },
        ],
      },
      pricing: {
        mainPrice: String,
        strategy: String,
        paymentPlans: [String],
      },
      marketing: {
        angles: [String],
      },
      bonuses: [
        {
          title: String,
          description: String,
        },
      ],
      launch: {
        sequence: [
          {
            day: Number,
            title: String,
            description: String,
          },
        ],
      },
      sales: {
        headline: String,
        subheadline: String,
        bulletPoints: [String],
      },
      technical: {
        requirements: [String],
      },
      revenue: {
        type: mongoose.Schema.Types.Mixed,
      },
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
    // Tracking
    contentCopied: [
      {
        section: String,
        copiedAt: Date,
      },
    ],
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
ProductGenerationSchema.index({ user: 1 })
ProductGenerationSchema.index({ user: 1, createdAt: -1 })
ProductGenerationSchema.index({ productType: 1, niche: 1 })
ProductGenerationSchema.index({ status: 1 })
ProductGenerationSchema.index({ createdAt: -1 })

// Virtual for generation age
ProductGenerationSchema.virtual('generationAge').get(function () {
  return Date.now() - this.createdAt
})

// Instance method to mark content as copied
ProductGenerationSchema.methods.markContentCopied = async function (section) {
  this.contentCopied.push({
    section,
    copiedAt: new Date(),
  })
  await this.save()
  return true
}

// Instance method to mark as downloaded
ProductGenerationSchema.methods.markDownloaded = async function () {
  this.downloaded = true
  this.downloadedAt = new Date()
  await this.save()
  return this
}

// Instance method to add rating and feedback
ProductGenerationSchema.methods.addFeedback = async function (
  rating,
  feedback
) {
  this.rating = rating
  this.feedback = feedback
  await this.save()
  return this
}

// Static method to get user stats

ProductGenerationSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalTokens: { $sum: '$tokenUsage.totalTokens' },
        avgProcessingTime: { $avg: '$processingTime' },
        productTypeBreakdown: {
          $push: '$productType',
        },
        nicheBreakdown: {
          $push: '$niche',
        },
        audienceBreakdown: {
          $push: '$audience',
        },
        completedProducts: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
        },
        totalDownloads: {
          $sum: { $cond: ['$downloaded', 1, 0] },
        },
        totalContentCopies: {
          $sum: { $size: { $ifNull: ['$contentCopied', []] } },
        },
      },
    },
  ])

  const result = stats[0] || {
    totalProducts: 0,
    totalTokens: 0,
    avgProcessingTime: 0,
    productTypeBreakdown: [],
    nicheBreakdown: [],
    audienceBreakdown: [],
    completedProducts: 0,
    totalDownloads: 0,
    totalContentCopies: 0,
  }

  // Calculate success rate
  result.successRate =
    result.totalProducts > 0
      ? ((result.completedProducts / result.totalProducts) * 100).toFixed(1)
      : 0

  // Use JavaScript-based calculation instead of complex MongoDB aggregation
  try {
    const completedProducts = await this.find({
      user: new mongoose.Types.ObjectId(userId),
      status: 'completed',
      'generatedProduct.pricing.mainPrice': { $exists: true, $ne: null },
    }).select('generatedProduct.pricing.mainPrice')

    let totalRevenue = 0
    let validPrices = 0

    for (const product of completedProducts) {
      const priceString = product.generatedProduct?.pricing?.mainPrice
      if (priceString && typeof priceString === 'string') {
        // Extract number from price string like "$297" or "$1,497" or "$5,000"
        const numericValue = parseFloat(priceString.replace(/[$,]/g, ''))
        if (!isNaN(numericValue) && numericValue > 0) {
          totalRevenue += numericValue
          validPrices++
        }
      }
    }

    result.averagePrice =
      validPrices > 0 ? `$${Math.round(totalRevenue / validPrices)}` : '$0'
    result.totalRevenue =
      totalRevenue > 0 ? `$${Math.round(totalRevenue)}` : '$0'
  } catch (revenueError) {
    console.warn('Revenue calculation failed:', revenueError.message)
    result.averagePrice = '$0'
    result.totalRevenue = '$0'
  }

  return result
}

// Static method to get product type analytics
ProductGenerationSchema.statics.getProductAnalytics = async function () {
  return await this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$productType',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        avgTokens: { $avg: '$tokenUsage.totalTokens' },
        avgProcessingTime: { $avg: '$processingTime' },
        downloadRate: {
          $avg: { $cond: ['$downloaded', 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ])
}

// Pre-save middleware for validation
ProductGenerationSchema.pre('save', function (next) {
  // Only validate completed products
  if (this.status === 'completed') {
    if (
      !this.generatedProduct ||
      !this.generatedProduct.title ||
      !this.generatedProduct.overview
    ) {
      this.status = 'failed'
      this.error = {
        message: 'Generated product is incomplete',
        code: 'INCOMPLETE_PRODUCT',
      }
    }
  }
  next()
})

export default mongoose.model('ProductGeneration', ProductGenerationSchema)
