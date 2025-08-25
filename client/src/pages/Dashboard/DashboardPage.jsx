import {
  Bot,
  CheckCircle,
  ChevronRight,
  Crown,
  DollarSign,
  ExternalLink,
  Gift,
  MessageCircle,
  Rocket,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'
import Layout from '../Layout/Layout'

const DashboardPage = () => {
  const [isClaimingBonus, setIsClaimingBonus] = useState(false)
  const [bonusClaimed, setBonusClaimed] = useState(false)

  const handleClaimBonus = async () => {
    setIsClaimingBonus(true)
    setTimeout(() => {
      setBonusClaimed(true)
      setIsClaimingBonus(false)
    }, 1500)
  }

  const QuickActionCard = ({
    icon,
    title,
    description,
    badge,
    color = 'bg-[#D4AF37]',
  }) => (
    <div className='group bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-5 hover:border-[#D4AF37]/40 hover:bg-[#1A1A1C]/50 transition-all duration-300 cursor-pointer'>
      <div className='flex items-start gap-3'>
        <div
          className={`${color} p-2.5 rounded-xl text-black group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
        >
          {icon}
        </div>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-2'>
            <h3 className='text-[#EDEDED] font-semibold text-base sm:text-lg truncate'>
              {title}
            </h3>
            {badge && (
              <span className='bg-[#D4AF37] text-black text-xs px-2 py-0.5 rounded-lg font-bold uppercase tracking-wider whitespace-nowrap'>
                {badge}
              </span>
            )}
          </div>
          <p className='text-gray-400 text-sm leading-relaxed mb-3'>
            {description}
          </p>
          <div className='flex items-center text-[#D4AF37] text-sm font-medium group-hover:gap-2 transition-all duration-300'>
            <span>Get Started</span>
            <ChevronRight
              size={16}
              className='group-hover:translate-x-1 transition-transform duration-300'
            />
          </div>
        </div>
      </div>
    </div>
  )

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

        {/* Daily Bonus & Stats Row */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
          {/* Daily Check-in Bonus */}
          <div className='lg:col-span-2 bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6 flex items-center justify-between min-h-[120px]'>
            <div className='flex items-center gap-3 sm:gap-4'>
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

            <button
              onClick={handleClaimBonus}
              disabled={bonusClaimed || isClaimingBonus}
              className={`h-10 sm:h-12 px-4 sm:px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 sm:gap-3 justify-center flex-shrink-0 ${
                bonusClaimed
                  ? 'bg-emerald-600 text-white cursor-not-allowed'
                  : isClaimingBonus
                  ? 'bg-[#D4AF37]/50 text-black cursor-wait'
                  : 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 hover:scale-105 shadow-lg hover:shadow-[#D4AF37]/20'
              }`}
            >
              {isClaimingBonus ? (
                <>
                  <div className='w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin' />
                  <span className='hidden sm:inline'>Claiming...</span>
                </>
              ) : bonusClaimed ? (
                <>
                  <CheckCircle size={16} className='sm:w-[18px] sm:h-[18px]' />
                  Claimed!
                </>
              ) : (
                <>
                  <Star size={16} className='sm:w-[18px] sm:h-[18px]' />
                  Claim Now
                </>
              )}
            </button>
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
                +24 today
              </div>
            </div>

            <div className='text-2xl sm:text-3xl font-bold text-[#D4AF37] mb-2'>
              1,247
            </div>

            <div className='flex items-center justify-between'>
              <p className='text-gray-400 text-xs sm:text-sm'>
                Complete tasks to grow
              </p>
              <div className='flex items-center gap-1'>
                <div className='w-2 h-2 rounded-full bg-[#D4AF37]'></div>
                <span className='text-xs text-[#D4AF37] font-medium'>
                  Level 5
                </span>
              </div>
            </div>

            <div className='mt-3 bg-[#1A1A1C] rounded-lg h-1.5 overflow-hidden'>
              <div className='bg-[#D4AF37] h-full w-[62%] rounded-lg'></div>
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
            />
            <QuickActionCard
              icon={<DollarSign size={20} className='sm:w-6 sm:h-6' />}
              title='Money OS'
              description='Track revenue streams, manage finances, and optimize your profit centers'
              color='bg-emerald-500'
            />
            <QuickActionCard
              icon={<Users size={20} className='sm:w-6 sm:h-6' />}
              title='Affiliate Army'
              description='Build and manage your affiliate network to exponentially scale your reach'
              badge='Recruit'
              color='bg-blue-500'
            />
          </div>
        </div>

        {/* Community & Command Briefing */}
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6'>
          {/* Empire Community */}
          <div className='lg:col-span-2 bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6 flex flex-col'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='bg-[#5865F2]/10 p-2.5 rounded-xl flex-shrink-0'>
                <MessageCircle
                  size={20}
                  className='sm:w-6 sm:h-6 text-[#5865F2]'
                />
              </div>
              <div>
                <h3 className='text-[#EDEDED] font-bold text-base sm:text-lg'>
                  Empire Community
                </h3>
                <p className='text-gray-400 text-xs sm:text-sm'>
                  Join 2,847+ entrepreneurs
                </p>
              </div>
            </div>

            <p className='text-gray-400 text-sm leading-relaxed mb-4 flex-1'>
              Connect with fellow empire builders, share strategies, and get
              exclusive insights.
            </p>

            <button className='w-full h-10 sm:h-12 bg-[#5865F2] text-white rounded-xl font-semibold hover:bg-[#5865F2]/90 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-sm'>
              <MessageCircle size={16} className='sm:w-[18px] sm:h-[18px]' />
              <span className='hidden sm:inline'>Join Discord Community</span>
              <span className='sm:hidden'>Join Discord</span>
              <ExternalLink size={14} className='sm:w-4 sm:h-4' />
            </button>
          </div>

          {/* AI Strategic Command */}
          <div className='lg:col-span-3 bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
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

                <button className='bg-[#D4AF37] text-black h-8 sm:h-10 px-4 sm:px-6 rounded-xl font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-lg'>
                  <Rocket size={14} className='sm:w-4 sm:h-4' />
                  Launch First Mission
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DashboardPage
