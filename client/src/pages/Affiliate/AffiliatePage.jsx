import {
  Check,
  Copy,
  DollarSign,
  ExternalLink,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  UserPlus,
  Users,
} from 'lucide-react'
import { createElement, useState } from 'react'
import {
  useAffiliateProgram,
  useCurrentUser,
  useGenerateReferralCode,
  useReferralStats,
} from '../../hooks/useAuth.js'
import AffiliatesTable from '../../components/Affiliate/AffiliatesTable.jsx'
import Layout from '../Layout/Layout.jsx'

const DEFAULT_COMMISSION_RATE = 40

const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse rounded-md bg-white/[0.08] ${className}`} />
)

const StatCard = ({ label, value, icon, color, isLoading }) => (
  <div className='rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5'>
    <div className='mb-4 flex items-center justify-between gap-3'>
      <span className='text-xs font-bold uppercase tracking-[0.1em] text-gray-500'>
        {label}
      </span>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
        {createElement(icon, { size: 16 })}
      </span>
    </div>
    {isLoading ? (
      <Skeleton className='h-8 w-20' />
    ) : (
      <p className='text-2xl font-black tracking-tight text-white'>{value}</p>
    )}
  </div>
)

const AffiliatePage = () => {
  const [copied, setCopied] = useState(null)
  const [copyError, setCopyError] = useState('')

  const currentUser = useCurrentUser()
  const referralQuery = useReferralStats()
  const programQuery = useAffiliateProgram()
  const generateCode = useGenerateReferralCode()

  const referralStats = referralQuery.data?.data?.referralStats
  const program = programQuery.data?.data?.affiliateProgram
  const referralCode =
    referralStats?.referralCode || currentUser?.referralCode || ''
  const referralLink =
    referralStats?.referralUrl?.replace('/signup', '/auth') ||
    (referralCode
      ? `${window.location.origin}/auth?ref=${encodeURIComponent(referralCode)}`
      : '')
  const commissionRate =
    Number.isFinite(Number(program?.commissionRate))
      ? Number(program.commissionRate)
      : DEFAULT_COMMISSION_RATE
  const programName = program?.name || 'AscndLabs Affiliate Program'
  const invitationMessage = referralLink
    ? `Join ${programName} and earn ${commissionRate}% commission when your referrals become customers. Get started here: ${referralLink}`
    : ''

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount) || 0)

  const copyToClipboard = async (text, type) => {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopyError('')
      setCopied(type)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopyError('Copy failed. Select the text and copy it manually.')
    }
  }

  const handleGenerateCode = async () => {
    try {
      setCopyError('')
      await generateCode.mutateAsync()
      await referralQuery.refetch()
    } catch (error) {
      setCopyError(
        error.response?.data?.message ||
          'We could not create a referral code. Please try again.'
      )
    }
  }

  const stats = [
    {
      label: 'Commission rate',
      value: `${commissionRate}%`,
      icon: DollarSign,
      color: 'bg-gold/15 text-gold',
      isLoading: programQuery.isLoading,
    },
    {
      label: 'Total affiliates',
      value: referralStats?.summary?.totalReferrals || 0,
      icon: Users,
      color: 'bg-blue-400/15 text-blue-300',
      isLoading: referralQuery.isLoading,
    },
    {
      label: 'Total earned',
      value: formatCurrency(
        Number(referralStats?.summary?.totalRewards || 0) / 100
      ),
      icon: DollarSign,
      color: 'bg-emerald-400/15 text-emerald-300',
      isLoading: referralQuery.isLoading,
    },
    {
      label: 'This month',
      value: referralStats?.summary?.thisMonthReferrals || 0,
      icon: UserPlus,
      color: 'bg-purple-400/15 text-purple-300',
      isLoading: referralQuery.isLoading,
    },
  ]

  return (
    <Layout>
      <div className='mx-auto max-w-6xl space-y-6 p-2 sm:p-6'>
        <div>
          <p className='mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-gold'>
            Affiliate program
          </p>
          <h1 className='text-3xl font-black tracking-tight text-white sm:text-4xl'>
            Affiliates
          </h1>
          <p className='mt-2 text-sm text-gray-500'>
            Share your invitation link and track the people joining your program.
          </p>
        </div>

        {referralQuery.isError && (
          <div className='flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-red-300'>
              {referralQuery.error?.response?.data?.message ||
                'We could not load your affiliate details.'}
            </p>
            <button
              type='button'
              onClick={() => referralQuery.refetch()}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-red-400 px-4 py-2 text-sm font-bold text-black'
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        <section className='rounded-3xl border border-gold/15 bg-gradient-to-br from-gold/[0.08] via-white/[0.025] to-transparent p-5 sm:p-7'>
          <div className='mb-5 flex items-start gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold text-black'>
              <Link2 size={19} />
            </div>
            <div>
              <h2 className='text-xl font-bold text-white'>Your affiliate link</h2>
              <p className='mt-1 text-xs text-gray-500'>
                Anyone who registers through this link will be attributed to you.
              </p>
            </div>
          </div>

          {referralQuery.isLoading ? (
            <Skeleton className='h-14 w-full' />
          ) : referralLink ? (
            <div className='flex flex-col gap-3 sm:flex-row'>
              <div className='min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3.5 font-mono text-sm text-gray-300'>
                <span className='block truncate'>{referralLink}</span>
              </div>
              <button
                type='button'
                onClick={() => copyToClipboard(referralLink, 'link')}
                className='inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-black transition-transform hover:scale-[1.02]'
              >
                {copied === 'link' ? <Check size={17} /> : <Copy size={17} />}
                {copied === 'link' ? 'Link copied' : 'Copy link'}
              </button>
              <a
                href={referralLink}
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Open affiliate link'
                className='inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/[0.08] text-gray-300 hover:border-gold/30 hover:text-white sm:w-12'
              >
                <ExternalLink size={17} />
              </a>
            </div>
          ) : (
            <div className='rounded-2xl border border-white/[0.08] bg-black/30 p-5'>
              <p className='text-sm text-gray-400'>
                Create your referral code to generate a shareable link.
              </p>
              <button
                type='button'
                onClick={handleGenerateCode}
                disabled={generateCode.isPending}
                className='mt-4 inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black disabled:opacity-60'
              >
                {generateCode.isPending ? (
                  <Loader2 size={16} className='animate-spin' />
                ) : (
                  <Link2 size={16} />
                )}
                Create referral code
              </button>
            </div>
          )}

          {copyError && <p className='mt-3 text-xs text-red-300'>{copyError}</p>}
        </section>

        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <AffiliatesTable
          referrals={referralStats?.referrals || []}
          isLoading={referralQuery.isLoading}
          isError={referralQuery.isError}
          referralLink={referralLink}
          copiedLink={copied === 'link'}
          onCopyLink={() => copyToClipboard(referralLink, 'link')}
        />

        <section className='rounded-3xl border border-white/[0.06] bg-white/[0.025] p-5 sm:p-7'>
          <div className='mb-5 flex items-start gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300'>
              <Mail size={19} />
            </div>
            <div>
              <h2 className='text-xl font-bold text-white'>Invitation message</h2>
              <p className='mt-1 text-xs text-gray-500'>
                Send this message directly to a prospective affiliate.
              </p>
            </div>
          </div>

          <div className='rounded-2xl border border-white/[0.08] bg-black/30 p-4 text-sm leading-relaxed text-gray-300'>
            {referralQuery.isLoading || programQuery.isLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-4/5' />
              </div>
            ) : invitationMessage ? (
              invitationMessage
            ) : (
              'Your invitation message will appear after your referral link is ready.'
            )}
          </div>

          <button
            type='button'
            onClick={() => copyToClipboard(invitationMessage, 'invitation')}
            disabled={!invitationMessage}
            className='mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:border-gold/40 hover:text-gold disabled:cursor-not-allowed disabled:opacity-40'
          >
            {copied === 'invitation' ? <Check size={16} /> : <Copy size={16} />}
            {copied === 'invitation'
              ? 'Invitation copied'
              : 'Copy invitation'}
          </button>
        </section>
      </div>
    </Layout>
  )
}

export default AffiliatePage
