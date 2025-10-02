// File: client/src/components/Layout/PlanGate.jsx
import { getPlanFeatures, useCheckPlanAccess } from '@/hooks/usePlanAccess'
import { AlertTriangle, Crown, Rocket, Star, Zap } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const PlanGate = ({ children, requiredFeature }) => {
  const navigate = useNavigate()
  const {
    hasAccess,
    hasUsageAvailable,
    userPlan,
    isActive,
    usageStats,
    unlimited,
  } = useCheckPlanAccess(requiredFeature)

  if (hasAccess) {
    return <>{children}</>
  }

  // Only usage blocking now (no feature blocking)
  return (
    <div className='min-h-[60vh] flex items-center justify-center p-6'>
      <div className='max-w-md w-full'>
        <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-2xl p-8 text-center'>
          <div className='bg-[#D4AF37]/10 rounded-full p-4 w-fit mx-auto mb-6'>
            <AlertTriangle size={32} className='text-orange-400' />
          </div>

          <h2 className='text-2xl font-bold text-[#EDEDED] mb-3'>
            Generation Limit Reached
          </h2>
          <p className='text-gray-400 mb-6'>
            You've used all {usageStats.limit} generations this month.
            {userPlan === 'free'
              ? ' Upgrade to get more generations and continue creating.'
              : ' Upgrade for more generations or wait until next month.'}
          </p>

          <div className='bg-[#1E1E21] rounded-lg p-4 mb-6'>
            <div className='text-xs text-gray-400 mb-2'>Your Current Plan</div>
            <div className='text-lg font-semibold capitalize flex items-center justify-center gap-2'>
              {getPlanIcon(userPlan)}
              <span className='text-[#EDEDED]'>{userPlan}</span>
            </div>

            <div className='mt-3 pt-3 border-t border-gray-700'>
              <div className='text-xs text-gray-400 mb-1'>Monthly Usage</div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-300'>
                  {usageStats.used} / {usageStats.limit}
                </span>
                <span className='text-red-400'>0 left</span>
              </div>
              <div className='w-full bg-gray-700 rounded-full h-2 mt-2'>
                <div
                  className='h-2 rounded-full bg-red-400'
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/pricing')}
            className='w-full bg-[#D4AF37] text-black h-12 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-200 flex items-center justify-center gap-2'
          >
            <Crown size={18} />
            Upgrade for More Generations
          </button>

          <div className='mt-6 pt-6 border-t border-[#1E1E21]'>
            <div className='text-xs text-gray-400 mb-3'>
              Get more with {userPlan === 'empire' ? 'Pro' : 'Empire'}:
            </div>
            <div className='space-y-2 text-sm text-gray-300 text-left'>
              {getPlanFeatures(userPlan === 'empire' ? 'pro' : 'empire').map(
                (feature, index) => (
                  <div key={index} className='flex items-center gap-2'>
                    <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full flex-shrink-0'></div>
                    {feature}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const getPlanIcon = (plan) => {
  const icons = {
    free: <Zap size={20} className='text-gray-400' />,
    starter: <Rocket size={20} className='text-green-400' />,
    pro: <Crown size={20} className='text-blue-400' />,
    empire: <Star size={20} className='text-[#D4AF37]' />,
  }
  return icons[plan] || icons.free
}

export default PlanGate
