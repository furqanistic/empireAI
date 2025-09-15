// File: models/User.js - UPDATED WITH EMAIL VERIFICATION STATUS
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

    // EMAIL VERIFICATION FIELDS
    isEmailVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },

    // Password Reset Fields - OTP BASED
    passwordResetOTP: {
      type: String,
      select: false, // Don't include in queries by default
    },
    passwordResetOTPExpires: {
      type: Date,
      select: false, // Don't include in queries by default
    },
    passwordResetAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    passwordResetLastAttempt: {
      type: Date,
      select: false,
    },

    // Legacy token fields (keep for backward compatibility)
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },

    // Points System
    points: {
      type: Number,
      default: 0,
    },
    lastDailyClaim: {
      type: Date,
      default: null,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
    },
    pointsSpent: {
      type: Number,
      default: 0,
    },

    // Streak tracking for daily claims
    dailyClaimStreak: {
      type: Number,
      default: 0,
    },
    lastStreakClaim: {
      type: Date,
      default: null,
    },

    // Discord Integration
    discord: {
      discordId: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple null values
      },
      username: String,
      discriminator: String,
      avatar: String,
      email: String, // Discord email (might be different from main email)
      isConnected: {
        type: Boolean,
        default: false,
      },
      connectedAt: Date,
      lastRoleUpdate: Date,
      currentRoles: [String], // Array of role IDs currently assigned
    },

    // Subscription plan
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'starter', 'pro', 'empire'],
        default: 'free',
      },
      status: {
        type: String,
        enum: [
          'active',
          'inactive',
          'cancelled',
          'trial',
          'trialing',
          'past_due',
          'unpaid',
        ],
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

    // Stripe Integration Fields
    stripeCustomerId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but unique non-null values
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
UserSchema.index({ 'discord.discordId': 1 })
UserSchema.index({ isDeleted: 1, isActive: 1 })
UserSchema.index({ isEmailVerified: 1 }) // New index for email verification
UserSchema.index({ lastDailyClaim: 1 })
UserSchema.index({ points: -1 })
UserSchema.index({ passwordResetOTP: 1 }) // Index for OTP
UserSchema.index({ passwordResetOTPExpires: 1 }) // Index for OTP expiry
UserSchema.index({ passwordResetToken: 1 }) // Legacy index
UserSchema.index({ passwordResetExpires: 1 }) // Legacy index

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)

    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000)
    }

    // Clear password reset fields when password is changed
    this.passwordResetToken = undefined
    this.passwordResetExpires = undefined
    this.passwordResetOTP = undefined
    this.passwordResetOTPExpires = undefined
    this.passwordResetAttempts = 0
    this.passwordResetLastAttempt = undefined

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

// NEW: Method to mark email as verified
UserSchema.methods.verifyEmail = function () {
  this.isEmailVerified = true
  this.emailVerifiedAt = new Date()
}

// NEW: Method to create password reset OTP
UserSchema.methods.createPasswordResetOTP = function () {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()

  // Hash OTP and save to database
  this.passwordResetOTP = crypto.createHash('sha256').update(otp).digest('hex')

  // Set expiry time (10 minutes from now)
  this.passwordResetOTPExpires = Date.now() + 10 * 60 * 1000

  // Reset attempts counter
  this.passwordResetAttempts = 0
  this.passwordResetLastAttempt = new Date()

  // Return unhashed OTP (this will be sent via email)
  return otp
}

// NEW: Method to validate password reset OTP
UserSchema.methods.validatePasswordResetOTP = function (otp) {
  // Check if too many attempts
  if (this.passwordResetAttempts >= 5) {
    const timeSinceLastAttempt = Date.now() - this.passwordResetLastAttempt
    const cooldownTime = 15 * 60 * 1000 // 15 minutes

    if (timeSinceLastAttempt < cooldownTime) {
      return {
        isValid: false,
        error: 'Too many attempts. Please wait 15 minutes before trying again.',
        remainingTime: Math.ceil((cooldownTime - timeSinceLastAttempt) / 60000),
      }
    } else {
      // Reset attempts after cooldown
      this.passwordResetAttempts = 0
    }
  }

  // Hash the incoming OTP
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex')

  // Check if OTP matches and hasn't expired
  const isValid =
    this.passwordResetOTP === hashedOTP &&
    this.passwordResetOTPExpires > Date.now()

  // Increment attempts
  this.passwordResetAttempts += 1
  this.passwordResetLastAttempt = new Date()

  if (!isValid) {
    return {
      isValid: false,
      error:
        this.passwordResetOTPExpires <= Date.now()
          ? 'OTP has expired. Please request a new one.'
          : 'Invalid OTP. Please check and try again.',
      attemptsRemaining: Math.max(0, 5 - this.passwordResetAttempts),
    }
  }

  return { isValid: true }
}

// NEW: Static method to find user by valid reset OTP
UserSchema.statics.findByValidResetOTP = function (otp) {
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex')

  return this.findOne({
    passwordResetOTP: hashedOTP,
    passwordResetOTPExpires: { $gt: Date.now() },
    isActive: true,
    isDeleted: false,
  }).select(
    '+passwordResetOTP +passwordResetOTPExpires +passwordResetAttempts +passwordResetLastAttempt'
  )
}

// Legacy method to create password reset token (keep for backward compatibility)
UserSchema.methods.createPasswordResetToken = function () {
  // Generate random token
  const resetToken = crypto.randomBytes(32).toString('hex')

  // Hash token and save to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

  // Set expiry time (10 minutes from now)
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000

  // Return unhashed token (this will be sent via email)
  return resetToken
}

// Legacy method to validate password reset token
UserSchema.methods.validatePasswordResetToken = function (token) {
  // Hash the incoming token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  // Check if token matches and hasn't expired
  return (
    this.passwordResetToken === hashedToken &&
    this.passwordResetExpires > Date.now()
  )
}

// Legacy static method to find user by valid reset token
UserSchema.statics.findByValidResetToken = function (token) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    isActive: true,
    isDeleted: false,
  }).select('+passwordResetToken +passwordResetExpires')
}

// Method to check if user can claim daily points
UserSchema.methods.canClaimDailyPoints = function () {
  if (!this.lastDailyClaim) {
    return { canClaim: true, hoursUntilNext: 0 }
  }

  const now = new Date()
  const lastClaim = new Date(this.lastDailyClaim)
  const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60)

  if (hoursSinceLastClaim >= 24) {
    return { canClaim: true, hoursUntilNext: 0 }
  }

  const hoursUntilNext = Math.ceil(24 - hoursSinceLastClaim)
  return { canClaim: false, hoursUntilNext }
}

// Method to claim daily points with Discord bonus
UserSchema.methods.claimDailyPoints = async function () {
  const claimCheck = this.canClaimDailyPoints()

  if (!claimCheck.canClaim) {
    throw new Error(`You can claim again in ${claimCheck.hoursUntilNext} hours`)
  }

  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Check if this continues a streak (claimed yesterday)
  let isConsecutive = false
  if (this.lastStreakClaim) {
    const lastStreakClaim = new Date(this.lastStreakClaim)
    const hoursSinceLastStreak = (now - lastStreakClaim) / (1000 * 60 * 60)

    // If claimed between 20-48 hours ago, it's consecutive
    if (hoursSinceLastStreak >= 20 && hoursSinceLastStreak <= 48) {
      isConsecutive = true
    }
  }

  // Update streak
  if (isConsecutive) {
    this.dailyClaimStreak += 1
  } else {
    this.dailyClaimStreak = 1 // Reset to 1 for this claim
  }

  // Calculate bonus points based on streak
  let pointsToAward = 100 // Base daily points

  // Bonus points for streaks
  if (this.dailyClaimStreak >= 7) {
    pointsToAward += 50 // Weekly streak bonus
  }
  if (this.dailyClaimStreak >= 30) {
    pointsToAward += 100 // Monthly streak bonus
  }

  // Discord connection bonus
  if (this.discord?.isConnected) {
    pointsToAward += 25 // Extra 25 points for Discord users
  }

  // Award points
  this.points += pointsToAward
  this.totalPointsEarned += pointsToAward
  this.lastDailyClaim = now
  this.lastStreakClaim = now

  await this.save()

  return {
    pointsAwarded: pointsToAward,
    totalPoints: this.points,
    streak: this.dailyClaimStreak,
    nextClaimIn: 24, // hours
    discordBonus: this.discord?.isConnected ? 25 : 0,
  }
}

// Method to spend points
UserSchema.methods.spendPoints = async function (amount) {
  if (this.points < amount) {
    throw new Error('Insufficient points')
  }

  this.points -= amount
  this.pointsSpent += amount

  await this.save()

  return {
    pointsSpent: amount,
    remainingPoints: this.points,
    totalSpent: this.pointsSpent,
  }
}

// Method to get Discord role based on subscription
UserSchema.methods.getDiscordRole = function () {
  const roleMapping = {
    free: process.env.DISCORD_ROLE_FREE,
    starter: process.env.DISCORD_ROLE_BASIC,
    pro: process.env.DISCORD_ROLE_PREMIUM,
    empire: process.env.DISCORD_ROLE_ENTERPRISE,
  }

  return roleMapping[this.subscription?.plan || 'free']
}

// Method to check if Discord roles need updating
UserSchema.methods.needsRoleUpdate = function () {
  if (!this.discord?.isConnected) return false

  const expectedRole = this.getDiscordRole()
  const hasExpectedRole = this.discord.currentRoles?.includes(expectedRole)

  return !hasExpectedRole
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

      // Award referral bonus points
      const referralPoints = 250 // Points for successful referral
      this.points += referralPoints
      this.totalPointsEarned += referralPoints

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

// Virtual for referral URL
UserSchema.virtual('referralUrl').get(function () {
  return `${
    process.env.FRONTEND_URL || 'http://localhost:5173'
  }/auth?ref=${this.referralCode}`
})

// Virtual for daily claim status
UserSchema.virtual('dailyClaimStatus').get(function () {
  const claimCheck = this.canClaimDailyPoints()
  return {
    canClaim: claimCheck.canClaim,
    hoursUntilNext: claimCheck.hoursUntilNext,
    streak: this.dailyClaimStreak,
    lastClaim: this.lastDailyClaim,
    discordBonus: this.discord?.isConnected ? 25 : 0,
  }
})

// Virtual for points summary
UserSchema.virtual('pointsSummary').get(function () {
  return {
    current: this.points,
    totalEarned: this.totalPointsEarned,
    totalSpent: this.pointsSpent,
    dailyStreak: this.dailyClaimStreak,
  }
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

// Virtual for email verification status
UserSchema.virtual('emailVerificationStatus').get(function () {
  return {
    isVerified: this.isEmailVerified,
    verifiedAt: this.emailVerifiedAt,
    canLogin: this.isEmailVerified && this.isActive && !this.isDeleted,
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

// Static method to get top earners by points
UserSchema.statics.getTopPointEarners = function (limit = 10) {
  return this.find({ totalPointsEarned: { $gt: 0 } })
    .select(
      'name email points totalPointsEarned dailyClaimStreak discord.isConnected'
    )
    .sort({ totalPointsEarned: -1 })
    .limit(limit)
}

// Query middleware to exclude deleted users by default
UserSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } })
  next()
})

export default mongoose.model('User', UserSchema)
