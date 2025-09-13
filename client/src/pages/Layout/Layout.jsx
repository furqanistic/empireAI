// File: client/src/pages/Layout/Layout.jsx - UPDATED WITH COPYRIGHT & TRADEMARK NOTICES

import AscendAIChatbot from '@/components/Layout/AscendAIChatbot.jsx'
import NotificationDrawer from '@/components/Layout/NotificationDrawer.jsx'
import {
  Bell,
  Bot,
  Box,
  CreditCard,
  Crown,
  CrownIcon,
  DollarSign,
  Gem,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  PanelLeft,
  PanelRight,
  Shield,
  Star,
  User,
  User2,
  Users,
  X,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'
import { FaDiscord } from 'react-icons/fa'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import {
  useCurrentUser,
  useLogout,
  usePointsStatus,
} from '../../hooks/useAuth.js'
import { useUnreadCount } from '../../hooks/useNotifications.js'
import { selectIsAdmin } from '../../redux/userSlice.js'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [showText, setShowText] = useState(true)

  // Redux state
  const currentUser = useCurrentUser()
  const isAdmin = useSelector(selectIsAdmin)
  const logoutMutation = useLogout()

  // Notification data
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.data?.unreadCount || 0

  // Points data
  const { data: pointsData, isLoading: pointsLoading } = usePointsStatus()
  const userPoints = pointsData?.data?.points || 0

  // Get current location to determine active menu item
  const location = useLocation()

  const CustomCrown = ({ size = 16, className = '' }) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 256 256'
      width='1em'
      height='1em'
      className={className}
    >
      <path
        fill='currentColor'
        d='M248 80a28 28 0 1 0-51.12 15.77l-26.79 33L146 73.4a28 28 0 1 0-36.06 0l-24.03 55.34l-26.79-33a28 28 0 1 0-26.6 12L47 194.63A16 16 0 0 0 62.78 208h130.44A16 16 0 0 0 209 194.63l14.47-86.85A28 28 0 0 0 248 80M128 40a12 12 0 1 1-12 12a12 12 0 0 1 12-12M24 80a12 12 0 1 1 12 12a12 12 0 0 1-12-12m196 12a12 12 0 1 1 12-12a12 12 0 0 1-12 12'
      />
    </svg>
  )

  const AIIcon = ({ size = 16, className = '' }) => (
    <div className={`relative ${className}`}>
      <div className='relative flex items-center justify-center'>
        <MessageCircle size={size} className='text-current' />

        {/* Crown with glow */}
        <div className='absolute -top-2.25 right-0.5'>
          <CustomCrown
            size={size * 0.6}
            className='relative text-current z-10'
          />
        </div>
      </div>
    </div>
  )

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
      id: 'ai-chat',
      label: 'AI Assistant',
      icon: <AIIcon size={18} />,
      path: '/chat',
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
    {
      id: 'paid',
      label: 'Get Paid',
      icon: <CreditCard size={18} />,
      path: '/payout',
      badgeColor: 'bg-blue-500',
    },
  ]

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
      icon: <Gem size={18} />,
      path: '/pricing',
    },
    ...(isAdmin
      ? [
          {
            id: 'admin',
            label: 'Admin Panel',
            icon: <Shield size={18} />,
            path: '/admin',
            badge: 'ADMIN',
            badgeColor: 'bg-red-500',
          },
        ]
      : []),
  ]

  const communityItems = [
    {
      id: 'discord',
      label: 'Discord Server',
      icon: <FaDiscord size={18} />,
      path: 'https://discord.gg/t7r94BZUXv', // Replace with your actual Discord invite link
      external: true,
      badge: 'JOIN',
      badgeColor: 'bg-indigo-500',
    },
  ]

  // Function to check if menu item is active
  const isActive = (itemPath) => {
    return location.pathname === itemPath
  }

  // Handle sidebar toggle with text animation
  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      // Closing sidebar - hide text immediately
      setShowText(false)
      setSidebarOpen(false)
    } else {
      // Opening sidebar - show sidebar first, then text after animation
      setSidebarOpen(true)
      setTimeout(() => {
        setShowText(true)
      }, 200) // Delay text appearance until sidebar animation is mostly complete
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      window.location.href = '/auth'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/auth'
    }
  }

  const MenuItem = ({ item, section }) => {
    const active = isActive(item.path)

    // Handle external links (like Discord)
    if (item.external) {
      return (
        <li>
          <a
            href={item.path}
            target='_blank'
            rel='noopener noreferrer'
            className='block'
            title={!sidebarOpen ? item.label : undefined}
          >
            <button
              className={`group w-full flex items-center ${
                sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
              } py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                item.premium
                  ? 'text-gray-500 hover:text-gray-400 hover:bg-[#1A1A1C]'
                  : 'text-[#EDEDED] hover:bg-[#1A1A1C] hover:text-white'
              }`}
              disabled={item.premium}
            >
              <span>{item.icon}</span>

              {showText && sidebarOpen && (
                <>
                  <span className='flex-1 text-left truncate'>
                    {item.label}
                  </span>

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
                </>
              )}
            </button>
          </a>
        </li>
      )
    }

    // Handle internal links
    return (
      <li>
        <Link to={item.path || '#'}>
          <button
            className={`group w-full flex items-center ${
              sidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'
            } py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
              active
                ? 'bg-[#D4AF37] text-black shadow-sm'
                : item.premium
                ? 'text-gray-500 hover:text-gray-400 hover:bg-[#1A1A1C]'
                : 'text-[#EDEDED] hover:bg-[#1A1A1C] hover:text-white'
            }`}
            disabled={item.premium}
            title={!sidebarOpen ? item.label : undefined}
          >
            <span className={`${active ? 'text-black' : ''}`}>{item.icon}</span>

            {showText && sidebarOpen && (
              <>
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
              </>
            )}
          </button>
        </Link>
      </li>
    )
  }

  const SidebarContent = () => (
    <>
      {/* Logo Section */}
      <div
        className={`${
          sidebarOpen ? 'px-4 py-6' : 'px-2 py-6'
        } border-b border-[#1E1E21]`}
      >
        <div className='flex items-center justify-between'>
          <div
            className={`flex items-center ${
              sidebarOpen ? 'gap-3' : 'justify-center w-full'
            }`}
          >
            <div className='text-[#D4AF37] p-2 rounded-lg bg-[#D4AF37]/10'>
              <CrownIcon />
            </div>
            {showText && sidebarOpen && (
              <div>
                <h1 className='text-lg font-bold text-[#D4AF37] leading-none'>
                  Ascend AI
                </h1>
                <p className='text-[10px] text-gray-400 uppercase tracking-wider font-semibold'>
                  EMPIRE
                </p>
              </div>
            )}
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

      <nav
        className={`flex-1 ${
          sidebarOpen ? 'px-3' : 'px-1'
        } py-6 space-y-8 overflow-y-auto`}
      >
        {/* Essential Tools */}
        <div>
          {showText && sidebarOpen && (
            <h3 className='text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-4 px-3'>
              Essential Tools
            </h3>
          )}
          <ul className={`space-y-1 ${!sidebarOpen ? 'mt-0' : ''}`}>
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} section='essential' />
            ))}
          </ul>
        </div>

        {/* Advanced Tools */}
        <div>
          {showText && sidebarOpen && (
            <h3 className='text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-4 px-3'>
              Advanced Tools
            </h3>
          )}
          <ul className='space-y-1'>
            {advancedItems.map((item) => (
              <MenuItem key={item.id} item={item} section='advanced' />
            ))}
          </ul>
        </div>

        {/* Community */}
        <div>
          {showText && sidebarOpen && (
            <h3 className='text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-4 px-3'>
              Community
            </h3>
          )}
          <ul className='space-y-1'>
            {communityItems.map((item) => (
              <MenuItem key={item.id} item={item} section='community' />
            ))}
          </ul>
        </div>
      </nav>

      {/* Footer */}
      <div className='border-t border-[#1E1E21] p-3 space-y-3'>
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className={`w-full flex items-center ${
            sidebarOpen ? 'justify-center gap-2 px-4' : 'justify-center px-0'
          } py-2.5 rounded-lg bg-red-600 text-[#EDEDED] hover:bg-red-800 cursor-pointer transition-colors duration-200 text-sm font-medium h-8 disabled:opacity-50 disabled:cursor-not-allowed`}
          title={!sidebarOpen ? 'Logout' : undefined}
        >
          {logoutMutation.isPending ? (
            <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
          ) : (
            <LogOut size={16} />
          )}
          {showText &&
            sidebarOpen &&
            (logoutMutation.isPending ? 'Logging out...' : 'Logout')}
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
      <header
        className={`fixed top-0 z-20 h-14 md:h-16 bg-[#0B0B0C]/95 backdrop-blur-sm border-b border-[#1E1E21] flex items-center px-4 md:px-6 transition-all duration-300 ${
          sidebarOpen
            ? 'left-0 md:left-64 right-0'
            : 'left-0 md:left-16 right-0'
        }`}
      >
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

            {/* Desktop sidebar toggle button */}
            <button
              onClick={handleSidebarToggle}
              className='hidden md:flex p-2 rounded-lg bg-[#D4AF37] text-black hover:bg-[#D4AF37]/80 transition-colors h-9 w-9 items-center justify-center font-bold'
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarOpen ? <PanelLeft size={20} /> : <PanelRight size={20} />}
            </button>
          </div>

          {/* Right Section */}
          <div className='flex items-center gap-3'>
            {/* Points Display */}
            <div className='hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#121214] border border-[#1E1E21]'>
              <Zap size={16} className='text-[#D4AF37]' />
              <span className='text-[#D4AF37] font-bold text-sm'>
                {pointsLoading ? '...' : userPoints.toLocaleString()}
              </span>
              <span className='text-gray-400 text-xs hidden md:inline'>
                points
              </span>
            </div>

            {/* Mobile Points Display */}
            <div className='sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-[#121214] border border-[#1E1E21]'>
              <Zap size={14} className='text-[#D4AF37]' />
              <span className='text-[#D4AF37] font-bold text-xs'>
                {pointsLoading ? '...' : userPoints.toLocaleString()}
              </span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className='relative p-2 rounded-lg bg-[#121214] border border-[#1E1E21] text-[#EDEDED] hover:bg-[#1A1A1C] transition-colors h-9 w-9 flex items-center justify-center'
            >
              <Bell size={22} />
              {unreadCount > 0 && (
                <span className='absolute -top-1 -right-1 w-4 h-4 bg-[#D4AF37] rounded-full text-black text-[10px] font-bold flex items-center justify-center'>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div className='hidden md:flex items-center gap-3'>
              <div className='flex items-center gap-3 px-3 py-1.5 rounded-lg transition-colors cursor-pointer'>
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
        className={`fixed md:relative z-30 h-full ${
          sidebarOpen ? 'w-64' : 'w-16'
        } border-r border-[#1E1E21] bg-[#121214] transform transition-all duration-300 ease-in-out
          ${
            isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'
          } md:translate-x-0`}
      >
        <div className='h-full flex flex-col'>
          <SidebarContent />
        </div>
      </aside>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* Main Content */}
      <main className='flex-1 overflow-auto pt-14 md:pt-16 bg-[#0B0B0C] flex flex-col'>
        <div className='flex-1'>{children}</div>

        {/* Minimal Footer with Copyright & Trademark */}
        <footer className='mt-auto border-t border-[#1E1E21] bg-[#0B0B0C] py-3 px-4'>
          <div className='text-center'>
            <div className='text-[10px] text-gray-600 space-y-1'>
              <div>
                © {new Date().getFullYear()} Ascend AI. All rights reserved.
              </div>
              <div>Ascend AI™ is a trademark of Ascend AI Empire.</div>
            </div>
          </div>
        </footer>
      </main>

      {/* Ascend AI Chatbot - Only show if not on /chat route */}
      {location.pathname !== '/chat' && <AscendAIChatbot />}
    </div>
  )
}

export default Layout
