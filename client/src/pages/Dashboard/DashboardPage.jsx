// File: client/src/pages/Dashboard/DashboardPage.jsx
import PlanStatusCard from '@/components/Dashboard/PlanStatusCard.jsx'
import DiscordConnection from '@/components/Discord/DiscordConnection.jsx'
import axiosInstance from '@/config/config'
import { AnimatePresence, motion } from 'framer-motion'
import {
    Award,
    Bot,
    CheckCircle,
    ChevronRight,
    Cpu,
    Crown,
    DollarSign,
    ExternalLink,
    Gift,
    LayoutDashboard,
    MessageCircle,
    Rocket,
    Settings,
    Shield,
    Star,
    TrendingUp,
    UserPlus,
    Users,
    Wallet,
    X,
    Zap
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { FaDiscord } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { useClaimDailyPoints, useCurrentUser, usePointsStatus } from '../../hooks/useAuth.js'
import Layout from '../Layout/Layout'

const DashboardPage = () => {
  const currentUser = useCurrentUser()
  const { data: pointsData, isLoading: pointsLoading, refetch: refetchPoints } = usePointsStatus()
  const claimPointsMutation = useClaimDailyPoints()

  const pointsStatus = pointsData?.data || {}
  const {
    points = 0,
    dailyClaimStreak = 0,
    canClaimDaily = false,
    hoursUntilNextClaim = 0,
  } = pointsStatus

  const [isClaimingBonus, setIsClaimingBonus] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [showDiscordModal, setShowDiscordModal] = useState(false)
  const [discordStatus, setDiscordStatus] = useState(null)
  const [discordLoading, setDiscordLoading] = useState(true)

  const handleClaimDailyBonus = async () => {
    if (!canClaimDaily || isClaimingBonus) return
    setIsClaimingBonus(true)
    try {
      const result = await claimPointsMutation.mutateAsync()
      await refetchPoints()
      setFeedback({ type: 'success', message: `+${result.data?.pointsAwarded || 100} points added!` })
      setTimeout(() => setFeedback(null), 4000)
    } catch (error) {
      setFeedback({ type: 'error', message: error.response?.data?.message || 'Failed to claim' })
      setTimeout(() => setFeedback(null), 6000)
    } finally {
      setIsClaimingBonus(false)
    }
  }

  const fetchDiscordStatus = async () => {
    try {
      const response = await axiosInstance.get('/auth/discord/status')
      setDiscordStatus(response.data.data.discord)
    } catch (error) {
      setDiscordStatus(null)
    } finally {
      setDiscordLoading(false)
    }
  }

  useEffect(() => {
    fetchDiscordStatus()
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('discord_connected') === 'true') {
      setFeedback({ type: 'success', message: 'Discord connected!' })
      window.history.replaceState({}, document.title, '/dashboard')
    }
  }, [])

  const QuickActionCard = ({ icon: Icon, title, desc, path, color, badge }) => (
    <Link to={path} className='block group'>
      <div className='relative h-full p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:border-gold/30 hover:bg-white/[0.04] transition-all duration-300'>
        <div className={`p-2.5 w-fit rounded-xl ${color} text-black mb-4 group-hover:scale-110 transition-transform`}>
          <Icon size={20} />
        </div>
        <div className='flex items-center gap-2 mb-2'>
          <h3 className='font-bold text-white'>{title}</h3>
          {badge && <span className='text-[8px] font-black px-1.5 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/10'>{badge}</span>}
        </div>
        <p className='text-gray-500 text-xs leading-relaxed mb-4'>{desc}</p>
        <div className='flex items-center text-xs font-bold text-gold group-hover:gap-2 transition-all'>
           Go to {title} <ChevronRight size={14} />
        </div>
      </div>
    </Link>
  )

  return (
    <Layout>
      <div className='max-w-7xl mx-auto px-6 py-8 space-y-8'>
        
        {/* Header - Simple Welcome */}
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div>
            <h1 className='text-3xl font-black text-white tracking-tight mb-1'>
              Welcome, <span className='text-gold'>{currentUser?.name?.split(' ')[0] || 'Member'}</span>
            </h1>
            <p className='text-gray-500 text-sm'>
              Ready to grow your <span className='text-white font-bold'>Empire</span> today?
            </p>
          </div>
          
          <div className='hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10'>
             <div className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
             <span className='text-[10px] font-black tracking-widest text-gray-400 uppercase'>System Online</span>
          </div>
        </div>

        {/* Daily Bonus & Empire Score Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Daily Bonus Card */}
          <div className='lg:col-span-2 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8'>
              <div className='flex items-center gap-4'>
                <div className='h-14 w-14 rounded-2xl bg-gold flex items-center justify-center text-black shadow-lg shadow-gold/20'>
                  <Gift size={28} />
                </div>
                <div>
                  <h2 className='text-xl font-black text-white'>Daily Empire Bonus</h2>
                  <p className='text-gray-500 text-sm'>Claim your daily 100 points reward</p>
                </div>
              </div>

              <button 
                onClick={handleClaimDailyBonus}
                disabled={!canClaimDaily || isClaimingBonus}
                className={`h-12 px-8 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                  !canClaimDaily ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5' : 
                  isClaimingBonus ? 'bg-gold/50 text-black cursor-wait' : 
                  'bg-gold text-black hover:scale-105 shadow-lg shadow-gold/20'
                }`}
              >
                {isClaimingBonus ? <Zap size={16} className='animate-spin' /> : <Star size={18} />}
                {canClaimDaily ? 'Claim Now' : hoursUntilNextClaim > 0 ? `${hoursUntilNextClaim}h left` : 'Claimed'}
              </button>
            </div>

            <div className='grid grid-cols-2 gap-4 mb-6'>
              <div className='p-4 rounded-2xl bg-white/[0.03] border border-white/5'>
                <p className='text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1'>Current Streak</p>
                <p className='text-xl font-black text-gold'>{dailyClaimStreak} days</p>
              </div>
              <div className='p-4 rounded-2xl bg-white/[0.03] border border-white/5'>
                <p className='text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1'>{canClaimDaily ? 'Status' : 'Next Claim'}</p>
                <p className='text-xl font-black text-emerald-400'>{canClaimDaily ? 'Ready!' : `${hoursUntilNextClaim}h`}</p>
              </div>
            </div>

            <div className='flex items-center justify-between py-4 border-t border-white/5'>
              <div className='flex items-center gap-2'>
                <Zap size={14} className='text-gold' />
                <span className='text-xs text-gray-400'>Daily bonus builds your empire score</span>
              </div>
              <span className='text-sm font-bold text-white'>+100 pts</span>
            </div>
          </div>

          {/* Empire Score Card */}
          <div className='p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between'>
            <div>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold'>
                    <TrendingUp size={20} />
                  </div>
                  <h3 className='font-bold text-white'>Empire Score</h3>
                </div>
                <div className='text-[10px] font-black px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'>
                  LVL 5
                </div>
              </div>

              <div className='mb-6'>
                <p className='text-4xl font-black text-gold tracking-tight mb-2'>{points.toLocaleString()}</p>
                <div className='flex items-center gap-2'>
                  <div className='h-1.5 w-1.5 rounded-full bg-gold animate-pulse' />
                  <p className='text-xs text-gray-500'>Keep completing tasks to grow</p>
                </div>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='flex justify-between text-[10px] font-black uppercase tracking-widest'>
                <span className='text-gray-600'>Progress to Level 6</span>
                <span className='text-gold'>62%</span>
              </div>
              <div className='h-1.5 w-full bg-white/5 rounded-full overflow-hidden'>
                <div className='h-full bg-gold rounded-full w-[62%] shadow-[0_0_10px_rgba(212,175,55,0.3)]' />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Bar */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
                feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}
            >
              {feedback.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>

        <PlanStatusCard />

        {/* Quick Tools Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <QuickActionCard 
            icon={Cpu} color='bg-gold' title='AI Builder' badge='Hot'
            desc='Generate products, content, and plans instantly with our AI tools.' path='/build'
          />
          <QuickActionCard 
            icon={Wallet} color='bg-emerald-400' title='Earnings'
            desc='Track your money, manage sales, and optimize your profit channels.' path='/earn'
          />
          <QuickActionCard 
            icon={UserPlus} color='bg-blue-400' title='Affiliate'
            desc='Invite others to join and earn commissions on every successful signup.' path='/invite'
          />
        </div>

        {/* Lower Section: Discord & Stats */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
           {/* Discord Card */}
           <div className='lg:col-span-8 bg-gradient-to-br from-[#5865F2]/10 via-transparent to-transparent border border-[#5865F2]/20 rounded-[2rem] p-8 flex flex-col md:flex-row items-center gap-8'>
              <div className='h-20 w-20 rounded-3xl bg-[#5865F2] flex items-center justify-center shadow-2xl shadow-[#5865F2]/20 flex-shrink-0'>
                <FaDiscord size={40} className='text-white' />
              </div>
              <div className='flex-1 text-center md:text-left'>
                 <h2 className='text-2xl font-black text-white mb-2'>Join our Elite Discord</h2>
                 <p className='text-gray-400 text-sm leading-relaxed mb-6'>Get access to exclusive channels, +25 daily points bonus, and networking with other founders.</p>
                 <div className='flex flex-wrap justify-center md:justify-start gap-4'>
                    <button 
                      onClick={() => setShowDiscordModal(true)}
                      className='h-12 px-6 rounded-xl bg-[#5865F2] text-white font-bold text-sm hover:scale-105 transition-all'
                    >
                      {discordStatus?.isConnected ? 'Manage Connection' : 'Connect Account'}
                    </button>
                    <a href='https://discord.gg/t7r94BZUXv' target='_blank' rel='noopener noreferrer' className='h-12 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center gap-2 hover:bg-white/10 transition-all'>
                       Join Server <ExternalLink size={14} />
                    </a>
                 </div>
              </div>
           </div>

           {/* Stats Side Card */}
           <div className='lg:col-span-4 p-8 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group'>
              <div className='absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity'>
                 <TrendingUp size={80} className='text-gold' />
              </div>
              <p className='text-[10px] font-black tracking-widest text-gold uppercase mb-6'>Next Milestone</p>
              <h3 className='text-xl font-bold text-white mb-2'>Level Up</h3>
              <p className='text-gray-500 text-sm mb-6'>Keep building products to increase your rank and rewards.</p>
              
              <div className='space-y-4'>
                 <div className='flex justify-between text-xs font-bold'>
                    <span className='text-gray-400'>Progress</span>
                    <span className='text-gold'>62%</span>
                 </div>
                 <div className='h-2 w-full bg-white/5 rounded-full overflow-hidden'>
                    <div className='h-full bg-gold rounded-full w-[62%]' />
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* Discord Modal */}
      {showDiscordModal && (
        <div className='fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6' onClick={() => setShowDiscordModal(false)}>
          <div className='w-full max-w-2xl relative bg-transparent' onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDiscordModal(false)} className='absolute -top-12 right-0 text-gray-500 hover:text-white transition-colors'><X size={24}/></button>
            <div className='max-h-[80vh] overflow-y-auto rounded-[2rem] custom-scrollbar'>
              <DiscordConnection onConnectionResult={() => { fetchDiscordStatus(); setShowDiscordModal(false); }} onClose={() => setShowDiscordModal(false)} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default DashboardPage
