// File: controllers/notification.js
import { createError } from '../error.js'
import Notification from '../models/Notification.js'

// Get user's notifications with pagination and filtering
export const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 20, type, isRead, priority } = req.query

    const options = {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 50), // Max 50 notifications per request
      type,
      isRead: isRead !== undefined ? isRead === 'true' : null,
      priority,
    }

    const result = await Notification.getUserNotifications(userId, options)

    res.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    console.error('Error in getUserNotifications:', error)
    next(error)
  }
}

// Get unread notification count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isDeleted: false,
    })

    res.status(200).json({
      status: 'success',
      data: {
        unreadCount,
      },
    })
  } catch (error) {
    console.error('Error in getUnreadCount:', error)
    next(error)
  }
}

// Mark a specific notification as read
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
      isDeleted: false,
    })

    if (!notification) {
      return next(createError(404, 'Notification not found'))
    }

    await notification.markAsRead()

    res.status(200).json({
      status: 'success',
      data: {
        notification,
      },
    })
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error)
    next(error)
  }
}

// Mark all notifications as read for a user
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await Notification.updateMany(
      {
        recipient: userId,
        isRead: false,
        isDeleted: false,
      },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      }
    )

    res.status(200).json({
      status: 'success',
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} notifications marked as read`,
      },
    })
  } catch (error) {
    console.error('Error in markAllAsRead:', error)
    next(error)
  }
}

// Delete a specific notification (soft delete)
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: userId,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
        },
      },
      { new: true }
    )

    if (!notification) {
      return next(createError(404, 'Notification not found'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Notification deleted successfully',
      },
    })
  } catch (error) {
    console.error('Error in deleteNotification:', error)
    next(error)
  }
}

// Clear all read notifications for a user
export const clearReadNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await Notification.updateMany(
      {
        recipient: userId,
        isRead: true,
        isDeleted: false,
      },
      {
        $set: {
          isDeleted: true,
        },
      }
    )

    res.status(200).json({
      status: 'success',
      data: {
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} read notifications cleared`,
      },
    })
  } catch (error) {
    console.error('Error in clearReadNotifications:', error)
    next(error)
  }
}

// Get notification statistics for a user
export const getNotificationStats = async (req, res, next) => {
  try {
    const userId = req.user.id

    const stats = await Notification.aggregate([
      {
        $match: {
          recipient: userId,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0],
            },
          },
          byType: {
            $push: {
              type: '$type',
              isRead: '$isRead',
            },
          },
          byPriority: {
            $push: {
              priority: '$priority',
              isRead: '$isRead',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          unread: 1,
          read: { $subtract: ['$total', '$unread'] },
          typeBreakdown: {
            $reduce: {
              input: '$byType',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.type',
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $getField: {
                                      field: '$$this.type',
                                      input: '$$value',
                                    },
                                  },
                                  0,
                                ],
                              },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
          priorityBreakdown: {
            $reduce: {
              input: '$byPriority',
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: '$$this.priority',
                          v: {
                            $add: [
                              {
                                $ifNull: [
                                  {
                                    $getField: {
                                      field: '$$this.priority',
                                      input: '$$value',
                                    },
                                  },
                                  0,
                                ],
                              },
                              1,
                            ],
                          },
                        },
                      ],
                    ],
                  },
                ],
              },
            },
          },
        },
      },
    ])

    const result = stats[0] || {
      total: 0,
      unread: 0,
      read: 0,
      typeBreakdown: {},
      priorityBreakdown: {},
    }

    res.status(200).json({
      status: 'success',
      data: {
        stats: result,
      },
    })
  } catch (error) {
    console.error('Error in getNotificationStats:', error)
    next(error)
  }
}

// Admin function to send system notification to users
export const sendSystemNotification = async (req, res, next) => {
  try {
    const {
      recipientIds,
      title,
      message,
      type = 'system_announcement',
      priority = 'medium',
      actionUrl,
      actionText,
      expiresAt,
    } = req.body

    // Validate required fields
    if (!title || !message) {
      return next(createError(400, 'Title and message are required'))
    }

    if (
      !recipientIds ||
      !Array.isArray(recipientIds) ||
      recipientIds.length === 0
    ) {
      return next(createError(400, 'At least one recipient ID is required'))
    }

    const notificationData = {
      type,
      title,
      message,
      priority,
      actionUrl,
      actionText,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    }

    const notifications = await Notification.createSystemNotification(
      recipientIds,
      notificationData
    )

    res.status(201).json({
      status: 'success',
      data: {
        message: `System notification sent to ${notifications.length} users`,
        notifications,
      },
    })
  } catch (error) {
    console.error('Error in sendSystemNotification:', error)
    next(error)
  }
}

// Admin function to get notification analytics
export const getNotificationAnalytics = async (req, res, next) => {
  try {
    const { timeframe = 'week' } = req.query

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

    const analytics = await Notification.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            type: '$type',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt',
              },
            },
          },
          count: { $sum: 1 },
          readCount: {
            $sum: {
              $cond: [{ $eq: ['$isRead', true] }, 1, 0],
            },
          },
        },
      },
      {
        $group: {
          _id: '$_id.type',
          totalSent: { $sum: '$count' },
          totalRead: { $sum: '$readCount' },
          dailyData: {
            $push: {
              date: '$_id.date',
              sent: '$count',
              read: '$readCount',
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          totalSent: 1,
          totalRead: 1,
          readRate: {
            $cond: [
              { $gt: ['$totalSent', 0] },
              {
                $multiply: [{ $divide: ['$totalRead', '$totalSent'] }, 100],
              },
              0,
            ],
          },
          dailyData: 1,
        },
      },
      { $sort: { totalSent: -1 } },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        analytics,
        timeframe,
      },
    })
  } catch (error) {
    console.error('Error in getNotificationAnalytics:', error)
    next(error)
  }
}
