// File: client/src/services/notificationServices.js
import axiosInstance from '../config/config.js'

export const notificationService = {
  // Get user notifications with pagination and filters
  getNotifications: async (params = {}) => {
    const response = await axiosInstance.get('/notifications', { params })
    return response.data
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/notifications/unread-count')
    return response.data
  },

  // Get notification statistics
  getNotificationStats: async () => {
    const response = await axiosInstance.get('/notifications/stats')
    return response.data
  },

  // Mark specific notification as read
  markAsRead: async (notificationId) => {
    const response = await axiosInstance.put(
      `/notifications/${notificationId}/read`
    )
    return response.data
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axiosInstance.put('/notifications/mark-all-read')
    return response.data
  },

  // Delete specific notification
  deleteNotification: async (notificationId) => {
    const response = await axiosInstance.delete(
      `/notifications/${notificationId}`
    )
    return response.data
  },

  // Clear all read notifications
  clearReadNotifications: async () => {
    const response = await axiosInstance.delete('/notifications/clear-read')
    return response.data
  },
}
