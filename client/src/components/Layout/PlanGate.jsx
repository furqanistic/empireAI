// File: client/src/components/PlanGate.jsx
import {
  getPlanFeatures,
  getRequiredPlan,
  useCheckPlanAccess,
} from '@/hooks/usePlanAccess'
import { Crown, Lock, Rocket, Star, Zap } from 'lucide-react'
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const PlanGate = ({ children, requiredFeature }) => {
  const navigate = useNavigate()
  const { hasAccess, userPlan, isActive } = useCheckPlanAccess(requiredFeature)
  const requiredPlan = getRequiredPlan(requiredFeature)

  // DEBUG: Log everything
  useEffect(() => {
    console.log('🔒 PlanGate Debug:', {
      requiredFeature,
      userPlan,
      isActive,
      hasAccess,
      requiredPlan,
    })
  }, [requiredFeature, userPlan, isActive, hasAccess, requiredPlan])

  if (hasAccess) {
    return <>{children}</>
  }

  // Rest of your component...
  return (
    <div className='min-h-[60vh] flex items-center justify-center p-6'>
      <div className='max-w-md w-full'>
        <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-2xl p-8 text-center'>
          <div className='bg-[#D4AF37]/10 rounded-full p-4 w-fit mx-auto mb-6'>
            <Lock size={32} className='text-[#D4AF37]' />
          </div>

          <h2 className='text-2xl font-bold text-[#EDEDED] mb-3'>
            Upgrade to Access This Feature
          </h2>

          <p className='text-gray-400 mb-6'>
            This AI Builder requires the{' '}
            <span className='text-[#D4AF37] font-semibold capitalize'>
              {requiredPlan}
            </span>{' '}
            plan or higher.
          </p>

          <div className='bg-[#1E1E21] rounded-lg p-4 mb-6'>
            <div className='text-xs text-gray-400 mb-2'>Your Current Plan</div>
            <div className='text-lg font-semibold capitalize flex items-center justify-center gap-2'>
              {getPlanIcon(userPlan)}
              <span className='text-[#EDEDED]'>{userPlan}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/pricing')}
            className='w-full bg-[#D4AF37] text-black h-12 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-200 flex items-center justify-center gap-2'
          >
            <Crown size={18} />
            Upgrade to{' '}
            {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
          </button>

          <div className='mt-6 pt-6 border-t border-[#1E1E21]'>
            <div className='text-xs text-gray-400 mb-3'>
              Unlock with {requiredPlan}:
            </div>
            <div className='space-y-2 text-sm text-gray-300 text-left'>
              {getPlanFeatures(requiredPlan).map((feature, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full flex-shrink-0'></div>
                  {feature}
                </div>
              ))}
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
