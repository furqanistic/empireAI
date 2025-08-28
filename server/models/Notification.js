// File: models/Notification.js
import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'referral_join',
        'referral_reward',
        'system_announcement',
        'account_update',
        'payment_update',
        'subscription_update',
        'achievement',
        'security_alert',
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 100,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxLength: 500,
    },
    data: {
      // Flexible field for storing notification-specific data
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    actionUrl: {
      type: String,
      trim: true,
    },
    actionText: {
      type: String,
      trim: true,
      maxLength: 50,
    },
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 }, // TTL index for auto-deletion
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Compound indexes for efficient querying
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
NotificationSchema.index({ recipient: 1, type: 1, createdAt: -1 })
NotificationSchema.index({ recipient: 1, isDeleted: 1, createdAt: -1 })

// Virtual for time ago
NotificationSchema.virtual('timeAgo').get(function () {
  const now = new Date()
  const diffMs = now - this.createdAt
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${
      Math.floor(diffDays / 7) > 1 ? 's' : ''
    } ago`
  return `${Math.floor(
    diffDays / 30
  )} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
})

// Method to mark notification as read
NotificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true
    this.readAt = new Date()
    await this.save()
  }
  return this
}

// Static method to create referral notification
NotificationSchema.statics.createReferralNotification = async function (
  referrerId,
  newUser
) {
  try {
    const notification = await this.create({
      recipient: referrerId,
      type: 'referral_join',
      title: 'New Referral Joined!',
      message: `${newUser.name} just joined using your referral code. You've earned referral rewards!`,
      data: {
        referredUser: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          joinedAt: newUser.createdAt,
        },
        rewardAmount: 10, // This should match the reward amount in User model
      },
      priority: 'high',
      actionUrl: '/invite',
      actionText: 'View Referrals',
    })

    return notification
  } catch (error) {
    console.error('Error creating referral notification:', error)
    throw error
  }
}

// Static method to create system notification
NotificationSchema.statics.createSystemNotification = async function (
  recipients,
  notificationData
) {
  try {
    const notifications = []
    const recipientIds = Array.isArray(recipients) ? recipients : [recipients]

    for (const recipientId of recipientIds) {
      const notification = await this.create({
        recipient: recipientId,
        ...notificationData,
      })
      notifications.push(notification)
    }

    return notifications
  } catch (error) {
    console.error('Error creating system notification:', error)
    throw error
  }
}

// Static method to get user notifications with pagination
NotificationSchema.statics.getUserNotifications = async function (
  userId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    type = null,
    isRead = null,
    priority = null,
  } = options

  const query = {
    recipient: userId,
    isDeleted: false,
  }

  if (type) query.type = type
  if (isRead !== null) query.isRead = isRead
  if (priority) query.priority = priority

  const notifications = await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('recipient', 'name email')
    .lean()

  const total = await this.countDocuments(query)
  const unreadCount = await this.countDocuments({
    ...query,
    isRead: false,
  })

  return {
    notifications,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalNotifications: total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    },
    unreadCount,
  }
}

// Query middleware to exclude deleted notifications by default
NotificationSchema.pre(/^find/, function (next) {
  this.find({ isDeleted: { $ne: true } })
  next()
})

export default mongoose.model('Notification', NotificationSchema)
