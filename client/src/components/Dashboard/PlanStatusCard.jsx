// File: client/src/components/Dashboard/PlanStatusCard.jsx
import { PLAN_FEATURES } from '@/hooks/usePlanAccess'
import { useUsageStats } from '@/hooks/useUsageStats'
import { selectCurrentUser } from '@/redux/userSlice'
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Crown,
  Lock,
  MessageCircle,
  Rocket,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PlanBadge from '../Layout/PlanBadge'

const PlanStatusCard = () => {
  const navigate = useNavigate()
  const currentUser = useSelector(selectCurrentUser)
  const { data: usageData } = useUsageStats()
  const [expanded, setExpanded] = useState(false)

  const userPlan = currentUser?.subscription?.isActive
    ? currentUser.subscription.plan
    : 'free'

  const planConfig = PLAN_FEATURES[userPlan]

  // All available AI builders
  const allBuilders = [
    {
      id: 'viral-hooks',
      name: 'Viral Hook Factory',
      icon: MessageCircle,
      color: 'text-blue-400',
    },
    {
      id: 'product-generator',
      name: 'AI Product Generator',
      icon: Rocket,
      color: 'text-purple-400',
    },
    {
      id: 'niche-launchpad',
      name: 'Niche Launchpad',
      icon: Target,
      color: 'text-green-400',
    },
  ]

  // Get usage data
  const generationsUsed = usageData?.data?.usage?.total || 0
  const maxGenerations =
    usageData?.data?.plan?.maxGenerations || planConfig?.maxGenerations || 0
  const isUnlimited = maxGenerations === -1

  const usagePercentage = isUnlimited
    ? 0
    : Math.min((generationsUsed / maxGenerations) * 100, 100)

  const getUsageColor = () => {
    if (isUnlimited) return 'bg-green-500'
    if (usagePercentage < 50) return 'bg-green-500'
    if (usagePercentage < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl overflow-hidden'>
      {/* Compact Header */}
      <div className='p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-2'>
            <div className='text-sm font-semibold text-[#EDEDED]'>Plan</div>
            <PlanBadge plan={userPlan} size='sm' />
          </div>
          {userPlan !== 'empire' && (
            <button
              onClick={() => navigate('/pricing')}
              className='text-xs text-[#D4AF37] hover:text-[#DAB543] font-medium flex items-center gap-1'
            >
              <TrendingUp size={12} />
              Upgrade
            </button>
          )}
        </div>

        {/* AI Builders - Icon Grid */}
        <div className='flex items-center gap-2 mb-3'>
          {allBuilders.map((builder) => {
            const Icon = builder.icon
            const hasAccess = planConfig?.aiBuilders?.includes(builder.id)
            return (
              <div
                key={builder.id}
                className={`relative flex-1 h-10 rounded-lg flex items-center justify-center transition-all ${
                  hasAccess
                    ? 'bg-[#1E1E21] border border-[#D4AF37]/20'
                    : 'bg-[#1E1E21]/30 border border-[#1E1E21]'
                }`}
                title={`${builder.name} ${
                  hasAccess ? '(Unlocked)' : '(Locked)'
                }`}
              >
                <Icon
                  size={16}
                  className={hasAccess ? builder.color : 'text-gray-600'}
                />
                {hasAccess ? (
                  <div className='absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#121214]' />
                ) : (
                  <div className='absolute -top-1 -right-1 w-3 h-3 bg-[#1E1E21] rounded-full border-2 border-[#121214] flex items-center justify-center'>
                    <Lock size={8} className='text-gray-600' />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Usage Bar */}
        <div>
          <div className='flex items-center justify-between text-xs text-gray-400 mb-1.5'>
            <span>Generations</span>
            <span className='font-medium text-[#EDEDED]'>
              {isUnlimited ? (
                <span className='text-green-400 flex items-center gap-1'>
                  <Zap size={10} />
                  Unlimited
                </span>
              ) : (
                `${generationsUsed}/${maxGenerations}`
              )}
            </span>
          </div>

          {!isUnlimited && (
            <div className='w-full bg-[#1E1E21] rounded-full h-1.5'>
              <div
                className={`${getUsageColor()} h-1.5 rounded-full transition-all duration-300`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className='px-4 pb-4 pt-2 border-t border-[#1E1E21] space-y-3'>
          {/* Builder Details */}
          <div>
            <div className='text-xs text-gray-400 mb-2'>AI Builders</div>
            <div className='space-y-1.5'>
              {allBuilders.map((builder) => {
                const Icon = builder.icon
                const hasAccess = planConfig?.aiBuilders?.includes(builder.id)
                return (
                  <div
                    key={builder.id}
                    className='flex items-center justify-between text-xs'
                  >
                    <div className='flex items-center gap-2'>
                      <Icon
                        size={12}
                        className={hasAccess ? builder.color : 'text-gray-600'}
                      />
                      <span
                        className={
                          hasAccess ? 'text-[#EDEDED]' : 'text-gray-600'
                        }
                      >
                        {builder.name}
                      </span>
                    </div>
                    {hasAccess ? (
                      <CheckCircle size={12} className='text-green-400' />
                    ) : (
                      <Lock size={10} className='text-gray-600' />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Features */}
          <div>
            <div className='text-xs text-gray-400 mb-2'>Features</div>
            <div className='space-y-1'>
              {planConfig?.features.slice(0, 3).map((feature, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 text-xs text-gray-300'
                >
                  <div className='w-1 h-1 bg-[#D4AF37] rounded-full flex-shrink-0' />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expand Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className='w-full px-4 py-2 border-t border-[#1E1E21] hover:bg-[#1E1E21]/30 transition-colors flex items-center justify-center gap-1 text-xs text-gray-400'
      >
        {expanded ? (
          <>
            <ChevronUp size={14} />
            Show Less
          </>
        ) : (
          <>
            <ChevronDown size={14} />
            Show Details
          </>
        )}
      </button>
    </div>
  )
}

export default PlanStatusCard
