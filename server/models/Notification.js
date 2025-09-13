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
        'points',
        // NEW: Subscription & Payment related notifications
        'trial_started',
        'trial_ending_soon',
        'trial_ended',
        'subscription_activated',
        'subscription_upgraded',
        'subscription_downgraded',
        'subscription_cancelled',
        'subscription_expired',
        'subscription_renewed',
        'payment_successful',
        'payment_failed',
        'payment_retry',
        'payout_processed',
        'commission_earned',
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

// NEW: Static method to create trial notification
NotificationSchema.statics.createTrialNotification = async function (
  userId,
  trialType,
  trialData = {}
) {
  try {
    const notifications = {
      trial_started: {
        title: 'Welcome! Your 7-Day Trial Has Started',
        message: `Your ${trialData.planName} trial is now active! Explore all features for the next 7 days.`,
        priority: 'high',
        actionUrl: '/dashboard',
        actionText: 'Explore Features',
      },
      trial_ending_soon: {
        title: 'Trial Ending Soon - 2 Days Left!',
        message: `Your ${trialData.planName} trial expires in 2 days. Subscribe now to keep your access.`,
        priority: 'urgent',
        actionUrl: '/pricing',
        actionText: 'Subscribe Now',
      },
      trial_ended: {
        title: 'Trial Expired',
        message: `Your ${trialData.planName} trial has ended. Subscribe to continue enjoying all features.`,
        priority: 'urgent',
        actionUrl: '/pricing',
        actionText: 'Choose Plan',
      },
    }

    const notificationConfig = notifications[trialType]
    if (!notificationConfig) {
      throw new Error(`Unknown trial notification type: ${trialType}`)
    }

    const notification = await this.create({
      recipient: userId,
      type: trialType,
      title: notificationConfig.title,
      message: notificationConfig.message,
      data: {
        trialType,
        planName: trialData.planName || 'Free Trial',
        trialEnd: trialData.trialEnd,
        trialDaysRemaining: trialData.daysRemaining || 0,
        ...trialData,
      },
      priority: notificationConfig.priority,
      actionUrl: notificationConfig.actionUrl,
      actionText: notificationConfig.actionText,
    })

    return notification
  } catch (error) {
    console.error('Error creating trial notification:', error)
    throw error
  }
}

// NEW: Static method to create subscription notification
NotificationSchema.statics.createSubscriptionNotification = async function (
  userId,
  subscriptionType,
  subscriptionData = {}
) {
  try {
    const notifications = {
      subscription_activated: {
        title: 'Subscription Activated!',
        message: `Welcome to ${subscriptionData.planName}! Your subscription is now active and ready to use.`,
        priority: 'high',
        actionUrl: '/dashboard',
        actionText: 'Get Started',
      },
      subscription_upgraded: {
        title: 'Subscription Upgraded!',
        message: `Successfully upgraded to ${subscriptionData.newPlan}! Enjoy your enhanced features.`,
        priority: 'high',
        actionUrl: '/dashboard',
        actionText: 'Explore Features',
      },
      subscription_downgraded: {
        title: 'Subscription Updated',
        message: `Your plan has been changed to ${subscriptionData.newPlan}. Changes take effect at the end of your billing period.`,
        priority: 'medium',
        actionUrl: '/pricing',
        actionText: 'View Plans',
      },
      subscription_cancelled: {
        title: 'Subscription Cancelled',
        message: `Your ${subscriptionData.planName} subscription has been cancelled. You'll continue to have access until ${subscriptionData.periodEnd}.`,
        priority: 'medium',
        actionUrl: '/pricing',
        actionText: 'Reactivate',
      },
      subscription_expired: {
        title: 'Subscription Expired',
        message: `Your ${subscriptionData.planName} subscription has expired. Renew now to restore your access.`,
        priority: 'urgent',
        actionUrl: '/pricing',
        actionText: 'Renew Now',
      },
      subscription_renewed: {
        title: 'Subscription Renewed',
        message: `Your ${subscriptionData.planName} subscription has been renewed successfully. Thank you for staying with us!`,
        priority: 'medium',
        actionUrl: '/dashboard',
        actionText: 'Continue',
      },
    }

    const notificationConfig = notifications[subscriptionType]
    if (!notificationConfig) {
      throw new Error(
        `Unknown subscription notification type: ${subscriptionType}`
      )
    }

    const notification = await this.create({
      recipient: userId,
      type: subscriptionType,
      title: notificationConfig.title,
      message: notificationConfig.message,
      data: {
        subscriptionType,
        planName: subscriptionData.planName || 'Plan',
        amount: subscriptionData.amount,
        currency: subscriptionData.currency || 'USD',
        billingCycle: subscriptionData.billingCycle,
        periodStart: subscriptionData.periodStart,
        periodEnd: subscriptionData.periodEnd,
        ...subscriptionData,
      },
      priority: notificationConfig.priority,
      actionUrl: notificationConfig.actionUrl,
      actionText: notificationConfig.actionText,
    })

    return notification
  } catch (error) {
    console.error('Error creating subscription notification:', error)
    throw error
  }
}

// NEW: Static method to create payment notification
NotificationSchema.statics.createPaymentNotification = async function (
  userId,
  paymentType,
  paymentData = {}
) {
  try {
    const amount = (paymentData.amount / 100).toFixed(2) // Convert from cents
    const currency = (paymentData.currency || 'USD').toUpperCase()

    const notifications = {
      payment_successful: {
        title: 'Payment Successful',
        message: `Your payment of $${amount} ${currency} has been processed successfully.`,
        priority: 'medium',
        actionUrl: '/billing',
        actionText: 'View Receipt',
      },
      payment_failed: {
        title: 'Payment Failed',
        message: `Your payment of $${amount} ${currency} failed. Please update your payment method to avoid service interruption.`,
        priority: 'urgent',
        actionUrl: '/billing',
        actionText: 'Update Payment',
      },
      payment_retry: {
        title: 'Payment Retry Scheduled',
        message: `We'll retry your payment of $${amount} ${currency} in 3 days. Please ensure your payment method is up to date.`,
        priority: 'high',
        actionUrl: '/billing',
        actionText: 'Update Payment',
      },
      payout_processed: {
        title: 'Payout Processed',
        message: `Your payout of $${amount} ${currency} has been processed and is on its way to your account.`,
        priority: 'high',
        actionUrl: '/earn',
        actionText: 'View Earnings',
      },
      commission_earned: {
        title: 'Commission Earned!',
        message: `You've earned $${amount} ${currency} commission from ${paymentData.referredUserName}'s subscription!`,
        priority: 'high',
        actionUrl: '/earn',
        actionText: 'View Earnings',
      },
    }

    const notificationConfig = notifications[paymentType]
    if (!notificationConfig) {
      throw new Error(`Unknown payment notification type: ${paymentType}`)
    }

    const notification = await this.create({
      recipient: userId,
      type: paymentType,
      title: notificationConfig.title,
      message: notificationConfig.message,
      data: {
        paymentType,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        paymentIntentId: paymentData.paymentIntentId,
        subscriptionId: paymentData.subscriptionId,
        planName: paymentData.planName,
        failureReason: paymentData.failureReason,
        referredUserName: paymentData.referredUserName,
        ...paymentData,
      },
      priority: notificationConfig.priority,
      actionUrl: notificationConfig.actionUrl,
      actionText: notificationConfig.actionText,
    })

    return notification
  } catch (error) {
    console.error('Error creating payment notification:', error)
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
