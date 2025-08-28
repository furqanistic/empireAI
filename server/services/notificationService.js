// File: services/notificationService.js
import Notification from '../models/Notification.js'

class NotificationService {
  // Create a referral notification
  static async createReferralNotification(
    referrerId,
    newUser,
    rewardAmount = 10
  ) {
    try {
      const notification = await Notification.create({
        recipient: referrerId,
        type: 'referral_join',
        title: 'New Referral Joined! 🎉',
        message: `${newUser.name} just joined using your referral code. You've earned ${rewardAmount} reward points!`,
        data: {
          referredUser: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            joinedAt: newUser.createdAt,
          },
          rewardAmount,
          referralCode: newUser.referralCode,
        },
        priority: 'high',
        actionUrl: '/invite',
        actionText: 'View Referrals',
      })

      console.log(`✅ Referral notification created for user ${referrerId}`)
      return notification
    } catch (error) {
      console.error('❌ Error creating referral notification:', error)
      throw error
    }
  }

  // Create referral reward notification (when someone earns money from referrals)
  static async createReferralRewardNotification(
    userId,
    amount,
    referredUserName
  ) {
    try {
      const notification = await Notification.create({
        recipient: userId,
        type: 'referral_reward',
        title: 'Referral Commission Earned! 💰',
        message: `You've earned $${amount} commission from ${referredUserName}'s activity!`,
        data: {
          rewardAmount: amount,
          referredUserName,
          currency: 'USD',
        },
        priority: 'high',
        actionUrl: '/earn',
        actionText: 'View Earnings',
      })

      console.log(`✅ Referral reward notification created for user ${userId}`)
      return notification
    } catch (error) {
      console.error('❌ Error creating referral reward notification:', error)
      throw error
    }
  }

  // Create account update notification
  static async createAccountUpdateNotification(userId, updateType, details) {
    try {
      const messages = {
        profile_updated: 'Your profile has been updated successfully.',
        password_changed: 'Your password has been changed successfully.',
        email_verified: 'Your email address has been verified.',
        subscription_upgraded: `Your subscription has been upgraded to ${details.newPlan}.`,
        subscription_cancelled: 'Your subscription has been cancelled.',
      }

      const notification = await Notification.create({
        recipient: userId,
        type: 'account_update',
        title: 'Account Updated',
        message: messages[updateType] || 'Your account has been updated.',
        data: {
          updateType,
          ...details,
        },
        priority: 'medium',
        actionUrl: '/profile',
        actionText: 'View Profile',
      })

      console.log(`✅ Account update notification created for user ${userId}`)
      return notification
    } catch (error) {
      console.error('❌ Error creating account update notification:', error)
      throw error
    }
  }

  // Create payment notification
  static async createPaymentNotification(
    userId,
    paymentType,
    amount,
    details = {}
  ) {
    try {
      const messages = {
        payment_received: `Payment of $${amount} has been received successfully.`,
        payout_processed: `Your payout of $${amount} has been processed.`,
        payment_failed: `Your payment of $${amount} failed. Please update your payment method.`,
        subscription_renewed: `Your subscription has been renewed. Payment of $${amount} processed.`,
      }

      const priority = paymentType === 'payment_failed' ? 'urgent' : 'high'

      const notification = await Notification.create({
        recipient: userId,
        type: 'payment_update',
        title: 'Payment Update',
        message: messages[paymentType] || `Payment update: $${amount}`,
        data: {
          paymentType,
          amount,
          currency: 'USD',
          ...details,
        },
        priority,
        actionUrl: '/earn',
        actionText: 'View Payments',
      })

      console.log(`✅ Payment notification created for user ${userId}`)
      return notification
    } catch (error) {
      console.error('❌ Error creating payment notification:', error)
      throw error
    }
  }

  // Create system announcement notification
  static async createSystemAnnouncement(
    recipientIds,
    title,
    message,
    options = {}
  ) {
    try {
      const {
        priority = 'medium',
        actionUrl,
        actionText,
        expiresAt,
        data = {},
      } = options

      const notifications = []
      const recipients = Array.isArray(recipientIds)
        ? recipientIds
        : [recipientIds]

      for (const recipientId of recipients) {
        const notification = await Notification.create({
          recipient: recipientId,
          type: 'system_announcement',
          title,
          message,
          data,
          priority,
          actionUrl,
          actionText,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        })
        notifications.push(notification)
      }

      console.log(
        `✅ System announcement sent to ${notifications.length} users`
      )
      return notifications
    } catch (error) {
      console.error('❌ Error creating system announcement:', error)
      throw error
    }
  }

  // Create security alert notification
  static async createSecurityAlert(userId, alertType, details = {}) {
    try {
      const messages = {
        login_new_device: 'New login detected from an unrecognized device.',
        password_reset_requested:
          'A password reset has been requested for your account.',
        suspicious_activity: 'Suspicious activity detected on your account.',
        account_locked:
          'Your account has been temporarily locked for security reasons.',
      }

      const notification = await Notification.create({
        recipient: userId,
        type: 'security_alert',
        title: 'Security Alert',
        message: messages[alertType] || 'Security alert for your account.',
        data: {
          alertType,
          timestamp: new Date(),
          ...details,
        },
        priority: 'urgent',
        actionUrl: '/profile',
        actionText: 'Secure Account',
      })

      console.log(`✅ Security alert notification created for user ${userId}`)
      return notification
    } catch (error) {
      console.error('❌ Error creating security alert notification:', error)
      throw error
    }
  }

  // Create achievement notification
  static async createAchievementNotification(
    userId,
    achievementType,
    details = {}
  ) {
    try {
      const messages = {
        first_referral: "Congratulations! You've made your first referral!",
        milestone_5_referrals: "Amazing! You've reached 5 referrals!",
        milestone_10_referrals: "Incredible! You've reached 10 referrals!",
        milestone_50_referrals: "Outstanding! You've reached 50 referrals!",
        milestone_100_referrals: "Legendary! You've reached 100 referrals!",
        first_commission: 'Congratulations on earning your first commission!',
        top_referrer: "You're now one of our top referrers!",
      }

      const notification = await Notification.create({
        recipient: userId,
        type: 'achievement',
        title: 'Achievement Unlocked! 🏆',
        message:
          messages[achievementType] || "You've unlocked a new achievement!",
        data: {
          achievementType,
          ...details,
        },
        priority: 'high',
        actionUrl: '/invite',
        actionText: 'View Achievements',
      })

      console.log(`✅ Achievement notification created for user ${userId}`)
      return notification
    } catch (error) {
      console.error('❌ Error creating achievement notification:', error)
      throw error
    }
  }

  // Bulk create notifications for multiple users
  static async createBulkNotifications(recipients, notificationData) {
    try {
      const notifications = []

      for (const recipientId of recipients) {
        const notification = await Notification.create({
          recipient: recipientId,
          ...notificationData,
        })
        notifications.push(notification)
      }

      console.log(
        `✅ Bulk notifications created for ${notifications.length} users`
      )
      return notifications
    } catch (error) {
      console.error('❌ Error creating bulk notifications:', error)
      throw error
    }
  }

  // Get notification statistics
  static async getNotificationStats(timeframe = 'week') {
    try {
      let dateRange
      const now = new Date()

      switch (timeframe) {
        case 'day':
          dateRange = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      }

      const stats = await Notification.aggregate([
        {
          $match: {
            createdAt: { $gte: dateRange },
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            readCount: {
              $sum: { $cond: [{ $eq: ['$isRead', true] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            type: '$_id',
            totalSent: '$count',
            totalRead: '$readCount',
            readRate: {
              $multiply: [{ $divide: ['$readCount', '$count'] }, 100],
            },
          },
        },
        { $sort: { totalSent: -1 } },
      ])

      return stats
    } catch (error) {
      console.error('❌ Error getting notification stats:', error)
      throw error
    }
  }

  // Clean up old notifications (can be run as a cron job)
  static async cleanupOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await Notification.updateMany(
        {
          createdAt: { $lt: cutoffDate },
          isRead: true,
          isDeleted: false,
        },
        {
          $set: { isDeleted: true },
        }
      )

      console.log(`🧹 Cleaned up ${result.modifiedCount} old notifications`)
      return result
    } catch (error) {
      console.error('❌ Error cleaning up notifications:', error)
      throw error
    }
  }
}

export default NotificationService
