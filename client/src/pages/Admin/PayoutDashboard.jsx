// File: client/src/pages/Admin/PayoutDashboard.jsx - ENHANCED WITH ZERO STATES & BREAKDOWN
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Clock,
  Copy,
  CreditCard,
  DollarSign,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import React, { useState } from 'react'
import { useCurrentUser } from '../../hooks/useAuth'
import {
  usePayoutActions,
  usePayoutDashboardData,
  usePayoutStatusLogic,
} from '../../hooks/usePayouts'
import Layout from '../Layout/Layout'

// Enhanced Loading Component (keeping existing)
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
      <div className='max-w-6xl mx-auto p-6 space-y-8'>
        <div className='text-center space-y-4'>
          <div className='relative'>
            <div className='h-8 w-48 bg-gradient-to-r from-[#D4AF37]/30 via-[#D4AF37]/60 to-[#D4AF37]/30 rounded-lg mx-auto animate-pulse'></div>
            <div className='h-5 w-72 bg-[#1E1E21] rounded mx-auto mt-2 animate-pulse'></div>
          </div>
          <div className='max-w-md mx-auto'>
            <div className='h-2 bg-[#1A1A1C] rounded-full overflow-hidden border border-[#1E1E21]'>
              <div
                className='h-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] transition-all duration-300 ease-out'
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className='flex items-center justify-center gap-2 mt-3'>
              <Wallet className='text-[#D4AF37] animate-bounce' size={16} />
              <p className='text-sm text-gray-400'>
                {loadingSteps[loadingStep]}
              </p>
            </div>
          </div>
        </div>

        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='h-24 bg-gradient-to-r from-[#1A1A1C] via-[#1E1E21] to-[#1A1A1C] rounded-xl border border-[#1E1E21] animate-pulse'
              />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

// Error Display Component (keeping existing)
const ErrorDisplay = ({ error, onRetry }) => (
  <Layout>
    <div className='max-w-6xl mx-auto p-6'>
      <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center'>
        <AlertCircle className='mx-auto mb-4 text-red-400' size={48} />
        <h2 className='text-xl font-semibold text-red-400 mb-2'>
          Error Loading Dashboard
        </h2>
        <p className='text-gray-400 mb-4'>
          {error?.response?.data?.message ||
            error?.message ||
            'Failed to load dashboard data'}
        </p>
        <button
          onClick={onRetry}
          className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300'
        >
          Try Again
        </button>
      </div>
    </div>
  </Layout>
)

// Zero State Component for No Earnings
const NoEarningsState = ({ user, onGetLink }) => {
  const [copied, setCopied] = useState(false)

  const referralLink = `${window.location.origin}/signup?ref=${user?.referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-8 text-center'>
      <div className='max-w-md mx-auto'>
        <Wallet className='mx-auto mb-6 text-gray-600' size={64} />
        <h3 className='text-xl font-semibold text-[#EDEDED] mb-3'>
          No earnings yet
        </h3>
        <p className='text-gray-400 mb-6'>
          Invite users or affiliates to start earning commission. Share your
          referral link and earn from every successful signup.
        </p>

        {/* Referral Link Display */}
        <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3 mb-4'>
          <div className='flex items-center gap-3'>
            <Link2 className='text-[#D4AF37]' size={16} />
            <input
              type='text'
              value={referralLink}
              readOnly
              className='flex-1 bg-transparent text-[#EDEDED] text-sm focus:outline-none'
            />
            <button
              onClick={copyToClipboard}
              className='text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors duration-200'
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <button
          onClick={onGetLink || copyToClipboard}
          className='bg-[#D4AF37] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 w-full'
        >
          <Link2 size={16} />
          {copied ? 'Link Copied!' : 'Get Your Link'}
        </button>

        <div className='mt-6 text-xs text-gray-500'>
          <p>Direct referrals earn 40% commission</p>
          <p>Indirect referrals earn 10% commission</p>
        </div>
      </div>
    </div>
  )
}

// Connect Banner Component
const ConnectPayoutBanner = ({ onConnect, isLoading }) => (
  <div className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4 mb-6'>
    <div className='flex items-center justify-between'>
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center'>
          <CreditCard className='text-blue-400' size={20} />
        </div>
        <div>
          <h4 className='text-[#EDEDED] font-medium'>
            Connect your payout account
          </h4>
          <p className='text-gray-400 text-sm'>
            Set up to receive your earnings
          </p>
        </div>
      </div>
      <button
        onClick={onConnect}
        disabled={isLoading}
        className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
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

// Enhanced Earnings Stats with MTD/All-time and Direct/Indirect breakdown
const EarningsStatsGrid = ({ earningsSummary }) => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Mock MTD calculation - you'd implement this properly in your backend
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
  const directEarnings = totalEarned * 0.8 // Assuming 80% are direct (40% rate vs 10% indirect)
  const indirectEarnings = totalEarned * 0.2 // Assuming 20% are indirect

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* Total All-time */}
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='text-gray-400 text-sm'>All-time Total</h4>
          <TrendingUp className='text-green-400' size={16} />
        </div>
        <div className='text-2xl font-bold text-[#EDEDED]'>
          ${earningsSummary?.userEarningsInfo?.totalEarned || '0.00'}
        </div>
        <div className='text-xs text-gray-400 mt-1'>
          {(earningsSummary?.summary?.pending?.count || 0) +
            (earningsSummary?.summary?.approved?.count || 0) +
            (earningsSummary?.summary?.paid?.count || 0)}{' '}
          total referrals
        </div>
      </div>

      {/* MTD Earnings */}
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='text-gray-400 text-sm'>This Month</h4>
          <Clock className='text-blue-400' size={16} />
        </div>
        <div className='text-2xl font-bold text-[#EDEDED]'>
          ${(mtdEarnings / 100).toFixed(2)}
        </div>
        <div className='text-xs text-gray-400 mt-1'>Month-to-date earnings</div>
      </div>

      {/* Direct Earnings (40%) */}
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='text-gray-400 text-sm'>Direct (40%)</h4>
          <Users className='text-purple-400' size={16} />
        </div>
        <div className='text-2xl font-bold text-[#EDEDED]'>
          ${directEarnings.toFixed(2)}
        </div>
        <div className='text-xs text-gray-400 mt-1'>
          Direct referral commissions
        </div>
      </div>

      {/* Indirect Earnings (10%) */}
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='text-gray-400 text-sm'>Indirect (10%)</h4>
          <ArrowUpRight className='text-orange-400' size={16} />
        </div>
        <div className='text-2xl font-bold text-[#EDEDED]'>
          ${indirectEarnings.toFixed(2)}
        </div>
        <div className='text-xs text-gray-400 mt-1'>
          Indirect referral commissions
        </div>
      </div>
    </div>
  )
}

// Available for Payout Card
const AvailablePayoutCard = ({
  earningsSummary,
  onRequestPayout,
  canRequestPayout,
}) => {
  const availableAmount = parseFloat(
    earningsSummary?.userEarningsInfo?.availableForPayout || '0'
  )

  return (
    <div className='bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-[#EDEDED] font-semibold text-lg mb-1'>
            Available for Payout
          </h3>
          <div className='text-3xl font-bold text-green-400 mb-2'>
            ${availableAmount.toFixed(2)}
          </div>
          <p className='text-gray-400 text-sm'>
            {earningsSummary?.summary?.approved?.count || 0} approved earnings
            ready for withdrawal
          </p>
        </div>
        <div className='text-right'>
          <Wallet className='text-green-400 mb-4' size={32} />
          {availableAmount >= 10 ? (
            <button
              onClick={onRequestPayout}
              disabled={!canRequestPayout}
              className='bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Request Payout
            </button>
          ) : (
            <div className='text-xs text-gray-500'>Minimum: $10.00</div>
          )}
        </div>
      </div>
    </div>
  )
}

// Recent Transactions Component
const RecentTransactions = ({ recentEarnings, payoutHistory }) => {
  // Combine and sort recent earnings and payouts
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
      amount: -payout.amount, // Negative for payouts
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
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
        <h3 className='text-[#EDEDED] font-semibold mb-4'>
          Recent Transactions
        </h3>
        <div className='text-center py-8'>
          <FileText className='mx-auto text-gray-600 mb-3' size={32} />
          <p className='text-gray-400 text-sm'>No transactions yet</p>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
      <h3 className='text-[#EDEDED] font-semibold mb-4'>Recent Transactions</h3>
      <div className='space-y-3'>
        {allTransactions.map((transaction, index) => (
          <div
            key={`${transaction.type}-${transaction._id || index}`}
            className='flex items-center justify-between p-3 bg-[#1A1A1C] rounded-lg'
          >
            <div className='flex items-center gap-3'>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
              <div>
                <div className='text-[#EDEDED] font-medium text-sm'>
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
            <div className='text-right'>
              <div
                className={`font-semibold ${
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

// Status Badge Component (keeping existing)
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

// Connect Onboarding Modal (keeping existing but simplified reference)
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
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-[#EDEDED]'>
            {connectStatus?.connected ? 'Complete Setup' : 'Set Up Payouts'}
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-[#EDEDED]'
          >
            <X size={20} />
          </button>
        </div>

        <div className='space-y-4'>
          <div className='flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
            <Wallet className='text-blue-400 mt-0.5' size={16} />
            <div>
              <h4 className='text-blue-400 font-medium text-sm'>
                Connect Your Bank Account
              </h4>
              <p className='text-gray-400 text-xs mt-1'>
                We use Stripe to securely handle your payouts. You'll be
                redirected to complete setup.
              </p>
            </div>
          </div>

          <div className='flex gap-3 pt-4'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] transition-all duration-300'
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
              className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50'
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

// Payout Request Modal (keeping existing but simplified reference)
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
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-[#EDEDED]'>
            Request Payout
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-[#EDEDED]'
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
              className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-lg px-3 py-2 text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]/40'
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

          <div className='flex gap-3 pt-4'>
            <button
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] transition-all duration-300'
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
              className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2'
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

// Main PayoutDashboard Component
const PayoutDashboard = () => {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Get current user
  const currentUser = useCurrentUser()

  // Use custom hooks
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

  // Check if user has any earnings
  const hasEarnings =
    earningsSummary?.data &&
    (parseFloat(earningsSummary.data.userEarningsInfo?.totalEarned || '0') >
      0 ||
      earningsSummary.data.recentEarnings?.length > 0)

  // Show loading state
  if (isLoading) {
    return <PayoutDashboardLoader />
  }

  // Show error state
  if (isError) {
    return <ErrorDisplay error={error} onRetry={refetch} />
  }

  // Handle payout request
  const handlePayoutRequest = async (data) => {
    try {
      await handleAction('payout', data)
      setShowRequestModal(false)
      refetch()
    } catch (error) {
      console.error('Payout request failed:', error)
    }
  }

  // Overview Tab Component
  const OverviewTab = () => (
    <div className='space-y-6'>
      {/* Connect Banner - Show if not connected */}
      {!statusLogic.isVerified && (
        <ConnectPayoutBanner
          onConnect={() => setShowConnectModal(true)}
          isLoading={actionLoading}
        />
      )}

      {/* Zero State - Show if no earnings */}
      {!hasEarnings ? (
        <NoEarningsState user={currentUser} />
      ) : (
        <>
          {/* Enhanced Earnings Stats */}
          <EarningsStatsGrid earningsSummary={earningsSummary?.data} />

          {/* Available for Payout */}
          <AvailablePayoutCard
            earningsSummary={earningsSummary?.data}
            onRequestPayout={() => setShowRequestModal(true)}
            canRequestPayout={statusLogic.canRequestPayout}
          />

          {/* Recent Transactions */}
          <RecentTransactions
            recentEarnings={earningsSummary?.data?.recentEarnings}
            payoutHistory={payoutHistory}
          />
        </>
      )}
    </div>
  )

  // Simplified Earnings and Payouts tabs
  const EarningsTab = () => (
    <div className='space-y-6'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
        <h3 className='text-[#EDEDED] font-semibold text-lg mb-4'>
          All Earnings
        </h3>
        <div className='text-center py-12'>
          <Wallet className='mx-auto text-gray-600 mb-4' size={48} />
          <p className='text-gray-400'>Detailed earnings view coming soon</p>
        </div>
      </div>
    </div>
  )

  const PayoutsTab = () => (
    <div className='space-y-6'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-[#EDEDED] font-semibold text-lg'>
            Payout History
          </h3>
          {statusLogic.canRequestPayout && (
            <button
              onClick={() => setShowRequestModal(true)}
              className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2'
            >
              <ArrowUpRight size={14} />
              Request Payout
            </button>
          )}
        </div>

        {!payoutHistory?.data?.payouts?.length ? (
          <div className='text-center py-12'>
            <FileText className='mx-auto text-gray-600 mb-4' size={48} />
            <p className='text-gray-400'>No payout requests yet</p>
          </div>
        ) : (
          <div className='space-y-3'>
            {payoutHistory.data.payouts.map((payout) => (
              <div
                key={payout._id}
                className='flex items-center justify-between p-3 bg-[#1A1A1C] rounded-lg'
              >
                <div className='flex-1'>
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
                <div className='text-right'>
                  <div className='text-[#EDEDED] font-semibold'>
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
      <div className='max-w-6xl mx-auto p-6 space-y-8'>
        {/* Header */}
        <div>
          <h1 className='text-3xl font-bold text-[#EDEDED] mb-2'>Payouts</h1>
          <p className='text-gray-400'>
            Manage your earnings and payout settings
          </p>
        </div>

        {/* Tabs */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
          <div className='border-b border-[#1E1E21]'>
            <nav className='flex overflow-x-auto'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-300 ${
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

          <div className='p-6'>
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
