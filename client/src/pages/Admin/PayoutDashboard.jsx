// File: client/src/pages/Admin/PayoutDashboard.jsx - COMPLETE VERSION WITH ALL TABS
import axiosInstance from '@/config/config'
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import Layout from '../Layout/Layout'

const PayoutDashboard = () => {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState(null)

  // Data states
  const [connectStatus, setConnectStatus] = useState(null)
  const [earningsSummary, setEarningsSummary] = useState(null)
  const [payoutHistory, setPayoutHistory] = useState([])
  const [recentEarnings, setRecentEarnings] = useState([])
  const [allEarnings, setAllEarnings] = useState([])

  // Load data on component mount
  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load all data in parallel
      const [connectResponse, earningsResponse, payoutsResponse] =
        await Promise.all([
          axiosInstance.get('/payouts/connect/status'),
          axiosInstance.get('/payouts/earnings/summary'),
          axiosInstance.get('/payouts/history?limit=10'),
        ])

      setConnectStatus(connectResponse.data.data)
      setEarningsSummary(earningsResponse.data.data)
      setPayoutHistory(payoutsResponse.data.data.payouts || [])
      setRecentEarnings(earningsResponse.data.data.recentEarnings || [])
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to load dashboard data'
      )
    } finally {
      setLoading(false)
    }
  }

  // Load all earnings when earnings tab is activated
  const loadAllEarnings = async () => {
    try {
      const response = await axiosInstance.get('/payouts/earnings')
      setAllEarnings(response.data.data.earnings || [])
    } catch (err) {
      console.error('Error loading earnings:', err)
    }
  }

  // Create Connect account
  const createConnectAccount = async () => {
    try {
      setActionLoading('create')
      const response = await axiosInstance.post(
        '/payouts/connect/create-account',
        {
          country: 'US',
        }
      )

      if (response.data.data.onboardingUrl) {
        window.open(response.data.data.onboardingUrl, '_blank')
      }
    } catch (err) {
      console.error('Error creating Connect account:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create Connect account'
      )
    } finally {
      setActionLoading('')
    }
  }

  // Get onboarding link
  const getOnboardingLink = async () => {
    try {
      setActionLoading('onboarding')
      const response = await axiosInstance.get(
        '/payouts/connect/onboarding-link'
      )
      if (response.data.data.onboardingUrl) {
        window.open(response.data.data.onboardingUrl, '_blank')
      }
    } catch (err) {
      console.error('Error getting onboarding link:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to get onboarding link'
      )
    } finally {
      setActionLoading('')
    }
  }

  // Get management link
  const getManagementLink = async () => {
    try {
      setActionLoading('management')
      const response = await axiosInstance.get(
        '/payouts/connect/management-link'
      )
      if (response.data.data.managementUrl) {
        window.open(response.data.data.managementUrl, '_blank')
      }
    } catch (err) {
      console.error('Error getting management link:', err)
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to get management link'
      )
    } finally {
      setActionLoading('')
    }
  }

  // Refresh account status
  const refreshAccountStatus = async () => {
    try {
      setActionLoading('refresh')
      await axiosInstance.post('/payouts/connect/refresh-status')
      await loadDashboardData()
    } catch (err) {
      console.error('Error refreshing status:', err)
      setError(
        err.response?.data?.message || err.message || 'Failed to refresh status'
      )
    } finally {
      setActionLoading('')
    }
  }

  // Reset account
  const resetAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to reset your payout account? This will remove all setup progress.'
      )
    ) {
      return
    }

    try {
      setActionLoading('reset')
      await axiosInstance.delete('/payouts/connect/reset')
      await loadDashboardData()
    } catch (err) {
      console.error('Error resetting account:', err)
      setError(
        err.response?.data?.message || err.message || 'Failed to reset account'
      )
    } finally {
      setActionLoading('')
    }
  }

  // Request payout
  const requestPayout = async (amount, method = 'standard') => {
    try {
      setLoading(true)
      const response = await axiosInstance.post('/payouts/request', {
        amount: Math.round(parseFloat(amount) * 100),
        method,
      })

      await loadDashboardData()
      setShowRequestModal(false)
      alert('Payout request submitted successfully!')
    } catch (err) {
      console.error('Error requesting payout:', err)
      setError(
        err.response?.data?.message || err.message || 'Failed to request payout'
      )
    } finally {
      setLoading(false)
    }
  }

  // Cancel payout
  const cancelPayout = async (payoutId) => {
    try {
      setLoading(true)
      await axiosInstance.delete(`/payouts/${payoutId}/cancel`)
      await loadDashboardData()
      alert('Payout cancelled successfully!')
    } catch (err) {
      console.error('Error cancelling payout:', err)
      setError(
        err.response?.data?.message || err.message || 'Failed to cancel payout'
      )
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const getStatusColor = (state) => {
    switch (state) {
      case 'verified':
        return 'text-green-400'
      case 'onboarding_incomplete':
        return 'text-yellow-400'
      case 'verification_required':
        return 'text-orange-400'
      case 'sync_error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (state) => {
    switch (state) {
      case 'verified':
        return <Check className='w-5 h-5 text-green-400' />
      case 'sync_error':
        return <AlertCircle className='w-5 h-5 text-red-400' />
      default:
        return <AlertCircle className='w-5 h-5 text-yellow-400' />
    }
  }

  const StatusBadge = ({ status, type = 'earning' }) => {
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

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${
          configs[type][status] || configs[type].pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Connect Onboarding Modal
  const ConnectOnboardingModal = () => {
    if (!showConnectModal) return null

    const formatRequirements = (requirements) => {
      const categories = {
        'Personal Information': new Set(),
        'Address Information': new Set(),
        'Business Details': new Set(),
        'Banking Information': new Set(),
        'Legal Requirements': new Set(),
      }

      requirements.forEach((req) => {
        if (
          req.includes('individual.dob') ||
          req.includes('individual.first_name') ||
          req.includes('individual.last_name') ||
          req.includes('individual.email') ||
          req.includes('individual.phone') ||
          req.includes('individual.ssn_last_4')
        ) {
          categories['Personal Information'].add(
            'Name, email, phone, date of birth, SSN'
          )
        } else if (req.includes('individual.address')) {
          categories['Address Information'].add('Home address for verification')
        } else if (req.includes('business_profile')) {
          categories['Business Details'].add('Business type and website')
        } else if (req.includes('external_account')) {
          categories['Banking Information'].add('Bank account for payouts')
        } else if (req.includes('tos_acceptance')) {
          categories['Legal Requirements'].add('Terms of service acceptance')
        }
      })

      Object.keys(categories).forEach((key) => {
        categories[key] = Array.from(categories[key])
        if (categories[key].length === 0) {
          delete categories[key]
        }
      })

      return categories
    }

    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-[#EDEDED]'>
              {connectStatus?.connected ? 'Complete Setup' : 'Set Up Payouts'}
            </h3>
            <button
              onClick={() => setShowConnectModal(false)}
              className='text-gray-400 hover:text-[#EDEDED]'
            >
              <X size={20} />
            </button>
          </div>

          <div className='space-y-4'>
            {connectStatus?.connected && (
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  connectStatus.accountState === 'verified'
                    ? 'bg-green-500/10 border-green-500/20'
                    : 'bg-yellow-500/10 border-yellow-500/20'
                }`}
              >
                {getStatusIcon(connectStatus.accountState)}
                <div>
                  <h4
                    className={`font-medium text-sm ${getStatusColor(
                      connectStatus.accountState
                    )}`}
                  >
                    {connectStatus.accountState
                      ?.replace('_', ' ')
                      .toUpperCase() || 'UNKNOWN'}
                  </h4>
                  <p className='text-gray-400 text-xs mt-1'>
                    {connectStatus.messages?.primary}
                  </p>
                </div>
              </div>
            )}

            {!connectStatus?.connected && (
              <div className='flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                <Wallet className='text-blue-400 mt-0.5' size={16} />
                <div>
                  <h4 className='text-blue-400 font-medium text-sm'>
                    Connect Your Bank Account
                  </h4>
                  <p className='text-gray-400 text-xs mt-1'>
                    We use Stripe to securely handle your payouts. You'll be
                    redirected to Stripe to complete setup.
                  </p>
                </div>
              </div>
            )}

            {connectStatus?.requirements?.length > 0 && (
              <div className='p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg'>
                <h4 className='text-orange-400 font-medium text-sm mb-3'>
                  Information Needed:
                </h4>
                <div className='space-y-2'>
                  {Object.entries(
                    formatRequirements(connectStatus.requirements)
                  ).map(([category, items]) => (
                    <div key={category} className='flex items-start gap-2'>
                      <AlertCircle
                        size={12}
                        className='text-orange-400 mt-0.5 flex-shrink-0'
                      />
                      <div>
                        <div className='text-xs font-medium text-orange-300'>
                          {category}
                        </div>
                        {items.map((item, idx) => (
                          <div key={idx} className='text-xs text-gray-400 ml-2'>
                            • {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!connectStatus?.connected && (
              <div className='space-y-2'>
                <h4 className='text-[#EDEDED] font-medium text-sm'>
                  What you'll need:
                </h4>
                <ul className='space-y-1 text-xs text-gray-400'>
                  <li className='flex items-center gap-2'>
                    <Check size={12} className='text-green-400' />
                    Bank account information
                  </li>
                  <li className='flex items-center gap-2'>
                    <Check size={12} className='text-green-400' />
                    Government-issued ID
                  </li>
                  <li className='flex items-center gap-2'>
                    <Check size={12} className='text-green-400' />
                    Tax identification number
                  </li>
                </ul>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && (
              <div className='p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
                <p className='text-sm text-yellow-400'>
                  <strong>Development Mode:</strong> Use test bank details:
                  Routing 110000000, Account 000123456789
                </p>
              </div>
            )}

            <div className='flex gap-3 pt-4'>
              <button
                onClick={() => setShowConnectModal(false)}
                className='flex-1 px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConnectModal(false)
                  if (connectStatus?.actions?.canRetryOnboarding) {
                    getOnboardingLink()
                  } else {
                    createConnectAccount()
                  }
                }}
                disabled={actionLoading}
                className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50'
              >
                {actionLoading ? (
                  <Loader2 size={14} className='animate-spin' />
                ) : (
                  <>
                    {connectStatus?.actions?.canRetryOnboarding
                      ? 'Continue Setup'
                      : 'Get Started'}
                    <ExternalLink size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Payout Request Modal
  const PayoutRequestModal = () => {
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState('standard')

    if (!showRequestModal) return null

    const maxAmount = parseFloat(
      earningsSummary?.userEarningsInfo?.availableForPayout || '0'
    )
    const minAmount = connectStatus?.minimumPayoutAmount / 100 || 10

    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-[#EDEDED]'>
              Request Payout
            </h3>
            <button
              onClick={() => setShowRequestModal(false)}
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

            <div>
              <label className='block text-sm font-medium text-gray-400 mb-2'>
                Payout Speed
              </label>
              <div className='space-y-2'>
                <label className='flex items-center gap-3 p-3 border border-[#1E1E21] rounded-lg cursor-pointer hover:border-[#D4AF37]/40 transition-all duration-300'>
                  <input
                    type='radio'
                    name='method'
                    value='standard'
                    checked={method === 'standard'}
                    onChange={(e) => setMethod(e.target.value)}
                    className='w-4 h-4 text-[#D4AF37]'
                  />
                  <div className='flex-1'>
                    <div className='text-[#EDEDED] font-medium text-sm'>
                      Standard
                    </div>
                    <div className='text-gray-400 text-xs'>
                      2-7 business days • Free
                    </div>
                  </div>
                </label>
                <label className='flex items-center gap-3 p-3 border border-[#1E1E21] rounded-lg cursor-pointer hover:border-[#D4AF37]/40 transition-all duration-300'>
                  <input
                    type='radio'
                    name='method'
                    value='instant'
                    checked={method === 'instant'}
                    onChange={(e) => setMethod(e.target.value)}
                    className='w-4 h-4 text-[#D4AF37]'
                  />
                  <div className='flex-1'>
                    <div className='text-[#EDEDED] font-medium text-sm'>
                      Instant
                    </div>
                    <div className='text-gray-400 text-xs'>
                      Within 30 minutes • 1.5% fee
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {method === 'instant' && amount && (
              <div className='p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
                <div className='text-yellow-400 text-xs font-medium'>
                  Fee Breakdown:
                </div>
                <div className='text-gray-400 text-xs mt-1'>
                  Amount: ${amount} • Fee: $
                  {(parseFloat(amount) * 0.015).toFixed(2)} • You'll receive: $
                  {(parseFloat(amount) * 0.985).toFixed(2)}
                </div>
              </div>
            )}

            <div className='flex gap-3 pt-4'>
              <button
                onClick={() => setShowRequestModal(false)}
                className='flex-1 px-4 py-2 border border-[#1E1E21] rounded-lg text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'
              >
                Cancel
              </button>
              <button
                onClick={() => requestPayout(amount, method)}
                disabled={
                  loading ||
                  !amount ||
                  parseFloat(amount) < minAmount ||
                  parseFloat(amount) > maxAmount
                }
                className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {loading ? (
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

  // Loading state
  if (loading && !connectStatus) {
    return (
      <Layout>
        <div className='max-w-6xl mx-auto p-6 flex items-center justify-center min-h-screen'>
          <div className='flex items-center gap-3 text-[#EDEDED]'>
            <Loader2 size={24} className='animate-spin' />
            Loading payout dashboard...
          </div>
        </div>
      </Layout>
    )
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className='max-w-6xl mx-auto p-6'>
          <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center'>
            <AlertCircle className='mx-auto mb-4 text-red-400' size={48} />
            <h2 className='text-xl font-semibold text-red-400 mb-2'>
              Error Loading Dashboard
            </h2>
            <p className='text-gray-400 mb-4'>{error}</p>
            <button
              onClick={loadDashboardData}
              className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300'
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // Overview Tab
  const OverviewTab = () => (
    <div className='space-y-6'>
      {/* Connect Account Status */}
      <div
        className={`rounded-xl p-6 border ${
          connectStatus?.accountState === 'verified'
            ? 'bg-green-500/10 border-green-500/20'
            : connectStatus?.connected
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20'
        }`}
      >
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-3'>
              {connectStatus?.connected ? (
                getStatusIcon(connectStatus.accountState)
              ) : (
                <Wallet className='text-blue-400' size={20} />
              )}
              <h3
                className={`font-semibold ${
                  connectStatus?.accountState === 'verified'
                    ? 'text-green-400'
                    : connectStatus?.connected
                    ? getStatusColor(connectStatus.accountState)
                    : 'text-[#EDEDED]'
                }`}
              >
                {connectStatus?.connected
                  ? `Account Status: ${connectStatus.accountState
                      ?.replace('_', ' ')
                      .toUpperCase()}`
                  : 'Set Up Payouts'}
              </h3>
            </div>
            <p className='text-gray-400 text-sm mb-4'>
              {connectStatus?.messages?.primary ||
                'Connect your bank account to start receiving payouts for your referral commissions.'}
            </p>

            {/* Action Buttons */}
            <div className='flex flex-wrap gap-3'>
              {connectStatus?.actions?.canCreateAccount && (
                <button
                  onClick={() => setShowConnectModal(true)}
                  disabled={actionLoading === 'create'}
                  className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
                >
                  {actionLoading === 'create' ? (
                    <Loader2 size={16} className='animate-spin' />
                  ) : (
                    <Wallet size={16} />
                  )}
                  Setup Account
                </button>
              )}

              {connectStatus?.actions?.canRetryOnboarding && (
                <button
                  onClick={() => setShowConnectModal(true)}
                  disabled={actionLoading === 'onboarding'}
                  className='bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
                >
                  {actionLoading === 'onboarding' ? (
                    <Loader2 size={16} className='animate-spin' />
                  ) : (
                    <ExternalLink size={16} />
                  )}
                  Complete Setup
                </button>
              )}

              {connectStatus?.actions?.canManageAccount && (
                <button
                  onClick={getManagementLink}
                  disabled={actionLoading === 'management'}
                  className='bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
                >
                  {actionLoading === 'management' ? (
                    <Loader2 size={16} className='animate-spin' />
                  ) : (
                    <Settings size={16} />
                  )}
                  Manage Bank Details
                </button>
              )}

              <button
                onClick={refreshAccountStatus}
                disabled={actionLoading === 'refresh'}
                className='border border-[#1E1E21] text-gray-400 px-4 py-2 rounded-lg font-medium hover:text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
              >
                {actionLoading === 'refresh' ? (
                  <Loader2 size={16} className='animate-spin' />
                ) : (
                  <RefreshCw size={16} />
                )}
                Refresh
              </button>

              {process.env.NODE_ENV === 'development' &&
                connectStatus?.connected && (
                  <button
                    onClick={resetAccount}
                    disabled={actionLoading === 'reset'}
                    className='border border-red-500/20 text-red-400 px-4 py-2 rounded-lg font-medium hover:bg-red-500/10 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
                  >
                    {actionLoading === 'reset' ? (
                      <Loader2 size={16} className='animate-spin' />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    Reset
                  </button>
                )}
            </div>

            {connectStatus?.requirements?.length > 0 && (
              <div className='mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg'>
                <h4 className='text-orange-400 text-sm font-medium mb-1'>
                  Action Required: Please complete your bank details to finish
                  your submission.
                </h4>
              </div>
            )}
          </div>
          <CreditCard className='text-blue-400 ml-4' size={32} />
        </div>
      </div>

      {/* Earnings Summary Cards */}
      {earningsSummary && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='text-gray-400 text-sm'>Total Earned</h4>
              <TrendingUp className='text-green-400' size={16} />
            </div>
            <div className='text-2xl font-bold text-[#EDEDED]'>
              ${earningsSummary.userEarningsInfo.totalEarned}
            </div>
            <div className='text-xs text-gray-400 mt-1'>
              {earningsSummary.summary.pending.count +
                earningsSummary.summary.approved.count +
                earningsSummary.summary.paid.count}{' '}
              commissions
            </div>
          </div>

          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='text-gray-400 text-sm'>Available</h4>
              <Wallet className='text-blue-400' size={16} />
            </div>
            <div className='text-2xl font-bold text-[#EDEDED]'>
              ${earningsSummary.userEarningsInfo.availableForPayout}
            </div>
            <div className='text-xs text-gray-400 mt-1'>
              {earningsSummary.summary.approved.count} approved
            </div>
          </div>

          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='text-gray-400 text-sm'>Pending</h4>
              <Clock className='text-yellow-400' size={16} />
            </div>
            <div className='text-2xl font-bold text-[#EDEDED]'>
              ${earningsSummary.summary.formatted.pending}
            </div>
            <div className='text-xs text-gray-400 mt-1'>
              {earningsSummary.summary.pending.count} pending
            </div>
          </div>

          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center justify-between mb-2'>
              <h4 className='text-gray-400 text-sm'>Paid Out</h4>
              <DollarSign className='text-green-400' size={16} />
            </div>
            <div className='text-2xl font-bold text-[#EDEDED]'>
              ${earningsSummary.userEarningsInfo.totalPaidOut}
            </div>
            <div className='text-xs text-gray-400 mt-1'>
              {earningsSummary.summary.paid.count} payouts
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <button
          onClick={() =>
            connectStatus?.actions?.canRequestPayout
              ? setShowRequestModal(true)
              : setShowConnectModal(true)
          }
          disabled={
            connectStatus?.actions?.canRequestPayout &&
            parseFloat(
              earningsSummary?.userEarningsInfo?.availableForPayout || '0'
            ) < (connectStatus?.minimumPayoutAmount / 100 || 10)
          }
          className='flex-1 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          <ArrowUpRight size={16} />
          {connectStatus?.actions?.canRequestPayout
            ? 'Request Payout'
            : 'Set Up Payouts'}
        </button>
        <button
          onClick={() => {
            setActiveTab('earnings')
            loadAllEarnings()
          }}
          className='flex-1 border border-[#1E1E21] text-[#EDEDED] px-6 py-3 rounded-xl font-semibold hover:border-[#D4AF37]/40 transition-all duration-300 flex items-center justify-center gap-2'
        >
          <Users size={16} />
          View Earnings
        </button>
      </div>

      {/* Recent Earnings */}
      {recentEarnings?.length > 0 && (
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
          <h3 className='text-[#EDEDED] font-semibold mb-4'>Recent Earnings</h3>
          <div className='space-y-3'>
            {recentEarnings.slice(0, 3).map((earning) => (
              <div
                key={earning._id}
                className='flex items-center justify-between p-3 bg-[#1A1A1C] rounded-lg'
              >
                <div className='flex-1'>
                  <div className='text-[#EDEDED] font-medium text-sm'>
                    {earning.referredUser?.name || 'Unknown User'}
                  </div>
                  <div className='text-gray-400 text-xs'>
                    {earning.description}
                  </div>
                </div>
                <div className='text-right'>
                  <div className='text-[#EDEDED] font-semibold'>
                    ${(earning.commissionAmount / 100).toFixed(2)}
                  </div>
                  <StatusBadge status={earning.status} type='earning' />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => {
              setActiveTab('earnings')
              loadAllEarnings()
            }}
            className='w-full mt-4 text-[#D4AF37] text-sm font-medium hover:text-[#D4AF37]/80 transition-colors duration-300'
          >
            View All Earnings →
          </button>
        </div>
      )}
    </div>
  )

  // Earnings Tab
  const EarningsTab = () => {
    useEffect(() => {
      if (activeTab === 'earnings' && allEarnings.length === 0) {
        loadAllEarnings()
      }
    }, [activeTab])

    return (
      <div className='space-y-6'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-[#EDEDED] font-semibold text-lg'>
              All Earnings
            </h3>
            <button
              onClick={loadAllEarnings}
              className='text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors duration-300'
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {allEarnings.length === 0 ? (
            <div className='text-center py-12'>
              <Wallet className='mx-auto text-gray-600 mb-4' size={48} />
              <p className='text-gray-400'>No earnings yet</p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead className='border-b border-[#1E1E21]'>
                  <tr>
                    <th className='text-left text-xs font-medium text-gray-400 pb-3'>
                      Date
                    </th>
                    <th className='text-left text-xs font-medium text-gray-400 pb-3'>
                      Description
                    </th>
                    <th className='text-left text-xs font-medium text-gray-400 pb-3'>
                      Referred User
                    </th>
                    <th className='text-right text-xs font-medium text-gray-400 pb-3'>
                      Amount
                    </th>
                    <th className='text-right text-xs font-medium text-gray-400 pb-3'>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-[#1E1E21]'>
                  {allEarnings.map((earning) => (
                    <tr
                      key={earning._id}
                      className='hover:bg-[#1A1A1C] transition-colors duration-200'
                    >
                      <td className='py-3 text-sm text-gray-400'>
                        {formatDate(earning.createdAt)}
                      </td>
                      <td className='py-3 text-sm text-[#EDEDED]'>
                        {earning.description}
                      </td>
                      <td className='py-3 text-sm text-gray-400'>
                        {earning.referredUser?.name || 'Unknown'}
                      </td>
                      <td className='py-3 text-sm text-[#EDEDED] text-right font-semibold'>
                        ${(earning.commissionAmount / 100).toFixed(2)}
                      </td>
                      <td className='py-3 text-right'>
                        <StatusBadge status={earning.status} type='earning' />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Payouts Tab
  const PayoutsTab = () => (
    <div className='space-y-6'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h3 className='text-[#EDEDED] font-semibold text-lg'>
            Payout History
          </h3>
          {connectStatus?.actions?.canRequestPayout && (
            <button
              onClick={() => setShowRequestModal(true)}
              className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2'
            >
              <ArrowUpRight size={14} />
              Request Payout
            </button>
          )}
        </div>

        {payoutHistory.length === 0 ? (
          <div className='text-center py-12'>
            <FileText className='mx-auto text-gray-600 mb-4' size={48} />
            <p className='text-gray-400'>No payout requests yet</p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='border-b border-[#1E1E21]'>
                <tr>
                  <th className='text-left text-xs font-medium text-gray-400 pb-3'>
                    Date
                  </th>
                  <th className='text-left text-xs font-medium text-gray-400 pb-3'>
                    Method
                  </th>
                  <th className='text-right text-xs font-medium text-gray-400 pb-3'>
                    Amount
                  </th>
                  <th className='text-right text-xs font-medium text-gray-400 pb-3'>
                    Fees
                  </th>
                  <th className='text-right text-xs font-medium text-gray-400 pb-3'>
                    Net
                  </th>
                  <th className='text-right text-xs font-medium text-gray-400 pb-3'>
                    Status
                  </th>
                  <th className='text-right text-xs font-medium text-gray-400 pb-3'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[#1E1E21]'>
                {payoutHistory.map((payout) => (
                  <tr
                    key={payout._id}
                    className='hover:bg-[#1A1A1C] transition-colors duration-200'
                  >
                    <td className='py-3 text-sm text-gray-400'>
                      {formatDate(payout.requestedAt)}
                    </td>
                    <td className='py-3 text-sm text-gray-400 capitalize'>
                      {payout.method}
                    </td>
                    <td className='py-3 text-sm text-[#EDEDED] text-right font-semibold'>
                      ${(payout.amount / 100).toFixed(2)}
                    </td>
                    <td className='py-3 text-sm text-gray-400 text-right'>
                      ${(payout.fees?.total / 100 || 0).toFixed(2)}
                    </td>
                    <td className='py-3 text-sm text-[#EDEDED] text-right font-semibold'>
                      ${(payout.netAmount / 100).toFixed(2)}
                    </td>
                    <td className='py-3 text-right'>
                      <StatusBadge status={payout.status} type='payout' />
                    </td>
                    <td className='py-3 text-right'>
                      {payout.status === 'pending' && (
                        <button
                          onClick={() => cancelPayout(payout._id)}
                          className='text-red-400 hover:text-red-300 text-sm'
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        <ConnectOnboardingModal />
        <PayoutRequestModal />
      </div>
    </Layout>
  )
}

export default PayoutDashboard
