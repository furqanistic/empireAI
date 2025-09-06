// File: models/Payout.js
import mongoose from 'mongoose'

const PayoutSchema = new mongoose.Schema(
  {
    // User requesting the payout
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Payout details
    amount: {
      type: Number,
      required: true, // Amount in cents
      min: 0,
    },

    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },

    // Stripe Connect information
    stripeConnectAccountId: {
      type: String,
      required: true,
    },

    stripePayoutId: {
      type: String,
      unique: true,
      sparse: true, // Allows null but unique non-null values
    },

    stripeTransferId: {
      type: String,
    },

    // Status tracking
    status: {
      type: String,
      enum: [
        'pending', // Payout requested but not processed
        'processing', // Being processed by Stripe
        'in_transit', // Money is on its way
        'paid', // Successfully paid
        'failed', // Payment failed
        'cancelled', // Cancelled before processing
        'returned', // Money was returned (rare)
      ],
      default: 'pending',
      index: true,
    },

    // Method of payout
    method: {
      type: String,
      enum: ['standard', 'instant'],
      default: 'standard',
    },

    // Related earnings
    earnings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Earnings',
      },
    ],

    // Timing information
    requestedAt: {
      type: Date,
      default: Date.now,
    },

    processedAt: {
      type: Date,
    },

    paidAt: {
      type: Date,
    },

    failedAt: {
      type: Date,
    },

    // Expected arrival (for standard payouts)
    expectedArrival: {
      earliest: Date,
      latest: Date,
    },

    // Failure information
    failureCode: {
      type: String,
    },

    failureMessage: {
      type: String,
    },

    // Processing fees
    fees: {
      stripeFee: {
        type: Number,
        default: 0, // Stripe's fee in cents
      },
      platformFee: {
        type: Number,
        default: 0, // Our platform fee in cents
      },
      total: {
        type: Number,
        default: 0, // Total fees in cents
      },
    },

    // Net amount after fees
    netAmount: {
      type: Number,
    },

    // Payout destination
    destination: {
      type: {
        type: String,
        enum: ['bank_account', 'debit_card'],
      },
      last4: String,
      bankName: String,
      country: String,
    },

    // Admin notes and approval
    adminNotes: {
      type: String,
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Metadata for tracking
    metadata: {
      automaticPayout: {
        type: Boolean,
        default: false,
      },
      payoutSchedule: String,
      batchId: String,
    },

    // Tax information (for future use)
    taxInfo: {
      taxWithheld: {
        type: Number,
        default: 0,
      },
      taxRate: {
        type: Number,
        default: 0,
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
PayoutSchema.index({ user: 1, status: 1 })
PayoutSchema.index({ user: 1, createdAt: -1 })
PayoutSchema.index({ status: 1, createdAt: -1 })
PayoutSchema.index({ stripePayoutId: 1 })
PayoutSchema.index({ stripeConnectAccountId: 1 })
PayoutSchema.index({ requestedAt: 1 })

// Virtual to check if payout is pending
PayoutSchema.virtual('isPending').get(function () {
  return this.status === 'pending'
})

// Virtual to check if payout is completed
PayoutSchema.virtual('isCompleted').get(function () {
  return this.status === 'paid'
})

// Virtual to check if payout failed
PayoutSchema.virtual('isFailed').get(function () {
  return ['failed', 'returned'].includes(this.status)
})

// Virtual to get formatted amounts
PayoutSchema.virtual('formattedAmounts').get(function () {
  return {
    gross: (this.amount / 100).toFixed(2),
    fees: (this.fees.total / 100).toFixed(2),
    net: (this.netAmount / 100).toFixed(2),
    currency: this.currency,
  }
})

// Virtual to get processing time
PayoutSchema.virtual('processingTime').get(function () {
  if (!this.processedAt || !this.requestedAt) return null

  const timeDiff = this.processedAt - this.requestedAt
  const hours = Math.floor(timeDiff / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
})

// Method to calculate fees
PayoutSchema.methods.calculateFees = function () {
  // Stripe Connect standard payout fees
  // Standard: Free for bank accounts, $0.50 for debit cards
  // Instant: 1.5% for debit cards (min $0.50)

  let stripeFee = 0
  let platformFee = 0

  if (this.method === 'instant') {
    stripeFee = Math.max(50, Math.floor(this.amount * 0.015)) // 1.5%, min $0.50
  } else if (this.destination?.type === 'debit_card') {
    stripeFee = 50 // $0.50 for standard debit card payouts
  }
  // Bank account standard payouts are free

  // Platform fee (optional - you might want to charge a small fee)
  // platformFee = Math.floor(this.amount * 0.01) // 1% platform fee

  this.fees.stripeFee = stripeFee
  this.fees.platformFee = platformFee
  this.fees.total = stripeFee + platformFee
  this.netAmount = this.amount - this.fees.total

  return this.fees
}

// Method to mark as processing
PayoutSchema.methods.markAsProcessing = function (
  stripePayoutId,
  processedBy = null
) {
  this.status = 'processing'
  this.stripePayoutId = stripePayoutId
  this.processedAt = new Date()
  if (processedBy) {
    this.processedBy = processedBy
  }
  return this.save()
}

// Method to mark as paid
PayoutSchema.methods.markAsPaid = function (paidDate = null) {
  this.status = 'paid'
  this.paidAt = paidDate || new Date()
  return this.save()
}

// Method to mark as failed
PayoutSchema.methods.markAsFailed = function (failureCode, failureMessage) {
  this.status = 'failed'
  this.failedAt = new Date()
  this.failureCode = failureCode
  this.failureMessage = failureMessage
  return this.save()
}

// Method to cancel payout
PayoutSchema.methods.cancel = function (reason) {
  if (this.status !== 'pending') {
    throw new Error('Can only cancel pending payouts')
  }

  this.status = 'cancelled'
  this.adminNotes = reason
  return this.save()
}

// Static method to get user's payout history
PayoutSchema.statics.getUserPayoutHistory = function (
  userId,
  limit = 20,
  status = null
) {
  const query = { user: userId }
  if (status) {
    query.status = status
  }

  return this.find(query)
    .populate('earnings', 'source commissionAmount description')
    .sort({ createdAt: -1 })
    .limit(limit)
}

// Static method to get pending payouts
PayoutSchema.statics.getPendingPayouts = function (limit = 50) {
  return this.find({ status: 'pending' })
    .populate('user', 'name email stripeConnectAccountId')
    .sort({ requestedAt: 1 })
    .limit(limit)
}

// Static method to get payout statistics
PayoutSchema.statics.getPayoutStats = async function (dateRange = null) {
  const matchStage = {}

  if (dateRange) {
    matchStage.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    }
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalFees: { $sum: '$fees.total' },
      },
    },
  ])

  const result = {
    pending: { count: 0, totalAmount: 0, totalFees: 0 },
    processing: { count: 0, totalAmount: 0, totalFees: 0 },
    paid: { count: 0, totalAmount: 0, totalFees: 0 },
    failed: { count: 0, totalAmount: 0, totalFees: 0 },
    cancelled: { count: 0, totalAmount: 0, totalFees: 0 },
  }

  stats.forEach((item) => {
    if (result[item._id]) {
      result[item._id] = {
        count: item.count,
        totalAmount: item.totalAmount,
        totalFees: item.totalFees,
      }
    }
  })

  return result
}

// Pre-save middleware to calculate fees and validate
PayoutSchema.pre('save', function (next) {
  // Calculate fees if not already set
  if (this.isModified('amount') || this.isModified('method')) {
    this.calculateFees()
  }

  // Validate minimum payout amount
  const minimumPayout = 1000 // $10.00 in cents
  if (this.amount < minimumPayout) {
    next(
      new Error(
        `Minimum payout amount is ${minimumPayout / 100} ${this.currency}`
      )
    )
    return
  }

  // Set expected arrival for standard payouts
  if (this.method === 'standard' && this.status === 'processing') {
    const now = new Date()
    this.expectedArrival = {
      earliest: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days
      latest: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }
  }

  next()
})

export default mongoose.model('Payout', PayoutSchema)
