import { Check, Copy, Search, UserPlus, Users } from 'lucide-react'
import { useMemo, useState } from 'react'

const SkeletonRow = () => (
  <tr className='border-t border-white/[0.05]'>
    <td className='px-5 py-4'>
      <div className='flex items-center gap-3'>
        <div className='h-9 w-9 animate-pulse rounded-xl bg-white/[0.08]' />
        <div className='space-y-2'>
          <div className='h-3.5 w-28 animate-pulse rounded bg-white/[0.08]' />
          <div className='h-3 w-36 animate-pulse rounded bg-white/[0.05]' />
        </div>
      </div>
    </td>
    {[1, 2, 3, 4, 5].map((item) => (
      <td key={item} className='px-5 py-4'>
        <div className='h-4 w-16 animate-pulse rounded bg-white/[0.06]' />
      </td>
    ))}
  </tr>
)

const formatJoinedDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

const getInitial = (user) => {
  const source = user?.name?.trim() || user?.email?.trim() || 'U'
  return source.charAt(0).toUpperCase()
}

const formatCommission = (amount) => {
  if (amount == null || !Number.isFinite(Number(amount))) return '—'

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(amount) / 100)
}

const AffiliatesTable = ({
  referrals = [],
  isLoading = false,
  isError = false,
  referralLink,
  copiedLink = false,
  onCopyLink,
}) => {
  const [search, setSearch] = useState('')

  const filteredReferrals = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) return referrals

    return referrals.filter((referral) => {
      const name = referral?.user?.name?.toLowerCase() || ''
      const email = referral?.user?.email?.toLowerCase() || ''
      return (
        name.includes(normalizedSearch) || email.includes(normalizedSearch)
      )
    })
  }, [referrals, search])

  return (
    <section className='overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.025]'>
      <div className='flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
        <div>
          <div className='flex items-center gap-2'>
            <Users size={18} className='text-gold' />
            <h2 className='text-xl font-bold text-white'>Your affiliates</h2>
          </div>
          <p className='mt-1 text-xs text-gray-500'>
            {isLoading
              ? 'Loading affiliate records...'
              : `${referrals.length} ${
                  referrals.length === 1 ? 'affiliate' : 'affiliates'
                } in your program`}
          </p>
        </div>

        {referrals.length > 0 && (
          <label className='relative block w-full sm:w-72'>
            <Search
              size={16}
              className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600'
            />
            <span className='sr-only'>Search affiliates</span>
            <input
              type='search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Search name or email'
              className='h-10 w-full rounded-xl border border-white/[0.08] bg-black/30 pl-10 pr-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-gold/40'
            />
          </label>
        )}
      </div>

      {isError ? (
        <div className='px-6 py-12 text-center'>
          <p className='font-semibold text-gray-300'>
            Affiliate list unavailable
          </p>
          <p className='mt-2 text-sm text-gray-600'>
            Retry the referral data request above.
          </p>
        </div>
      ) : !isLoading && referrals.length === 0 ? (
        <div className='px-6 py-12 text-center'>
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold'>
            <UserPlus size={22} />
          </div>
          <h3 className='mt-4 text-lg font-bold text-white'>
            Invite your first affiliate
          </h3>
          <p className='mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500'>
            Share your affiliate link to add the first person promoting your
            program.
          </p>
          <button
            type='button'
            onClick={onCopyLink}
            disabled={!referralLink}
            className='mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-40'
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            {copiedLink ? 'Link copied' : 'Copy invite link'}
          </button>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[850px] border-collapse text-left'>
            <thead>
              <tr className='text-[10px] font-black uppercase tracking-[0.12em] text-gray-600'>
                <th className='px-5 py-3 font-black'>Name</th>
                <th className='px-5 py-3 font-black'>Joined</th>
                <th className='px-5 py-3 font-black'>Status</th>
                <th className='px-5 py-3 font-black'>Referrals</th>
                <th className='px-5 py-3 font-black'>Commission</th>
                <th className='px-5 py-3 font-black'>Payout</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? [1, 2, 3].map((item) => <SkeletonRow key={item} />)
                : filteredReferrals.map((referral, index) => {
                    const user = referral?.user
                    const status =
                      referral?.status ||
                      (user?.isActive === false ? 'inactive' : 'active')
                    const referralTotal =
                      user?.referralStats?.totalReferrals ?? '—'
                    const commission =
                      referral?.commissionAmount ??
                      user?.earningsInfo?.totalEarned
                    const payout =
                      referral?.payoutStatus || user?.payoutStatus || '—'

                    return (
                      <tr
                        key={user?._id || `${referral?.joinedAt || 'affiliate'}-${index}`}
                        className='border-t border-white/[0.05] text-sm transition-colors hover:bg-white/[0.02]'
                      >
                        <td className='max-w-[280px] px-5 py-4'>
                          <div className='flex min-w-0 items-center gap-3'>
                            <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 font-bold text-gold'>
                              {getInitial(user)}
                            </div>
                            <div className='min-w-0'>
                              <p
                                className='truncate font-semibold text-white'
                                title={user?.name || 'Unnamed affiliate'}
                              >
                                {user?.name || 'Unnamed affiliate'}
                              </p>
                              <p
                                className='truncate text-xs text-gray-600'
                                title={user?.email || ''}
                              >
                                {user?.email || 'No email available'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='whitespace-nowrap px-5 py-4 text-gray-400'>
                          {formatJoinedDate(referral?.joinedAt || user?.createdAt)}
                        </td>
                        <td className='px-5 py-4'>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                              status === 'active'
                                ? 'bg-emerald-400/10 text-emerald-300'
                                : 'bg-white/[0.06] text-gray-400'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className='px-5 py-4 text-gray-400'>
                          {referralTotal}
                        </td>
                        <td className='px-5 py-4 text-gray-400'>
                          {formatCommission(commission)}
                        </td>
                        <td className='px-5 py-4 text-gray-400'>{payout}</td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>

          {!isLoading && referrals.length > 0 && filteredReferrals.length === 0 && (
            <div className='border-t border-white/[0.05] px-6 py-10 text-center'>
              <p className='font-semibold text-gray-300'>No affiliates found</p>
              <p className='mt-1 text-sm text-gray-600'>
                Try a different name or email.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default AffiliatesTable
