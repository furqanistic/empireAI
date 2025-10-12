// File: models/Subscription.js - UPDATED: REMOVED TRIAL FUNCTIONALITY
import mongoose from 'mongoose'

const SubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // One subscription per user
    },
    stripeCustomerId: {
      type: String,
      required: function () {
        return !this.isGifted // Only required if not gifted
      },
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      sparse: true,
    },
    stripePriceId: {
      type: String,
      required: function () {
        return !this.isGifted
      },
      sparse: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'pro', 'empire'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'incomplete',
        'incomplete_expired',
        'paused',
      ],
      default: 'incomplete',
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    currentPeriodStart: {
      type: Date,
    },
    currentPeriodEnd: {
      type: Date,
    },
    // REMOVED: trialStart, trialEnd fields
    canceledAt: {
      type: Date,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      required: true, // Amount in cents
    },
    currency: {
      type: String,
      default: 'usd',
    },
    // Payment history
    paymentHistory: [
      {
        stripePaymentIntentId: String,
        amount: Number,
        currency: String,
        status: String,
        paidAt: Date,
        failureReason: String,
      },
    ],
    isGifted: {
      type: Boolean,
      default: false,
    },
    giftedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    giftedAt: {
      type: Date,
      default: null,
    },
    // Subscription metadata
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better performance
SubscriptionSchema.index({ user: 1 })
SubscriptionSchema.index({ stripeCustomerId: 1 })
SubscriptionSchema.index({ stripeSubscriptionId: 1 })
SubscriptionSchema.index({ status: 1 })
SubscriptionSchema.index({ plan: 1 })
SubscriptionSchema.index({ currentPeriodEnd: 1 })

// Virtual to check if subscription is active - UPDATED: REMOVED TRIAL STATUS
SubscriptionSchema.virtual('isActive').get(function () {
  return this.status === 'active'
})

// Virtual to check if subscription is past due
SubscriptionSchema.virtual('isPastDue').get(function () {
  return this.status === 'past_due'
})

// Virtual to check if subscription is canceled
SubscriptionSchema.virtual('isCanceled').get(function () {
  return ['canceled', 'unpaid', 'incomplete_expired'].includes(this.status)
})

// Virtual to get days remaining in current period
SubscriptionSchema.virtual('daysRemaining').get(function () {
  if (!this.currentPeriodEnd) return 0
  const now = new Date()
  const timeDiff = this.currentPeriodEnd - now
  return Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)))
})

// REMOVED: isTrialActive virtual

// Method to update subscription status - UPDATED: REMOVED TRIAL LOGIC
SubscriptionSchema.methods.updateFromStripe = function (stripeSubscription) {
  this.status = stripeSubscription.status

  // Handle period dates
  this.currentPeriodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000)
    : null

  this.currentPeriodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000)
    : null

  this.canceledAt = stripeSubscription.canceled_at
    ? new Date(stripeSubscription.canceled_at * 1000)
    : null

  this.cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end

  // REMOVED: Trial-related field updates

  return this.save()
}

// Method to add payment to history
SubscriptionSchema.methods.addPaymentToHistory = function (paymentData) {
  this.paymentHistory.push({
    stripePaymentIntentId: paymentData.id,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentData.status,
    paidAt: paymentData.paidAt || new Date(),
    failureReason: paymentData.failureReason || null,
  })
  return this.save()
}

// Static method to find active subscriptions - UPDATED: REMOVED TRIAL STATUS
SubscriptionSchema.statics.findActive = function () {
  return this.find({
    status: 'active', // Removed 'trialing'
  })
}

// Static method to find subscriptions expiring soon
SubscriptionSchema.statics.findExpiringSoon = function (days = 7) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  return this.find({
    status: 'active', // Removed 'trialing'
    currentPeriodEnd: { $lte: futureDate },
  })
}

export default mongoose.model('Subscription', SubscriptionSchema)
