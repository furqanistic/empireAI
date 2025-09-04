// File: client/src/components/AIBuilder/BusinessPlanHistory.jsx - COMPACT VERSION
import { useBusinessPlanHistory } from '@/hooks/useBusinessPlans'
import {
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  Rocket,
  Target,
  Users,
  XCircle,
} from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

const BusinessPlanHistory = ({ onLoadPlan, currentPlanId }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [loadingPlanId, setLoadingPlanId] = useState(null)
  const { token } = useSelector((state) => state.user)

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useBusinessPlanHistory({ page: currentPage, limit: 10 }, !!token)

  if (!token) return null

  const businessPlans = historyData?.data?.businessPlans || []
  const totalPages = historyData?.totalPages || 1
  const hasHistory = businessPlans.length > 0

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return 'now'
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={12} className='text-green-400' />
      case 'pending':
        return <Clock size={12} className='text-yellow-400 animate-pulse' />
      case 'failed':
        return <XCircle size={12} className='text-red-400' />
      default:
        return <Clock size={12} className='text-gray-400' />
    }
  }

  const getNicheIcon = (niche) => {
    const iconMap = {
      fitness: '💪',
      tech: '💻',
      finance: '💰',
      education: '📚',
      ecommerce: '🛒',
      food: '🍽️',
      travel: '✈️',
      fashion: '👕',
      pets: '🐾',
      home: '🏠',
      entertainment: '🎮',
      creative: '🎨',
    }
    return iconMap[niche] || '📈'
  }

  const getBusinessModelIcon = (model) => {
    const iconMap = {
      saas: <Rocket size={10} />,
      ecommerce: <Briefcase size={10} />,
      marketplace: <Users size={10} />,
      coaching: <Target size={10} />,
      subscription: <DollarSign size={10} />,
      content: <FileText size={10} />,
    }
    return iconMap[model] || <BarChart3 size={10} />
  }

  const handleLoadPlan = async (plan) => {
    if (plan.status !== 'completed' || !plan.generatedPlan) return

    setLoadingPlanId(plan._id)
    try {
      await new Promise((resolve) => setTimeout(resolve, 200))
      onLoadPlan({
        id: plan._id,
        plan: plan.generatedPlan,
        metadata: {
          niche: plan.niche,
          businessModel: plan.businessModel,
          targetMarket: plan.targetMarket,
          customContext: plan.customContext,
          createdAt: plan.createdAt,
          dataSource: plan.dataSource,
        },
      })
    } finally {
      setLoadingPlanId(null)
    }
  }

  return (
    <div className='w-full max-w-7xl mx-auto mb-6'>
      <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4'>
        {/* Compact Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='flex items-center justify-between w-full mb-3 text-left group'
        >
          <div className='flex items-center gap-2'>
            <BarChart3 size={18} className='text-[#D4AF37]' />
            <h3 className='text-base font-semibold text-[#EDEDED] group-hover:text-[#D4AF37] transition-colors'>
              Recent Plans
            </h3>
            <span className='text-xs text-gray-400'>
              ({historyData?.totalResults || 0})
            </span>
          </div>

          <div className='flex items-center gap-2'>
            {hasHistory && !isCollapsed && (
              <span className='text-xs text-gray-500'>Click to load</span>
            )}
            {isCollapsed ? (
              <ChevronDown size={16} className='text-gray-400' />
            ) : (
              <ChevronUp size={16} className='text-gray-400' />
            )}
          </div>
        </button>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className='flex items-center justify-center py-6'>
                <RefreshCw
                  size={16}
                  className='animate-spin text-[#D4AF37] mr-2'
                />
                <span className='text-sm text-gray-400'>Loading...</span>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className='text-center py-4'>
                <XCircle size={20} className='text-red-400 mx-auto mb-2' />
                <p className='text-sm text-red-400 mb-2'>
                  Failed to load plans
                </p>
                <button
                  onClick={() => refetch()}
                  className='text-[#D4AF37] hover:underline text-xs'
                >
                  Retry
                </button>
              </div>
            )}

            {/* No History */}
            {!isLoading && !error && !hasHistory && (
              <div className='text-center py-6'>
                <Rocket size={20} className='text-gray-400 mx-auto mb-2' />
                <p className='text-sm text-gray-400'>No business plans yet</p>
              </div>
            )}

            {/* Compact History Grid */}
            {!isLoading && !error && hasHistory && (
              <>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2'>
                  {businessPlans.map((plan) => {
                    const isCurrentPlan = currentPlanId === plan._id
                    const canLoad =
                      plan.status === 'completed' && plan.generatedPlan
                    const isLoadingPlan = loadingPlanId === plan._id

                    return (
                      <button
                        key={plan._id}
                        onClick={() => canLoad && handleLoadPlan(plan)}
                        disabled={!canLoad || isLoadingPlan}
                        className={`p-2.5 rounded-lg border transition-all duration-150 text-left group relative ${
                          isCurrentPlan
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : canLoad
                            ? 'border-[#1E1E21] bg-gradient-to-br from-[#1A1A1C] to-[#0F0F11] hover:border-[#D4AF37]/40 hover:scale-105'
                            : 'border-[#1E1E21] bg-gradient-to-br from-[#1A1A1C] to-[#0F0F11] opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {/* Current indicator */}
                        {isCurrentPlan && (
                          <div className='absolute -top-1 -right-1 bg-[#D4AF37] text-black text-xs px-1.5 py-0.5 rounded-full font-bold text-[10px] leading-none'>
                            Current
                          </div>
                        )}

                        {/* Loading Overlay */}
                        {isLoadingPlan && (
                          <div className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg'>
                            <Loader2
                              size={16}
                              className='animate-spin text-[#D4AF37]'
                            />
                          </div>
                        )}

                        {/* Compact Content */}
                        <div
                          className={`space-y-2 ${
                            isLoadingPlan ? 'opacity-50' : ''
                          }`}
                        >
                          {/* Title with niche icon */}
                          <div className='flex items-start gap-1.5'>
                            <span className='text-sm flex-shrink-0 mt-0.5'>
                              {getNicheIcon(plan.niche)}
                            </span>
                            <h4
                              className={`font-medium text-xs line-clamp-2 leading-tight ${
                                isCurrentPlan
                                  ? 'text-[#D4AF37]'
                                  : 'text-[#EDEDED] group-hover:text-[#D4AF37]'
                              } transition-colors`}
                            >
                              {plan.generatedPlan?.title || 'Business Plan'}
                            </h4>
                          </div>

                          {/* Tags */}
                          <div className='flex items-center gap-1 flex-wrap'>
                            <div className='flex items-center gap-0.5 px-1.5 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] rounded text-[10px] font-medium'>
                              {getBusinessModelIcon(plan.businessModel)}
                              <span className='capitalize'>
                                {plan.businessModel}
                              </span>
                            </div>
                            <div className='px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-medium'>
                              {plan.targetMarket.toUpperCase()}
                            </div>
                          </div>

                          {/* Status and Date */}
                          <div className='flex items-center justify-between text-[10px]'>
                            <div className='flex items-center gap-1 text-gray-400'>
                              <Calendar size={8} />
                              <span>{formatDate(plan.createdAt)}</span>
                            </div>
                            <div className='flex items-center gap-0.5'>
                              {getStatusIcon(plan.status)}
                            </div>
                          </div>

                          {/* Status messages */}
                          {plan.status === 'pending' && (
                            <div className='text-[10px] text-yellow-400'>
                              Generating...
                            </div>
                          )}
                          {plan.status === 'failed' && (
                            <div className='text-[10px] text-red-400'>
                              Failed
                            </div>
                          )}
                          {canLoad && !isCurrentPlan && !isLoadingPlan && (
                            <div className='text-[10px] text-gray-500 group-hover:text-[#D4AF37] transition-colors'>
                              Click to load
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Compact Pagination */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-between mt-3 pt-3 border-t border-[#1E1E21]'>
                    <span className='text-[10px] text-gray-500'>
                      {businessPlans.length} of {historyData?.totalResults}
                    </span>

                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className='p-1 rounded border border-[#1E1E21] text-gray-400 hover:text-[#EDEDED] disabled:opacity-40 disabled:cursor-not-allowed'
                      >
                        <ChevronLeft size={12} />
                      </button>

                      <span className='text-[10px] text-gray-400 px-1'>
                        {currentPage}/{totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className='p-1 rounded border border-[#1E1E21] text-gray-400 hover:text-[#EDEDED] disabled:opacity-40 disabled:cursor-not-allowed'
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default BusinessPlanHistory
