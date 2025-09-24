// File: client/src/components/PlanBadge.jsx
import { Crown, Rocket, Star, Zap } from 'lucide-react'
import React from 'react'

const PlanBadge = ({ plan, size = 'md' }) => {
  const badges = {
    free: {
      icon: Zap,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
    },
    starter: {
      icon: Rocket,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
    },
    pro: {
      icon: Crown,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
    },
    empire: {
      icon: Star,
      color: 'text-[#D4AF37]',
      bg: 'bg-[#D4AF37]/10',
      border: 'border-[#D4AF37]/20',
    },
  }

  const badge = badges[plan] || badges.free
  const Icon = badge.icon

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }

  return (
    <div
      className={`inline-flex items-center gap-2 ${badge.bg} border ${badge.border} rounded-full ${sizeClasses[size]}`}
    >
      <Icon size={iconSizes[size]} className={badge.color} />
      <span className={`${badge.color} font-medium capitalize`}>{plan}</span>
    </div>
  )
}

export default PlanBadge
