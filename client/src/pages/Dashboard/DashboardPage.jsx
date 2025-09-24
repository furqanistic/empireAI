// File: client/src/pages/Dashboard/DashboardPage.jsx - CLEANED VERSION
import {
  Award,
  Bot,
  CheckCircle,
  ChevronRight,
  Crown,
  DollarSign,
  ExternalLink,
  Gift,
  MessageCircle,
  Rocket,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { FaDiscord } from 'react-icons/fa'

import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import PlanStatusCard from '@/components/Dashboard/PlanStatusCard.jsx'
import DiscordConnection from '@/components/Discord/DiscordConnection.jsx'
import axiosInstance from '@/config/config'
import { useClaimDailyPoints, usePointsStatus } from '../../hooks/useAuth.js'
import Layout from '../Layout/Layout'

const DashboardPage = () => {
  // Hooks for points functionality
  const {
    data: pointsData,
    isLoading: pointsLoading,
    refetch: refetchPoints,
  } = usePointsStatus()

  const claimPointsMutation = useClaimDailyPoints()

  // Extract points data with fallbacks
  const pointsStatus = pointsData?.data || {}
  const {
    points = 0,
    dailyClaimStreak = 0,
    canClaimDaily = false,
    hoursUntilNextClaim = 0,
  } = pointsStatus

  // Local state for UI feedback
  const [isClaimingBonus, setIsClaimingBonus] = useState(false)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [feedbackType, setFeedbackType] = useState('success') // 'success' | 'error'

  // Discord modal state
  const [showDiscordModal, setShowDiscordModal] = useState(false)
  const [discordStatus, setDiscordStatus] = useState(null)
  const [discordLoading, setDiscordLoading] = useState(true)

  // Handle daily points claiming
  const handleClaimDailyBonus = async () => {
    if (!canClaimDaily || isClaimingBonus) return

    setIsClaimingBonus(true)
    setFeedbackMessage(null)

    try {
      const result = await claimPointsMutation.mutateAsync()

      // Refetch points data to update UI
      await refetchPoints()

      setFeedbackType('success')
      setFeedbackMessage(
        `Points claimed successfully! +${
          result.data?.pointsAwarded || 100
        } points`
      )

      // Auto-hide success message after 4 seconds
      setTimeout(() => {
        setFeedbackMessage(null)
      }, 4000)
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Failed to claim daily points'
      setFeedbackType('error')
      setFeedbackMessage(errorMessage)

      // Auto-hide error message after 6 seconds
      setTimeout(() => {
        setFeedbackMessage(null)
      }, 6000)
    } finally {
      setIsClaimingBonus(false)
    }
  }

  // Handle Discord modal
  const handleDiscordExpand = () => {
    setShowDiscordModal(true)
  }

  const handleDiscordModalClose = () => {
    setShowDiscordModal(false)
  }

  // Handle Discord connection success/failure
  const handleDiscordConnectionResult = (result) => {
    if (result.success) {
      // Refresh Discord status and close modal
      setDiscordLoading(true)
      fetchDiscordStatus()
      setShowDiscordModal(false)

      // Show success feedback
      setFeedbackType('success')
      setFeedbackMessage(
        'Discord connected successfully! +25 daily bonus unlocked.'
      )

      // Auto-hide success message after 4 seconds
      setTimeout(() => {
        setFeedbackMessage(null)
      }, 4000)
    } else {
      // Show failure message
      setFeedbackType('error')
      setFeedbackMessage(
        'Discord connection failed. Please try again or contact support@ascndlabs.com.'
      )

      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setFeedbackMessage(null)
      }, 8000)
    }
  }

  // Fetch Discord status function
  const fetchDiscordStatus = async () => {
    try {
      const response = await axiosInstance.get('/auth/discord/status')
      setDiscordStatus(response.data.data.discord)
    } catch (error) {
      console.error('Error fetching Discord status:', error)
      setDiscordStatus(null)
    } finally {
      setDiscordLoading(false)
    }
  }

  // Fetch Discord status on mount and handle OAuth redirect
  React.useEffect(() => {
    fetchDiscordStatus()

    // Check for Discord OAuth success/failure in URL params
    const urlParams = new URLSearchParams(window.location.search)
    const discordSuccess = urlParams.get('discord_connected')
    const discordError = urlParams.get('discord_error')

    if (discordSuccess === 'true') {
      // Show success message and refresh status
      setFeedbackType('success')
      setFeedbackMessage(
        'Discord connected successfully! +25 daily bonus unlocked.'
      )
      setTimeout(() => setFeedbackMessage(null), 4000)

      // Clean URL
      window.history.replaceState({}, document.title, '/dashboard')
    } else if (discordError || discordSuccess === 'false') {
      // Show error message
      setFeedbackType('error')
      setFeedbackMessage(
        'Discord connection failed. Please try again or contact support@ascndlabs.com.'
      )
      setTimeout(() => setFeedbackMessage(null), 8000)

      // Clean URL
      window.history.replaceState({}, document.title, '/dashboard')
    }
  }, [])

  // Quick action card component
  const QuickActionCard = ({
    icon,
    title,
    description,
    badge,
    color = 'bg-[#D4AF37]',
    path,
  }) => (
    <Link to={path} className='block'>
      <div className='group bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-5 hover:border-[#D4AF37]/40 hover:bg-[#1A1A1C]/50 transition-all duration-300 cursor-pointer relative'>
        <div className='relative z-10'>
          <div className='flex items-center gap-2 mb-3'>
            <h3 className='text-[#EDEDED] font-semibold text-base sm:text-lg'>
              {title}
            </h3>
            {badge && (
              <span className='bg-[#D4AF37] text-black text-xs px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider'>
                {badge}
              </span>
            )}
          </div>

          <p className='text-gray-400 text-sm leading-relaxed mb-4'>
            {description}
          </p>

          <div className='flex items-center justify-between'>
            <div className='flex items-center text-[#D4AF37] text-sm font-medium group-hover:gap-2 transition-all duration-300'>
              <span>Get Started</span>
              <ChevronRight
                size={16}
                className='ml-1 group-hover:translate-x-1 transition-transform duration-300'
              />
            </div>

            <div
              className={`${color} p-1.5 rounded-lg text-black group-hover:scale-110 transition-transform duration-300`}
            >
              {React.cloneElement(icon, { size: 16 })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )

  // Claim button component
  const ClaimButton = ({ mobile = false }) => {
    const buttonClasses = `
      ${mobile ? 'w-full sm:hidden' : 'hidden sm:flex flex-shrink-0'} 
      h-8 px-4 rounded-xl font-semibold text-sm transition-all duration-300 
      flex items-center gap-2 justify-center
      ${
        !canClaimDaily
          ? 'bg-gray-600 text-white cursor-not-allowed'
          : isClaimingBonus
          ? 'bg-[#D4AF37]/50 text-black cursor-wait'
          : 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 hover:scale-105 shadow-lg hover:shadow-[#D4AF37]/20'
      }
    `

    return (
      <button
        onClick={handleClaimDailyBonus}
        disabled={!canClaimDaily || isClaimingBonus}
        className={buttonClasses}
      >
        {isClaimingBonus ? (
          <>
            <div className='w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin' />
            {!mobile && <span className='hidden sm:inline'>Claiming...</span>}
            {mobile && <span>Claiming...</span>}
          </>
        ) : !canClaimDaily ? (
          <>
            <CheckCircle size={16} />
            {hoursUntilNextClaim > 0
              ? `${hoursUntilNextClaim}h left`
              : 'Claimed Today!'}
          </>
        ) : (
          <>
            <Star size={16} />
            Claim Now
          </>
        )}
      </button>
    )
  }

  return (
    <Layout>
      <div className='max-w-6xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8'>
        {/* Welcome Hero Section */}
        <div className='bg-gradient-to-r from-[#121214] via-[#1A1A1C] to-[#121214] border border-[#1E1E21] rounded-xl p-6 sm:p-8'>
          <div className='flex items-center gap-3 sm:gap-4'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0'>
              <Crown size={24} className='sm:hidden text-black' />
              <Crown size={28} className='hidden sm:block text-black' />
            </div>
            <div className='min-w-0'>
              <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-[#EDEDED] mb-1 sm:mb-2'>
                Welcome back, <span className='text-[#D4AF37]'>Emperor</span>
              </h1>
              <p className='text-gray-400 text-sm sm:text-base lg:text-lg'>
                Ready to build your digital empire today?
              </p>
            </div>
          </div>
        </div>
        <PlanStatusCard />

        {/* Global Feedback Messages */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-lg border ${
              feedbackType === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-red-500/10 border-red-500/20'
            }`}
          >
            <p
              className={`text-sm ${
                feedbackType === 'success' ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {feedbackMessage}
            </p>
          </div>
        )}

        {/* Daily Bonus & Stats Row (2 cards only) */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
          {/* Daily Check-in Bonus */}
          <div className='lg:col-span-2 bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            {/* Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4'>
              <div className='flex items-center gap-3 sm:gap-4 mb-4 sm:mb-0'>
                <div className='bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80 p-2.5 rounded-xl flex-shrink-0'>
                  <Gift size={20} className='sm:hidden text-black' />
                  <Gift size={24} className='hidden sm:block text-black' />
                </div>
                <div>
                  <h2 className='text-lg sm:text-xl font-bold text-[#EDEDED] mb-1'>
                    Daily Empire Bonus
                  </h2>
                  <p className='text-gray-400 text-sm'>
                    Claim your daily 100 points reward
                  </p>
                </div>
              </div>
              <ClaimButton />
            </div>

            {/* Streak & Status Info */}
            <div className='grid grid-cols-2 gap-3 mb-4'>
              <div className='bg-[#1A1A1C] rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='w-2 h-2 rounded-full bg-[#D4AF37]'></div>
                  <span className='text-gray-400 text-xs'>Current Streak</span>
                </div>
                <div className='text-[#D4AF37] font-bold text-lg'>
                  {pointsLoading ? '...' : `${dailyClaimStreak} days`}
                </div>
              </div>
              <div className='bg-[#1A1A1C] rounded-lg p-3'>
                <div className='flex items-center gap-2 mb-1'>
                  <div className='w-2 h-2 rounded-full bg-emerald-500'></div>
                  <span className='text-gray-400 text-xs'>
                    {canClaimDaily ? 'Available Now' : 'Next Claim'}
                  </span>
                </div>
                <div className='text-emerald-400 font-bold text-lg'>
                  {canClaimDaily
                    ? 'Ready!'
                    : hoursUntilNextClaim > 0
                    ? `${hoursUntilNextClaim}h`
                    : 'Ready!'}
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className='flex items-center justify-between text-sm mb-4 sm:mb-0'>
              <div className='flex items-center gap-2'>
                <Zap size={14} className='text-[#D4AF37]' />
                <span className='text-[#EDEDED]'>
                  Daily bonus builds your empire score
                </span>
              </div>
              <span className='text-gray-400'>+100 pts</span>
            </div>

            {/* Mobile Claim Button */}
            <ClaimButton mobile />
          </div>

          {/* Empire Score */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6 min-h-[120px]'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <div className='bg-[#D4AF37]/10 p-2 rounded-xl flex-shrink-0'>
                  <TrendingUp
                    size={18}
                    className='sm:w-5 sm:h-5 text-[#D4AF37]'
                  />
                </div>
                <h3 className='text-[#EDEDED] font-semibold text-sm sm:text-base'>
                  Empire Score
                </h3>
              </div>
              <div className='text-xs text-emerald-400 font-medium'>
                Level 5
              </div>
            </div>

            <div className='text-2xl sm:text-3xl font-bold text-[#D4AF37] mb-2'>
              {pointsLoading ? '...' : points.toLocaleString()}
            </div>

            <div className='flex items-center justify-between mb-3'>
              <p className='text-gray-400 text-xs sm:text-sm'>
                Complete tasks to grow
              </p>
              <div className='flex items-center gap-1'>
                <div className='w-2 h-2 rounded-full bg-[#D4AF37]'></div>
                <span className='text-xs text-[#D4AF37] font-medium'>
                  {dailyClaimStreak}d streak
                </span>
              </div>
            </div>

            <div className='bg-[#1A1A1C] rounded-lg h-1.5 overflow-hidden'>
              <div className='bg-[#D4AF37] h-full w-[62%] rounded-lg'></div>
            </div>
          </div>
        </div>

        {/* SINGLE DISCORD SECTION - Clean & Simple */}
        <div className='bg-gradient-to-r from-[#5865F2]/8 via-[#5865F2]/12 to-[#5865F2]/8 border border-[#5865F2]/20 rounded-xl p-6'>
          <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-center'>
            {/* Left: Branding & Info */}
            <div className='lg:col-span-4 text-center lg:text-left'>
              <div className='flex items-center justify-center lg:justify-start gap-4 mb-3'>
                <div className='w-12 h-12 bg-[#5865F2] rounded-xl flex items-center justify-center'>
                  <FaDiscord size={24} className='text-white' />
                </div>
                <div>
                  <h2 className='text-xl font-bold text-[#EDEDED] mb-1'>
                    Discord Connect
                  </h2>
                  <p className='text-[#5865F2] text-sm font-medium'>
                    {discordStatus?.isConnected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
              <p className='text-gray-400 text-sm leading-relaxed mb-3 lg:mb-0'>
                Connect for exclusive roles, +25 daily bonus, and community
                access
              </p>
            </div>

            {/* Center: Status */}
            <div className='lg:col-span-4 flex justify-center'>
              <div className='w-full max-w-xs'>
                {discordLoading ? (
                  <div className='flex items-center justify-center py-4'>
                    <div className='w-6 h-6 border-2 border-[#5865F2]/30 border-t-[#5865F2] rounded-full animate-spin'></div>
                  </div>
                ) : discordStatus?.isConnected ? (
                  <div className='bg-[#121214]/50 border border-[#1E1E21] rounded-xl p-4'>
                    <div className='flex items-center gap-3 mb-3'>
                      {discordStatus.avatar ? (
                        <img
                          src={`https://cdn.discordapp.com/avatars/${discordStatus.discordId}/${discordStatus.avatar}.png?size=32`}
                          alt='Discord Avatar'
                          className='w-8 h-8 rounded-full border border-[#5865F2]'
                          onError={(e) => {
                            e.target.src = `https://cdn.discordapp.com/embed/avatars/${
                              (discordStatus.discriminator || '0') % 5
                            }.png`
                          }}
                        />
                      ) : (
                        <div className='w-8 h-8 rounded-full bg-[#5865F2]/20 flex items-center justify-center'>
                          <MessageCircle size={16} className='text-[#5865F2]' />
                        </div>
                      )}
                      <div className='flex-1 min-w-0'>
                        <div className='text-[#EDEDED] font-semibold text-sm truncate'>
                          {discordStatus.username}
                        </div>
                        <div className='flex items-center gap-2'>
                          <div className='w-1.5 h-1.5 rounded-full bg-emerald-500'></div>
                          <span className='text-emerald-400 text-xs'>
                            Connected
                          </span>
                        </div>
                      </div>
                      <Award
                        size={16}
                        className='text-[#D4AF37] flex-shrink-0'
                      />
                    </div>

                    {/* Compact Role & Bonus Info */}
                    <div className='grid grid-cols-2 gap-2'>
                      <div className='text-center bg-[#1A1A1C] rounded-lg p-2'>
                        <div className='text-[#5865F2] font-bold text-sm'>
                          Role Active
                        </div>
                        <div className='text-gray-400 text-xs'>
                          Server Status
                        </div>
                      </div>
                      <div className='text-center bg-[#1A1A1C] rounded-lg p-2'>
                        <div className='text-[#D4AF37] font-bold text-sm'>
                          +25 pts
                        </div>
                        <div className='text-gray-400 text-xs'>Daily Bonus</div>
                      </div>
                    </div>

                    {/* Compact Warnings */}
                    {(discordStatus.needsRoleUpdate ||
                      discordStatus.isInServer === false) && (
                      <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mt-3 flex items-center gap-2'>
                        <span className='text-yellow-500 text-sm flex-shrink-0'>
                          ⚠️
                        </span>
                        <span className='text-yellow-200 text-xs'>
                          {discordStatus.isInServer === false
                            ? 'Join server for roles'
                            : 'Role update needed'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='bg-[#121214]/50 border border-[#1E1E21] rounded-xl p-4 text-center'>
                    <div className='text-[#EDEDED] font-semibold mb-2'>
                      Not Connected
                    </div>
                    <div className='grid grid-cols-2 gap-2 mb-3'>
                      <div className='bg-[#1A1A1C] rounded-lg p-2'>
                        <div className='text-[#D4AF37] text-sm'>⭐</div>
                        <div className='text-gray-300 text-xs'>+25 Bonus</div>
                      </div>
                      <div className='bg-[#1A1A1C] rounded-lg p-2'>
                        <div className='text-[#5865F2] text-sm'>🎯</div>
                        <div className='text-gray-300 text-xs'>Roles</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Actions */}
            <div className='lg:col-span-4 space-y-3'>
              <div className='flex flex-col sm:flex-row lg:flex-col gap-3'>
                <button
                  onClick={handleDiscordExpand}
                  className='flex-1 bg-[#5865F2] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#5865F2]/90 transition-all duration-300 flex items-center justify-center gap-2'
                >
                  {discordStatus?.isConnected ? (
                    <>
                      <Settings size={16} />
                      Discord Connected • Manage
                    </>
                  ) : (
                    <>
                      <MessageCircle size={16} />
                      Connect Discord
                    </>
                  )}
                </button>

                <a
                  href='https://discord.gg/t7r94BZUXv'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex-1 bg-[#121214] border border-[#5865F2]/30 text-[#5865F2] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#5865F2]/5 transition-all duration-300 flex items-center justify-center gap-2'
                >
                  <MessageCircle size={16} />
                  Join Server
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div>
          <div className='flex items-center gap-3 mb-4 sm:mb-6'>
            <Zap size={20} className='sm:w-6 sm:h-6 text-[#D4AF37]' />
            <h2 className='text-xl sm:text-2xl font-bold text-[#EDEDED]'>
              Start Building
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            <QuickActionCard
              icon={<Bot size={20} className='sm:w-6 sm:h-6' />}
              title='AI Builder'
              description='Create your first digital product with AI assistance and automated workflows'
              badge='Start Here'
              color='bg-[#D4AF37]'
              path='/build'
            />
            <QuickActionCard
              icon={<DollarSign size={20} className='sm:w-6 sm:h-6' />}
              title='Earnings'
              description='Track revenue streams, manage finances, and optimize your profit centers'
              color='bg-emerald-500'
              path='/earn'
            />
            <QuickActionCard
              icon={<Users size={20} className='sm:w-6 sm:h-6' />}
              title='Affiliate Army'
              description='Build and manage your affiliate network to exponentially scale your reach'
              badge='Recruit'
              color='bg-blue-500'
              path='/invite'
            />
          </div>
        </div>

        {/* AI Strategic Command - Single Section */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
          <div className='bg-gradient-to-r from-[#D4AF37]/10 to-transparent p-4 sm:p-6 border-b border-[#1E1E21]'>
            <div className='flex items-center gap-3'>
              <div className='bg-[#D4AF37] p-2 rounded-xl flex-shrink-0'>
                <Shield size={18} className='sm:w-5 sm:h-5 text-black' />
              </div>
              <h2 className='text-lg sm:text-xl font-bold text-[#EDEDED]'>
                AI Strategic Command
              </h2>
            </div>
          </div>

          <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
            {/* Status Indicators */}
            <div className='space-y-2 sm:space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 flex-shrink-0'></div>
                <span className='text-[#EDEDED] font-medium text-sm sm:text-base'>
                  Training Phase Complete
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#D4AF37] flex-shrink-0'></div>
                <span className='text-[#EDEDED] font-medium text-sm sm:text-base'>
                  Marketplace Ready
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-blue-500 flex-shrink-0'></div>
                <span className='text-[#EDEDED] font-medium text-sm sm:text-base'>
                  AI Systems Online
                </span>
              </div>
            </div>

            {/* Strategic Counsel */}
            <div className='bg-[#1A1A1C]/50 rounded-xl p-4 border border-[#1E1E21]'>
              <p className='text-[#EDEDED] leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base'>
                <span className='text-[#D4AF37] font-semibold'>
                  Mission Brief:
                </span>{' '}
                Your empire requires its first digital asset. Deploy the AI
                Builder to establish your market presence.
              </p>

              <Link to='/build'>
                <button className='bg-[#D4AF37] text-black h-8 px-4 rounded-xl font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg'>
                  <Rocket size={14} />
                  Launch First Mission
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Discord Modal */}
      {showDiscordModal && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-hidden'
          onClick={handleDiscordModalClose}
        >
          <div
            className='w-full max-w-2xl max-h-[85vh] relative bg-transparent'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Enhanced & Fixed Position */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDiscordModalClose()
              }}
              className='absolute top-2 right-4 z-[60] w-10 h-10 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-white'
              aria-label='Close Discord Modal'
            >
              <X size={18} className='stroke-2' />
            </button>

            {/* Scrollable Content Container */}
            <div className='max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent pr-2'>
              {/* Discord Connection Component */}
              <DiscordConnection
                onConnectionResult={handleDiscordConnectionResult}
                onClose={handleDiscordModalClose}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default DashboardPage
