// File: models/Earnings.js
import mongoose from 'mongoose'

const EarningsSchema = new mongoose.Schema(
  {
    // User who earned the commission
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // User who made the purchase (referred user)
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Source of the earning
    source: {
      type: String,
      enum: [
        'referral_signup',
        'subscription_purchase',
        'subscription_renewal',
        'product_sale',
      ],
      required: true,
    },

    // Transaction details
    transactionType: {
      type: String,
      enum: ['commission', 'bonus', 'reward'],
      default: 'commission',
    },

    // Related subscription (if applicable)
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },

    // Related product (if applicable)
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },

    // Financial details
    grossAmount: {
      type: Number,
      required: true, // Original transaction amount in cents
    },

    commissionRate: {
      type: Number,
      required: true, // Commission rate as decimal (e.g., 0.05 for 5%)
    },

    commissionAmount: {
      type: Number,
      required: true, // Calculated commission in cents
    },

    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },

    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'disputed', 'cancelled'],
      default: 'pending',
      index: true,
    },

    // Payout information
    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout',
    },

    paidAt: {
      type: Date,
    },

    // Approval workflow
    approvedAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // External reference IDs
    stripePaymentIntentId: {
      type: String,
    },

    stripeTransferId: {
      type: String,
    },

    // Additional metadata
    metadata: {
      clickId: String,
      campaignId: String,
      conversionData: mongoose.Schema.Types.Mixed,
    },

    // Notes and descriptions
    description: {
      type: String,
    },

    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for performance
EarningsSchema.index({ user: 1, status: 1 })
EarningsSchema.index({ user: 1, createdAt: -1 })
EarningsSchema.index({ referredUser: 1 })
EarningsSchema.index({ status: 1, createdAt: -1 })
EarningsSchema.index({ payout: 1 })
EarningsSchema.index({ source: 1 })

// Virtual to check if earning is payable
EarningsSchema.virtual('isPayable').get(function () {
  return this.status === 'approved' && !this.payout
})

// Virtual to get formatted amounts
EarningsSchema.virtual('formattedAmounts').get(function () {
  return {
    gross: (this.grossAmount / 100).toFixed(2),
    commission: (this.commissionAmount / 100).toFixed(2),
    currency: this.currency,
  }
})

// Virtual to get age in days
EarningsSchema.virtual('ageInDays').get(function () {
  const now = new Date()
  const timeDiff = now - this.createdAt
  return Math.floor(timeDiff / (1000 * 60 * 60 * 24))
})

// Method to approve earning
EarningsSchema.methods.approve = function (approvedBy) {
  this.status = 'approved'
  this.approvedAt = new Date()
  this.approvedBy = approvedBy
  return this.save()
}

// Method to mark as paid
EarningsSchema.methods.markAsPaid = function (payoutId, transferId = null) {
  this.status = 'paid'
  this.paidAt = new Date()
  this.payout = payoutId
  if (transferId) {
    this.stripeTransferId = transferId
  }
  return this.save()
}

// Method to dispute earning
EarningsSchema.methods.dispute = function (reason) {
  this.status = 'disputed'
  this.notes = reason
  return this.save()
}

// Method to cancel earning
EarningsSchema.methods.cancel = function (reason) {
  this.status = 'cancelled'
  this.notes = reason
  return this.save()
}

// Static method to calculate total earnings for a user
EarningsSchema.statics.getTotalEarnings = async function (
  userId,
  status = null
) {
  const matchStage = { user: mongoose.Types.ObjectId(userId) }
  if (status) {
    matchStage.status = status
  }

  const result = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
  ])

  return result.length > 0 ? result[0] : { total: 0, count: 0 }
}

// Static method to get earnings summary by status
EarningsSchema.statics.getEarningsSummary = async function (userId) {
  const result = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
  ])

  const summary = {
    pending: { total: 0, count: 0 },
    approved: { total: 0, count: 0 },
    paid: { total: 0, count: 0 },
    disputed: { total: 0, count: 0 },
    cancelled: { total: 0, count: 0 },
  }

  result.forEach((item) => {
    if (summary[item._id]) {
      summary[item._id] = {
        total: item.total,
        count: item.count,
      }
    }
  })

  return summary
}

// Static method to get payable earnings for a user
EarningsSchema.statics.getPayableEarnings = function (
  userId,
  minimumAmount = 0
) {
  return this.find({
    user: userId,
    status: 'approved',
    payout: { $exists: false },
    commissionAmount: { $gte: minimumAmount },
  }).populate('referredUser', 'name email')
}

// Static method to get recent earnings
EarningsSchema.statics.getRecentEarnings = function (
  userId,
  days = 30,
  limit = 10
) {
  const dateThreshold = new Date()
  dateThreshold.setDate(dateThreshold.getDate() - days)

  return this.find({
    user: userId,
    createdAt: { $gte: dateThreshold },
  })
    .populate('referredUser', 'name email')
    .populate('subscription', 'plan billingCycle')
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Pre-save middleware to validate commission calculation
EarningsSchema.pre('save', function (next) {
  // Validate commission calculation
  const expectedCommission = Math.floor(this.grossAmount * this.commissionRate)
  if (Math.abs(this.commissionAmount - expectedCommission) > 1) {
    // Allow 1 cent tolerance for rounding
    next(new Error('Commission amount does not match calculation'))
    return
  }

  // Set description if not provided
  if (!this.description) {
    switch (this.source) {
      case 'referral_signup':
        this.description = 'Referral signup bonus'
        break
      case 'subscription_purchase':
        this.description = 'Subscription commission'
        break
      case 'subscription_renewal':
        this.description = 'Renewal commission'
        break
      case 'product_sale':
        this.description = 'Product sale commission'
        break
      default:
        this.description = 'Commission earning'
    }
  }

  next()
})

export default mongoose.model('Earnings', EarningsSchema)
