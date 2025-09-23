// File: models/User.js - COMPLETE VERSION WITH ALL MISSING METHODS
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    // Basic user information
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password in queries by default
    },

    // User profile
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },
    website: {
      type: String,
      maxlength: [200, 'Website URL cannot exceed 200 characters'],
    },

    // Account settings
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: Date,

    // Authentication
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,

    // OTP for signup and password reset
    otpCode: String,
    otpExpires: Date,
    otpVerified: {
      type: Boolean,
      default: false,
    },

    // Password reset OTP system
    passwordResetOTP: String,
    passwordResetOTPExpires: Date,
    passwordResetAttempts: {
      type: Number,
      default: 0,
    },
    passwordResetLastAttempt: Date,

    // Referral system
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    referralCodeLastChanged: Date,
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    referrals: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
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
      },
    ],
    referralCount: {
      type: Number,
      default: 0,
    },
    hasUsedReferralDiscount: {
      type: Boolean,
      default: false,
    },
    referralDiscountUsedAt: Date,

    // Referral statistics
    referralStats: {
      totalReferrals: {
        type: Number,
        default: 0,
      },
      activeReferrals: {
        type: Number,
        default: 0,
      },
      referralRewards: {
        type: Number,
        default: 0, // in cents
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Points system
    points: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    pointsHistory: [
      {
        action: {
          type: String,
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
        description: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastDailyPointsClaim: Date,
    dailyClaimStreak: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Subscription information
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'pro', 'empire'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'trial', 'cancelled', 'past_due'],
        default: 'inactive',
      },
      startDate: Date,
      endDate: Date,
      isActive: {
        type: Boolean,
        default: false,
      },
      isTrialActive: {
        type: Boolean,
        default: false,
      },
      trialStartDate: Date,
      trialEndDate: Date,
      daysRemaining: {
        type: Number,
        default: 0,
      },
    },

    // Stripe customer information
    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Stripe Connect for payouts
    stripeConnect: {
      accountId: {
        type: String,
        unique: true,
        sparse: true,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },
      capabilities: {
        type: Map,
        of: String,
        default: {},
      },
      requirementsNeeded: [String],
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
        debitNegativeBalances: Boolean,
        statementDescriptor: String,
      },
      businessProfile: {
        mcc: String,
        url: String,
        productDescription: String,
      },
      lastUpdated: Date,
    },

    // Earnings tracking
    earningsInfo: {
      totalEarned: {
        type: Number,
        default: 0, // in cents
      },
      availableForPayout: {
        type: Number,
        default: 0, // in cents
      },
      pendingEarnings: {
        type: Number,
        default: 0, // in cents
      },
      totalPaidOut: {
        type: Number,
        default: 0, // in cents
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // Discord integration
    discord: {
      isConnected: {
        type: Boolean,
        default: false,
      },
      discordId: {
        type: String,
        unique: true,
        sparse: true,
      },
      username: String,
      discriminator: String,
      avatar: String,
      accessToken: String,
      refreshToken: String,
      tokenExpires: Date,
      connectedAt: Date,
      guilds: [
        {
          guildId: String,
          guildName: String,
          roles: [String],
          joinedAt: Date,
        },
      ],
    },

    // Activity tracking
    lastLogin: Date,
    loginCount: {
      type: Number,
      default: 0,
    },
    ipAddress: String,
    userAgent: String,

    // Preferences
    preferences: {
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        marketing: {
          type: Boolean,
          default: false,
        },
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'dark',
      },
      language: {
        type: String,
        default: 'en',
      },
    },

    // Privacy settings
    privacy: {
      profileVisible: {
        type: Boolean,
        default: true,
      },
      showEarnings: {
        type: Boolean,
        default: false,
      },
      allowMessages: {
        type: Boolean,
        default: true,
      },
    },

    // Metadata
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// ============================================================================
// INDEXES FOR PERFORMANCE
// ============================================================================

UserSchema.index({ email: 1 })
UserSchema.index({ referralCode: 1 })
UserSchema.index({ referredBy: 1 })
UserSchema.index({ 'stripeConnect.accountId': 1 })
UserSchema.index({ stripeCustomerId: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })
UserSchema.index({ createdAt: -1 })
UserSchema.index({ 'discord.discordId': 1 })

// ============================================================================
// VIRTUALS
// ============================================================================

// Virtual to get formatted earnings
UserSchema.virtual('formattedEarnings').get(function () {
  const earnings = this.earningsInfo || {}

  return {
    totalEarned: ((earnings.totalEarned || 0) / 100).toFixed(2),
    availableForPayout: ((earnings.availableForPayout || 0) / 100).toFixed(2),
    pendingEarnings: ((earnings.pendingEarnings || 0) / 100).toFixed(2),
    totalPaidOut: ((earnings.totalPaidOut || 0) / 100).toFixed(2),
    currency: 'USD',
  }
})

// Virtual to check if user is premium
UserSchema.virtual('isPremium').get(function () {
  return this.subscription?.isActive && this.subscription?.plan !== 'free'
})

// Virtual to get display name
UserSchema.virtual('displayName').get(function () {
  return this.name || this.email.split('@')[0]
})

// Virtual for referral URL
UserSchema.virtual('referralUrl').get(function () {
  if (!this.referralCode) return null
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
  return `${baseUrl}/auth?ref=${this.referralCode}`
})

// ============================================================================
// POINTS SYSTEM METHODS
// ============================================================================

// Method to check if user can claim daily points
UserSchema.methods.canClaimDailyPoints = function () {
  const now = new Date()
  const lastClaim = this.lastDailyPointsClaim

  if (!lastClaim) {
    return { canClaim: true, hoursUntilNext: 0 }
  }

  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60)
  const hoursUntilNext = Math.max(0, 24 - hoursSinceLastClaim)

  return {
    canClaim: hoursSinceLastClaim >= 24,
    hoursUntilNext: Math.ceil(hoursUntilNext),
  }
}

// Method to claim daily points
UserSchema.methods.claimDailyPoints = async function () {
  const now = new Date()
  const claimStatus = this.canClaimDailyPoints()

  if (!claimStatus.canClaim) {
    throw new Error(
      `Cannot claim points yet. Wait ${claimStatus.hoursUntilNext} hours.`
    )
  }

  // Check if this is consecutive day (within 48 hours of last claim)
  let isConsecutive = false
  if (this.lastDailyPointsClaim) {
    const hoursSinceLastClaim =
      (now - this.lastDailyPointsClaim) / (1000 * 60 * 60)
    isConsecutive = hoursSinceLastClaim >= 24 && hoursSinceLastClaim <= 48
  }

  // Update streak
  if (isConsecutive || !this.lastDailyPointsClaim) {
    this.dailyClaimStreak = (this.dailyClaimStreak || 0) + 1
  } else {
    this.dailyClaimStreak = 1 // Reset streak
  }

  // Base daily points
  let pointsToAward = 100 // Base daily points

  // Discord connection bonus
  let discordBonus = 0
  if (this.discord?.isConnected) {
    discordBonus = 25
    pointsToAward += discordBonus
  }

  // Award the points
  this.points += pointsToAward
  this.totalPointsEarned += pointsToAward
  this.lastDailyPointsClaim = now

  // Add to points history with detailed description
  const bonusDescription = []
  if (discordBonus > 0)
    bonusDescription.push(`Discord bonus (+${discordBonus})`)

  const description =
    bonusDescription.length > 0
      ? `Daily points claim (${
          this.dailyClaimStreak
        } day streak) - ${bonusDescription.join(', ')}`
      : `Daily points claim (${this.dailyClaimStreak} day streak)`

  this.pointsHistory.push({
    action: 'daily_claim',
    points: pointsToAward,
    description,
    date: now,
  })

  await this.save()

  return {
    pointsAwarded: pointsToAward,
    totalPoints: this.points,
    streak: this.dailyClaimStreak,
    discordBonus: discordBonus,
    nextClaimIn: 24, // hours
  }
}

// Static method to get top point earners
UserSchema.statics.getTopPointEarners = async function (limit = 10) {
  try {
    return await this.find({
      isDeleted: false,
      isActive: true,
    })
      .select('name email totalPointsEarned createdAt')
      .sort({ totalPointsEarned: -1 })
      .limit(limit)
  } catch (error) {
    console.error('Error getting top point earners:', error)
    return []
  }
}

// Method to add points
UserSchema.methods.addPoints = function (points, action, description) {
  this.points += points
  this.totalPointsEarned += points
  this.pointsHistory.push({
    action,
    points,
    description,
    date: new Date(),
  })
}

// Method to spend points
UserSchema.methods.spendPoints = function (points, action, description) {
  if (this.points < points) {
    throw new Error('Insufficient points')
  }
  this.points -= points
  this.pointsSpent += points
  this.pointsHistory.push({
    action,
    points: -points,
    description,
    date: new Date(),
  })
}

// ============================================================================
// REFERRAL SYSTEM METHODS
// ============================================================================

// Static method to find user by referral code
UserSchema.statics.findByReferralCode = async function (
  code,
  selectFields = null
) {
  try {
    console.log('Searching for user with referral code:', code)

    let query = this.findOne({
      referralCode: code.toUpperCase().trim(),
      isDeleted: false,
      isActive: true,
    })

    // Apply field selection if provided
    if (selectFields) {
      query = query.select(selectFields)
    }

    const user = await query

    console.log(
      'Found user:',
      user
        ? {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            referralCode: user.referralCode,
          }
        : 'No user found'
    )

    return user
  } catch (error) {
    console.error('Error finding user by referral code:', error)
    return null
  }
}

// Method to add a referral
UserSchema.methods.addReferral = async function (referredUserId) {
  try {
    // Check if referral already exists
    const existingReferral = this.referrals.find(
      (ref) => ref.user.toString() === referredUserId.toString()
    )

    if (existingReferral) {
      return false // Already exists
    }

    // Add the referral
    this.referrals.push({
      user: referredUserId,
      joinedAt: new Date(),
      status: 'active',
    })

    // Update referral stats
    if (!this.referralStats) {
      this.referralStats = {
        totalReferrals: 0,
        activeReferrals: 0,
        referralRewards: 0,
        lastUpdated: new Date(),
      }
    }

    this.referralStats.totalReferrals =
      (this.referralStats.totalReferrals || 0) + 1
    this.referralStats.activeReferrals =
      (this.referralStats.activeReferrals || 0) + 1
    this.referralStats.lastUpdated = new Date()
    this.referralCount = this.referrals.length

    await this.save()
    return true
  } catch (error) {
    console.error('Error adding referral:', error)
    throw error
  }
}

// Method to update referral stats
UserSchema.methods.updateReferralStats = async function () {
  try {
    const activeReferrals = this.referrals.filter(
      (ref) => ref.status === 'active'
    )

    this.referralStats = {
      ...this.referralStats,
      totalReferrals: this.referrals.length,
      activeReferrals: activeReferrals.length,
      lastUpdated: new Date(),
    }

    this.referralCount = this.referrals.length
    await this.save()
  } catch (error) {
    console.error('Error updating referral stats:', error)
  }
}

// ============================================================================
// PASSWORD RESET OTP METHODS
// ============================================================================

// Method to create password reset OTP
UserSchema.methods.createPasswordResetOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex')

  this.passwordResetOTP = otpHash
  this.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
  this.passwordResetAttempts = 0
  this.passwordResetLastAttempt = null

  return otp // Return plain OTP for sending
}

// Method to validate password reset OTP
UserSchema.methods.validatePasswordResetOTP = function (otp) {
  const now = Date.now()

  // Check if OTP exists and hasn't expired
  if (!this.passwordResetOTP || !this.passwordResetOTPExpires) {
    return {
      isValid: false,
      error: 'No OTP found. Please request a new password reset.',
    }
  }

  if (this.passwordResetOTPExpires <= now) {
    return {
      isValid: false,
      error: 'OTP has expired. Please request a new password reset.',
    }
  }

  // Check rate limiting (max 5 attempts per OTP)
  if (this.passwordResetAttempts >= 5) {
    return {
      isValid: false,
      error: 'Too many attempts. Please request a new password reset.',
    }
  }

  // Update attempt tracking
  this.passwordResetAttempts = (this.passwordResetAttempts || 0) + 1
  this.passwordResetLastAttempt = new Date()

  // Validate OTP
  const otpHash = crypto.createHash('sha256').update(otp).digest('hex')
  if (this.passwordResetOTP !== otpHash) {
    const attemptsLeft = 5 - this.passwordResetAttempts
    return {
      isValid: false,
      error: `Invalid OTP. ${attemptsLeft} attempts remaining.`,
    }
  }

  return { isValid: true }
}

// ============================================================================
// EARNINGS METHODS
// ============================================================================

// Method to update earnings info
UserSchema.methods.updateEarningsInfo = async function () {
  try {
    // Dynamically import Earnings model to avoid circular dependency
    const { default: Earnings } = await import('./Earnings.js')

    // Calculate earnings summary
    const earningsData = await Earnings.aggregate([
      {
        $match: { user: this._id },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$commissionAmount' },
        },
      },
    ])

    // Initialize earnings info
    const earningsInfo = {
      totalEarned: 0,
      availableForPayout: 0,
      pendingEarnings: 0,
      totalPaidOut: 0,
      lastUpdated: new Date(),
    }

    // Process earnings data
    earningsData.forEach((item) => {
      switch (item._id) {
        case 'pending':
          earningsInfo.pendingEarnings = item.total
          break
        case 'approved':
          earningsInfo.availableForPayout = item.total
          break
        case 'paid':
          earningsInfo.totalPaidOut = item.total
          break
      }
      // Add to total earned (all statuses except cancelled/disputed)
      if (!['cancelled', 'disputed'].includes(item._id)) {
        earningsInfo.totalEarned += item.total
      }
    })

    // Update user document
    this.earningsInfo = earningsInfo
    await this.save()

    return earningsInfo
  } catch (error) {
    console.error('Error updating earnings info:', error)
    // Return default earnings info on error
    return {
      totalEarned: 0,
      availableForPayout: 0,
      pendingEarnings: 0,
      totalPaidOut: 0,
      lastUpdated: new Date(),
    }
  }
}

// Method to check if user can receive payouts
UserSchema.methods.canReceivePayouts = function () {
  return !!(
    this.stripeConnect?.accountId &&
    this.stripeConnect?.isVerified &&
    this.stripeConnect?.onboardingCompleted
  )
}

// Method to get minimum payout amount
UserSchema.methods.getMinimumPayoutAmount = function () {
  const defaultMinimum = 1000 // $10.00 in cents
  return this.stripeConnect?.payoutSettings?.minimumAmount || defaultMinimum
}

// ============================================================================
// STATIC METHODS
// ============================================================================

// Static method to get top earners
UserSchema.statics.getTopEarners = async function (limit = 10, period = '30d') {
  try {
    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    const { default: Earnings } = await import('./Earnings.js')

    const topEarners = await Earnings.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'paid'] },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$user',
          totalEarnings: { $sum: '$commissionAmount' },
          totalCommissions: { $sum: 1 },
        },
      },
      {
        $sort: { totalEarnings: -1 },
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 1,
          totalEarnings: 1,
          totalCommissions: 1,
          'user.name': 1,
          'user.email': 1,
          'user.createdAt': 1,
        },
      },
    ])

    return topEarners
  } catch (error) {
    console.error('Error getting top earners:', error)
    return []
  }
}

// ============================================================================
// AUTHENTICATION METHODS
// ============================================================================

// Method to check password
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

// Method to check if password changed after JWT was issued
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

// Method to create password reset token
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes

  return resetToken
}

// Method to create email verification token
UserSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex')

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex')

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

  return verificationToken
}

// Method to generate referral code
UserSchema.methods.generateReferralCode = function () {
  const code = crypto.randomBytes(4).toString('hex').toUpperCase()
  this.referralCode = code
  return code
}

// Method to update Connect account status from Stripe account object
UserSchema.methods.updateConnectAccountStatus = async function (stripeAccount) {
  try {
    if (!stripeAccount) return

    // Initialize stripeConnect if it doesn't exist
    if (!this.stripeConnect) {
      this.stripeConnect = {}
    }

    // Update account verification status
    this.stripeConnect.isVerified =
      stripeAccount.charges_enabled &&
      stripeAccount.payouts_enabled &&
      stripeAccount.details_submitted

    // Update onboarding status
    this.stripeConnect.onboardingCompleted =
      stripeAccount.details_submitted || false

    // Update capabilities
    if (stripeAccount.capabilities) {
      this.stripeConnect.capabilities = new Map()
      for (const [key, value] of Object.entries(stripeAccount.capabilities)) {
        this.stripeConnect.capabilities.set(key, value.status || 'inactive')
      }
    }

    // Update requirements
    this.stripeConnect.requirementsNeeded =
      stripeAccount.requirements?.currently_due || []

    // Update business profile if exists
    if (stripeAccount.business_profile) {
      this.stripeConnect.businessProfile = {
        mcc: stripeAccount.business_profile.mcc,
        url: stripeAccount.business_profile.url,
        productDescription: stripeAccount.business_profile.product_description,
      }
    }

    // Update last updated timestamp
    this.stripeConnect.lastUpdated = new Date()

    await this.save()

    return this.stripeConnect
  } catch (error) {
    console.error('Error updating Connect account status:', error)
    throw error
  }
}

// Method to safely reset Connect account
UserSchema.methods.safeResetConnectAccount = async function () {
  try {
    this.stripeConnect = {
      accountId: null,
      isVerified: false,
      onboardingCompleted: false,
      capabilities: new Map(),
      requirementsNeeded: [],
      payoutSettings: {
        schedule: 'manual',
        minimumAmount: 1000,
        currency: 'USD',
      },
    }

    await this.save()
    console.log(`Reset Connect account for user ${this.email}`)
    return true
  } catch (error) {
    console.error('Error resetting Connect account:', error)
    throw error
  }
}

// ============================================================================
// PRE-SAVE MIDDLEWARE
// ============================================================================

// Hash password before saving
UserSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next()

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12)

  // Set passwordChangedAt
  if (!this.isNew) {
    this.passwordChangedAt = Date.now() - 1000
  }

  next()
})

// Generate referral code before saving if needed
UserSchema.pre('save', function (next) {
  if (this.isNew && !this.referralCode) {
    let attempts = 0
    const generateCode = () => {
      attempts++
      if (attempts > 10) {
        return next(new Error('Failed to generate unique referral code'))
      }
      this.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase()
    }
    generateCode()
  }
  next()
})

// Initialize referralStats if not exists
UserSchema.pre('save', function (next) {
  if (this.isNew && !this.referralStats) {
    this.referralStats = {
      totalReferrals: 0,
      activeReferrals: 0,
      referralRewards: 0,
      lastUpdated: new Date(),
    }
  }
  next()
})

// Clear OTP fields after password reset
UserSchema.pre('save', function (next) {
  if (this.isModified('password') && !this.isNew) {
    // Clear password reset OTP fields when password is changed
    this.passwordResetOTP = undefined
    this.passwordResetOTPExpires = undefined
    this.passwordResetAttempts = undefined
    this.passwordResetLastAttempt = undefined
  }
  next()
})

// ============================================================================
// QUERY MIDDLEWARE
// ============================================================================

// Exclude deleted users from find queries
UserSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: true } })
  next()
})

export default mongoose.model('User', UserSchema)
