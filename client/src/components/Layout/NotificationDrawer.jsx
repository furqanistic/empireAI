// File: client/src/components/NotificationDrawer.jsx
import {
  useClearReadNotifications,
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/useAuth'
import {
  Bell,
  Check,
  Clock,
  DollarSign,
  Star,
  Trash2,
  Trophy,
  User,
  X,
} from 'lucide-react'
import React from 'react'
import { Link } from 'react-router-dom'

const NotificationDrawer = ({ isOpen, onClose }) => {
  // Hooks
  const { data: notificationsData, isLoading } = useNotifications({
    page: 1,
    limit: 20,
  })
  const { data: unreadData } = useUnreadCount()
  const markAsReadMutation = useMarkAsRead()
  const markAllAsReadMutation = useMarkAllAsRead()
  const deleteNotificationMutation = useDeleteNotification()
  const clearReadMutation = useClearReadNotifications()

  const notifications = notificationsData?.data?.notifications || []
  const unreadCount = unreadData?.data?.unreadCount || 0

  // Helper function to get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'referral_join':
        return <User size={16} className='text-blue-500' />
      case 'referral_reward':
        return <DollarSign size={16} className='text-emerald-500' />
      case 'achievement':
        return <Trophy size={16} className='text-[#D4AF37]' />
      case 'system_announcement':
        return <Bell size={16} className='text-purple-500' />
      case 'account_update':
        return <User size={16} className='text-blue-500' />
      case 'payment_update':
        return <DollarSign size={16} className='text-emerald-500' />
      case 'security_alert':
        return <Bell size={16} className='text-red-500' />
      default:
        return <Bell size={16} className='text-gray-400' />
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markAsReadMutation.mutateAsync(notification._id)
      } catch (error) {
        console.error('Error marking notification as read:', error)
      }
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      onClose()
      // You can use React Router's navigate here if needed
    }
  }

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadMutation.mutateAsync()
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Handle delete notification
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await deleteNotificationMutation.mutateAsync(notificationId)
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  // Handle clear read notifications
  const handleClearRead = async () => {
    try {
      await clearReadMutation.mutateAsync()
    } catch (error) {
      console.error('Error clearing read notifications:', error)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-[#121214] border-l border-[#1E1E21] z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-[#1E1E21]'>
          <div className='flex items-center gap-3'>
            <Bell size={20} className='text-[#D4AF37]' />
            <h2 className='text-lg font-semibold text-[#EDEDED]'>
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className='bg-[#D4AF37] text-black text-xs px-2 py-1 rounded-full font-semibold'>
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className='p-2 rounded-lg bg-[#1A1A1C] text-[#EDEDED] hover:bg-[#1E1E21] transition-colors h-8 w-8 flex items-center justify-center'
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div className='p-4 border-b border-[#1E1E21] flex justify-between items-center'>
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
            className='text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {markAllAsReadMutation.isPending
              ? 'Marking...'
              : 'Mark all as read'}
          </button>

          <button
            onClick={handleClearRead}
            disabled={clearReadMutation.isPending}
            className='text-sm text-gray-400 hover:text-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {clearReadMutation.isPending ? 'Clearing...' : 'Clear read'}
          </button>
        </div>

        {/* Notifications List */}
        <div className='flex-1 overflow-y-auto'>
          {isLoading ? (
            <div className='flex items-center justify-center p-8'>
              <div className='w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin' />
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center p-8 text-center'>
              <Bell size={48} className='text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-[#EDEDED] mb-2'>
                No notifications
              </h3>
              <p className='text-gray-400 text-sm'>
                You're all caught up! New notifications will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 border-b border-[#1E1E21] hover:bg-[#1A1A1C] transition-colors cursor-pointer relative ${
                  !notification.isRead ? 'bg-[#1A1A1C]/50' : ''
                }`}
              >
                <div className='flex items-start gap-3'>
                  <div className='mt-1'>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <h4 className='text-sm font-medium text-[#EDEDED] truncate'>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <div className='w-2 h-2 bg-[#D4AF37] rounded-full flex-shrink-0' />
                      )}
                    </div>
                    <p className='text-xs text-gray-400 mb-2 line-clamp-2'>
                      {notification.message}
                    </p>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <Clock size={12} />
                        <span>{notification.timeAgo || 'Just now'}</span>
                      </div>
                      {notification.actionText && notification.actionUrl && (
                        <Link
                          to={notification.actionUrl}
                          onClick={(e) => {
                            e.stopPropagation()
                            onClose()
                          }}
                          className='text-xs text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium'
                        >
                          {notification.actionText}
                        </Link>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) =>
                      handleDeleteNotification(notification._id, e)
                    }
                    disabled={deleteNotificationMutation.isPending}
                    className='opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-400 transition-all'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-[#1E1E21]'>
          <button className='w-full py-2 text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium'>
            View All Notifications
          </button>
        </div>
      </div>
    </>
  )
}

export default NotificationDrawer
