// File: client/src/pages/Layout/Layout.jsx
import NotificationDrawer from '@/components/Layout/NotificationDrawer.jsx'
import { AnimatePresence, motion as Motion } from 'framer-motion'
import {
    Bell,
    CreditCard,
    Crown,
    DollarSign,
    Gem,
    HelpCircle,
    Home,
    LayoutDashboard,
    LogOut,
    Menu,
    MessageCircle,
    PanelLeft,
    PanelRight,
    Settings,
    Shield,
    Sparkles,
    Star,
    User,
    User2,
    UserPlus,
    Users,
    Wallet,
    X,
} from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import {
    useCurrentUser,
    useLogout,
} from '../../hooks/useAuth.js'
import { useUnreadCount } from '../../hooks/useNotifications.js'
import { selectIsAdmin } from '../../redux/userSlice.js'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [showText, setShowText] = useState(true)

  const currentUser = useCurrentUser()
  const isAdmin = useSelector(selectIsAdmin)
  const logoutMutation = useLogout()
  const { data: unreadData } = useUnreadCount()
  const unreadCount = unreadData?.data?.unreadCount || 0

  const location = useLocation()

  const CrownLogo = ({ size = 20, className = '' }) => (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 256 256'
      width={size}
      height={size}
      className={className}
      fill='currentColor'
    >
      <path d='M248 80a28 28 0 1 0-51.12 15.77l-26.79 33L146 73.4a28 28 0 1 0-36.06 0l-24.03 55.34l-26.79-33a28 28 0 1 0-26.6 12L47 194.63A16 16 0 0 0 62.78 208h130.44A16 16 0 0 0 209 194.63l14.47-86.85A28 28 0 0 0 248 80M128 40a12 12 0 1 1-12 12a12 12 0 0 1 12-12M24 80a12 12 0 1 1 12 12a12 12 0 0 1-12-12m196 12a12 12 0 1 1 12-12a12 12 0 0 1-12 12' />
    </svg>
  )

  const menuItems = [
    { id: 'dashboard', label: 'Program Overview', icon: LayoutDashboard, path: '/dashboard' },
    {
      id: 'program-launcher',
      label: 'AI Program Launcher',
      icon: Sparkles,
      path: '/program/launcher',
      badge: 'AI',
      featured: true,
    },
    { id: 'program-setup', label: 'Program Settings', icon: Settings, path: '/program/setup' },
    { id: 'affiliates', label: 'Invite & Affiliates', icon: UserPlus, path: '/invite' },
    { id: 'earnings', label: 'Commission Earnings', icon: Wallet, path: '/earn' },
    { id: 'payouts', label: 'Payout Center', icon: CreditCard, path: '/payout' },
  ]

  const advancedItems = [
    { id: 'profile', label: 'My Profile', icon: User, path: '/profile' },
    { id: 'pricing', label: 'Plans & Billing', icon: Gem, path: '/pricing' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Console', icon: Shield, path: '/admin', badge: 'ADM' }] : []),
  ]

  const isActive = (path) => location.pathname === path

  const handleSidebarToggle = () => {
    if (sidebarOpen) {
      setShowText(false)
      setTimeout(() => setSidebarOpen(false), 50)
    } else {
      setSidebarOpen(true)
      setTimeout(() => setShowText(true), 200)
    }
  }

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync()
      window.location.href = '/auth'
    } catch {
      window.location.href = '/auth'
    }
  }

  const MenuItem = ({ item }) => {
    const active = isActive(item.path)
    const Icon = item.icon

    const content = (
      <div className={`
        group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300
        ${
          active
            ? 'bg-gold text-black shadow-[0_0_20px_rgba(212,175,55,0.2)]'
            : item.featured
              ? 'border border-gold/25 bg-gold/10 text-gold shadow-[0_0_18px_rgba(212,175,55,0.08)] hover:border-gold/45 hover:bg-gold/15'
              : 'border border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
        }
        ${!sidebarOpen ? 'justify-center px-0' : ''}
      `}>
        <Icon size={sidebarOpen ? 18 : 22} className={active ? 'text-black' : 'group-hover:text-gold transition-colors'} />
        
        {sidebarOpen && showText && (
          <div className='flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden'>
            <span className='font-medium text-[13px] tracking-tight'>{item.label}</span>
            {item.badge && (
              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md ${
                active
                  ? 'bg-black/15 text-black/70'
                  : item.featured
                    ? 'bg-gold text-black'
                    : item.badgeColor || 'bg-white/10 text-white/60'
              }`}>
                {item.badge}
              </span>
            )}
          </div>
        )}

        {active && (
          <div className='absolute -left-3 w-1 h-5 bg-gold rounded-full' />
        )}
      </div>
    )

    if (item.external) {
      return (
        <a href={item.path} target='_blank' rel='noopener noreferrer' className='block my-1'>
          {content}
        </a>
      )
    }

    return (
      <Link to={item.path} className='block my-1'>
        {content}
      </Link>
    )
  }

  if (!currentUser) {
    window.location.href = '/auth'
    return null
  }

  return (
    <div className='flex h-screen bg-black text-[#EDEDED] overflow-hidden selection:bg-gold/30 selection:text-gold'>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className='fixed inset-0 z-[40] bg-black/80 backdrop-blur-sm md:hidden'
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative z-[50] h-full transition-all duration-500 ease-in-out border-r border-white/5 bg-[#050505]
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className='flex h-full flex-col'>
          {/* Logo Section */}
          <div className='p-6 mb-4'>
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <div className='text-gold bg-gold/10 p-2.5 rounded-2xl shadow-[0_0_15px_rgba(212,175,55,0.1)]'>
                <CrownLogo size={24} />
              </div>
              {sidebarOpen && showText && (
                <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h1 className='text-xl font-bold tracking-tighter text-white leading-none'>
                    Ascnd<span className='text-gold'>Labs</span>
                  </h1>
                  <span className='text-[8px] font-black tracking-[0.3em] text-gray-600 uppercase mt-1 block'>
                    AFFILIATE PROGRAMS
                  </span>
                </Motion.div>
              )}
            </div>
          </div>

          {/* Navigation Area */}
          <div className='flex-1 overflow-y-auto overflow-x-hidden px-4 scrollbar-hide' style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            <style>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className='space-y-6 pb-4'>
              {/* Group 1 */}
              <div>
                {sidebarOpen && showText && (
                  <p className='text-[9px] font-black tracking-[0.2em] text-gray-600 uppercase mb-3 ml-2'>
                    Affiliate Program
                  </p>
                )}
                <div className='space-y-0.5'>
                  {menuItems.map(item => <MenuItem key={item.id} item={item} />)}
                </div>
              </div>

              {/* Group 2 */}
              <div>
                {sidebarOpen && showText && (
                  <p className='text-[9px] font-black tracking-[0.2em] text-gray-600 uppercase mb-3 ml-2'>
                    Account
                  </p>
                )}
                <div className='space-y-0.5'>
                  {advancedItems.map(item => <MenuItem key={item.id} item={item} />)}
                </div>
              </div>
            </div>
          </div>

          {/* User / Footer */}
          <div className='p-4 mt-auto border-t border-white/5'>
             {sidebarOpen ? (
               <div className='flex items-center gap-3 p-2 rounded-2xl bg-white/5 border border-white/5 mb-3'>
                  <div className='h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold border border-gold/10'>
                     <User size={20} />
                  </div>
                  <div className='flex-1 overflow-hidden'>
                     <p className='text-sm font-bold text-white truncate'>{currentUser?.name || 'Agent'}</p>
                     <p className='text-[10px] font-bold text-gold/60 uppercase tracking-tighter'>{isAdmin ? 'Admin' : 'Program Owner'}</p>
                  </div>
                  <button onClick={handleLogout} className='p-1.5 hover:text-red-400 transition-colors'>
                     <LogOut size={16} />
                  </button>
               </div>
             ) : (
               <div className='flex flex-col items-center gap-4 py-2'>
                  <button onClick={handleLogout} className='text-gray-500 hover:text-red-400 transition-colors'>
                     <LogOut size={20} />
                  </button>
               </div>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className='flex-1 flex flex-col relative overflow-hidden'>
        {/* Top Header */}
        <header className='h-16 flex items-center justify-between px-6 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-[30]'>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className='md:hidden p-2 text-gray-400 hover:text-white'
            >
              <Menu size={20} />
            </button>
            <button
              onClick={handleSidebarToggle}
              className='hidden md:flex p-2 text-gray-500 hover:text-gold transition-colors'
            >
              {sidebarOpen ? <PanelLeft size={20} /> : <PanelRight size={20} />}
            </button>
            <div className='h-6 w-px bg-white/5 hidden md:block' />
            <h2 className='text-sm font-bold text-gray-400 hidden sm:block'>
               {menuItems.find(i => isActive(i.path))?.label || advancedItems.find(i => isActive(i.path))?.label || 'Affiliate Programs'}
            </h2>
          </div>

          <div className='flex items-center gap-3'>
            <button 
              onClick={() => setIsNotificationOpen(true)}
              className='relative p-2.5 text-gray-400 hover:text-white rounded-xl bg-white/5 border border-white/5 transition-all'
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className='absolute top-2 right-2 w-2 h-2 bg-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]' />
              )}
            </button>

            <Link to='/profile' className='h-10 w-10 rounded-xl overflow-hidden border border-white/10 hover:border-gold/50 transition-all'>
               <div className='h-full w-full bg-gradient-to-br from-gold/20 to-transparent flex items-center justify-center text-gold'>
                  <User size={20} />
               </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className='flex-1 overflow-y-auto bg-[#030303] custom-scrollbar relative'>
          <div className='p-6 max-w-7xl mx-auto min-h-full'>
            {children}
          </div>
          
          {/* Subtle footer */}
          <footer className='py-6 px-10 border-t border-white/5 opacity-50 text-[10px] font-medium tracking-widest text-center uppercase flex flex-col md:flex-row justify-center gap-4'>
             <span>© 2025 Ascnd Labs LLC.</span>
             <Link to='/privacy' className='hover:text-gold transition-colors'>Privacy</Link>
             <Link to='/terms' className='hover:text-gold transition-colors'>Terms</Link>
          </footer>
        </main>
      </div>

      {/* Notification Drawer Component */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
    </div>
  )
}

export default Layout
