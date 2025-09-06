// File: models/DigitalProduct.js
import mongoose from 'mongoose'

const FileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
})

const PurchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  stripeSessionId: {
    type: String,
    required: true,
  },
  stripePaymentIntentId: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
})

const DigitalProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Course', 'Software', 'Templates', 'E-book', 'Audio', 'Video'],
      default: 'Course',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      max: [99999, 'Price cannot exceed $99,999'],
    },
    type: {
      type: String,
      enum: ['digital', 'saas', 'service'],
      default: 'digital',
    },
    published: {
      type: Boolean,
      default: false,
    },
    files: [FileSchema],
    sales: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
    purchases: [PurchaseSchema],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },
    // SEO and marketing fields
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    // Analytics
    views: {
      type: Number,
      default: 0,
    },
    lastViewedAt: {
      type: Date,
    },
    // Status tracking
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better performance
DigitalProductSchema.index({ creator: 1, isDeleted: 1 })
DigitalProductSchema.index({ published: 1, isDeleted: 1 })
DigitalProductSchema.index({ slug: 1 })
DigitalProductSchema.index({ category: 1, published: 1 })
DigitalProductSchema.index({ createdAt: -1 })

// Virtual for checkout URL
DigitalProductSchema.virtual('checkoutUrl').get(function () {
  if (this.published && this.slug) {
    return `${process.env.FRONTEND_URL}/product/checkout/${this.slug}`
  }
  return null
})

// Virtual for conversion rate
DigitalProductSchema.virtual('conversionRate').get(function () {
  if (this.views === 0) return 0
  return ((this.sales / this.views) * 100).toFixed(2)
})

// Pre-save middleware to generate slug
DigitalProductSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('name')) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    let slug = baseSlug
    let counter = 1

    // Ensure slug is unique
    while (
      await mongoose.models.DigitalProduct.findOne({
        slug,
        _id: { $ne: this._id },
        isDeleted: false,
      })
    ) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    this.slug = slug
  }
  next()
})

// Pre-find middleware to exclude deleted products by default
DigitalProductSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } })
  next()
})

// Instance method to add a purchase
DigitalProductSchema.methods.addPurchase = async function (purchaseData) {
  this.purchases.push(purchaseData)
  this.sales += 1
  this.revenue += purchaseData.amount
  return await this.save()
}

// Instance method to soft delete
DigitalProductSchema.methods.softDelete = async function () {
  this.isDeleted = true
  this.deletedAt = new Date()
  this.published = false
  return await this.save()
}

// Static method to get user's products with filters
DigitalProductSchema.statics.getUserProducts = function (userId, filters = {}) {
  const query = { creator: userId, isDeleted: false }

  if (filters.category && filters.category !== 'all') {
    query.category =
      filters.category.charAt(0).toUpperCase() + filters.category.slice(1)
  }

  if (filters.published !== undefined) {
    query.published = filters.published
  }

  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ]
  }

  return this.find(query)
    .populate('creator', 'name email')
    .sort({ createdAt: -1 })
}

// Static method to get public product by slug
DigitalProductSchema.statics.getPublicProduct = function (slug) {
  return this.findOne({
    slug,
    published: true,
    isDeleted: false,
  }).populate('creator', 'name email')
}

export default mongoose.model('DigitalProduct', DigitalProductSchema)
