// File: client/src/pages/Affiliate/AffiliatePage.jsx
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  DollarSign,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCw,
  Share2,
  UserPlus,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'
import {
  useCurrentUser,
  useGenerateReferralCode,
  useReferralStats,
} from '../../hooks/useAuth.js'
import Layout from '../Layout/Layout'

const AffiliatePage = () => {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedRefCode, setCopiedRefCode] = useState(false)
  const [showAllReferrals, setShowAllReferrals] = useState(false)
  const [showEmbedCode, setShowEmbedCode] = useState(false)

  // Get current user and referral data
  const currentUser = useCurrentUser()
  const {
    data: referralData,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useReferralStats()

  const generateCodeMutation = useGenerateReferralCode()

  // Extract referral information with fallbacks - Fix URL to use /auth
  const referralStats = referralData?.data?.referralStats
  const referralCode = currentUser?.referralCode || 'LOADING'
  const referralLink =
    referralStats?.referralUrl?.replace('/signup', '/auth') ||
    `${window.location.origin}/auth?ref=${referralCode}`

  // Create embed code with correct URL
  const embedCode = `<a href="${referralLink}" target="_blank" style="display: inline-block; background: #D4AF37; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Try Ascend AI</a>`

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else if (type === 'code') {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } else if (type === 'refcode') {
      setCopiedRefCode(true)
      setTimeout(() => setCopiedRefCode(false), 2000)
    }
  }

  const handleGenerateNewCode = async () => {
    try {
      await generateCodeMutation.mutateAsync()
      refetchStats()
    } catch (error) {
      console.error('Error generating new code:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0)
  }

  return (
    <Layout>
      <div className='max-w-6xl mx-auto p-4 sm:p-6 space-y-6'>
        {/* Header */}
        <div className='text-left'>
          <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
            Affiliate Program
          </h1>
          <p className='text-gray-400'>
            Share Ascend AI and earn recurring commissions
          </p>
          {currentUser?.name && (
            <div className='flex items-center gap-2 mt-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <span className='text-sm text-gray-400'>
                <span className='text-[#EDEDED] font-medium'>
                  {currentUser.name}
                </span>
              </span>
            </div>
          )}
        </div>

        {statsError && (
          <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center'>
            <p className='text-red-400 text-sm mb-2'>
              Failed to load referral data
            </p>
            <button
              onClick={() => refetchStats()}
              className='bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600 transition-colors'
            >
              Retry
            </button>
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3'>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-lg p-4 text-center'>
            <div className='text-xl font-bold text-[#EDEDED] mb-1'>
              {isLoadingStats ? (
                <Loader2 className='w-5 h-5 animate-spin mx-auto' />
              ) : (
                referralStats?.summary?.totalReferrals || 0
              )}
            </div>
            <div className='text-gray-400 text-xs'>Total Referrals</div>
          </div>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-lg p-4 text-center'>
            <div className='text-xl font-bold text-[#D4AF37] mb-1'>
              {isLoadingStats ? (
                <Loader2 className='w-5 h-5 animate-spin mx-auto' />
              ) : (
                formatCurrency(referralStats?.summary?.totalRewards)
              )}
            </div>
            <div className='text-gray-400 text-xs'>Total Earned</div>
          </div>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-lg p-4 text-center'>
            <div className='text-xl font-bold text-blue-400 mb-1'>
              {isLoadingStats ? (
                <Loader2 className='w-5 h-5 animate-spin mx-auto' />
              ) : (
                referralStats?.summary?.conversionRate || '0%'
              )}
            </div>
            <div className='text-gray-400 text-xs'>Conversion</div>
          </div>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-lg p-4 text-center'>
            <div className='text-xl font-bold text-emerald-400 mb-1'>
              {isLoadingStats ? (
                <Loader2 className='w-5 h-5 animate-spin mx-auto' />
              ) : (
                referralStats?.summary?.thisMonthReferrals || 0
              )}
            </div>
            <div className='text-gray-400 text-xs'>This Month</div>
          </div>
        </div>

        {/* Referral Tools */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Referral Code */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center justify-between mb-3'>
              <div className='flex items-center gap-3'>
                <div className='bg-purple-500/10 p-2 rounded-lg text-purple-400'>
                  <Copy size={18} />
                </div>
                <div>
                  <h3 className='text-lg font-bold text-[#EDEDED]'>
                    Referral Code
                  </h3>
                  <p className='text-gray-400 text-xs'>
                    Manual entry during signup
                  </p>
                </div>
              </div>
              <button
                onClick={handleGenerateNewCode}
                disabled={generateCodeMutation.isPending || isLoadingStats}
                className='bg-[#1A1A1C] border border-[#1E1E21] text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/40 p-2 rounded-lg transition-colors disabled:opacity-50'
                title='Generate new code'
              >
                <RefreshCw
                  size={14}
                  className={
                    generateCodeMutation.isPending ? 'animate-spin' : ''
                  }
                />
              </button>
            </div>

            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3'>
              <div className='flex items-center gap-2'>
                <div className='bg-[#121214] border border-[#1E1E21] rounded-md px-3 py-2 font-mono text-lg font-bold text-[#D4AF37] tracking-wider flex-1 text-center'>
                  {isLoadingStats ? (
                    <Loader2 className='w-5 h-5 animate-spin mx-auto' />
                  ) : (
                    referralCode
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(referralCode, 'refcode')}
                  disabled={isLoadingStats || referralCode === 'LOADING'}
                  className='bg-[#D4AF37] text-black px-3 py-2 rounded-md font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
                >
                  {copiedRefCode ? <Check size={14} /> : <Copy size={14} />}
                  <span className='hidden sm:inline'>
                    {copiedRefCode ? 'Copied!' : 'Copy'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='bg-blue-500/10 p-2 rounded-lg text-blue-400'>
                <Link2 size={18} />
              </div>
              <div>
                <h3 className='text-lg font-bold text-[#EDEDED]'>
                  Referral Link
                </h3>
                <p className='text-gray-400 text-xs'>Direct link for sharing</p>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3'>
                <div className='flex items-center gap-2'>
                  <div className='flex-1 bg-[#121214] border border-[#1E1E21] rounded-md px-3 py-2 font-mono text-xs text-[#EDEDED] overflow-x-auto'>
                    {isLoadingStats ? 'Loading...' : referralLink}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralLink, 'link')}
                    disabled={isLoadingStats}
                    className='bg-[#D4AF37] text-black px-3 py-2 rounded-md font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 disabled:opacity-50'
                  >
                    {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                    <span className='hidden sm:inline'>
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <button
                  disabled={isLoadingStats}
                  className='bg-blue-500 text-white px-3 py-2 rounded-md font-semibold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  onClick={() =>
                    !isLoadingStats && window.open(referralLink, '_blank')
                  }
                  disabled={isLoadingStats}
                  className='bg-[#1A1A1C] border border-[#1E1E21] text-[#EDEDED] px-3 py-2 rounded-md font-semibold text-sm hover:border-[#D4AF37]/40 transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
                >
                  <ExternalLink size={14} />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Structure - Compact */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-[#D4AF37] p-2 rounded-lg text-black'>
              <DollarSign size={18} />
            </div>
            <div>
              <h3 className='text-lg font-bold text-[#EDEDED]'>
                Commission Structure
              </h3>
              <p className='text-gray-400 text-sm'>
                Recurring earnings on all plans
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3 text-center'>
              <div className='text-lg font-bold text-blue-400 mb-1'>20%</div>
              <div className='text-[#EDEDED] text-sm font-medium'>Pro Plan</div>
            </div>
            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3 text-center ring-1 ring-[#D4AF37]/20'>
              <div className='text-lg font-bold text-[#D4AF37] mb-1'>30%</div>
              <div className='text-[#EDEDED] text-sm font-medium'>
                Empire Plan
              </div>
              <div className='bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium px-2 py-0.5 rounded-full mt-1'>
                Popular
              </div>
            </div>
            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3 text-center'>
              <div className='text-lg font-bold text-purple-400 mb-1'>40%</div>
              <div className='text-[#EDEDED] text-sm font-medium'>
                Ultimate Plan
              </div>
            </div>
          </div>
        </div>

        {/* Embed Code - Collapsible */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
          <button
            onClick={() => setShowEmbedCode(!showEmbedCode)}
            className='w-full flex items-center justify-between text-left'
          >
            <div className='flex items-center gap-3'>
              <div className='bg-emerald-500/10 p-2 rounded-lg text-emerald-400'>
                <Copy size={18} />
              </div>
              <div>
                <h3 className='text-lg font-bold text-[#EDEDED]'>Embed Code</h3>
                <p className='text-gray-400 text-sm'>
                  Website button integration
                </p>
              </div>
            </div>
            {showEmbedCode ? (
              <ChevronUp size={20} className='text-gray-400' />
            ) : (
              <ChevronDown size={20} className='text-gray-400' />
            )}
          </button>

          {showEmbedCode && (
            <div className='mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <div className='space-y-3'>
                <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3'>
                  <div className='text-sm text-gray-400 mb-2'>Preview:</div>
                  <div className='bg-[#121214] border border-[#1E1E21] rounded-md p-3 text-center'>
                    <a
                      href={referralLink}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-block bg-[#D4AF37] text-black px-4 py-2 rounded-md font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 no-underline'
                    >
                      Try Ascend AI
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(embedCode, 'code')}
                  disabled={isLoadingStats}
                  className='w-full bg-emerald-500 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50'
                >
                  {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                  {copiedCode ? 'Code Copied!' : 'Copy Embed Code'}
                </button>
              </div>
              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3'>
                <div className='text-sm text-gray-400 mb-2'>Code:</div>
                <div className='bg-[#0A0A0C] border border-[#1E1E21] rounded-md p-3 max-h-32 overflow-y-auto'>
                  <code className='text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all'>
                    {embedCode}
                  </code>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All Referrals - Collapsible */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
          <button
            onClick={() => setShowAllReferrals(!showAllReferrals)}
            className='w-full flex items-center justify-between text-left'
          >
            <div className='flex items-center gap-3'>
              <div className='bg-blue-500/10 p-2 rounded-lg text-blue-400'>
                <Users size={18} />
              </div>
              <div>
                <h3 className='text-lg font-bold text-[#EDEDED]'>
                  All Referrals ({referralStats?.referrals?.length || 0})
                </h3>
                <p className='text-gray-400 text-sm'>
                  Complete referral network overview
                </p>
              </div>
            </div>
            {showAllReferrals ? (
              <ChevronUp size={20} className='text-gray-400' />
            ) : (
              <ChevronDown size={20} className='text-gray-400' />
            )}
          </button>

          {showAllReferrals && (
            <div className='mt-4'>
              {isLoadingStats ? (
                <div className='text-center py-8'>
                  <Loader2 className='w-6 h-6 animate-spin text-[#D4AF37] mx-auto mb-2' />
                  <p className='text-gray-400 text-sm'>Loading referrals...</p>
                </div>
              ) : referralStats?.referrals &&
                referralStats.referrals.length > 0 ? (
                <div className='space-y-2 max-h-64 overflow-y-auto'>
                  {referralStats.referrals
                    .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt))
                    .map((referral, index) => {
                      const joinDate = new Date(referral.joinedAt)
                      const daysActive = Math.floor(
                        (new Date() - joinDate) / (1000 * 60 * 60 * 24)
                      )

                      return (
                        <div
                          key={referral.user._id || index}
                          className='flex items-center justify-between p-3 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg hover:bg-[#1A1A1C]/70 transition-colors'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center'>
                              <span className='text-black font-bold text-sm'>
                                {referral.user.name
                                  ? referral.user.name.charAt(0).toUpperCase()
                                  : 'U'}
                              </span>
                            </div>
                            <div>
                              <p className='text-[#EDEDED] font-medium text-sm'>
                                {referral.user.name || 'Anonymous User'}
                              </p>
                              <p className='text-gray-400 text-xs'>
                                {joinDate.toLocaleDateString()} • {daysActive}{' '}
                                days active
                              </p>
                            </div>
                          </div>
                          <div
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              referral.status === 'active'
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                referral.status === 'active'
                                  ? 'bg-green-400'
                                  : 'bg-gray-400'
                              }`}
                            ></div>
                            {referral.status}
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center'>
                    <Users size={20} className='text-gray-400' />
                  </div>
                  <h4 className='text-[#EDEDED] font-bold mb-1'>
                    No Referrals Yet
                  </h4>
                  <p className='text-gray-400 text-sm'>
                    Start sharing to build your network
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default AffiliatePage
