// File: client/src/pages/Earnings/EarningsPage.jsx
import {
  ChevronDown,
  DollarSign,
  Download,
  MoreHorizontal,
  Search,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import Layout from '../Layout/Layout'

const EarningsPage = () => {
  const [timeFilter, setTimeFilter] = useState('30d')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Chart data based on time filter
  const chartData = {
    '7d': [
      { date: '8/20', revenue: 340, commissions: 102, referrals: 12 },
      { date: '8/21', revenue: 520, commissions: 156, referrals: 18 },
      { date: '8/22', revenue: 890, commissions: 267, referrals: 24 },
      { date: '8/23', revenue: 290, commissions: 87, referrals: 8 },
      { date: '8/24', revenue: 670, commissions: 201, referrals: 21 },
      { date: '8/25', revenue: 1240, commissions: 372, referrals: 32 },
      { date: '8/26', revenue: 1580, commissions: 474, referrals: 28 },
    ],
    '30d': [
      { date: 'Week 1', revenue: 2840, commissions: 852, referrals: 84 },
      { date: 'Week 2', revenue: 3920, commissions: 1176, referrals: 126 },
      { date: 'Week 3', revenue: 4650, commissions: 1395, referrals: 158 },
      { date: 'Week 4', revenue: 5280, commissions: 1584, referrals: 142 },
    ],
    '90d': [
      { date: 'Month 1', revenue: 8420, commissions: 2526, referrals: 324 },
      { date: 'Month 2', revenue: 11850, commissions: 3555, referrals: 486 },
      { date: 'Month 3', revenue: 16690, commissions: 5007, referrals: 508 },
    ],
  }

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-3 shadow-lg'>
          <p className='text-[#EDEDED] font-medium mb-2'>{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className='flex items-center gap-2 text-sm'>
              <div
                className='w-2 h-2 rounded-full'
                style={{ backgroundColor: entry.color }}
              />
              <span className='text-gray-400'>{entry.dataKey}:</span>
              <span className='text-[#EDEDED] font-medium'>
                {entry.dataKey === 'referrals' ? entry.value : `${entry.value}`}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const statsCards = [
    {
      title: 'Total Earnings',
      value: '$12,847.50',
      icon: <DollarSign size={18} />,
      color: 'bg-[#D4AF37]',
    },
    {
      title: 'This Month',
      value: '$3,240.75',
      icon: <TrendingUp size={18} />,
      color: 'bg-emerald-500',
    },
    {
      title: 'Active Referrals',
      value: '247',
      icon: <Users size={18} />,
      color: 'bg-blue-500',
    },
    {
      title: 'Conversion Rate',
      value: '4.2%',
      icon: <Target size={18} />,
      color: 'bg-purple-500',
    },
  ]

  const earningsData = [
    {
      id: 1,
      customer: 'Sarah Johnson',
      email: 'sarah.j@company.com',
      plan: 'Empire',
      amount: 89.7,
      commission: 26.91,
      date: '2025-08-26',
      status: 'paid',
      type: 'subscription',
    },
    {
      id: 2,
      customer: 'Michael Chen',
      email: 'm.chen@startup.io',
      plan: 'Pro',
      amount: 49.0,
      commission: 14.7,
      date: '2025-08-25',
      status: 'pending',
      type: 'subscription',
    },
    {
      id: 3,
      customer: 'Emily Rodriguez',
      email: 'emily.r@agency.com',
      plan: 'Empire',
      amount: 89.7,
      commission: 26.91,
      date: '2025-08-24',
      status: 'paid',
      type: 'upgrade',
    },
    {
      id: 4,
      customer: 'David Park',
      email: 'david@techcorp.com',
      plan: 'Starter',
      amount: 29.0,
      commission: 8.7,
      date: '2025-08-23',
      status: 'paid',
      type: 'subscription',
    },
    {
      id: 5,
      customer: 'Lisa Anderson',
      email: 'lisa.a@business.com',
      plan: 'Pro',
      amount: 49.0,
      commission: 14.7,
      date: '2025-08-22',
      status: 'processing',
      type: 'renewal',
    },
  ]

  const StatCard = ({ title, value, icon, color }) => (
    <div className='relative bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-3 sm:p-5 hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-all duration-300 group overflow-hidden'>
      {/* Background glow effect - reduced on mobile */}
      <div
        className={`absolute top-0 right-0 w-12 h-12 sm:w-20 sm:h-20 ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-300`}
      ></div>

      <div className='relative'>
        <div className='flex items-start justify-between mb-2 sm:mb-3'>
          <div className='space-y-1 flex-1 min-w-0'>
            <h3 className='text-gray-400 text-xs sm:text-sm font-medium leading-tight truncate'>
              {title}
            </h3>
          </div>
          <div
            className={`${color} p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-black shadow-lg flex-shrink-0 ml-2`}
          >
            <div className='block sm:hidden'>
              {React.cloneElement(icon, { size: 14 })}
            </div>
            <div className='hidden sm:block'>{icon}</div>
          </div>
        </div>

        <div className='text-lg sm:text-2xl font-bold text-[#EDEDED] leading-none'>
          {value}
        </div>
      </div>
    </div>
  )

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      paid: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Paid' },
      pending: { color: 'bg-yellow-500/10 text-yellow-400', label: 'Pending' },
      processing: {
        color: 'bg-blue-500/10 text-blue-400',
        label: 'Processing',
      },
    }

    const config = statusConfig[status] || statusConfig.pending

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  const TypeBadge = ({ type }) => {
    const typeConfig = {
      subscription: {
        color: 'bg-[#D4AF37]/10 text-[#D4AF37]',
        label: 'New Sub',
      },
      upgrade: { color: 'bg-purple-500/10 text-purple-400', label: 'Upgrade' },
      renewal: { color: 'bg-blue-500/10 text-blue-400', label: 'Renewal' },
    }

    const config = typeConfig[type] || typeConfig.subscription

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  const DropdownButton = ({ value, options, onChange, placeholder }) => (
    <div className='relative'>
      <button className='bg-[#121214] border border-[#1E1E21] rounded-xl px-4 h-8 text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 flex items-center gap-2 justify-between w-full sm:min-w-[120px] sm:w-auto'>
        <span>
          {options.find((opt) => opt.value === value)?.label || placeholder}
        </span>
        <ChevronDown size={14} />
      </button>
    </div>
  )

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ]
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  // Mobile card component for earnings - REMOVED since keeping table format

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8'>
        {/* Header */}
        <div>
          <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
            Earnings Dashboard
          </h1>
          <p className='text-gray-400'>
            Track your affiliate performance and commission earnings
          </p>
        </div>

        {/* Stats Grid - 2 cards per row on mobile, 4 on desktop */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          {statsCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Quick Insights */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6'>
          {/* Revenue Chart */}
          <div className='lg:col-span-2 bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
            <div className='flex items-center justify-between mb-6'>
              <h2 className='text-lg font-bold text-[#EDEDED]'>
                Revenue Trend
              </h2>
              <div className='flex items-center gap-2'>
                <div className='relative'>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl px-3 h-8 text-sm text-[#EDEDED] focus:outline-none focus:border-[#D4AF37]/40 appearance-none pr-8 cursor-pointer'
                  >
                    <option value='7d'>7 days</option>
                    <option value='30d'>30 days</option>
                    <option value='90d'>90 days</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none'
                  />
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className='h-64'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={chartData[timeFilter]}>
                  <defs>
                    <linearGradient
                      id='revenueGradient'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#D4AF37' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#D4AF37' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id='commissionsGradient'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#10B981' stopOpacity={0.3} />
                      <stop offset='95%' stopColor='#10B981' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' stroke='#1E1E21' />
                  <XAxis
                    dataKey='date'
                    stroke='#666'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke='#666'
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type='monotone'
                    dataKey='revenue'
                    stroke='#D4AF37'
                    strokeWidth={2}
                    fill='url(#revenueGradient)'
                  />
                  <Area
                    type='monotone'
                    dataKey='commissions'
                    stroke='#10B981'
                    strokeWidth={2}
                    fill='url(#commissionsGradient)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className='flex items-center gap-6 mt-4'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-2 rounded bg-[#D4AF37]'></div>
                <span className='text-gray-400 text-sm'>Revenue</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-2 rounded bg-emerald-500'></div>
                <span className='text-gray-400 text-sm'>Commissions</span>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
            <h2 className='text-lg font-bold text-[#EDEDED] mb-4'>
              Performance Overview
            </h2>

            {/* Top Referrals List */}
            <div className='space-y-3'>
              <h3 className='text-sm font-medium text-gray-400 mb-3'>
                Recent Top Referrals
              </h3>
              {[
                {
                  name: 'Sarah J.',
                  amount: '$89.70',
                  plan: 'Empire',
                  trend: '+12%',
                },
                {
                  name: 'Michael C.',
                  amount: '$49.00',
                  plan: 'Pro',
                  trend: '+8%',
                },
                {
                  name: 'Emily R.',
                  amount: '$89.70',
                  plan: 'Empire',
                  trend: '+15%',
                },
              ].map((referral, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-[#1A1A1C] rounded-lg'
                >
                  <div>
                    <div className='text-[#EDEDED] font-medium text-sm'>
                      {referral.name}
                    </div>
                    <div className='text-gray-400 text-xs'>
                      {referral.plan} Plan
                    </div>
                  </div>
                  <div className='text-right'>
                    <div className='text-[#D4AF37] font-bold text-sm'>
                      {referral.amount}
                    </div>
                    <div className='text-emerald-400 text-xs'>
                      {referral.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
          {/* Table Header */}
          <div className='p-4 sm:p-6 border-b border-[#1E1E21]'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <h2 className='text-xl font-semibold text-[#EDEDED]'>
                Recent Earnings
              </h2>

              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                {/* Search */}
                <div className='relative'>
                  <Search
                    size={14}
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  />
                  <input
                    type='text'
                    placeholder='Search customers...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl pl-9 pr-4 h-8 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 w-full sm:w-48'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3 sm:grid-cols-none'>
                  {/* Filters */}
                  <DropdownButton
                    value={statusFilter}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'paid', label: 'Paid' },
                      { value: 'pending', label: 'Pending' },
                    ]}
                    placeholder='Status'
                  />

                  {/* Export Button */}
                  <button className='bg-[#D4AF37] text-black h-8 px-4 rounded-xl font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap'>
                    <Download size={14} />
                    <span className='hidden sm:inline'>Export Data</span>
                    <span className='sm:hidden'>Export</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead>
                <tr className='border-b border-[#1E1E21]'>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Customer
                  </th>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Plan
                  </th>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Amount
                  </th>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Commission
                  </th>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Type
                  </th>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Status
                  </th>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Date
                  </th>
                  <th className='text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-[#1E1E21]'>
                {earningsData.map((earning) => (
                  <tr
                    key={earning.id}
                    className='hover:bg-[#1A1A1C]/50 transition-all duration-200'
                  >
                    <td className='px-6 py-4'>
                      <div>
                        <div className='text-[#EDEDED] font-medium text-sm'>
                          {earning.customer}
                        </div>
                        <div className='text-gray-400 text-xs'>
                          {earning.email}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          earning.plan === 'Empire'
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                            : earning.plan === 'Pro'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {earning.plan}
                      </span>
                    </td>
                    <td className='px-6 py-4 text-[#EDEDED] font-medium'>
                      ${earning.amount}
                    </td>
                    <td className='px-6 py-4 text-[#D4AF37] font-bold'>
                      ${earning.commission}
                    </td>
                    <td className='px-6 py-4'>
                      <TypeBadge type={earning.type} />
                    </td>
                    <td className='px-6 py-4'>
                      <StatusBadge status={earning.status} />
                    </td>
                    <td className='px-6 py-4 text-gray-400 text-sm'>
                      {formatDate(earning.date)}
                    </td>
                    <td className='px-6 py-4 text-right'>
                      <button className='text-gray-400 hover:text-[#EDEDED] transition-colors duration-200'>
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className='px-4 sm:px-6 py-4 border-t border-[#1E1E21] flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='text-gray-400 text-sm text-center sm:text-left'>
              Showing 5 of 47 results
            </div>
            <div className='flex items-center justify-center gap-2'>
              <button className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'>
                Previous
              </button>
              <button className='px-3 h-8 bg-[#D4AF37] text-black rounded-lg text-sm font-medium'>
                1
              </button>
              <button className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'>
                2
              </button>
              <button className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default EarningsPage
