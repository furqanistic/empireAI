// File: client/src/pages/Affiliate/AffiliatePage.jsx
import {
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Link2,
  Share2,
  UserPlus,
} from 'lucide-react'
import React, { useState } from 'react'

import Layout from '../Layout/Layout'

const AffiliatePage = () => {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedRefCode, setCopiedRefCode] = useState(false)

  const referralLink = 'https://ascendai.com/ref/AF7X9K2'
  const referralCode = 'AF7X9K2'
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

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8'>
        {/* Header */}
        <div className='text-left'>
          <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
            Affiliate Program
          </h1>
          <p className='text-gray-400'>
            Share Ascend AI and earn recurring commissions
          </p>
        </div>

        {/* Referral Code & Link - Side by Side */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Referral Code */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-purple-500/10 p-2 rounded-lg text-purple-400'>
                <Copy size={20} />
              </div>
              <div>
                <h2 className='text-lg font-bold text-[#EDEDED]'>
                  Referral Code
                </h2>
                <p className='text-gray-400 text-sm'>
                  For manual entry during signup
                </p>
              </div>
            </div>

            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3'>
              <div className='flex items-center gap-3'>
                <div className='bg-[#121214] border border-[#1E1E21] rounded-md px-4 py-2 font-mono text-lg font-bold text-[#D4AF37] tracking-wider flex-1 text-center'>
                  {referralCode}
                </div>
                <button
                  onClick={() => copyToClipboard(referralCode, 'refcode')}
                  className='bg-[#D4AF37] text-black px-3 py-2 rounded-md font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 flex-shrink-0'
                >
                  {copiedRefCode ? (
                    <>
                      <Check size={14} />
                      <span className='hidden sm:inline'>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span className='hidden sm:inline'>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-blue-500/10 p-2 rounded-lg text-blue-400'>
                <Link2 size={20} />
              </div>
              <div>
                <h2 className='text-lg font-bold text-[#EDEDED]'>
                  Referral Link
                </h2>
                <p className='text-gray-400 text-sm'>
                  Direct link for easy sharing
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3'>
                <div className='flex items-center gap-3'>
                  <div className='flex-1 bg-[#121214] border border-[#1E1E21] rounded-md px-3 py-2 font-mono text-xs text-[#EDEDED] overflow-x-auto'>
                    {referralLink}
                  </div>
                  <button
                    onClick={() => copyToClipboard(referralLink, 'link')}
                    className='bg-[#D4AF37] text-black px-3 py-2 rounded-md font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 flex-shrink-0'
                  >
                    {copiedLink ? (
                      <>
                        <Check size={14} />
                        <span className='hidden sm:inline'>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span className='hidden sm:inline'>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-2'>
                <button className='bg-blue-500 text-white px-3 py-2 rounded-md font-semibold text-sm hover:bg-blue-600 transition-all duration-300 flex items-center justify-center gap-2'>
                  <Share2 size={14} />
                  <span className='hidden sm:inline'>Share</span>
                </button>
                <button className='bg-[#1A1A1C] border border-[#1E1E21] text-[#EDEDED] px-3 py-2 rounded-md font-semibold text-sm hover:border-[#D4AF37]/40 transition-all duration-300 flex items-center justify-center gap-2'>
                  <ExternalLink size={14} />
                  <span className='hidden sm:inline'>Preview</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Structure & Stats */}
        <div className='grid grid-cols-1 xl:grid-cols-4 gap-4'>
          {/* Commission Structure */}
          <div className='xl:col-span-3 bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4 hover:border-[#D4AF37]/20 transition-all duration-300'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-[#D4AF37] p-2 rounded-lg text-black'>
                <DollarSign size={20} />
              </div>
              <div>
                <h2 className='text-lg font-bold text-[#EDEDED]'>
                  Commission Structure
                </h2>
                <p className='text-gray-400 text-sm'>
                  Earn on every sale your recruits make
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-4 text-center hover:border-blue-500/30 transition-all duration-300'>
                <div className='bg-blue-500/10 p-2 rounded-lg inline-flex mb-2'>
                  <UserPlus size={16} className='text-blue-400' />
                </div>
                <h3 className='text-[#EDEDED] font-bold mb-1'>Pro Plan</h3>
                <p className='text-gray-400 text-xs mb-2'>$49/month</p>
                <div className='text-xl font-bold text-blue-400 mb-1'>20%</div>
                <div className='text-gray-400 text-xs'>Recurring</div>
              </div>

              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-4 text-center hover:border-[#D4AF37]/30 transition-all duration-300 ring-1 ring-[#D4AF37]/20'>
                <div className='bg-[#D4AF37]/10 p-2 rounded-lg inline-flex mb-2'>
                  <UserPlus size={16} className='text-[#D4AF37]' />
                </div>
                <h3 className='text-[#EDEDED] font-bold mb-1'>Empire Plan</h3>
                <p className='text-gray-400 text-xs mb-2'>$89/month</p>
                <div className='text-xl font-bold text-[#D4AF37] mb-1'>30%</div>
                <div className='text-gray-400 text-xs'>Recurring</div>
                <div className='bg-[#D4AF37]/10 text-[#D4AF37] text-xs font-medium px-2 py-1 rounded-full mt-2'>
                  Popular
                </div>
              </div>

              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-4 text-center hover:border-purple-500/30 transition-all duration-300'>
                <div className='bg-purple-500/10 p-2 rounded-lg inline-flex mb-2'>
                  <UserPlus size={16} className='text-purple-400' />
                </div>
                <h3 className='text-[#EDEDED] font-bold mb-1'>Ultimate Plan</h3>
                <p className='text-gray-400 text-xs mb-2'>$149/month</p>
                <div className='text-xl font-bold text-purple-400 mb-1'>
                  40%
                </div>
                <div className='text-gray-400 text-xs'>Recurring</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
            <h3 className='text-lg font-bold text-[#EDEDED] mb-4'>
              Your Stats
            </h3>
            <div className='space-y-4'>
              <div className='text-center'>
                <div className='text-xl font-bold text-[#EDEDED] mb-1'>147</div>
                <div className='text-gray-400 text-xs'>Total Referrals</div>
              </div>
              <div className='text-center'>
                <div className='text-xl font-bold text-[#D4AF37] mb-1'>
                  $18,874
                </div>
                <div className='text-gray-400 text-xs'>Total Earned</div>
              </div>
              <div className='text-center'>
                <div className='text-xl font-bold text-blue-400 mb-1'>8.7%</div>
                <div className='text-gray-400 text-xs'>Conversion Rate</div>
              </div>
              <div className='text-center'>
                <div className='text-xl font-bold text-emerald-400 mb-1'>
                  $3,240
                </div>
                <div className='text-gray-400 text-xs'>This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Embed Code */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-emerald-500/10 p-2 rounded-lg text-emerald-400'>
              <Copy size={20} />
            </div>
            <div>
              <h2 className='text-lg font-bold text-[#EDEDED]'>Embed Code</h2>
              <p className='text-gray-400 text-sm'>
                Add this button to your website
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
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
                className='w-full bg-emerald-500 text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-emerald-600 transition-all duration-300 flex items-center justify-center gap-2'
              >
                {copiedCode ? (
                  <>
                    <Check size={14} />
                    Code Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Embed Code
                  </>
                )}
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
        </div>
      </div>
    </Layout>
  )
}

export default AffiliatePage
