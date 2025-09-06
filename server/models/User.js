// File: models/User.js - UPDATED WITH STRIPE CONNECT INTEGRATION
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default in queries
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },

    // Stripe Integration Fields
    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but unique non-null values
    },

    // NEW: Stripe Connect Fields for Payouts
    stripeConnect: {
      accountId: {
        type: String,
        unique: true,
        sparse: true,
      },

      // Account verification status
      isVerified: {
        type: Boolean,
        default: false,
      },

      // Current verification requirements
      requirementsNeeded: [
        {
          type: String,
        },
      ],

      // Account capabilities
      capabilities: {
        cardPayments: {
          type: String,
          enum: ['active', 'inactive', 'pending'],
          default: 'inactive',
        },
        transfers: {
          type: String,
          enum: ['active', 'inactive', 'pending'],
          default: 'inactive',
        },
      },

      // Payout settings
      payoutSettings: {
        schedule: {
          type: String,
          enum: ['manual', 'weekly', 'monthly'],
          default: 'manual',
        },
        minimumAmount: {
          type: Number,
          default: 1000, // $10.00 in cents
        },
        currency: {
          type: String,
          default: 'USD',
        },
      },

      // Business information
      businessProfile: {
        name: String,
        supportEmail: String,
        supportPhone: String,
        supportUrl: String,
        country: String,
        businessType: {
          type: String,
          enum: ['individual', 'company'],
          default: 'individual',
        },
      },

      // Account status tracking
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },

      lastUpdated: {
        type: Date,
        default: Date.now,
      },

      // Restrictions or issues
      restrictedFeatures: [
        {
          feature: String,
          reason: String,
        },
      ],
    },

    // Enhanced Referral System Fields
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    referrals: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['active', 'inactive'],
          default: 'active',
        },
        // Track if this referral has made a purchase
        hasSubscribed: {
          type: Boolean,
          default: false,
        },
        subscriptionValue: {
          type: Number,
          default: 0,
        },
      },
    ],

    // Enhanced referral statistics
    referralStats: {
      totalReferrals: {
        type: Number,
        default: 0,
      },
      activeReferrals: {
        type: Number,
        default: 0,
      },
      paidReferrals: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: Number,
        default: 0, // Total earnings in cents
      },
      pendingEarnings: {
        type: Number,
        default: 0,
      },
      paidEarnings: {
        type: Number,
        default: 0,
      },
      conversionRate: {
        type: Number,
        default: 0, // Percentage of referrals that convert to paid
      },
    },

    // NEW: Earnings and Payout Information
    earningsInfo: {
      totalEarned: {
        type: Number,
        default: 0, // Total lifetime earnings in cents
      },
      availableForPayout: {
        type: Number,
        default: 0, // Currently available for payout in cents
      },
      totalPaidOut: {
        type: Number,
        default: 0, // Total amount paid out in cents
      },
      lastPayoutDate: {
        type: Date,
      },
      nextAutomaticPayout: {
        type: Date,
      },
    },

    // Notification preferences
    notificationPreferences: {
      emailNotifications: {
        earnings: {
          type: Boolean,
          default: true,
        },
        payouts: {
          type: Boolean,
          default: true,
        },
        referrals: {
          type: Boolean,
          default: true,
        },
        marketing: {
          type: Boolean,
          default: false,
        },
      },
      pushNotifications: {
        earnings: {
          type: Boolean,
          default: true,
        },
        payouts: {
          type: Boolean,
          default: true,
        },
      },
    },

    // Account Status
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes for better performance
UserSchema.index({ email: 1 })
UserSchema.index({ referralCode: 1 })
UserSchema.index({ referredBy: 1 })
UserSchema.index({ stripeCustomerId: 1 })
UserSchema.index({ 'stripeConnect.accountId': 1 })
UserSchema.index({ isDeleted: 1, isActive: 1 })

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)

    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000)
    }

    next()
  } catch (error) {
    next(error)
  }
})

// Pre-save middleware to generate referral code
UserSchema.pre('save', async function (next) {
  if (!this.isNew || this.referralCode) return next()

  try {
    let referralCode
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    while (!isUnique && attempts < maxAttempts) {
      const namePrefix = this.name
        .replace(/\s+/g, '')
        .substring(0, 3)
        .toUpperCase()
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
      referralCode = `${namePrefix}${randomSuffix}`

      const existingUser = await mongoose.models.User.findOne({ referralCode })
      if (!existingUser) {
        isUnique = true
        this.referralCode = referralCode
      }
      attempts++
    }

    if (!isUnique) {
      this.referralCode = `USER${Date.now().toString().slice(-6)}`
    }

    next()
  } catch (error) {
    next(error)
  }
})

// Method to check if password is correct
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

// Method to check if password was changed after JWT was issued
UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    )
    return JWTTimestamp < changedTimestamp
  }
  return false
}

// Enhanced method to add a referral
UserSchema.methods.addReferral = async function (
  referredUserId,
  subscriptionValue = 0
) {
  try {
    const existingReferral = this.referrals.find(
      (ref) => ref.user.toString() === referredUserId.toString()
    )

    if (!existingReferral) {
      this.referrals.push({
        user: referredUserId,
        joinedAt: new Date(),
        status: 'active',
        hasSubscribed: subscriptionValue > 0,
        subscriptionValue: subscriptionValue,
      })

      this.referralStats.totalReferrals += 1
      this.referralStats.activeReferrals += 1

      if (subscriptionValue > 0) {
        this.referralStats.paidReferrals += 1
      }

      // Update conversion rate
      this.referralStats.conversionRate =
        (this.referralStats.paidReferrals / this.referralStats.totalReferrals) *
        100

      await this.save()
      return true
    }
    return false
  } catch (error) {
    throw error
  }
}

// NEW: Method to update Stripe Connect account status
UserSchema.methods.updateConnectAccountStatus = function (accountData) {
  if (!this.stripeConnect) {
    this.stripeConnect = {}
  }

  this.stripeConnect.accountId = accountData.id
  this.stripeConnect.isVerified =
    accountData.details_submitted && accountData.charges_enabled
  this.stripeConnect.requirementsNeeded =
    accountData.requirements?.currently_due || []

  // Update capabilities
  if (accountData.capabilities) {
    this.stripeConnect.capabilities = {
      cardPayments: accountData.capabilities.card_payments || 'inactive',
      transfers: accountData.capabilities.transfers || 'inactive',
    }
  }

  // Update business profile if available
  if (accountData.business_profile) {
    this.stripeConnect.businessProfile = {
      ...this.stripeConnect.businessProfile,
      name: accountData.business_profile.name,
      supportEmail: accountData.business_profile.support_email,
      supportPhone: accountData.business_profile.support_phone,
      supportUrl: accountData.business_profile.support_url,
      country: accountData.country,
    }
  }

  this.stripeConnect.onboardingCompleted = accountData.details_submitted
  this.stripeConnect.lastUpdated = new Date()

  return this.save()
}

// NEW: Method to update earnings information
UserSchema.methods.updateEarningsInfo = async function () {
  const Earnings = mongoose.model('Earnings')

  // Get earnings summary
  const summary = await Earnings.getEarningsSummary(this._id)

  this.earningsInfo.totalEarned =
    summary.approved.total + summary.paid.total + summary.pending.total
  this.earningsInfo.availableForPayout = summary.approved.total
  this.earningsInfo.totalPaidOut = summary.paid.total

  // Update referral stats
  this.referralStats.totalEarnings = this.earningsInfo.totalEarned
  this.referralStats.pendingEarnings =
    summary.pending.total + summary.approved.total
  this.referralStats.paidEarnings = summary.paid.total

  return this.save()
}

// NEW: Method to check if user can receive payouts
UserSchema.methods.canReceivePayouts = function () {
  return (
    this.stripeConnect?.accountId &&
    this.stripeConnect.isVerified &&
    this.stripeConnect.capabilities?.transfers === 'active' &&
    this.stripeConnect.onboardingCompleted
  )
}

// NEW: Method to get minimum payout amount
UserSchema.methods.getMinimumPayoutAmount = function () {
  return this.stripeConnect?.payoutSettings?.minimumAmount || 1000 // Default $10
}

// Virtual for referral URL
UserSchema.virtual('referralUrl').get(function () {
  return `${
    process.env.FRONTEND_URL || 'http://localhost:5173'
  }/auth?ref=${this.referralCode}`
})

// Virtual to get subscription status
UserSchema.virtual('subscriptionStatus').get(function () {
  if (this.subscription) {
    return {
      hasSubscription: true,
      isActive: this.subscription.isActive,
      plan: this.subscription.plan,
      status: this.subscription.status,
      trialActive: this.subscription.isTrialActive,
      daysRemaining: this.subscription.daysRemaining,
    }
  }
  return {
    hasSubscription: false,
    isActive: false,
    plan: null,
    status: 'none',
    trialActive: false,
  }
})

// NEW: Virtual for Connect account status
UserSchema.virtual('connectStatus').get(function () {
  if (!this.stripeConnect?.accountId) {
    return {
      status: 'not_connected',
      canReceivePayouts: false,
      needsVerification: false,
    }
  }

  return {
    status: this.stripeConnect.isVerified ? 'verified' : 'pending',
    canReceivePayouts: this.canReceivePayouts(),
    needsVerification: this.stripeConnect.requirementsNeeded.length > 0,
    requirements: this.stripeConnect.requirementsNeeded,
  }
})

// NEW: Virtual for formatted earnings
UserSchema.virtual('formattedEarnings').get(function () {
  const info = this.earningsInfo
  return {
    totalEarned: (info.totalEarned / 100).toFixed(2),
    availableForPayout: (info.availableForPayout / 100).toFixed(2),
    totalPaidOut: (info.totalPaidOut / 100).toFixed(2),
    currency: this.stripeConnect?.payoutSettings?.currency || 'USD',
  }
})

// Static method to find user by referral code
UserSchema.statics.findByReferralCode = function (code) {
  return this.findOne({
    referralCode: code,
    isActive: true,
    isDeleted: false,
  })
}

// NEW: Static method to find users with pending Connect verification
UserSchema.statics.findPendingVerification = function () {
  return this.find({
    'stripeConnect.accountId': { $exists: true },
    'stripeConnect.isVerified': false,
    'stripeConnect.onboardingCompleted': false,
  })
}

// Query middleware to exclude deleted users by default
UserSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } })
  next()
})

export default mongoose.model('User', UserSchema)
