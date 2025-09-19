// File: client/src/pages/Admin/PayoutDashboard.jsx - MOBILE OPTIMIZED & RESPONSIVE
import {
  AlertCircle,
  ArrowUpRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  Edit3,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useCurrentUser } from '../../hooks/useAuth'
import {
  usePayoutActions,
  usePayoutDashboardData,
  usePayoutStatusLogic,
} from '../../hooks/usePayouts'
import Layout from '../Layout/Layout'

// Enhanced Loading Component (Mobile Optimized)
const PayoutDashboardLoader = () => {
  const [loadingStep, setLoadingStep] = React.useState(0)
  const [progress, setProgress] = React.useState(0)

  const loadingSteps = [
    'Connecting to secure servers...',
    'Verifying your account...',
    'Loading payout configuration...',
    'Fetching earnings data...',
    'Synchronizing with Stripe...',
    'Finalizing dashboard...',
  ]

  React.useEffect(() => {
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length)
    }, 800)

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95
        return prev + Math.random() * 15
      })
    }, 200)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <Layout>
      <div className='max-w-6xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8'>
        <div className='text-center space-y-4'>
          <div className='relative'>
            <div className='h-6 sm:h-8 w-32 sm:w-48 bg-gradient-to-r from-[#D4AF37]/30 via-[#D4AF37]/60 to-[#D4AF37]/30 rounded-lg mx-auto animate-pulse'></div>
            <div className='h-4 sm:h-5 w-48 sm:w-72 bg-[#1E1E21] rounded mx-auto mt-2 animate-pulse'></div>
          </div>
          <div className='max-w-md mx-auto px-4'>
            <div className='h-2 bg-[#1A1A1C] rounded-full overflow-hidden border border-[#1E1E21]'>
              <div
                className='h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] transition-all duration-300 ease-out'
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className='flex items-center justify-center gap-2 mt-3'>
              <Wallet className='text-[#D4AF37] animate-bounce' size={16} />
              <p className='text-xs sm:text-sm text-gray-400 text-center'>
                {loadingSteps[loadingStep]}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
          <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='h-20 sm:h-24 bg-gradient-to-r from-[#1A1A1C] via-[#1E1E21] to-[#1A1A1C] rounded-xl border border-[#1E1E21] animate-pulse'
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Error Display Component (Mobile Optimized)
const ErrorDisplay = ({ error, onRetry }) => (
  <Layout>
    <div className='max-w-6xl mx-auto p-3 sm:p-6'>
      <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4 sm:p-6 text-center'>
        <AlertCircle className='mx-auto mb-4 text-red-400' size={40} />
        <h2 className='text-lg sm:text-xl font-semibold text-red-400 mb-2'>
          Error Loading Dashboard
        </h2>
        <p className='text-sm sm:text-base text-gray-400 mb-4 px-2'>
          {error?.response?.data?.message ||
            error?.message ||
            'Failed to load dashboard data'}
        </p>
        <button
          onClick={onRetry}
          className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 text-sm sm:text-base'
        >
          Try Again
        </button>
      </div>
    </div>
  </Layout>
)

// Connected Bank Account Card (Mobile Optimized)
const ConnectedBankAccountCard = ({
  connectStatus,
  onManage,
  onRefresh,
  isLoading,
}) => {
  if (!connectStatus?.isVerified) return null

  return (
    <div className='bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex items-start sm:items-center gap-3 sm:gap-4'>
          <div className='w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0'>
            <CheckCircle2 className='text-green-400' size={20} />
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1'>
              <h4 className='text-sm sm:text-base text-[#EDEDED] font-semibold'>
                Bank Account Connected
              </h4>
            </div>
            <p className='text-xs sm:text-sm text-gray-400 mb-2 sm:mb-0'>
              Your payout account is verified and ready to receive payments
            </p>
            <div className='flex items-center gap-1 mt-1 sm:mt-2'>
              <Building2 className='text-gray-500' size={12} />
              <span className='text-xs text-gray-500'>
                Secured by Stripe • Last updated{' '}
                {new Date(connectStatus.lastUpdated).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className='flex items-center gap-2 sm:gap-3 self-end sm:self-auto'>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className='p-2 text-gray-400 hover:text-[#EDEDED] transition-colors duration-200 disabled:opacity-50'
            title='Refresh status'
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onManage}
            disabled={isLoading}
            className='bg-[#D4AF37] text-black px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 text-xs sm:text-sm'
          >
            <Edit3 size={12} />
            <span className='hidden sm:inline'>Manage Account</span>
            <span className='sm:hidden'>Manage</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Connect Banner Component (Mobile Optimized)
const ConnectPayoutBanner = ({ onConnect, isLoading }) => (
  <div className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-4 sm:mb-6'>
    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0'>
      <div className='flex items-center gap-3'>
        <div className='w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0'>
          <CreditCard className='text-blue-400' size={16} />
        </div>
        <div className='flex-1'>
          <h4 className='text-sm sm:text-base text-[#EDEDED] font-medium'>
            Connect your payout account
          </h4>
          <p className='text-xs sm:text-sm text-gray-400'>
            Set up your bank account to receive earnings
          </p>
        </div>
      </div>
      <button
        onClick={onConnect}
        disabled={isLoading}
        className='bg-[#D4AF37] text-black px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm w-full sm:w-auto'
      >
        {isLoading ? (
          <Loader2 size={14} className='animate-spin' />
        ) : (
          <ExternalLink size={14} />
        )}
        Connect Now
      </button>
    </div>
  </div>
)

// Zero State Component (Mobile Optimized)
const NoEarningsState = ({ user, onGetLink }) => {
  const [copied, setCopied] = useState(false)

  const referralLink = `${window.location.origin}/signup?ref=${user?.referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-8 text-center'>
      <div className='max-w-md mx-auto'>
        <Wallet className='mx-auto mb-4 sm:mb-6 text-gray-600' size={48} />
        <h3 className='text-lg sm:text-xl font-semibold text-[#EDEDED] mb-2 sm:mb-3'>
          No earnings yet
        </h3>
        <p className='text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 px-2'>
          Invite users or affiliates to start earning commission. Share your
          referral link and earn from every successful signup.
        </p>

        {/* Referral Link Display */}
        <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3 mb-4'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <Link2 className='text-[#D4AF37] flex-shrink-0' size={16} />
            <input
              type='text'
              value={referralLink}
              readOnly
              className='flex-1 bg-transparent text-[#EDEDED] text-xs sm:text-sm focus:outline-none min-w-0'
            />
            <button
              onClick={copyToClipboard}
              className='text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors duration-200 flex-shrink-0'
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <button
          onClick={onGetLink || copyToClipboard}
          className='bg-[#D4AF37] text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 w-full text-sm sm:text-base'
        >
          <Link2 size={16} />
          {copied ? 'Link Copied!' : 'Get Your Link'}
        </button>

        <div className='mt-4 sm:mt-6 text-xs text-gray-500 space-y-1'>
          <p>Direct referrals earn 40% commission</p>
          <p>Indirect referrals earn 10% commission</p>
        </div>
      </div>
    </div>
  )
}

// Enhanced Earnings Stats (Mobile Optimized)
const EarningsStatsGrid = ({ earningsSummary }) => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const calculateMTD = (earnings) => {
    if (!earnings || !Array.isArray(earnings)) return 0
    return earnings
      .filter((earning) => {
        const earningDate = new Date(earning.createdAt)
        return (
          earningDate.getMonth() === currentMonth &&
          earningDate.getFullYear() === currentYear
        )
      })
      .reduce((sum, earning) => sum + earning.commissionAmount, 0)
  }

  const totalEarned = parseFloat(
    earningsSummary?.userEarningsInfo?.totalEarned || '0'
  )
  const mtdEarnings = calculateMTD(earningsSummary?.recentEarnings || [])
  const directEarnings = totalEarned * 0.8
  const indirectEarnings = totalEarned * 0.2

  const stats = [
    {
      title: 'All-time Total',
      value: earningsSummary?.userEarningsInfo?.totalEarned || '0.00',
      subtitle: `${
        (earningsSummary?.summary?.pending?.count || 0) +
        (earningsSummary?.summary?.approved?.count || 0) +
        (earningsSummary?.summary?.paid?.count || 0)
      } total referrals`,
      icon: TrendingUp,
      iconColor: 'text-green-400',
    },
    {
      title: 'This Month',
      value: (mtdEarnings / 100).toFixed(2),
      subtitle: 'Month-to-date earnings',
      icon: Clock,
      iconColor: 'text-blue-400',
    },
    {
      title: 'Direct (40%)',
      value: directEarnings.toFixed(2),
      subtitle: 'Direct referral commissions',
      icon: Users,
      iconColor: 'text-purple-400',
    },
    {
      title: 'Indirect (10%)',
      value: indirectEarnings.toFixed(2),
      subtitle: 'Indirect referral commissions',
      icon: ArrowUpRight,
      iconColor: 'text-orange-400',
    },
  ]

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
      {stats.map((stat, index) => (
        <div
          key={index}
          className='bg-[#121214] border border-[#1E1E21] rounded-xl p-3 sm:p-4'
        >
          <div className='flex items-center justify-between mb-2'>
            <h4 className='text-gray-400 text-xs sm:text-sm font-medium'>
              {stat.title}
            </h4>
            <stat.icon className={stat.iconColor} size={14} />
          </div>
          <div className='text-lg sm:text-2xl font-bold text-[#EDEDED] mb-1'>
            ${stat.value}
          </div>
          <div className='text-xs text-gray-400'>{stat.subtitle}</div>
        </div>
      ))}
    </div>
  )
}

// Available for Payout Card (Mobile Optimized)
const AvailablePayoutCard = ({
  earningsSummary,
  onRequestPayout,
  canRequestPayout,
}) => {
  const availableAmount = parseFloat(
    earningsSummary?.userEarningsInfo?.availableForPayout || '0'
  )

  return (
    <div className='bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 sm:p-6'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='flex-1'>
          <h3 className='text-[#EDEDED] font-semibold text-base sm:text-lg mb-1'>
            Available for Payout
          </h3>
          <div className='text-2xl sm:text-3xl font-bold text-green-400 mb-2'>
            ${availableAmount.toFixed(2)}
          </div>
          <p className='text-gray-400 text-xs sm:text-sm'>
            {earningsSummary?.summary?.approved?.count || 0} approved earnings
            ready for withdrawal
          </p>
        </div>
        <div className='flex flex-col sm:flex-row items-center gap-3 sm:gap-4'>
          <Wallet className='text-green-400' size={28} />
          {availableAmount >= 10 ? (
            <button
              onClick={onRequestPayout}
              disabled={!canRequestPayout}
              className='bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base w-full sm:w-auto'
            >
              Request Payout
            </button>
          ) : (
            <div className='text-xs text-gray-500 text-center'>
              Minimum: $10.00
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Recent Transactions Component (Mobile Optimized)
const RecentTransactions = ({ recentEarnings, payoutHistory }) => {
  const allTransactions = [
    ...(recentEarnings || []).map((earning) => ({
      ...earning,
      type: 'earning',
      amount: earning.commissionAmount,
      date: earning.createdAt,
      description: `Commission from ${
        earning.referredUser?.name || 'Unknown User'
      }`,
    })),
    ...(payoutHistory?.data?.payouts || []).map((payout) => ({
      ...payout,
      type: 'payout',
      amount: -payout.amount,
      date: payout.requestedAt,
      description: `${
        payout.method.charAt(0).toUpperCase() + payout.method.slice(1)
      } payout`,
    })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8)

  if (allTransactions.length === 0) {
    return (
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
        <h3 className='text-[#EDEDED] font-semibold mb-4 text-base sm:text-lg'>
          Recent Transactions
        </h3>
        <div className='text-center py-6 sm:py-8'>
          <FileText className='mx-auto text-gray-600 mb-3' size={32} />
          <p className='text-gray-400 text-sm'>No transactions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
      <h3 className='text-[#EDEDED] font-semibold mb-4 text-base sm:text-lg'>
        Recent Transactions
      </h3>
      <div className='space-y-3'>
        {allTransactions.map((transaction, index) => (
          <div
            key={`${transaction.type}-${transaction._id || index}`}
            className='flex items-center justify-between p-3 bg-[#1A1A1C] rounded-lg gap-3'
          >
            <div className='flex items-center gap-3 flex-1 min-w-0'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  transaction.type === 'earning'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {transaction.type === 'earning' ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <Wallet size={14} />
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <div className='text-[#EDEDED] font-medium text-xs sm:text-sm truncate'>
                  {transaction.description}
                </div>
                <div className='text-gray-400 text-xs'>
                  {new Date(transaction.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
            <div className='text-right flex-shrink-0'>
              <div
                className={`font-semibold text-sm ${
                  transaction.type === 'earning'
                    ? 'text-green-400'
                    : 'text-blue-400'
                }`}
              >
                {transaction.type === 'earning' ? '+' : ''}$
                {Math.abs(transaction.amount / 100).toFixed(2)}
              </div>
              {transaction.status && (
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    transaction.status === 'paid'
                      ? 'bg-green-500/10 text-green-400'
                      : transaction.status === 'approved'
                      ? 'bg-blue-500/10 text-blue-400'
                      : transaction.status === 'pending'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {transaction.status}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Status Badge Component
const StatusBadge = ({ status, type = 'earning' }) => {
  const getClasses = () => {
    const configs = {
      earning: {
        pending: 'bg-yellow-500/10 text-yellow-400',
        approved: 'bg-blue-500/10 text-blue-400',
        paid: 'bg-green-500/10 text-green-400',
        disputed: 'bg-red-500/10 text-red-400',
      },
      payout: {
        pending: 'bg-yellow-500/10 text-yellow-400',
        processing: 'bg-blue-500/10 text-blue-400',
        in_transit: 'bg-purple-500/10 text-purple-400',
        paid: 'bg-green-500/10 text-green-400',
        failed: 'bg-red-500/10 text-red-400',
        cancelled: 'bg-gray-500/10 text-gray-400',
      },
    }
    return configs[type][status] || configs[type].pending
  }

  return (
    <span
      className={`px-2 py-1 rounded-lg text-xs font-medium ${getClasses()}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  )
}

// Connect Onboarding Modal (Mobile Optimized)
const ConnectOnboardingModal = ({
  show,
  onClose,
  connectStatus,
  onAction,
  isLoading,
}) => {
  if (!show) return null

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-4 sm:p-6 mx-4'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-base sm:text-lg font-semibold text-[#EDEDED]'>
            {connectStatus?.connected ? 'Complete Setup' : 'Set Up Payouts'}
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-[#EDEDED] p-1'
          >
            <X size={20} />
          </button>
        </div>

        <div className='space-y-4'>
          <div className='flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
            <Wallet className='text-blue-400 mt-0.5 flex-shrink-0' size={16} />
            <div className='flex-1'>
              <h4 className='text-blue-400 font-medium text-sm'>
                Connect Your Bank Account
              </h4>
              <p className='text-gray-400 text-xs mt-1'>
                We use Stripe to securely handle your payouts. You'll be
                redirected to complete setup.
              </p>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 pt-4'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] transition-all duration-300 text-sm sm:text-base'
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose()
                onAction(
                  connectStatus?.actions?.canRetryOnboarding
                    ? 'onboarding'
                    : 'create'
                )
              }}
              disabled={isLoading}
              className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base'
            >
              {isLoading ? (
                <Loader2 size={14} className='animate-spin' />
              ) : (
                <ExternalLink size={14} />
              )}
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Payout Request Modal (Mobile Optimized)
const PayoutRequestModal = ({
  show,
  onClose,
  onSubmit,
  earningsSummary,
  connectStatus,
  isLoading,
}) => {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('standard')

  if (!show) return null

  const maxAmount = parseFloat(
    earningsSummary?.userEarningsInfo?.availableForPayout || '0'
  )
  const minAmount = 10

  const handleSubmit = () => {
    onSubmit({ amount: Math.round(parseFloat(amount) * 100), method })
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-4 sm:p-6 mx-4'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-base sm:text-lg font-semibold text-[#EDEDED]'>
            Request Payout
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-[#EDEDED] p-1'
          >
            <X size={20} />
          </button>
        </div>

        <div className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-400 mb-2'>
              Amount (USD)
            </label>
            <input
              type='number'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minAmount}
              max={maxAmount}
              step='0.01'
              placeholder={`Min: $${minAmount}`}
              className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-3 text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]/40 text-sm sm:text-base'
            />
            <div className='flex justify-between text-xs text-gray-400 mt-1'>
              <span>Available: ${maxAmount.toFixed(2)}</span>
              <button
                onClick={() => setAmount(maxAmount.toString())}
                className='text-[#D4AF37] hover:text-[#D4AF37]/80'
              >
                Max
              </button>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row gap-3 pt-4'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-3 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] transition-all duration-300 text-sm sm:text-base'
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                !amount ||
                parseFloat(amount) < minAmount ||
                parseFloat(amount) > maxAmount
              }
              className='flex-1 px-4 py-3 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base'
            >
              {isLoading ? (
                <Loader2 size={14} className='animate-spin' />
              ) : (
                'Request Payout'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main PayoutDashboard Component (Mobile Optimized)
const PayoutDashboard = () => {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const currentUser = useCurrentUser()

  const {
    connectStatus,
    earningsSummary,
    payoutHistory,
    isLoading,
    isError,
    error,
    refetch,
  } = usePayoutDashboardData()

  const { handleAction, isLoading: actionLoading } = usePayoutActions()
  const statusLogic = usePayoutStatusLogic(connectStatus)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('onboarded') === 'true') {
      console.log('User returned from Stripe onboarding, refreshing status...')
      handleAction('refresh').then(() => {
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      })
    }
  }, [handleAction])

  const hasEarnings =
    earningsSummary?.data &&
    (parseFloat(earningsSummary.data.userEarningsInfo?.totalEarned || '0') >
      0 ||
      earningsSummary.data.recentEarnings?.length > 0)

  if (isLoading) {
    return <PayoutDashboardLoader />
  }

  if (isError) {
    return <ErrorDisplay error={error} onRetry={refetch} />
  }

  const handlePayoutRequest = async (data) => {
    try {
      await handleAction('payout', data)
      setShowRequestModal(false)
      refetch()
    } catch (error) {
      console.error('Payout request failed:', error)
    }
  }

  const handleManageAccount = async () => {
    try {
      await handleAction('management')
    } catch (error) {
      console.error('Manage account failed:', error)
    }
  }

  const handleRefreshStatus = async () => {
    try {
      await handleAction('refresh')
    } catch (error) {
      console.error('Refresh failed:', error)
    }
  }

  // Tab Components
  const OverviewTab = () => (
    <div className='space-y-4 sm:space-y-6'>
      {statusLogic.isVerified ? (
        <ConnectedBankAccountCard
          connectStatus={connectStatus?.data}
          onManage={handleManageAccount}
          onRefresh={handleRefreshStatus}
          isLoading={actionLoading}
        />
      ) : (
        <ConnectPayoutBanner
          onConnect={() => setShowConnectModal(true)}
          isLoading={actionLoading}
        />
      )}

      {!hasEarnings ? (
        <NoEarningsState user={currentUser} />
      ) : (
        <>
          <EarningsStatsGrid earningsSummary={earningsSummary?.data} />
          <AvailablePayoutCard
            earningsSummary={earningsSummary?.data}
            onRequestPayout={() => setShowRequestModal(true)}
            canRequestPayout={statusLogic.canRequestPayout}
          />
          <RecentTransactions
            recentEarnings={earningsSummary?.data?.recentEarnings}
            payoutHistory={payoutHistory}
          />
        </>
      )}
    </div>
  )

  const EarningsTab = () => (
    <div className='space-y-4 sm:space-y-6'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
        <h3 className='text-[#EDEDED] font-semibold text-base sm:text-lg mb-4'>
          All Earnings
        </h3>
        <div className='text-center py-8 sm:py-12'>
          <Wallet className='mx-auto text-gray-600 mb-4' size={40} />
          <p className='text-gray-400 text-sm'>
            Detailed earnings view coming soon
          </p>
        </div>
      </div>
    </div>
  )

  const PayoutsTab = () => (
    <div className='space-y-4 sm:space-y-6'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6'>
          <h3 className='text-[#EDEDED] font-semibold text-base sm:text-lg'>
            Payout History
          </h3>
          {statusLogic.canRequestPayout && (
            <button
              onClick={() => setShowRequestModal(true)}
              className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto'
            >
              <ArrowUpRight size={14} />
              Request Payout
            </button>
          )}
        </div>

        {!payoutHistory?.data?.payouts?.length ? (
          <div className='text-center py-8 sm:py-12'>
            <FileText className='mx-auto text-gray-600 mb-4' size={40} />
            <p className='text-gray-400 text-sm'>No payout requests yet</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {payoutHistory.data.payouts.map((payout) => (
              <div
                key={payout._id}
                className='flex items-center justify-between p-3 bg-[#1A1A1C] rounded-lg gap-3'
              >
                <div className='flex-1 min-w-0'>
                  <div className='text-[#EDEDED] font-medium text-sm'>
                    {new Date(payout.requestedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div className='text-gray-400 text-xs capitalize'>
                    {payout.method} payout
                  </div>
                </div>
                <div className='text-right flex-shrink-0'>
                  <div className='text-[#EDEDED] font-semibold text-sm'>
                    ${(payout.amount / 100).toFixed(2)}
                  </div>
                  <StatusBadge status={payout.status} type='payout' />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'earnings', label: 'Earnings', icon: DollarSign },
    { id: 'payouts', label: 'Payouts', icon: Wallet },
  ]

  return (
    <Layout>
      <div className='max-w-6xl mx-auto p-3 sm:p-6 space-y-6 sm:space-y-8'>
        {/* Header */}
        <div className='px-1'>
          <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-1 sm:mb-2'>
            Payouts
          </h1>
          <p className='text-sm sm:text-base text-gray-400'>
            Manage your earnings and payout settings
          </p>
        </div>

        {/* Tabs */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
          <div className='border-b border-[#1E1E21] overflow-x-auto'>
            <nav className='flex min-w-max'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'border-[#D4AF37] text-[#D4AF37]'
                      : 'border-transparent text-gray-400 hover:text-[#EDEDED]'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className='p-4 sm:p-6'>
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'earnings' && <EarningsTab />}
            {activeTab === 'payouts' && <PayoutsTab />}
          </div>
        </div>

        {/* Modals */}
        <ConnectOnboardingModal
          show={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          connectStatus={connectStatus?.data}
          onAction={handleAction}
          isLoading={actionLoading}
        />
        <PayoutRequestModal
          show={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          onSubmit={handlePayoutRequest}
          earningsSummary={earningsSummary?.data}
          connectStatus={connectStatus?.data}
          isLoading={actionLoading}
        />
      </div>
    </Layout>
  )
}

export default PayoutDashboard
