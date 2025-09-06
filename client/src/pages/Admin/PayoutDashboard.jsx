// File: client/src/pages/Admin/PayoutDashboard.jsx
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  ExternalLink,
  Settings,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import React, { useState } from 'react'
import Layout from '../Layout/Layout'

const PayoutDashboard = () => {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - replace with actual API calls
  const [connectStatus] = useState({
    connected: false,
    verified: false,
    onboardingCompleted: false,
    canReceivePayouts: false,
    requirements: ['identity_document', 'bank_account'],
    minimumPayoutAmount: 10.0,
  })

  const [earningsSummary] = useState({
    summary: {
      pending: { total: 2450, count: 5, formatted: '24.50' },
      approved: { total: 8750, count: 12, formatted: '87.50' },
      paid: { total: 15600, count: 8, formatted: '156.00' },
      formatted: { total: '268.50' },
    },
    userEarningsInfo: {
      totalEarned: '268.50',
      availableForPayout: '87.50',
      totalPaidOut: '156.00',
      currency: 'USD',
    },
    canRequestPayout: true,
  })

  const [payoutHistory] = useState([
    {
      _id: '1',
      amount: 50.0,
      status: 'paid',
      requestedAt: '2024-01-15T10:00:00Z',
      paidAt: '2024-01-17T14:30:00Z',
      method: 'standard',
      fees: { total: 0 },
    },
    {
      _id: '2',
      amount: 100.0,
      status: 'processing',
      requestedAt: '2024-01-20T09:15:00Z',
      method: 'standard',
      fees: { total: 0 },
    },
    {
      _id: '3',
      amount: 75.0,
      status: 'pending',
      requestedAt: '2024-01-22T16:45:00Z',
      method: 'standard',
      fees: { total: 0 },
    },
  ])

  const [recentEarnings] = useState([
    {
      _id: '1',
      commissionAmount: 2500,
      source: 'subscription_purchase',
      referredUser: { name: 'John Doe', email: 'john@example.com' },
      createdAt: '2024-01-20T10:00:00Z',
      status: 'approved',
      description: 'Subscription commission for pro plan',
    },
    {
      _id: '2',
      commissionAmount: 1200,
      source: 'subscription_renewal',
      referredUser: { name: 'Jane Smith', email: 'jane@example.com' },
      createdAt: '2024-01-18T14:30:00Z',
      status: 'paid',
      description: 'Renewal commission for starter plan',
    },
    {
      _id: '3',
      commissionAmount: 5000,
      source: 'subscription_purchase',
      referredUser: { name: 'Bob Wilson', email: 'bob@example.com' },
      createdAt: '2024-01-15T09:15:00Z',
      status: 'pending',
      description: 'Subscription commission for empire plan',
    },
  ])

  // Status badge component
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
        paid: 'bg-green-500/10 text-green-400',
        failed: 'bg-red-500/10 text-red-400',
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

  // Format date helper
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Stripe Connect onboarding modal
  const ConnectOnboardingModal = () => {
    if (!showConnectModal) return null

    return (
      <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl max-w-md w-full p-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-semibold text-[#EDEDED]'>
              Set Up Payouts
            </h3>
            <button
              onClick={() => setShowConnectModal(false)}
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
                  redirected to Stripe to complete setup.
                </p>
              </div>
            </div>

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

            {connectStatus.requirements.length > 0 && (
              <div className='p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
                <h4 className='text-yellow-400 font-medium text-sm mb-2'>
                  Required Information:
                </h4>
                <ul className='space-y-1'>
                  {connectStatus.requirements.map((req, index) => (
                    <li
                      key={index}
                      className='text-xs text-gray-400 flex items-center gap-2'
                    >
                      <AlertCircle size={12} className='text-yellow-400' />
                      {req
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </li>
                  ))}
                </ul>
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
                  console.log('Starting Stripe Connect onboarding...')
                  setShowConnectModal(false)
                }}
                className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2'
              >
                Get Started
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Payout request modal
  const PayoutRequestModal = () => {
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState('standard')

    if (!showRequestModal) return null

    const maxAmount = parseFloat(
      earningsSummary.userEarningsInfo.availableForPayout
    )
    const minAmount = connectStatus.minimumPayoutAmount

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
                onClick={() => {
                  console.log('Requesting payout:', { amount, method })
                  setShowRequestModal(false)
                  setAmount('')
                }}
                disabled={
                  !amount ||
                  parseFloat(amount) < minAmount ||
                  parseFloat(amount) > maxAmount
                }
                className='flex-1 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                Request Payout
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard content
  const OverviewTab = () => (
    <div className='space-y-6'>
      {/* Connect Account Status */}
      {!connectStatus.connected && (
        <div className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6'>
          <div className='flex items-start justify-between'>
            <div>
              <h3 className='text-[#EDEDED] font-semibold mb-2'>
                Set Up Payouts
              </h3>
              <p className='text-gray-400 text-sm mb-4'>
                Connect your bank account to start receiving payouts for your
                referral commissions.
              </p>
              <button
                onClick={() => setShowConnectModal(true)}
                className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2'
              >
                <Wallet size={16} />
                Connect Account
              </button>
            </div>
            <CreditCard className='text-blue-400' size={32} />
          </div>
        </div>
      )}

      {/* Earnings Summary Cards */}
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
            ${earningsSummary.summary.pending.formatted}
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

      {/* Quick Actions */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <button
          onClick={() =>
            connectStatus.canReceivePayouts
              ? setShowRequestModal(true)
              : setShowConnectModal(true)
          }
          disabled={
            !connectStatus.canReceivePayouts &&
            parseFloat(earningsSummary.userEarningsInfo.availableForPayout) <
              connectStatus.minimumPayoutAmount
          }
          className='flex-1 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
        >
          <ArrowUpRight size={16} />
          {connectStatus.canReceivePayouts
            ? 'Request Payout'
            : 'Set Up Payouts'}
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className='flex-1 border border-[#1E1E21] text-[#EDEDED] px-6 py-3 rounded-xl font-semibold hover:border-[#D4AF37]/40 transition-all duration-300 flex items-center justify-center gap-2'
        >
          <Users size={16} />
          View Earnings
        </button>
      </div>

      {/* Recent Earnings */}
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
                  {earning.referredUser.name}
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
          onClick={() => setActiveTab('earnings')}
          className='w-full mt-4 text-[#D4AF37] text-sm font-medium hover:text-[#D4AF37]/80 transition-colors duration-300'
        >
          View All Earnings →
        </button>
      </div>
    </div>
  )

  const EarningsTab = () => (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-semibold text-[#EDEDED]'>
          Earnings History
        </h3>
        <button className='flex items-center gap-2 text-[#D4AF37] text-sm font-medium hover:text-[#D4AF37]/80 transition-colors duration-300'>
          <Download size={16} />
          Export
        </button>
      </div>

      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-[#1E1E21]'>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Referral
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Source
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Amount
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Status
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Date
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#1E1E21]'>
              {recentEarnings.map((earning) => (
                <tr
                  key={earning._id}
                  className='hover:bg-[#1A1A1C]/50 transition-all duration-200'
                >
                  <td className='px-6 py-4'>
                    <div>
                      <div className='text-[#EDEDED] font-medium text-sm'>
                        {earning.referredUser.name}
                      </div>
                      <div className='text-gray-400 text-xs'>
                        {earning.referredUser.email}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-[#EDEDED] text-sm'>
                      {earning.source
                        .replace('_', ' ')
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-[#EDEDED] font-semibold'>
                      ${(earning.commissionAmount / 100).toFixed(2)}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <StatusBadge status={earning.status} type='earning' />
                  </td>
                  <td className='px-6 py-4 text-gray-400 text-sm'>
                    {formatDate(earning.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const PayoutsTab = () => (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-xl font-semibold text-[#EDEDED]'>Payout History</h3>
        {connectStatus.canReceivePayouts && (
          <button
            onClick={() => setShowRequestModal(true)}
            className='bg-[#D4AF37] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300'
          >
            Request Payout
          </button>
        )}
      </div>

      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-[#1E1E21]'>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Amount
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Method
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Status
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Requested
                </th>
                <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                  Completed
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-[#1E1E21]'>
              {payoutHistory.map((payout) => (
                <tr
                  key={payout._id}
                  className='hover:bg-[#1A1A1C]/50 transition-all duration-200'
                >
                  <td className='px-6 py-4'>
                    <div className='text-[#EDEDED] font-semibold'>
                      ${payout.amount.toFixed(2)}
                    </div>
                    {payout.fees.total > 0 && (
                      <div className='text-gray-400 text-xs'>
                        Fee: ${payout.fees.total.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-[#EDEDED] text-sm capitalize'>
                      {payout.method}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <StatusBadge status={payout.status} type='payout' />
                  </td>
                  <td className='px-6 py-4 text-gray-400 text-sm'>
                    {formatDate(payout.requestedAt)}
                  </td>
                  <td className='px-6 py-4 text-gray-400 text-sm'>
                    {payout.paidAt ? formatDate(payout.paidAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
