// File: models/Earnings.js - CREATE THIS FILE
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

    // User who was referred
    referredUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Source of the earning
    source: {
      type: String,
      enum: [
        'subscription_purchase',
        'subscription_renewal',
        'digital_product_purchase',
        'referral_bonus',
      ],
      required: true,
      index: true,
    },

    // Related subscription (if applicable)
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },

    // Related digital product (if applicable)
    digitalProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalProduct',
    },

    // Commission details
    grossAmount: {
      type: Number,
      required: true, // Original transaction amount in cents
    },

    commissionRate: {
      type: Number,
      required: true, // Rate as decimal (e.g., 0.05 for 5%)
    },

    commissionAmount: {
      type: Number,
      required: true, // Commission earned in cents
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

    // Approval details
    approvedAt: {
      type: Date,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Payment details
    paidAt: {
      type: Date,
    },

    payout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout',
    },

    stripeTransferId: {
      type: String,
    },

    stripePaymentIntentId: {
      type: String,
    },

    // Dispute details
    disputedAt: {
      type: Date,
    },

    disputedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    disputeReason: {
      type: String,
    },

    // Cancellation details
    cancelledAt: {
      type: Date,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    cancellationReason: {
      type: String,
    },

    // Description and metadata
    description: {
      type: String,
      required: true,
    },

    adminNotes: {
      type: String,
    },

    metadata: {
      planType: String,
      billingCycle: String,
      originalEarningId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Earnings',
      },
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
EarningsSchema.index({ subscription: 1 })
EarningsSchema.index({ digitalProduct: 1 })
EarningsSchema.index({ payout: 1 })
EarningsSchema.index({ status: 1, createdAt: -1 })
EarningsSchema.index({ source: 1, status: 1 })

// Virtual for formatted amounts
EarningsSchema.virtual('formattedAmounts').get(function () {
  return {
    gross: (this.grossAmount / 100).toFixed(2),
    commission: (this.commissionAmount / 100).toFixed(2),
    currency: this.currency,
    rate: (this.commissionRate * 100).toFixed(1) + '%',
  }
})

// Virtual to check if earning is payable
EarningsSchema.virtual('isPayable').get(function () {
  return this.status === 'approved' && !this.payout
})

// Static method to get earnings summary for a user
EarningsSchema.statics.getEarningsSummary = async function (userId) {
  const summary = await this.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$status',
        total: { $sum: '$commissionAmount' },
        count: { $sum: 1 },
      },
    },
  ])

  const result = {
    pending: { total: 0, count: 0 },
    approved: { total: 0, count: 0 },
    paid: { total: 0, count: 0 },
    disputed: { total: 0, count: 0 },
    cancelled: { total: 0, count: 0 },
  }

  summary.forEach((item) => {
    if (result[item._id]) {
      result[item._id] = {
        total: item.total,
        count: item.count,
      }
    }
  })

  return result
}

// Static method to get recent earnings
EarningsSchema.statics.getRecentEarnings = function (
  userId,
  days = 30,
  limit = 10
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return this.find({
    user: userId,
    createdAt: { $gte: startDate },
  })
    .populate('referredUser', 'name email')
    .populate('subscription', 'plan status')
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Static method to get payable earnings
EarningsSchema.statics.getPayableEarnings = function (
  userId,
  minimumAmount = 0
) {
  return this.find({
    user: userId,
    status: 'approved',
    payout: { $exists: false },
    commissionAmount: { $gte: minimumAmount },
  }).sort({ createdAt: 1 }) // Oldest first for FIFO
}

// Static method to get earnings by date range
EarningsSchema.statics.getEarningsByDateRange = function (
  userId,
  startDate,
  endDate,
  status = null
) {
  const query = {
    user: userId,
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }

  if (status) {
    query.status = status
  }

  return this.find(query)
    .populate('referredUser', 'name email')
    .populate('subscription', 'plan status')
    .sort({ createdAt: -1 })
}

// Method to approve earning
EarningsSchema.methods.approve = function (approvedBy = null) {
  this.status = 'approved'
  this.approvedAt = new Date()
  if (approvedBy) {
    this.approvedBy = approvedBy
  }
  return this.save()
}

// Method to mark as paid
EarningsSchema.methods.markAsPaid = function (payoutId, paidDate = null) {
  this.status = 'paid'
  this.paidAt = paidDate || new Date()
  this.payout = payoutId
  return this.save()
}

// Method to dispute earning
EarningsSchema.methods.dispute = function (reason, disputedBy = null) {
  this.status = 'disputed'
  this.disputedAt = new Date()
  this.disputeReason = reason
  if (disputedBy) {
    this.disputedBy = disputedBy
  }
  return this.save()
}

// Method to cancel earning
EarningsSchema.methods.cancel = function (reason, cancelledBy = null) {
  this.status = 'cancelled'
  this.cancelledAt = new Date()
  this.cancellationReason = reason
  if (cancelledBy) {
    this.cancelledBy = cancelledBy
  }
  return this.save()
}

export default mongoose.model('Earnings', EarningsSchema)
