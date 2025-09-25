import {
  Calendar,
  ChevronLeft,
  Crown,
  Eye,
  FileText,
  Globe,
  Lock,
  Mail,
  Shield,
  Users,
} from 'lucide-react'
import React from 'react'
import Layout from './Layout'

const PrivacyPolicyPage = () => {
  return (
    <>
      <div className='min-h-screen bg-[#0A0A0B] text-[#EDEDED]'>
        {/* Header */}
        <div className='bg-[#121214] border-b border-[#1E1E21]'>
          <div className='max-w-4xl mx-auto p-4 sm:p-6'>
            <div className='flex items-center gap-4 mb-4'>
              <button
                onClick={() => window.history.back()}
                className='flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors duration-300'
              >
                <ChevronLeft size={20} />
                <span className='text-sm'>Back to Ascend AI</span>
              </button>
            </div>

            <div className='flex items-center gap-4'>
              <div className='w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0'>
                <Shield size={24} className='sm:hidden text-black' />
                <Shield size={28} className='hidden sm:block text-black' />
              </div>
              <div>
                <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-[#EDEDED] mb-2'>
                  Privacy <span className='text-[#D4AF37]'>Policy</span>
                </h1>
                <p className='text-gray-400 text-sm sm:text-base'>
                  Your privacy and data security in the digital empire
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-4xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8'>
          {/* Effective Date Card */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <Calendar size={20} className='text-[#D4AF37]' />
              <h2 className='text-lg font-semibold text-[#EDEDED]'>
                Effective Date
              </h2>
            </div>
            <p className='text-gray-400'>
              This Privacy Policy is effective as of{' '}
              <span className='text-[#D4AF37] font-semibold'>Sept 25,2025</span>{' '}
              and applies to all users of the Ascend AI Empire platform.
            </p>
          </div>

          {/* Information Collection */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
                <Eye size={20} className='text-[#D4AF37]' />
              </div>
              <h2 className='text-xl font-bold text-[#EDEDED]'>
                Information We Collect
              </h2>
            </div>

            <div className='space-y-4'>
              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Account Information
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed'>
                  Name, email address, and encrypted password for account
                  creation and management.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Payment Information
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed'>
                  Processed securely through third-party providers like Stripe
                  or PayPal. We do not store your payment details.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Usage Data
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed'>
                  Login activity, platform interactions, and performance
                  analytics to improve your experience.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Cookies & Tracking
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed'>
                  Analytics, advertising, and site functionality data through
                  cookies and similar technologies.
                </p>
              </div>
            </div>
          </div>

          {/* How We Use Information */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-emerald-500/10 p-2 rounded-xl'>
                <Users size={20} className='text-emerald-500' />
              </div>
              <h2 className='text-xl font-bold text-[#EDEDED]'>
                How We Use Your Information
              </h2>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-emerald-400 font-semibold mb-2'>
                  Platform Operations
                </h3>
                <p className='text-gray-400 text-sm'>
                  Operate, maintain, and continuously improve our services.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-emerald-400 font-semibold mb-2'>
                  Payment Processing
                </h3>
                <p className='text-gray-400 text-sm'>
                  Handle payments, subscriptions, and affiliate payouts
                  securely.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-emerald-400 font-semibold mb-2'>
                  Communications
                </h3>
                <p className='text-gray-400 text-sm'>
                  Send updates, offers, support responses, and important
                  notices.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-emerald-400 font-semibold mb-2'>
                  Analytics & Marketing
                </h3>
                <p className='text-gray-400 text-sm'>
                  Analyze usage patterns and optimize marketing performance.
                </p>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-blue-500/10 p-2 rounded-xl'>
                <Globe size={20} className='text-blue-500' />
              </div>
              <h2 className='text-xl font-bold text-[#EDEDED]'>
                Information Sharing
              </h2>
            </div>

            <div className='space-y-4'>
              <div className='bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4'>
                <div className='flex items-center gap-2 mb-2'>
                  <div className='w-2 h-2 rounded-full bg-emerald-500'></div>
                  <h3 className='text-emerald-400 font-semibold'>
                    We Never Sell Your Data
                  </h3>
                </div>
                <p className='text-gray-400 text-sm'>
                  Your personal information is never sold to third parties.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-blue-400 font-semibold mb-2'>
                  Trusted Partners
                </h3>
                <p className='text-gray-400 text-sm mb-2'>
                  We may share data with:
                </p>
                <ul className='text-gray-400 text-sm space-y-1'>
                  <li>• Payment processors (Stripe, PayPal)</li>
                  <li>• Hosting and infrastructure providers</li>
                  <li>• Analytics and marketing platforms</li>
                  <li>• Customer support tools</li>
                </ul>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-blue-400 font-semibold mb-2'>
                  Legal Requirements
                </h3>
                <p className='text-gray-400 text-sm'>
                  Information may be disclosed when required by law, regulation,
                  or legal process.
                </p>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
                <Lock size={20} className='text-[#D4AF37]' />
              </div>
              <h2 className='text-xl font-bold text-[#EDEDED]'>
                Data Security & Retention
              </h2>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <div className='bg-[#1A1A1C] rounded-lg p-4'>
                  <h3 className='text-[#D4AF37] font-semibold mb-2'>
                    Security Measures
                  </h3>
                  <p className='text-gray-400 text-sm leading-relaxed'>
                    We implement reasonable security measures to protect your
                    data, though no system can guarantee complete security. Any
                    breaches will be reported promptly in compliance with
                    applicable laws.
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='bg-[#1A1A1C] rounded-lg p-4'>
                  <h3 className='text-[#D4AF37] font-semibold mb-2'>
                    Data Retention
                  </h3>
                  <p className='text-gray-400 text-sm leading-relaxed'>
                    Data is retained as long as necessary to provide services or
                    as required by law. Account deletion will remove or
                    anonymize your data unless retention is legally required.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* User Rights */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
                <Crown size={20} className='text-[#D4AF37]' />
              </div>
              <h2 className='text-xl font-bold text-[#EDEDED]'>
                Your Rights as an Emperor
              </h2>
            </div>

            <div className='space-y-6'>
              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-3'>
                  General Rights
                </h3>
                <p className='text-gray-400 text-sm mb-3'>
                  Request access, correction, or deletion of your personal
                  information by contacting{' '}
                  <a
                    href='mailto:support@ascndlabs.com'
                    className='text-[#D4AF37] hover:underline'
                  >
                    support@ascndlabs.com
                  </a>
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4'>
                  <h3 className='text-blue-400 font-semibold mb-2'>
                    GDPR Rights (EU Users)
                  </h3>
                  <ul className='text-gray-400 text-sm space-y-1'>
                    <li>• Access and rectify your data</li>
                    <li>• Request data erasure</li>
                    <li>• Restrict or object to processing</li>
                    <li>• Data portability</li>
                  </ul>
                </div>

                <div className='bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-4'>
                  <h3 className='text-emerald-400 font-semibold mb-2'>
                    CCPA Rights (California)
                  </h3>
                  <ul className='text-gray-400 text-sm space-y-1'>
                    <li>• Know what data we collect</li>
                    <li>• Request data deletion</li>
                    <li>• Opt out of data sales</li>
                    <li>• Non-discrimination protection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Policies */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
              <div className='flex items-center gap-3 mb-3'>
                <FileText size={18} className='text-[#D4AF37]' />
                <h3 className='text-lg font-semibold text-[#EDEDED]'>
                  Additional Information
                </h3>
              </div>

              <div className='space-y-3'>
                <div className='text-sm'>
                  <span className='text-[#D4AF37] font-semibold'>
                    Third-Party Links:
                  </span>
                  <span className='text-gray-400 ml-2'>
                    We're not responsible for external site privacy practices.
                  </span>
                </div>

                <div className='text-sm'>
                  <span className='text-[#D4AF37] font-semibold'>
                    Children's Privacy:
                  </span>
                  <span className='text-gray-400 ml-2'>
                    No data collection from users under 18.
                  </span>
                </div>

                <div className='text-sm'>
                  <span className='text-[#D4AF37] font-semibold'>
                    International Transfers:
                  </span>
                  <span className='text-gray-400 ml-2'>
                    Data may be processed in the U.S.
                  </span>
                </div>
              </div>
            </div>

            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
              <div className='flex items-center gap-3 mb-3'>
                <Mail size={18} className='text-[#D4AF37]' />
                <h3 className='text-lg font-semibold text-[#EDEDED]'>
                  Contact & Updates
                </h3>
              </div>

              <div className='space-y-3'>
                <div className='text-sm'>
                  <span className='text-[#D4AF37] font-semibold'>
                    Policy Changes:
                  </span>
                  <span className='text-gray-400 ml-2'>
                    Continued use indicates acceptance of updates.
                  </span>
                </div>

                <div className='text-sm'>
                  <span className='text-[#D4AF37] font-semibold'>
                    Questions:
                  </span>
                  <div className='text-gray-400 mt-1'>
                    Email us at{' '}
                    <a
                      href='mailto:support@ascndlabs.com'
                      className='text-[#D4AF37] hover:underline'
                    >
                      support@ascndlabs.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className='bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20 rounded-xl p-6 text-center'>
            <h3 className='text-xl font-bold text-[#EDEDED] mb-2'>
              Ready to Build Your{' '}
              <span className='text-[#D4AF37]'>Digital Empire?</span>
            </h3>
            <p className='text-gray-400 mb-4'>
              Your privacy is protected while you scale your business with
              AI-powered tools.
            </p>
            <button
              onClick={() => window.history.back()}
              className='inline-flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300'
            >
              <Crown size={16} />
              Back to Ascend AI
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default PrivacyPolicyPage
