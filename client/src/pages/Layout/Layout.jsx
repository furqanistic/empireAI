// File: client/src/pages/Layout/Layout.jsx
import {
  Bell,
  Bot,
  Box,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Crown,
  DollarSign,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  Star,
  TrendingUp,
  User,
  User2,
  Users,
  X,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { useCurrentUser, useLogout } from '../../hooks/useAuth.js'
import { selectIsAdmin } from '../../redux/userSlice.js'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Redux state
  const currentUser = useCurrentUser()
  const isAdmin = useSelector(selectIsAdmin)
  const logoutMutation = useLogout()

  // Get current location to determine active menu item
  const location = useLocation()

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home size={18} />,
      path: '/dashboard',
    },
    {
      id: 'ai-builder',
      label: 'AI Builder',
      icon: <Bot size={18} />,
      path: '/build',
      badge: 'START HERE',
      badgeColor: 'bg-emerald-500',
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: <DollarSign size={18} />,
      path: '/earn',
    },
    {
      id: 'affiliate-army',
      label: 'Affiliate Army',
      icon: <Users size={18} />,
      path: '/invite',
      badge: 'Join',
      badgeColor: 'bg-blue-500',
    },
  ]

  // Example advanced item
  const advancedItems = [
    {
      id: 'products',
      label: 'Products',
      icon: <Box size={18} />,
      path: '/product',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User2 size={18} />,
      path: '/profile',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: <Crown size={18} />,
      path: '/pricing',
    },
  ]

  const notifications = [
    {
      id: 1,
      title: 'New Affiliate Commission',
      message: 'You earned $127.50 from your referral',
      time: '2 min ago',
      icon: <DollarSign size={16} className='text-emerald-500' />,
      unread: true,
    },
    {
      id: 2,
      title: 'AI Builder Update',
      message: 'New templates are now available',
      time: '1 hour ago',
      icon: <Bot size={16} className='text-blue-500' />,
      unread: true,
    },
    {
      id: 3,
      title: 'Monthly Report Ready',
      message: 'Your performance report is ready to view',
      time: '3 hours ago',
      icon: <TrendingUp size={16} className='text-[#D4AF37]' />,
      unread: false,
    },
    {
      id: 4,
      title: 'System Maintenance',
      message: 'Scheduled maintenance tonight at 2 AM',
      time: '1 day ago',
      icon: <Settings size={16} className='text-gray-400' />,
      unread: false,
    },
  ]

  // Function to check if menu item is active
  const isActive = (itemPath) => {
    return location.pathname === itemPath
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      // Redirect to auth page
      window.location.href = '/auth'
    } catch (error) {
      console.error('Logout error:', error)
      // Even if API call fails, redirect to auth (Redux state is cleared)
      window.location.href = '/auth'
    }
  }

  const MenuItem = ({ item, section }) => {
    const active = isActive(item.path)

    return (
      <li>
        <Link to={item.path || '#'}>
          <button
            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
              active
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : item.premium
                ? 'text-gray-500 hover:text-gray-400 hover:bg-[#1A1A1C]'
                : 'text-[#EDEDED] hover:bg-[#1A1A1C] hover:text-white'
            }`}
            disabled={item.premium}
          >
            <span className={`${active ? 'text-black' : ''}`}>{item.icon}</span>
            <span className='flex-1 text-left truncate'>{item.label}</span>

            {item.badge && (
              <span
                className={`${item.badgeColor} text-white text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide`}
              >
                {item.badge}
              </span>
            )}

            {item.premium && (
              <Star
                size={14}
                className='text-[#D4AF37] opacity-60 group-hover:opacity-80'
                fill='currentColor'
              />
            )}
          </button>
        </Link>
      </li>
    )
  }

  const NotificationDrawer = () => (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          isNotificationOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsNotificationOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-96 bg-[#121214] border-l border-[#1E1E21] z-50 transform transition-transform duration-300 ease-in-out ${
          isNotificationOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-[#1E1E21]'>
          <div className='flex items-center gap-3'>
            <Bell size={20} className='text-[#D4AF37]' />
            <h2 className='text-lg font-semibold text-[#EDEDED]'>
              Notifications
            </h2>
            <span className='bg-[#D4AF37] text-black text-xs px-2 py-1 rounded-full font-semibold'>
              {notifications.filter((n) => n.unread).length}
            </span>
          </div>
          <button
            onClick={() => setIsNotificationOpen(false)}
            className='p-2 rounded-lg bg-[#1A1A1C] text-[#EDEDED] hover:bg-[#1E1E21] transition-colors h-8 w-8 flex items-center justify-center'
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div className='p-4 border-b border-[#1E1E21]'>
          <button className='text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 font-medium'>
            Mark all as read
          </button>
        </div>

        {/* Notifications List */}
        <div className='flex-1 overflow-y-auto'>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-b border-[#1E1E21] hover:bg-[#1A1A1C] transition-colors cursor-pointer ${
                notification.unread ? 'bg-[#1A1A1C]/50' : ''
              }`}
            >
              <div className='flex items-start gap-3'>
                <div className='mt-1'>{notification.icon}</div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 mb-1'>
                    <h4 className='text-sm font-medium text-[#EDEDED] truncate'>
                      {notification.title}
                    </h4>
                    {notification.unread && (
                      <div className='w-2 h-2 bg-[#D4AF37] rounded-full flex-shrink-0' />
                    )}
                  </div>
                  <p className='text-xs text-gray-400 mb-2 line-clamp-2'>
                    {notification.message}
                  </p>
                  <div className='flex items-center gap-2 text-xs text-gray-500'>
                    <Clock size={12} />
                    <span>{notification.time}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div className='px-4 py-6 border-b border-[#1E1E21]'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='text-[#D4AF37] p-2 rounded-lg bg-[#D4AF37]/10'>
              <svg viewBox='0 0 24 24' fill='currentColor' className='w-6 h-6'>
                <path d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z' />
              </svg>
            </div>
            <div>
              <h1 className='text-lg font-bold text-[#D4AF37] leading-none'>
                Ascend AI
              </h1>
              <p className='text-[10px] text-gray-400 uppercase tracking-wider font-semibold'>
                EMPIRE
              </p>
            </div>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className='md:hidden p-2 rounded-lg bg-[#1A1A1C] text-[#EDEDED] hover:bg-[#1E1E21] transition-colors h-8 w-8 flex items-center justify-center'
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <nav className='flex-1 px-3 py-6 space-y-8 overflow-y-auto'>
        {/* Essential Tools */}
        <div>
          <h3 className='text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-4 px-3'>
            Essential Tools
          </h3>
          <ul className='space-y-1'>
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} section='essential' />
            ))}
          </ul>
        </div>

        {/* Advanced Tools */}
        <div>
          <h3 className='text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-4 px-3'>
            Advanced Tools
          </h3>
          <ul className='space-y-1'>
            {advancedItems.map((item) => (
              <MenuItem key={item.id} item={item} section='advanced' />
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className='border-t border-[#1E1E21] p-3'>
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className='w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#1A1A1C] text-[#EDEDED] hover:bg-[#1E1E21] transition-colors duration-200 text-sm font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {logoutMutation.isPending ? (
            <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
          ) : (
            <LogOut size={16} />
          )}
          {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </>
  )

  // If user is not authenticated, redirect to auth
  if (!currentUser) {
    window.location.href = '/auth'
    return null
  }

  return (
    <div className='flex h-screen bg-[#0B0B0C] text-[#EDEDED]'>
      {/* Top Bar */}
      <header className='fixed top-0 left-0 right-0 z-20 h-14 md:h-16 bg-[#0B0B0C]/95 backdrop-blur-sm border-b border-[#1E1E21] flex items-center px-4 md:px-6'>
        <div className='flex items-center justify-between w-full max-w-screen-2xl mx-auto'>
          {/* Left Section */}
          <div className='flex items-center gap-4'>
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='md:hidden p-2 rounded-lg bg-[#121214] border border-[#1E1E21] text-[#EDEDED] hover:bg-[#1A1A1C] transition-colors h-9 w-9 flex items-center justify-center'
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Right Section */}
          <div className='flex items-center gap-3'>
            {/* Notifications */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className='relative p-2 rounded-lg bg-[#121214] border border-[#1E1E21] text-[#EDEDED] hover:bg-[#1A1A1C] transition-colors h-9 w-9 flex items-center justify-center'
            >
              <Bell size={22} />
              {notifications.filter((n) => n.unread).length > 0 && (
                <span className='absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full text-black text-[10px] font-bold flex items-center justify-center'>
                  {notifications.filter((n) => n.unread).length}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div className='hidden md:flex items-center gap-3'>
              <div className='flex items-center gap-3 px-3 py-1.5 rounded-lg bg-[#121214] border border-[#1E1E21] hover:bg-[#1A1A1C] transition-colors cursor-pointer'>
                <div className='w-9 h-9 rounded-full bg-[#D4AF37] flex items-center justify-center'>
                  <User size={22} className='text-black' />
                </div>
                <div className='text-left'>
                  <p className='font-medium text-sm leading-none'>
                    {currentUser?.name || 'User'}
                  </p>
                  <div className='flex items-center gap-1.5 mt-1'>
                    <Star
                      size={10}
                      className='text-[#D4AF37]'
                      fill='currentColor'
                    />
                    <span className='text-[#D4AF37] font-semibold text-[10px] uppercase tracking-wider'>
                      {isAdmin ? 'ADMIN' : 'FREE PLAN'}
                    </span>
                  </div>
                </div>
                <ChevronDown size={14} className='text-gray-400' />
              </div>
            </div>

            {/* Mobile User Info */}
            <div className='md:hidden flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center'>
                <User size={22} className='text-black' />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black/75 z-20 md:hidden backdrop-blur-sm'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-30 h-full w-64 border-r border-[#1E1E21] bg-[#121214] transform transition-transform duration-300 ease-in-out
          ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}
      >
        <div className='h-full flex flex-col'>
          <SidebarContent />
        </div>
      </aside>

      {/* Notification Drawer */}
      <NotificationDrawer />

      {/* Main Content */}
      <main className='flex-1 overflow-auto pt-14 md:pt-16 bg-[#0B0B0C]'>
        {children}
      </main>
    </div>
  )
}

export default Layout
