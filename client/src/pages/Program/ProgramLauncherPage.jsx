import {
  ArrowLeft,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  Eye,
  Globe2,
  Link2,
  Loader2,
  Mail,
  Megaphone,
  Pencil,
  Percent,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
  Users,
} from 'lucide-react'
import { createElement, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useCurrentUser,
  useGenerateProgramLauncherDraft,
  useProgramLauncherDraft,
  usePublishProgramLauncherDraft,
  useReferralStats,
  useRegenerateProgramLauncherSection,
  useSaveProgramLauncherDraft,
} from '../../hooks/useAuth.js'
import Layout from '../Layout/Layout.jsx'

const emptyInput = {
  websiteUrl: '',
  productDescription: '',
  preferredCommissionModel: 'percentage',
  averageOrderValue: '',
  notes: '',
}

const progressSteps = [
  'Reading website',
  'Understanding offer',
  'Creating program',
  'Preparing review',
]

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback

const money = (value, digits) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits ?? (Number(value) % 1 === 0 ? 0 : 2),
  }).format(Number(value) || 0)

const toLines = (value) =>
  Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '')
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean)

// "Question? Answer" → { q, a }
const splitFaq = (line) => {
  const idx = line.indexOf('?')
  if (idx === -1 || idx === line.length - 1) return { q: line, a: '' }
  return { q: line.slice(0, idx + 1).trim(), a: line.slice(idx + 1).trim() }
}

const TextField = ({ label, hint, multiline = false, disabled, ...props }) => (
  <label className='block space-y-2'>
    <span className='text-sm font-semibold text-[#EDEDED]'>{label}</span>
    {multiline ? (
      <textarea
        disabled={disabled}
        className='min-h-28 w-full resize-y rounded-xl border border-white/[0.10] bg-[#09090B] px-4 py-3 text-sm leading-6 text-[#EDEDED] outline-none transition-colors placeholder:text-gray-600 focus:border-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-70'
        {...props}
      />
    ) : (
      <input
        disabled={disabled}
        className='h-12 w-full rounded-xl border border-white/[0.10] bg-[#09090B] px-4 text-sm text-[#EDEDED] outline-none transition-colors placeholder:text-gray-600 focus:border-[#D4AF37]/50 disabled:cursor-not-allowed disabled:opacity-70'
        {...props}
      />
    )}
    {hint && <span className='block text-xs text-gray-500'>{hint}</span>}
  </label>
)

const Section = ({
  title,
  description,
  section,
  regenerationOptions,
  onRegenerate,
  regenerating,
  children,
}) => (
  <section className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-6'>
    <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
      <div>
        <h2 className='font-bold text-[#EDEDED]'>{title}</h2>
        {description && (
          <p className='mt-1 text-xs leading-5 text-gray-500'>{description}</p>
        )}
      </div>
      <div className='flex flex-wrap gap-2'>
        {(regenerationOptions || [
          { value: section, label: 'Regenerate section' },
        ]).map((option) => (
          <button
            key={option.value}
            type='button'
            onClick={() => onRegenerate(option.value)}
            disabled={regenerating}
            className='inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/[0.10] px-3 py-2 text-xs font-semibold text-gray-300 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-50'
          >
            {regenerating === option.value ? (
              <Loader2 size={14} className='animate-spin' />
            ) : (
              <RefreshCw size={14} />
            )}
            {option.label}
          </button>
        ))}
      </div>
    </div>
    {children}
  </section>
)

const ProgramLauncherPage = () => {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const draftQuery = useProgramLauncherDraft()
  const referralQuery = useReferralStats()
  const generateDraft = useGenerateProgramLauncherDraft()
  const regenerateSection = useRegenerateProgramLauncherSection()
  const saveDraft = useSaveProgramLauncherDraft()
  const publishDraft = usePublishProgramLauncherDraft()

  const [input, setInput] = useState(emptyInput)
  const [content, setContent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [viewMode, setViewMode] = useState('edit') // 'edit' | 'preview'
  const [activeSection, setActiveSection] = useState(null)
  const [progressIndex, setProgressIndex] = useState(0)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState('')
  const [salesPerMonth, setSalesPerMonth] = useState(10)

  const savedDraft = draftQuery.data?.data?.draft
  const isPublished = savedDraft?.status === 'published'
  const referralStats = referralQuery.data?.data?.referralStats
  const affiliateCount = referralStats?.summary?.totalReferrals || 0
  const referralCode = referralStats?.referralCode || currentUser?.referralCode || ''
  const inviteLink =
    referralStats?.referralUrl?.replace('/signup', '/auth') ||
    (referralCode
      ? `${window.location.origin}/auth?ref=${encodeURIComponent(referralCode)}`
      : '')

  const isBusy =
    generateDraft.isPending ||
    regenerateSection.isPending ||
    saveDraft.isPending ||
    publishDraft.isPending

  useEffect(() => {
    if (!savedDraft) return
    setInput({
      websiteUrl: savedDraft.websiteUrl || '',
      productDescription: savedDraft.productDescription || '',
      preferredCommissionModel:
        savedDraft.preferredCommissionModel || 'percentage',
      averageOrderValue: savedDraft.averageOrderValue ?? '',
      notes: savedDraft.notes || '',
    })
    setContent(savedDraft.editedContent || null)
  }, [savedDraft])

  useEffect(() => {
    if (!generateDraft.isPending && !regenerateSection.isPending) {
      setProgressIndex(0)
      return undefined
    }

    const interval = window.setInterval(() => {
      setProgressIndex((current) =>
        Math.min(current + 1, progressSteps.length - 1)
      )
    }, 1800)
    return () => window.clearInterval(interval)
  }, [generateDraft.isPending, regenerateSection.isPending])

  const formattedGeneratedAt = useMemo(() => {
    if (!savedDraft?.generatedAt) return null
    return new Date(savedDraft.generatedAt).toLocaleString()
  }, [savedDraft?.generatedAt])

  const rate = Number(content?.commissionRate) || 0
  const aov = Number(input.averageOrderValue) || 0
  const payoutPerSale = (aov * rate) / 100
  const monthlyPayout = payoutPerSale * salesPerMonth
  const monthlyRevenue = aov * salesPerMonth

  const invitationMessage = useMemo(() => {
    const base = content?.invitationMessage?.trim()
    if (!inviteLink) return base || ''
    if (base) return `${base}\n\nJoin here: ${inviteLink}`
    return `Join ${content?.name || 'our affiliate program'} and earn ${rate}% commission on every customer you send us. Sign up here: ${inviteLink}`
  }, [content?.invitationMessage, content?.name, inviteLink, rate])

  const launchSteps = useMemo(
    () => [
      { label: 'Website', done: !!(savedDraft?.websiteUrl || content) },
      { label: 'Draft', done: !!content },
      { label: 'Review', done: isPublished || (savedDraft?.version || 0) > 1 },
      { label: 'Publish', done: isPublished },
      { label: 'Invite', done: affiliateCount > 0 },
    ],
    [affiliateCount, content, isPublished, savedDraft?.version, savedDraft?.websiteUrl]
  )

  const copyValue = async (key, value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      window.setTimeout(() => setCopied(''), 1800)
    } catch {
      setCopied('')
    }
  }

  const updateInput = (field, value) => {
    setInput((current) => ({ ...current, [field]: value }))
    setError(null)
  }

  const updateContent = (field, value) => {
    setContent((current) => ({ ...current, [field]: value }))
    setMessage(null)
    setError(null)
  }

  const validateContent = () => {
    if (!content?.name?.trim()) return 'Program name is required.'
    const commissionRate = Number(content.commissionRate)
    const cookieDays = Number(content.cookieDays)
    if (
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      return 'Commission rate must be from 0 to 100.'
    }
    if (
      !Number.isInteger(cookieDays) ||
      cookieDays < 1 ||
      cookieDays > 365
    ) {
      return 'Cookie duration must be a whole number from 1 to 365.'
    }
    return null
  }

  const normalizedContent = () => ({
    ...content,
    name: content.name.trim(),
    commissionRate: Number(content.commissionRate),
    cookieDays: Number(content.cookieDays),
    faq: toLines(content.faq),
    contentAngles: toLines(content.contentAngles),
  })

  const handleGenerate = async (event) => {
    event.preventDefault()
    if (!input.websiteUrl.trim()) {
      setError('Enter your public website URL.')
      return
    }

    setError(null)
    setMessage(null)
    try {
      const response = await generateDraft.mutateAsync({
        ...input,
        websiteUrl: input.websiteUrl.trim(),
        averageOrderValue:
          input.averageOrderValue === '' ? null : Number(input.averageOrderValue),
      })
      setContent(response.data?.draft?.editedContent)
      setIsEditing(false)
      setViewMode('edit')
      setMessage('Draft created. Review every field before publishing.')
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          'We could not create a draft from this website.'
        )
      )
    }
  }

  const handleSave = async ({ quiet = false } = {}) => {
    const validationError = validateContent()
    if (validationError) {
      setError(validationError)
      return false
    }

    try {
      const response = await saveDraft.mutateAsync(normalizedContent())
      setContent(response.data?.draft?.editedContent)
      if (!quiet) setMessage('Draft saved. Nothing has been published.')
      setError(null)
      return true
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'We could not save this draft.'))
      return false
    }
  }

  const handleRegenerate = async (section) => {
    setActiveSection(section)
    setError(null)
    setMessage(null)
    const saved = await handleSave({ quiet: true })
    if (!saved) {
      setActiveSection(null)
      return
    }

    try {
      const response = await regenerateSection.mutateAsync(section)
      setContent(response.data?.draft?.editedContent)
      setMessage(`${section.replace(/([A-Z])/g, ' $1')} regenerated.`)
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'We could not regenerate this section.')
      )
    } finally {
      setActiveSection(null)
    }
  }

  const handlePublish = async () => {
    const validationError = validateContent()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      const response = await publishDraft.mutateAsync(normalizedContent())
      setContent(response.data?.draft?.editedContent)
      setIsEditing(false)
      setMessage('Program published. Share your invite link to start recruiting.')
      setError(null)
      // Layout's <main> is the scroll container, not the window.
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'We could not publish this program.')
      )
    }
  }

  if (draftQuery.isLoading) {
    return (
      <Layout>
        <div className='flex min-h-[60vh] items-center justify-center text-gray-400'>
          <Loader2 className='mr-3 animate-spin text-[#D4AF37]' />
          Loading AI Program Launcher...
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className='space-y-6'>
        <header className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <button
              type='button'
              onClick={() => navigate('/program/setup')}
              className='mb-5 flex items-center gap-2 text-sm text-gray-400 hover:text-[#D4AF37]'
            >
              <ArrowLeft size={16} />
              Program settings
            </button>
            <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D4AF37]'>
              <Sparkles size={14} />
              AI Program Launcher
            </div>
            <h1 className='text-3xl font-bold text-[#EDEDED] sm:text-4xl'>
              Turn your website into an affiliate program
            </h1>
            <p className='mt-2 max-w-3xl text-gray-400'>
              Paste your URL. AscndLabs reads your public pages and drafts the
              commission, cookie window, pitch, FAQ, and recruiting copy. You
              review, publish, and invite. Nothing goes live without you.
            </p>
          </div>
          {isPublished && (
            <div className='inline-flex shrink-0 items-center gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-sm font-semibold text-emerald-200'>
              <CheckCircle2 size={16} />
              Program live · {affiliateCount} affiliate{affiliateCount === 1 ? '' : 's'}
            </div>
          )}
        </header>

        <ol className='grid grid-cols-2 gap-2 sm:grid-cols-5'>
          {launchSteps.map((step, index) => {
            const active =
              !step.done && launchSteps.slice(0, index).every((prev) => prev.done)
            return (
              <li
                key={step.label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  step.done
                    ? 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-200'
                    : active
                      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] text-[#EDEDED]'
                      : 'border-white/[0.06] bg-[#121214] text-gray-500'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    step.done
                      ? 'bg-emerald-400 text-black'
                      : active
                        ? 'bg-[#D4AF37] text-black'
                        : 'bg-white/[0.08] text-gray-400'
                  }`}
                >
                  {step.done ? <Check size={13} /> : index + 1}
                </span>
                <span className='font-semibold'>{step.label}</span>
              </li>
            )
          })}
        </ol>

        {isPublished && content && (
          <section className='rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] via-[#121214] to-[#121214] p-5 sm:p-7'>
            <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]'>
              <div>
                <p className='text-[11px] font-bold uppercase tracking-wider text-emerald-300'>
                  Live program
                </p>
                <h2 className='mt-1 text-2xl font-bold text-[#EDEDED]'>{content.name}</h2>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Chip icon={Percent} label={`${rate}% commission`} />
                  <Chip icon={Clock} label={`${content.cookieDays}-day cookie`} />
                  <Chip icon={Users} label={`${affiliateCount} joined`} />
                </div>

                <p className='mt-5 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                  Invite link
                </p>
                {inviteLink ? (
                  <div className='mt-2 flex flex-col gap-2 sm:flex-row'>
                    <div className='min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 font-mono text-sm text-gray-300'>
                      <span className='block truncate'>{inviteLink}</span>
                    </div>
                    <button
                      type='button'
                      onClick={() => copyValue('link', inviteLink)}
                      className='inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-bold text-black'
                    >
                      {copied === 'link' ? <Check size={16} /> : <Copy size={16} />}
                      {copied === 'link' ? 'Copied' : 'Copy link'}
                    </button>
                    <a
                      href={inviteLink}
                      target='_blank'
                      rel='noreferrer'
                      aria-label='Open invite link'
                      className='inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] text-gray-300 hover:border-[#D4AF37]/40 hover:text-white'
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ) : (
                  <p className='mt-2 text-sm text-gray-500'>
                    Create your referral code on the{' '}
                    <Link to='/invite' className='text-[#D4AF37] underline'>
                      Affiliates page
                    </Link>{' '}
                    to get an invite link.
                  </p>
                )}
                <div className='mt-4 flex flex-wrap gap-2'>
                  <button
                    type='button'
                    onClick={() => copyValue('invite', invitationMessage)}
                    disabled={!invitationMessage}
                    className='inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.12] px-4 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40 disabled:opacity-50'
                  >
                    {copied === 'invite' ? <Check size={15} /> : <Mail size={15} />}
                    {copied === 'invite' ? 'Message copied' : 'Copy invitation message'}
                  </button>
                  <Link
                    to='/invite'
                    className='inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.12] px-4 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                  >
                    <Users size={15} />
                    Manage affiliates
                  </Link>
                  <Link
                    to='/build/product'
                    className='inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.12] px-4 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                  >
                    <Sparkles size={15} />
                    Create a product to sell
                  </Link>
                </div>
              </div>

              <div className='rounded-2xl border border-white/[0.08] bg-black/30 p-5'>
                <p className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                  Next steps
                </p>
                <ol className='mt-3 space-y-3 text-sm'>
                  <NextStep done={affiliateCount > 0}>
                    Send the invite to your first partner
                  </NextStep>
                  <NextStep done={false}>
                    Give them a product or link to promote
                  </NextStep>
                  <NextStep done={false}>Watch commissions on the Earnings page</NextStep>
                </ol>
                <Link
                  to='/dashboard'
                  className='mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#D4AF37] hover:underline'
                >
                  Open dashboard <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}

        <form
          onSubmit={handleGenerate}
          className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-7'
        >
          <div className='mb-5'>
            <h2 className='font-bold text-[#EDEDED]'>
              {content ? 'Start over from your website' : 'Tell us about your business'}
            </h2>
            <p className='mt-1 text-xs text-gray-500'>
              The launcher reads your public pages and proposes terms that fit
              your price point.
            </p>
          </div>
          <div className='grid gap-5 md:grid-cols-2'>
            <div className='md:col-span-2'>
              <TextField
                label='Enter your website URL'
                hint='Public homepage, for example https://example.com'
                type='url'
                placeholder='https://yourbusiness.com'
                value={input.websiteUrl}
                onChange={(event) => updateInput('websiteUrl', event.target.value)}
                disabled={generateDraft.isPending}
              />
            </div>
            <TextField
              label='Optional product description'
              hint='If the site blocks reading, enter at least 40 characters here and the launcher will use your description instead.'
              multiline
              placeholder='What do you sell, and who is it for?'
              value={input.productDescription}
              onChange={(event) =>
                updateInput('productDescription', event.target.value)
              }
              disabled={generateDraft.isPending}
            />
            <TextField
              label='Optional notes'
              hint='Restrictions, brand voice, or partners you want to attract.'
              multiline
              placeholder='Avoid discount-focused messaging...'
              value={input.notes}
              onChange={(event) => updateInput('notes', event.target.value)}
              disabled={generateDraft.isPending}
            />
            <label className='block space-y-2'>
              <span className='text-sm font-semibold text-[#EDEDED]'>
                Preferred commission model
              </span>
              <select
                value={input.preferredCommissionModel}
                onChange={(event) =>
                  updateInput('preferredCommissionModel', event.target.value)
                }
                disabled={generateDraft.isPending}
                className='h-12 w-full rounded-xl border border-white/[0.10] bg-[#09090B] px-4 text-sm text-[#EDEDED] outline-none focus:border-[#D4AF37]/50'
              >
                <option value='percentage'>Percentage</option>
                <option value='flat'>Flat-fee preference</option>
                <option value='unsure'>Recommend for me</option>
              </select>
            </label>
            <TextField
              label='Average order value'
              hint='Optional. Powers the payout calculator below.'
              type='number'
              min='0'
              step='0.01'
              placeholder='99'
              value={input.averageOrderValue}
              onChange={(event) =>
                updateInput('averageOrderValue', event.target.value)
              }
              disabled={generateDraft.isPending}
            />
          </div>

          <button
            type='submit'
            disabled={generateDraft.isPending}
            className='mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-black transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto'
          >
            {generateDraft.isPending ? (
              <Loader2 size={18} className='animate-spin' />
            ) : (
              <Sparkles size={18} />
            )}
            {content ? 'Generate a new draft' : 'Create program draft'}
          </button>
          <p className='mt-3 text-xs text-gray-500'>
            Includes up to 5 draft generations or section regenerations per
            account each day.
          </p>
        </form>

        {(generateDraft.isPending || regenerateSection.isPending) && (
          <div className='rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-5'>
            <div className='mb-4 flex items-center gap-3'>
              <Loader2 className='animate-spin text-[#D4AF37]' size={20} />
              <p className='font-semibold text-[#EDEDED]'>
                {progressSteps[progressIndex]}
              </p>
            </div>
            <div className='grid grid-cols-4 gap-2'>
              {progressSteps.map((step, index) => (
                <div key={step}>
                  <div
                    className={`h-1.5 rounded-full ${
                      index <= progressIndex ? 'bg-[#D4AF37]' : 'bg-white/10'
                    }`}
                  />
                  <p className='mt-2 hidden text-[10px] text-gray-500 sm:block'>
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className='rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300'>
            {error}
          </div>
        )}
        {draftQuery.isError && !error && (
          <div className='rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300'>
            {getErrorMessage(
              draftQuery.error,
              'We could not load your saved launcher draft.'
            )}
          </div>
        )}
        {message && (
          <div className='flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-300'>
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        {content && (
          <>
            <div className='flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0D0D0F] p-5 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='font-bold text-[#EDEDED]'>
                  {isPublished ? 'Published program' : 'Ready for review'}
                </p>
                <p className='mt-1 text-xs text-gray-500'>
                  Version {savedDraft?.version || 1}
                  {formattedGeneratedAt ? ` · Generated ${formattedGeneratedAt}` : ''}
                  {isPublished ? ' · Published' : ' · Draft'}
                </p>
              </div>
              <div className='flex flex-wrap gap-2'>
                <div className='inline-flex rounded-xl border border-white/[0.10] p-1'>
                  <button
                    type='button'
                    onClick={() => setViewMode('edit')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                      viewMode === 'edit'
                        ? 'bg-white/[0.08] text-[#EDEDED]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Pencil size={14} />
                    Fields
                  </button>
                  <button
                    type='button'
                    onClick={() => setViewMode('preview')}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                      viewMode === 'preview'
                        ? 'bg-white/[0.08] text-[#EDEDED]'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Eye size={14} />
                    Affiliate view
                  </button>
                </div>
                {viewMode === 'edit' && (
                  <button
                    type='button'
                    onClick={() => setIsEditing((current) => !current)}
                    className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-4 py-2.5 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                  >
                    {isEditing ? <Check size={16} /> : <Pencil size={16} />}
                    {isEditing ? 'Finish editing' : 'Edit manually'}
                  </button>
                )}
              </div>
            </div>

            <section className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-6'>
              <div className='flex items-start gap-3'>
                <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]'>
                  <Calculator size={18} />
                </span>
                <div>
                  <h2 className='font-bold text-[#EDEDED]'>What affiliates will earn</h2>
                  <p className='mt-1 text-xs leading-5 text-gray-500'>
                    Based on the {rate}% rate in this draft
                    {aov ? ` and a ${money(aov)} average order.` : '. Add an average order value above to see dollar amounts.'}
                  </p>
                </div>
              </div>
              <div className='mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                <CalcStat label='Per sale to affiliate' value={aov ? money(payoutPerSale, 2) : `${rate}%`} accent />
                <CalcStat label='You keep per sale' value={aov ? money(aov - payoutPerSale, 2) : `${100 - rate}%`} />
                <CalcStat
                  label={`Affiliate payout / month`}
                  value={aov ? money(monthlyPayout, 2) : '—'}
                  hint={`at ${salesPerMonth} sales`}
                />
                <CalcStat
                  label='Revenue / month'
                  value={aov ? money(monthlyRevenue, 2) : '—'}
                  hint={`at ${salesPerMonth} sales`}
                />
              </div>
              <label className='mt-5 block'>
                <div className='flex items-center justify-between text-xs text-gray-500'>
                  <span>Referred sales per month</span>
                  <span className='font-semibold text-[#EDEDED]'>{salesPerMonth}</span>
                </div>
                <input
                  type='range'
                  min='1'
                  max='200'
                  value={salesPerMonth}
                  onChange={(event) => setSalesPerMonth(Number(event.target.value))}
                  className='mt-2 w-full accent-[#D4AF37]'
                />
              </label>
            </section>

            {viewMode === 'preview' ? (
              <AffiliatePreview
                content={content}
                inviteLink={inviteLink}
                aov={aov}
                payoutPerSale={payoutPerSale}
              />
            ) : (
              <div className='grid gap-5 lg:grid-cols-2'>
                <Section
                  title='Core program'
                  description='Publishing writes these approved values to your existing affiliate program.'
                  section='name'
                  regenerationOptions={[
                    { value: 'name', label: 'New name' },
                    { value: 'commissionRate', label: 'New commission' },
                    { value: 'cookieDays', label: 'New cookie' },
                  ]}
                  onRegenerate={handleRegenerate}
                  regenerating={activeSection}
                >
                  <div className='space-y-5'>
                    <TextField
                      label='Program name'
                      value={content.name}
                      maxLength={80}
                      disabled={!isEditing}
                      onChange={(event) => updateContent('name', event.target.value)}
                    />
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <TextField
                        label='Commission rate (%)'
                        type='number'
                        min='0'
                        max='100'
                        step='0.01'
                        value={content.commissionRate}
                        disabled={!isEditing}
                        onChange={(event) =>
                          updateContent('commissionRate', event.target.value)
                        }
                      />
                      <TextField
                        label='Cookie duration (days)'
                        type='number'
                        min='1'
                        max='365'
                        step='1'
                        value={content.cookieDays}
                        disabled={!isEditing}
                        onChange={(event) =>
                          updateContent('cookieDays', event.target.value)
                        }
                      />
                    </div>
                    <div className='grid gap-3 text-xs text-gray-500 sm:grid-cols-2'>
                      <p>{content.commissionReason}</p>
                      <p>{content.cookieReason}</p>
                    </div>
                  </div>
                </Section>

                <Section
                  title='Program description'
                  description='Public explanation of the offer and intended customer.'
                  section='programDescription'
                  onRegenerate={handleRegenerate}
                  regenerating={activeSection}
                >
                  <TextField
                    label='Description'
                    multiline
                    value={content.programDescription}
                    disabled={!isEditing}
                    onChange={(event) =>
                      updateContent('programDescription', event.target.value)
                    }
                  />
                </Section>

                <Section
                  title='Ideal affiliate profile'
                  section='idealAffiliateProfile'
                  onRegenerate={handleRegenerate}
                  regenerating={activeSection}
                >
                  <TextField
                    label='Who should promote this offer?'
                    multiline
                    value={content.idealAffiliateProfile}
                    disabled={!isEditing}
                    onChange={(event) =>
                      updateContent('idealAffiliateProfile', event.target.value)
                    }
                  />
                </Section>

                <Section
                  title='Invitation message'
                  description='Reusable email or direct-message copy for affiliate recruitment. Your invite link is appended automatically when you copy it.'
                  section='invitationMessage'
                  onRegenerate={handleRegenerate}
                  regenerating={activeSection}
                >
                  <TextField
                    label='Invitation'
                    multiline
                    value={content.invitationMessage}
                    disabled={!isEditing}
                    onChange={(event) =>
                      updateContent('invitationMessage', event.target.value)
                    }
                  />
                  <button
                    type='button'
                    onClick={() => copyValue('invite-field', invitationMessage)}
                    disabled={!invitationMessage}
                    className='mt-3 inline-flex items-center gap-2 rounded-lg border border-white/[0.10] px-3 py-2 text-xs font-semibold text-gray-300 hover:border-[#D4AF37]/40 hover:text-[#D4AF37] disabled:opacity-50'
                  >
                    {copied === 'invite-field' ? <Check size={14} /> : <Copy size={14} />}
                    {copied === 'invite-field' ? 'Copied with link' : 'Copy with invite link'}
                  </button>
                </Section>

                <Section
                  title='Terms summary'
                  description='A plain-language draft for owner review, not legal advice.'
                  section='termsSummary'
                  onRegenerate={handleRegenerate}
                  regenerating={activeSection}
                >
                  <TextField
                    label='Summary'
                    multiline
                    value={content.termsSummary}
                    disabled={!isEditing}
                    onChange={(event) =>
                      updateContent('termsSummary', event.target.value)
                    }
                  />
                </Section>

                <Section
                  title='Affiliate FAQ'
                  description='Keep one question and answer per line.'
                  section='faq'
                  onRegenerate={handleRegenerate}
                  regenerating={activeSection}
                >
                  <TextField
                    label='Questions and answers'
                    multiline
                    value={
                      Array.isArray(content.faq)
                        ? content.faq.join('\n')
                        : content.faq
                    }
                    disabled={!isEditing}
                    onChange={(event) => updateContent('faq', event.target.value)}
                  />
                </Section>

                <div className='lg:col-span-2'>
                  <Section
                    title='Promotional angles'
                    description='Campaign ideas affiliates can adapt. Keep one angle per line.'
                    section='contentAngles'
                    onRegenerate={handleRegenerate}
                    regenerating={activeSection}
                  >
                    <TextField
                      label='Content angles'
                      multiline
                      value={
                        Array.isArray(content.contentAngles)
                          ? content.contentAngles.join('\n')
                          : content.contentAngles
                      }
                      disabled={!isEditing}
                      onChange={(event) =>
                        updateContent('contentAngles', event.target.value)
                      }
                    />
                  </Section>
                </div>
              </div>
            )}

            {!!savedDraft?.sourceUrls?.length && (
              <div className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <Globe2 size={17} className='text-[#D4AF37]' />
                  <h2 className='font-bold text-[#EDEDED]'>Sources reviewed</h2>
                </div>
                <div className='space-y-2'>
                  {savedDraft.sourceUrls.map((url) => (
                    <a
                      key={url}
                      href={url}
                      target='_blank'
                      rel='noreferrer'
                      className='flex items-center gap-2 break-all text-xs text-gray-400 hover:text-[#D4AF37]'
                    >
                      <ExternalLink size={13} className='shrink-0' />
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className='sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-white/[0.10] bg-[#0B0B0D]/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-between'>
              <p className='hidden text-xs text-gray-500 sm:block'>
                {isPublished
                  ? 'Publishing again updates the live program with these values.'
                  : 'Publishing writes the commission, cookie, and copy to your program and unlocks the invite link.'}
              </p>
              <div className='flex flex-col gap-3 sm:flex-row'>
                <button
                  type='button'
                  onClick={() => handleSave()}
                  disabled={isBusy}
                  className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-5 py-3 font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40 disabled:opacity-50'
                >
                  {saveDraft.isPending ? (
                    <Loader2 size={18} className='animate-spin' />
                  ) : (
                    <Save size={18} />
                  )}
                  Save draft
                </button>
                <button
                  type='button'
                  onClick={handlePublish}
                  disabled={isBusy}
                  className='inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-black hover:bg-[#E0BC43] disabled:opacity-50'
                >
                  {publishDraft.isPending ? (
                    <Loader2 size={18} className='animate-spin' />
                  ) : (
                    <Rocket size={18} />
                  )}
                  {isPublished ? 'Publish changes' : 'Publish program'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

const Chip = ({ icon, label }) => (
  <span className='inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-black/30 px-3 py-1.5 text-xs font-semibold text-[#EDEDED]'>
    {createElement(icon, { size: 13, className: 'text-[#D4AF37]' })}
    {label}
  </span>
)

const NextStep = ({ done, children }) => (
  <li className='flex items-start gap-3'>
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        done ? 'bg-emerald-400 text-black' : 'border border-white/[0.15] text-transparent'
      }`}
    >
      <Check size={12} />
    </span>
    <span className={done ? 'text-gray-500 line-through' : 'text-gray-300'}>{children}</span>
  </li>
)

const CalcStat = ({ label, value, hint, accent }) => (
  <div className='rounded-xl border border-white/[0.06] bg-black/30 p-4'>
    <p className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>{label}</p>
    <p className={`mt-1 text-xl font-black ${accent ? 'text-[#D4AF37]' : 'text-white'}`}>{value}</p>
    {hint && <p className='mt-0.5 text-xs text-gray-500'>{hint}</p>}
  </div>
)

// What a prospective affiliate would see when the owner shares this program.
const AffiliatePreview = ({ content, inviteLink, aov, payoutPerSale }) => {
  const faq = toLines(content.faq).map(splitFaq)
  const angles = toLines(content.contentAngles)
  const rate = Number(content.commissionRate) || 0

  return (
    <section className='overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0D0D0F]'>
      <div className='border-b border-white/[0.06] bg-gradient-to-br from-[#D4AF37]/[0.12] via-transparent to-transparent p-6 sm:p-10'>
        <p className='text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]'>
          Affiliate program
        </p>
        <h2 className='mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl'>
          {content.name || 'Your program name'}
        </h2>
        <p className='mt-4 max-w-2xl text-base leading-7 text-gray-300'>
          {content.programDescription || 'Program description appears here.'}
        </p>
        <div className='mt-6 grid gap-3 sm:grid-cols-3'>
          <PreviewStat icon={Percent} value={`${rate}%`} label='commission on every sale' />
          <PreviewStat icon={Clock} value={`${content.cookieDays || 0} days`} label='referral window' />
          <PreviewStat
            icon={DollarSign}
            value={aov ? money(payoutPerSale, 2) : 'Recurring'}
            label={aov ? 'typical payout per sale' : 'earnings tracked automatically'}
          />
        </div>
        <div className='mt-6 flex flex-wrap items-center gap-3'>
          <span className='inline-flex h-11 items-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-sm font-bold text-black'>
            <Link2 size={16} />
            Join the program
          </span>
          <span className='truncate font-mono text-xs text-gray-500'>
            {inviteLink || 'Invite link appears after you create a referral code'}
          </span>
        </div>
      </div>

      <div className='grid gap-6 p-6 sm:p-10 lg:grid-cols-2'>
        <PreviewBlock icon={Users} title='Who this is for'>
          <p className='text-sm leading-7 text-gray-300'>
            {content.idealAffiliateProfile || '—'}
          </p>
        </PreviewBlock>

        <PreviewBlock icon={Megaphone} title='Ways to promote'>
          {angles.length ? (
            <ul className='space-y-2'>
              {angles.map((angle) => (
                <li
                  key={angle}
                  className='rounded-xl border border-white/[0.06] bg-black/30 px-4 py-3 text-sm text-gray-300'
                >
                  {angle}
                </li>
              ))}
            </ul>
          ) : (
            <p className='text-sm text-gray-500'>No promotional angles yet.</p>
          )}
        </PreviewBlock>

        <PreviewBlock icon={Sparkles} title='Frequently asked'>
          {faq.length ? (
            <dl className='space-y-4'>
              {faq.map((item) => (
                <div key={item.q}>
                  <dt className='text-sm font-semibold text-white'>{item.q}</dt>
                  {item.a && <dd className='mt-1 text-sm leading-6 text-gray-400'>{item.a}</dd>}
                </div>
              ))}
            </dl>
          ) : (
            <p className='text-sm text-gray-500'>No FAQ yet.</p>
          )}
        </PreviewBlock>

        <PreviewBlock icon={CheckCircle2} title='Terms at a glance'>
          <p className='text-sm leading-7 text-gray-300'>{content.termsSummary || '—'}</p>
        </PreviewBlock>
      </div>
    </section>
  )
}

const PreviewStat = ({ icon, value, label }) => (
  <div className='rounded-2xl border border-white/[0.08] bg-black/30 p-4'>
    {createElement(icon, { size: 16, className: 'text-[#D4AF37]' })}
    <p className='mt-3 text-2xl font-black text-white'>{value}</p>
    <p className='mt-0.5 text-xs text-gray-500'>{label}</p>
  </div>
)

const PreviewBlock = ({ icon, title, children }) => (
  <div>
    <div className='mb-3 flex items-center gap-2'>
      {createElement(icon, { size: 16, className: 'text-[#D4AF37]' })}
      <h3 className='font-bold text-white'>{title}</h3>
    </div>
    {children}
  </div>
)

export default ProgramLauncherPage
