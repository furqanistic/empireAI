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
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  Gift,
  Lock,
  Megaphone,
  Shield,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  X,
  XCircle,
  Zap,
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

  // Helper function to get notification icon with updated subscription types
  const getNotificationIcon = (type) => {
    switch (type) {
      // Referral notifications
      case 'referral_join':
        return <User size={16} className='text-blue-500' />
      case 'referral_reward':
        return <DollarSign size={16} className='text-emerald-500' />

      // Trial notifications
      case 'trial_started':
        return <Gift size={16} className='text-green-500' />
      case 'trial_ending_soon':
        return <Clock size={16} className='text-yellow-500' />
      case 'trial_ended':
        return <AlertTriangle size={16} className='text-orange-500' />

      // Subscription notifications
      case 'subscription_activated':
        return <CheckCircle size={16} className='text-emerald-500' />
      case 'subscription_upgraded':
        return <TrendingUp size={16} className='text-[#D4AF37]' />
      case 'subscription_downgraded':
        return (
          <TrendingUp
            size={16}
            className='text-orange-500 transform rotate-180'
          />
        )
      case 'subscription_cancelled':
        return <XCircle size={16} className='text-red-500' />
      case 'subscription_expired':
        return <Calendar size={16} className='text-red-500' />
      case 'subscription_renewed':
        return <CheckCircle size={16} className='text-green-500' />

      // Payment notifications
      case 'payment_successful':
        return <CreditCard size={16} className='text-emerald-500' />
      case 'payment_failed':
        return <XCircle size={16} className='text-red-500' />
      case 'payment_retry':
        return <Clock size={16} className='text-yellow-500' />
      case 'payout_processed':
        return <DollarSign size={16} className='text-emerald-500' />
      case 'commission_earned':
        return <DollarSign size={16} className='text-[#D4AF37]' />

      // General notifications
      case 'achievement':
        return <Trophy size={16} className='text-[#D4AF37]' />
      case 'system_announcement':
        return <Megaphone size={16} className='text-purple-500' />
      case 'account_update':
        return <User size={16} className='text-blue-500' />
      case 'payment_update':
        return <CreditCard size={16} className='text-emerald-500' />
      case 'subscription_update':
        return <Crown size={16} className='text-[#D4AF37]' />
      case 'security_alert':
        return <Shield size={16} className='text-red-500' />
      case 'points':
        return <Zap size={16} className='text-yellow-500' />

      default:
        return <Bell size={16} className='text-gray-400' />
    }
  }

  // Helper function to get priority styling
  const getPriorityStyles = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-red-500 bg-red-500/5'
      case 'high':
        return 'border-l-4 border-[#D4AF37] bg-[#D4AF37]/5'
      case 'medium':
        return 'border-l-4 border-blue-500 bg-blue-500/5'
      case 'low':
        return 'border-l-4 border-gray-400 bg-gray-400/5'
      default:
        return ''
    }
  }

  // Helper function to format notification message for display
  const formatNotificationMessage = (notification) => {
    const message = notification.message

    // Truncate long messages
    if (message.length > 120) {
      return message.substring(0, 120) + '...'
    }

    return message
  }

  // Helper function to get notification category for grouping
  const getNotificationCategory = (type) => {
    const categories = {
      // Subscription related
      trial_started: 'subscription',
      trial_ending_soon: 'subscription',
      trial_ended: 'subscription',
      subscription_activated: 'subscription',
      subscription_upgraded: 'subscription',
      subscription_downgraded: 'subscription',
      subscription_cancelled: 'subscription',
      subscription_expired: 'subscription',
      subscription_renewed: 'subscription',
      subscription_update: 'subscription',

      // Payment related
      payment_successful: 'payment',
      payment_failed: 'payment',
      payment_retry: 'payment',
      payout_processed: 'payment',
      commission_earned: 'payment',
      payment_update: 'payment',

      // Referral related
      referral_join: 'referral',
      referral_reward: 'referral',

      // Other
      achievement: 'achievement',
      system_announcement: 'system',
      account_update: 'account',
      security_alert: 'security',
      points: 'points',
    }

    return categories[type] || 'general'
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
                className={`group p-4 border-b border-[#1E1E21] hover:bg-[#1A1A1C] transition-colors cursor-pointer relative ${
                  !notification.isRead ? 'bg-[#1A1A1C]/50' : ''
                } ${getPriorityStyles(notification.priority)}`}
              >
                <div className='flex items-start gap-3'>
                  <div className='mt-1 flex-shrink-0'>
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
                      {notification.priority === 'urgent' && (
                        <div className='text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium'>
                          URGENT
                        </div>
                      )}
                    </div>
                    <p className='text-xs text-gray-400 mb-2 leading-relaxed'>
                      {formatNotificationMessage(notification)}
                    </p>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 text-xs text-gray-500'>
                        <Clock size={12} />
                        <span>{notification.timeAgo || 'Just now'}</span>
                        {/* Show notification category tag */}
                        <span className='bg-gray-600 text-gray-300 px-1 py-0.5 rounded text-[10px] uppercase font-medium'>
                          {getNotificationCategory(notification.type)}
                        </span>
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
                    {/* Show additional data for certain notification types */}
                    {notification.data && (
                      <div className='mt-2'>
                        {notification.type === 'payment_successful' &&
                          notification.data.amount && (
                            <div className='text-xs text-emerald-400 font-medium'>
                              Amount: $
                              {(notification.data.amount / 100).toFixed(2)}{' '}
                              {notification.data.currency?.toUpperCase() ||
                                'USD'}
                            </div>
                          )}
                        {notification.type === 'commission_earned' &&
                          notification.data.rewardAmount && (
                            <div className='text-xs text-[#D4AF37] font-medium'>
                              Commission: ${notification.data.rewardAmount} from{' '}
                              {notification.data.referredUserName}
                            </div>
                          )}
                        {(notification.type === 'trial_ending_soon' ||
                          notification.type === 'trial_ended') &&
                          notification.data.trialDaysRemaining !==
                            undefined && (
                            <div className='text-xs text-yellow-400 font-medium'>
                              {notification.data.trialDaysRemaining > 0
                                ? `${notification.data.trialDaysRemaining} days remaining`
                                : 'Trial expired'}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) =>
                      handleDeleteNotification(notification._id, e)
                    }
                    disabled={deleteNotificationMutation.isPending}
                    className='opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-400 transition-all flex-shrink-0'
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
      </div>
    </>
  )
}

export default NotificationDrawer
