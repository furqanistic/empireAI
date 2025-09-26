import { selectIsAuthenticated } from '@/redux/userSlice'
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Crown,
  DollarSign,
  FileText,
  Gavel,
  Lock,
  Mail,
  Scale,
  Shield,
  UserCheck,
  Users,
} from 'lucide-react'
import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const TermsOfServicePage = () => {
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Conditional navigation based on authentication status
  const handleGoBack = () => {
    if (isAuthenticated) {
      // User is logged in - go one step back
      navigate(-1)
    } else {
      // User is not logged in - go to auth page
      navigate('/auth')
    }
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className='min-h-screen bg-[#0A0A0B] text-[#EDEDED]'>
      {/* Header */}
      <div className='bg-[#121214] border-b border-[#1E1E21]'>
        <div className='max-w-4xl mx-auto p-4 sm:p-6'>
          <div className='flex items-center gap-4 mb-4'>
            <button
              onClick={handleGoBack}
              className='flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors duration-300'
            >
              <ChevronLeft size={20} />
              <span className='text-sm'>Back to Ascend AI</span>
            </button>
          </div>

          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-[#D4AF37] flex items-center justify-center flex-shrink-0'>
              <Scale size={24} className='sm:hidden text-black' />
              <Scale size={28} className='hidden sm:block text-black' />
            </div>
            <div>
              <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-[#EDEDED] mb-2'>
                Terms of <span className='text-[#D4AF37]'>Service</span>
              </h1>
              <p className='text-gray-400 text-sm sm:text-base'>
                Your agreement to build and scale with Ascend AI Empire
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
            These Terms of Service are effective as of{' '}
            <span className='text-[#D4AF37] font-semibold'>Sept 25,2025</span>{' '}
            and govern your use of the Ascend AI Empire platform.
          </p>
        </div>

        {/* Eligibility */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
              <UserCheck size={20} className='text-[#D4AF37]' />
            </div>
            <h2 className='text-xl font-bold text-[#EDEDED]'>
              Eligibility Requirements
            </h2>
          </div>

          <div className='bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <CheckCircle size={16} className='text-[#D4AF37]' />
              <h3 className='text-[#D4AF37] font-semibold'>Age Requirement</h3>
            </div>
            <p className='text-gray-400 text-sm leading-relaxed'>
              You must be at least 18 years old to use Ascend AI Empire. By
              using this service, you represent and warrant that you meet this
              age requirement.
            </p>
          </div>
        </div>

        {/* Account & Responsibilities */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-blue-500/10 p-2 rounded-xl'>
              <Shield size={20} className='text-blue-500' />
            </div>
            <h2 className='text-xl font-bold text-[#EDEDED]'>
              Account Responsibility
            </h2>
          </div>

          <div className='space-y-4'>
            <div className='bg-[#1A1A1C] rounded-lg p-4'>
              <h3 className='text-blue-400 font-semibold mb-2'>
                Your Account, Your Responsibility
              </h3>
              <p className='text-gray-400 text-sm leading-relaxed'>
                You are fully responsible for all activity that occurs under
                your account. Maintain the security of your login credentials.
              </p>
            </div>

            <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4'>
              <h3 className='text-red-400 font-semibold mb-2'>
                Prohibited Uses
              </h3>
              <p className='text-gray-400 text-sm leading-relaxed mb-2'>
                You agree not to use the platform for:
              </p>
              <ul className='text-gray-400 text-sm space-y-1'>
                <li>• Illegal, harmful, or abusive purposes</li>
                <li>• Spamming or unsolicited communications</li>
                <li>• Hacking or distributing malicious software</li>
                <li>• Any activity that violates applicable laws</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Payments & Financial Terms */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-emerald-500/10 p-2 rounded-xl'>
              <DollarSign size={20} className='text-emerald-500' />
            </div>
            <h2 className='text-xl font-bold text-[#EDEDED]'>
              Payments & Refunds
            </h2>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='bg-[#1A1A1C] rounded-lg p-4'>
              <h3 className='text-emerald-400 font-semibold mb-2'>
                Subscription Terms
              </h3>
              <p className='text-gray-400 text-sm'>
                Subscriptions are billed in advance and are non-refundable
                except where required by law.
              </p>
            </div>

            <div className='bg-[#1A1A1C] rounded-lg p-4'>
              <h3 className='text-emerald-400 font-semibold mb-2'>
                Affiliate Commissions
              </h3>
              <p className='text-gray-400 text-sm'>
                Commissions are paid based on completed and verified
                transactions only.
              </p>
            </div>

            <div className='bg-[#1A1A1C] rounded-lg p-4 md:col-span-2'>
              <h3 className='text-emerald-400 font-semibold mb-2'>
                Pricing Changes
              </h3>
              <p className='text-gray-400 text-sm'>
                We reserve the right to adjust pricing, commissions, or payout
                schedules at any time with reasonable notice.
              </p>
            </div>
          </div>
        </div>

        {/* Content & Affiliate Terms */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Content Responsibility */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
                <FileText size={20} className='text-[#D4AF37]' />
              </div>
              <h2 className='text-lg font-bold text-[#EDEDED]'>
                Content Responsibility
              </h2>
            </div>

            <div className='space-y-3'>
              <div className='bg-[#1A1A1C] rounded-lg p-3'>
                <h3 className='text-[#D4AF37] font-semibold mb-1 text-sm'>
                  Your Content
                </h3>
                <p className='text-gray-400 text-xs'>
                  You are solely responsible for content you upload, create, or
                  sell.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-3'>
                <h3 className='text-[#D4AF37] font-semibold mb-1 text-sm'>
                  Platform Liability
                </h3>
                <p className='text-gray-400 text-xs'>
                  We are not liable for IP violations caused by user content.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-3'>
                <h3 className='text-[#D4AF37] font-semibold mb-1 text-sm'>
                  Rights Representation
                </h3>
                <p className='text-gray-400 text-xs'>
                  You represent that you own or have rights to distribute your
                  content.
                </p>
              </div>
            </div>
          </div>

          {/* Affiliate Program */}
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='bg-blue-500/10 p-2 rounded-xl'>
                <Users size={20} className='text-blue-500' />
              </div>
              <h2 className='text-lg font-bold text-[#EDEDED]'>
                Affiliate Program
              </h2>
            </div>

            <div className='space-y-3'>
              <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-3'>
                <h3 className='text-red-400 font-semibold mb-1 text-sm'>
                  Fraud Policy
                </h3>
                <p className='text-gray-400 text-xs'>
                  Fraud, self-referrals, or system manipulation results in
                  commission forfeiture.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-3'>
                <h3 className='text-blue-400 font-semibold mb-1 text-sm'>
                  Commission Terms
                </h3>
                <p className='text-gray-400 text-xs'>
                  Commissions only paid on verified, completed transactions.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-3'>
                <h3 className='text-blue-400 font-semibold mb-1 text-sm'>
                  Program Changes
                </h3>
                <p className='text-gray-400 text-xs'>
                  We may modify or terminate the program at any time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Intellectual Property */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
              <Lock size={20} className='text-[#D4AF37]' />
            </div>
            <h2 className='text-xl font-bold text-[#EDEDED]'>
              Intellectual Property Rights
            </h2>
          </div>

          <div className='space-y-4'>
            <div className='bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-lg p-4'>
              <h3 className='text-[#D4AF37] font-semibold mb-2'>
                Platform Ownership
              </h3>
              <p className='text-gray-400 text-sm'>
                All rights to the platform, including code, design, branding,
                and technology, belong exclusively to Ascend AI Empire.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Your License
                </h3>
                <p className='text-gray-400 text-sm'>
                  Limited, non-exclusive, non-transferable license to use the
                  platform.
                </p>
              </div>

              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Restrictions
                </h3>
                <p className='text-gray-400 text-sm'>
                  No copying, modifying, reselling, or reverse-engineering
                  permitted.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimers */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-yellow-500/10 p-2 rounded-xl'>
              <AlertTriangle size={20} className='text-yellow-500' />
            </div>
            <h2 className='text-xl font-bold text-[#EDEDED]'>
              Legal Disclaimers & Liability
            </h2>
          </div>

          <div className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4'>
                <h3 className='text-yellow-400 font-semibold mb-2'>
                  Disclaimer of Warranties
                </h3>
                <p className='text-gray-400 text-sm'>
                  Service provided "as is" and "as available." No guarantees of
                  earnings, availability, or error-free operation.
                </p>
              </div>

              <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4'>
                <h3 className='text-red-400 font-semibold mb-2'>
                  Limitation of Liability
                </h3>
                <p className='text-gray-400 text-sm'>
                  Our total liability shall not exceed the amount you paid us in
                  the last 12 months.
                </p>
              </div>
            </div>

            <div className='bg-[#1A1A1C] rounded-lg p-4'>
              <h3 className='text-[#D4AF37] font-semibold mb-2'>
                Indemnification
              </h3>
              <p className='text-gray-400 text-sm leading-relaxed'>
                You agree to indemnify and hold harmless Ascend AI Empire, its
                officers, employees, and affiliates from any claims, damages, or
                expenses arising from your use of the service, including
                violations of intellectual property rights or unlawful activity.
              </p>
            </div>
          </div>
        </div>

        {/* Dispute Resolution */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
              <Gavel size={20} className='text-[#D4AF37]' />
            </div>
            <h2 className='text-xl font-bold text-[#EDEDED]'>
              Dispute Resolution & Governing Law
            </h2>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <div className='space-y-4'>
              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Arbitration Agreement
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed mb-2'>
                  Disputes resolved exclusively through binding arbitration
                  under American Arbitration Association rules.
                </p>
                <p className='text-gray-400 text-xs'>
                  You waive rights to class actions or jury trials.
                </p>
              </div>
            </div>

            <div className='space-y-4'>
              <div className='bg-[#1A1A1C] rounded-lg p-4'>
                <h3 className='text-[#D4AF37] font-semibold mb-2'>
                  Governing Law
                </h3>
                <p className='text-gray-400 text-sm leading-relaxed'>
                  These Terms are governed by the laws of Delaware, without
                  regard to conflict of law principles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Terms */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <AlertTriangle size={18} className='text-red-500' />
              <h3 className='text-lg font-semibold text-[#EDEDED]'>
                Termination
              </h3>
            </div>
            <p className='text-gray-400 text-sm'>
              We reserve the right to suspend or terminate accounts for
              violations, misuse, or fraudulent activity.
            </p>
          </div>

          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <Shield size={18} className='text-blue-500' />
              <h3 className='text-lg font-semibold text-[#EDEDED]'>
                Severability
              </h3>
            </div>
            <p className='text-gray-400 text-sm'>
              If any part is unenforceable, remaining provisions continue in
              full force and effect.
            </p>
          </div>

          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <FileText size={18} className='text-[#D4AF37]' />
              <h3 className='text-lg font-semibold text-[#EDEDED]'>Changes</h3>
            </div>
            <p className='text-gray-400 text-sm'>
              Terms may be updated anytime. Continued use means acceptance of
              changes.
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className='bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20 rounded-xl p-6'>
          <div className='text-center'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <Mail size={20} className='text-[#D4AF37]' />
              <h3 className='text-xl font-bold text-[#EDEDED]'>
                Questions About These Terms?
              </h3>
            </div>
            <p className='text-gray-400 mb-4'>
              Contact our legal team for clarification on any terms or
              conditions.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 items-center justify-center'>
              <a
                href='mailto:hello@ascndlabs.com'
                className='inline-flex items-center gap-2 bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300'
              >
                <Mail size={16} />
                hello@ascndlabs.com
              </a>
              <button
                onClick={handleGoBack}
                className='inline-flex items-center gap-2 bg-[#121214] border border-[#D4AF37]/30 text-[#D4AF37] px-6 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/5 transition-all duration-300'
              >
                <Crown size={16} />
                Back to Ascend AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfServicePage
