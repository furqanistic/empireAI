// File: client/src/components/Layout/NotificationDrawer.jsx
import {
  useClearReadNotifications,
  useDeleteNotification,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadCount,
} from '@/hooks/useAuth'
import { formatTimeAgo } from '@/utils/timeUtils'
import { AnimatePresence, motion } from 'framer-motion'
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
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  Trophy,
  User,
  X,
  XCircle,
  Zap,
} from 'lucide-react'
import React, { useEffect } from 'react'
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

  // Auto mark all as read when drawer opens
  useEffect(() => {
    if (isOpen && unreadCount > 0 && !markAllAsReadMutation.isPending) {
      const timer = setTimeout(() => {
        markAllAsReadMutation.mutateAsync().catch((error) => {
          console.error('Error auto-marking notifications as read:', error)
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, unreadCount, markAllAsReadMutation])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'referral_join': return <User size={16} className='text-blue-400' />
      case 'referral_reward': return <DollarSign size={16} className='text-emerald-400' />
      case 'trial_started': return <Gift size={16} className='text-emerald-400' />
      case 'trial_ending_soon': return <Clock size={16} className='text-amber-400' />
      case 'trial_ended': return <AlertTriangle size={16} className='text-orange-500' />
      case 'subscription_activated': return <CheckCircle size={16} className='text-emerald-400' />
      case 'subscription_upgraded': return <TrendingUp size={16} className='text-gold' />
      case 'subscription_downgraded': return <TrendingUp size={16} className='text-orange-500 rotate-180' />
      case 'subscription_cancelled': return <XCircle size={16} className='text-red-400' />
      case 'subscription_expired': return <Calendar size={16} className='text-red-400' />
      case 'subscription_renewed': return <CheckCircle size={16} className='text-emerald-400' />
      case 'payment_successful': return <CreditCard size={16} className='text-emerald-400' />
      case 'payment_failed': return <XCircle size={16} className='text-red-400' />
      case 'payment_retry': return <Clock size={16} className='text-amber-400' />
      case 'payout_processed': return <DollarSign size={16} className='text-emerald-400' />
      case 'commission_earned': return <DollarSign size={16} className='text-gold' />
      case 'achievement': return <Trophy size={16} className='text-gold' />
      case 'system_announcement': return <Megaphone size={16} className='text-indigo-400' />
      case 'account_update': return <User size={16} className='text-blue-400' />
      case 'payment_update': return <CreditCard size={16} className='text-emerald-400' />
      case 'subscription_update': return <Crown size={16} className='text-gold' />
      case 'security_alert': return <Shield size={16} className='text-red-400' />
      case 'points': return <Zap size={16} className='text-gold' />
      default: return <Bell size={16} className='text-gray-400' />
    }
  }

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'urgent': return 'ring-1 ring-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
      case 'high': return 'ring-1 ring-gold/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]'
      default: return ''
    }
  }

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation()
    try {
      await deleteNotificationMutation.mutateAsync(notificationId)
    } catch (error) {}
  }

  const handleClearRead = async () => {
    try {
      await clearReadMutation.mutateAsync()
    } catch (error) {}
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/80 z-[100] backdrop-blur-md'
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='fixed top-0 right-0 h-full w-full md:w-[380px] bg-[#0A0A0B] border-l border-white/5 z-[110] shadow-2xl flex flex-col'
          >
            {/* Header */}
            <div className='p-5 border-b border-white/5'>
              <div className='flex items-center justify-between mb-1'>
                <div className='flex items-center gap-2.5'>
                  <div className='bg-gold/10 p-1.5 rounded-lg text-gold'>
                    <Bell size={18} />
                  </div>
                  <h2 className='text-lg font-bold text-white tracking-tight'>Notifications</h2>
                </div>
                <button
                  onClick={onClose}
                  className='h-8 w-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all'
                >
                  <X size={18} />
                </button>
              </div>
              <div className='flex items-center justify-between mt-5'>
                <p className='text-[9px] font-black tracking-widest text-gray-600 uppercase'>Recent Activity</p>
                <button
                  onClick={handleClearRead}
                  disabled={clearReadMutation.isPending || notifications.length === 0}
                  className='text-[10px] font-bold text-gold hover:text-gold/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-wider'
                >
                  {clearReadMutation.isPending ? 'Clearing...' : 'Clear All'}
                </button>
              </div>
            </div>

            {/* List */}
            <div className='flex-1 overflow-y-auto px-5 py-3 custom-scrollbar space-y-3'>
              {isLoading ? (
                <div className='flex flex-col items-center justify-center h-full gap-4 text-gray-600 font-medium'>
                  <div className='w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin' />
                  <p className='text-[10px] uppercase tracking-widest'>Accessing Feed</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-full text-center'>
                  <div className='h-16 w-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-4 text-gray-600 group'>
                    <Sparkles size={32} className='group-hover:text-gold transition-colors duration-700' />
                  </div>
                  <h3 className='text-white font-bold text-base mb-1'>All Caught Up</h3>
                  <p className='text-gray-500 text-xs max-w-[240px]'>You have no new notifications.</p>
                </div>
              ) : (
                notifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, scale: 0.98, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group relative p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 ${getPriorityClasses(notification.priority)}`}
                  >
                    <div className='flex items-start gap-3'>
                      <div className='mt-0.5 p-1.5 rounded-lg bg-white/5 text-gray-400 group-hover:text-gold transition-colors'>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center justify-between gap-2 mb-0.5'>
                          <h4 className='text-xs font-bold text-white truncate group-hover:text-gold transition-colors'>
                            {notification.title}
                          </h4>
                          <span className='text-[9px] whitespace-nowrap text-gray-600 font-bold'>
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className='text-[11px] text-gray-400 leading-relaxed mb-2 line-clamp-2'>
                          {notification.message}
                        </p>
                        
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center gap-2'>
                             <span className='px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[8px] font-black uppercase text-gray-500 tracking-wider'>
                               {notification.type.split('_').join(' ')}
                             </span>
                          </div>
                          
                          <div className='flex items-center gap-2'>
                            {notification.actionUrl && (
                              <Link
                                to={notification.actionUrl}
                                onClick={onClose}
                                className='text-[10px] font-bold text-gold hover:underline'
                              >
                                View
                              </Link>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification._id, e)}
                              className='p-1 text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100'
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Extra Data Badges */}
                        {notification.data && (
                          <div className='mt-2'>
                            {notification.type === 'payment_successful' && notification.data.amount && (
                              <span className='text-[10px] font-bold text-emerald-400'>
                                ${ (notification.data.amount / 100).toFixed(2) } Success
                              </span>
                            )}
                            {notification.type === 'commission_earned' && notification.data.rewardAmount && (
                              <span className='text-[10px] font-bold text-gold'>
                                ${notification.data.rewardAmount} Reward
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            {/* Simple Footer */}
            <div className='p-6 border-t border-white/5 text-center'>
               <p className='text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]'>System Core v2.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationDrawer
