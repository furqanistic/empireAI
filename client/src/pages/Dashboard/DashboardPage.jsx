import {
  AlertCircle,
  ArrowRight,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  HandCoins,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser, useReferralStats } from '../../hooks/useAuth.js'
import { useGetEarningsSummary } from '../../hooks/useEarnings.js'
import { useEarningsSummary as usePayoutEarningsSummary } from '../../hooks/usePayouts.js'
import Layout from '../Layout/Layout'

const formatCurrency = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return 'Not available'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

const MetricCard = ({
  title,
  value,
  helper,
  icon,
  color,
  isLoading,
  error,
}) => (
  <div className='rounded-2xl border border-white/[0.06] bg-white/[0.025] p-5'>
    <div className='mb-5 flex items-start justify-between gap-4'>
      <p className='text-xs font-bold uppercase tracking-[0.12em] text-gray-500'>
        {title}
      </p>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        {createElement(icon, { size: 18 })}
      </div>
    </div>

    {isLoading ? (
      <div aria-label={`Loading ${title}`} className='space-y-3'>
        <div className='h-8 w-28 animate-pulse rounded-lg bg-white/[0.08]' />
        <div className='h-3 w-36 animate-pulse rounded bg-white/[0.05]' />
      </div>
    ) : error ? (
      <div className='min-h-[52px]'>
        <p className='flex items-center gap-2 text-sm font-semibold text-amber-300'>
          <AlertCircle size={15} />
          Not available
        </p>
        <p className='mt-2 text-xs text-gray-600'>Could not load this metric.</p>
      </div>
    ) : (
      <div className='min-h-[52px]'>
        <p className='text-2xl font-black tracking-tight text-white'>{value}</p>
        <p className='mt-2 text-xs text-gray-500'>{helper}</p>
      </div>
    )}
  </div>
)

const DashboardPage = () => {
  const currentUser = useCurrentUser()
  const referralQuery = useReferralStats()
  const earningsQuery = useGetEarningsSummary()
  const payoutQuery = usePayoutEarningsSummary()

  const referralSummary =
    referralQuery.data?.data?.referralStats?.summary
  const earningsSummary = earningsQuery.data?.data
  const payoutSummary = payoutQuery.data?.data

  const totalAffiliates = Number(referralSummary?.totalReferrals || 0)
  const pendingCommissionCents = Number(
    earningsSummary?.pending?.total || 0
  )
  const approvedCommissionCents = Number(
    earningsSummary?.approved?.total || 0
  )
  const paidCommissionCents = Number(earningsSummary?.paid?.total || 0)
  const totalCommission =
    (pendingCommissionCents +
      approvedCommissionCents +
      paidCommissionCents) /
    100
  const commissionOwed =
    (pendingCommissionCents + approvedCommissionCents) / 100
  const pendingPayouts = Number(
    payoutSummary?.userEarningsInfo?.pendingEarnings || 0
  )

  const metrics = [
    {
      title: 'Total affiliates',
      value: totalAffiliates.toLocaleString(),
      helper:
        totalAffiliates === 0
          ? 'No affiliates have joined yet.'
          : `${totalAffiliates === 1 ? 'Affiliate' : 'Affiliates'} in your program.`,
      icon: Users,
      color: 'bg-blue-400/15 text-blue-300',
      isLoading: referralQuery.isLoading,
      error: referralQuery.isError,
    },
    {
      title: 'Total commission earned',
      value: formatCurrency(totalCommission),
      helper:
        totalCommission === 0
          ? 'No commission recorded yet.'
          : 'All pending, approved, and paid commission.',
      icon: CircleDollarSign,
      color: 'bg-emerald-400/15 text-emerald-300',
      isLoading: earningsQuery.isLoading,
      error: earningsQuery.isError,
    },
    {
      title: 'Commission owed',
      value: formatCurrency(commissionOwed),
      helper:
        commissionOwed === 0
          ? 'Nothing currently owed.'
          : 'Pending and approved commission not yet paid.',
      icon: HandCoins,
      color: 'bg-gold/15 text-gold',
      isLoading: earningsQuery.isLoading,
      error: earningsQuery.isError,
    },
    {
      title: 'Pending payouts',
      value: formatCurrency(pendingPayouts),
      helper:
        pendingPayouts === 0
          ? 'No balance is waiting for payout.'
          : 'Commission currently waiting for payout.',
      icon: CreditCard,
      color: 'bg-purple-400/15 text-purple-300',
      isLoading: payoutQuery.isLoading,
      error: payoutQuery.isError,
    },
  ]

  const quickActions = [
    {
      title: 'Affiliates',
      description: 'Invite affiliates and manage the people promoting your program.',
      path: '/invite',
      icon: UserPlus,
      color: 'bg-blue-400',
    },
    {
      title: 'Earnings',
      description: 'Review commissions, attributed revenue, and earning activity.',
      path: '/earn',
      icon: Wallet,
      color: 'bg-emerald-400',
    },
    {
      title: 'Payouts',
      description: 'See available balances and manage affiliate payouts.',
      path: '/payout',
      icon: CreditCard,
      color: 'bg-gold',
    },
  ]

  return (
    <Layout>
      <div className='max-w-7xl mx-auto px-6 py-8 space-y-8'>
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div>
            <p className='text-[10px] font-black tracking-[0.22em] text-gold uppercase mb-3'>
              Affiliate program
            </p>
            <h1 className='text-3xl font-black text-white tracking-tight mb-2'>
              Welcome,{' '}
              <span className='text-gold'>
                {currentUser?.name?.split(' ')[0] || 'Member'}
              </span>
            </h1>
            <p className='text-gray-500 text-sm'>
              Manage your affiliates, commissions, and payouts from one place.
            </p>
          </div>

          <Link
            to='/invite'
            className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-black transition-transform hover:scale-[1.02]'
          >
            <UserPlus size={17} />
            Invite an affiliate
          </Link>
        </div>

        <section aria-labelledby='program-overview-heading'>
          <div className='mb-4 flex items-center justify-between gap-4'>
            <div>
              <h2
                id='program-overview-heading'
                className='text-lg font-bold text-white'
              >
                Program overview
              </h2>
              <p className='mt-1 text-xs text-gray-600'>
                Live totals from your affiliates, earnings, and payouts.
              </p>
            </div>
          </div>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        </section>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {quickActions.map((action) => {
            return (
              <Link
                key={action.title}
                to={action.path}
                className='group rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-6 transition-all hover:border-gold/30 hover:bg-white/[0.04]'
              >
                <div
                  className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl ${action.color} text-black`}
                >
                  {createElement(action.icon, { size: 21 })}
                </div>
                <h2 className='mb-2 text-lg font-bold text-white'>
                  {action.title}
                </h2>
                <p className='mb-6 min-h-10 text-sm leading-relaxed text-gray-500'>
                  {action.description}
                </p>
                <span className='inline-flex items-center gap-2 text-xs font-bold text-gold'>
                  Open {action.title}
                  <ArrowRight
                    size={14}
                    className='transition-transform group-hover:translate-x-1'
                  />
                </span>
              </Link>
            )
          })}
        </div>

        <div className='rounded-[2rem] border border-white/5 bg-white/[0.02] p-8'>
          <div className='flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-xl'>
              <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold'>
                <Users size={23} />
              </div>
              <h2 className='mb-2 text-2xl font-black text-white'>
                Start with your first affiliate
              </h2>
              <p className='text-sm leading-relaxed text-gray-500'>
                Share your invitation link, let an affiliate join, and track the
                commissions they generate.
              </p>
            </div>

            <div className='grid min-w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[390px]'>
              <div className='rounded-2xl border border-white/5 bg-black/30 p-5'>
                <DollarSign size={18} className='mb-4 text-emerald-400' />
                <p className='text-sm font-bold text-white'>Clear commissions</p>
                <p className='mt-1 text-xs text-gray-500'>
                  Earnings stay visible and easy to understand.
                </p>
              </div>
              <div className='rounded-2xl border border-white/5 bg-black/30 p-5'>
                <CreditCard size={18} className='mb-4 text-blue-400' />
                <p className='text-sm font-bold text-white'>Simple payouts</p>
                <p className='mt-1 text-xs text-gray-500'>
                  Keep payment status in one dedicated place.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default DashboardPage
