// File: models/User.js
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

    // Referral System Fields
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values but unique non-null values
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
      },
    ],
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
        default: 0,
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
UserSchema.index({ isDeleted: 1, isActive: 1 })

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next()

  try {
    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Pre-save middleware to generate referral code
UserSchema.pre('save', async function (next) {
  // Only generate referral code if it's a new user and doesn't have one
  if (!this.isNew || this.referralCode) return next()

  try {
    let referralCode
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    // Generate unique referral code
    while (!isUnique && attempts < maxAttempts) {
      // Create referral code from name and random string
      const namePrefix = this.name
        .replace(/\s+/g, '')
        .substring(0, 3)
        .toUpperCase()
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase()
      referralCode = `${namePrefix}${randomSuffix}`

      // Check if this code already exists
      const existingUser = await mongoose.models.User.findOne({ referralCode })
      if (!existingUser) {
        isUnique = true
        this.referralCode = referralCode
      }
      attempts++
    }

    if (!isUnique) {
      // Fallback to timestamp-based code
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

// Method to add a referral
UserSchema.methods.addReferral = async function (referredUserId) {
  try {
    // Check if referral already exists
    const existingReferral = this.referrals.find(
      (ref) => ref.user.toString() === referredUserId.toString()
    )

    if (!existingReferral) {
      this.referrals.push({
        user: referredUserId,
        joinedAt: new Date(),
        status: 'active',
      })

      // Update referral stats
      this.referralStats.totalReferrals += 1
      this.referralStats.activeReferrals += 1
      this.referralStats.referralRewards += 10 // Example: 10 points per referral

      await this.save()
      return true
    }
    return false
  } catch (error) {
    throw error
  }
}

// Virtual for referral URL (if you want to implement sharing)
UserSchema.virtual('referralUrl').get(function () {
  return `${
    process.env.FRONTEND_URL || 'http://localhost:5173'
  }/auth?ref=${this.referralCode}`
})

// Static method to find user by referral code
UserSchema.statics.findByReferralCode = function (code) {
  return this.findOne({
    referralCode: code,
    isActive: true,
    isDeleted: false,
  })
}

// Query middleware to exclude deleted users by default
UserSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ isDeleted: { $ne: true } })
  next()
})

export default mongoose.model('User', UserSchema)
