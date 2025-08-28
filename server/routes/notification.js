// File: routes/notification.js
import express from 'express'
import {
  clearReadNotifications,
  deleteNotification,
  getNotificationAnalytics,
  getNotificationStats,
  getUnreadCount,
  getUserNotifications,
  markAllAsRead,
  markNotificationAsRead,
  sendSystemNotification,
} from '../controllers/notification.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// All notification routes require authentication
router.use(verifyToken)

// User notification routes
router.get('/', getUserNotifications) // Get user's notifications with pagination
router.get('/unread-count', getUnreadCount) // Get unread notification count
router.get('/stats', getNotificationStats) // Get notification statistics for user
router.put('/mark-all-read', markAllAsRead) // Mark all notifications as read
router.put('/:id/read', markNotificationAsRead) // Mark specific notification as read
router.delete('/clear-read', clearReadNotifications) // Clear all read notifications
router.delete('/:id', deleteNotification) // Delete specific notification

// Admin only routes
router.use(restrictTo('admin'))
router.post('/system', sendSystemNotification) // Send system notification to users
router.get('/analytics', getNotificationAnalytics) // Get notification analytics

export default router
