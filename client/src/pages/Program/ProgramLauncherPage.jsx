import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Loader2,
  Pencil,
  RefreshCw,
  Rocket,
  Save,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGenerateProgramLauncherDraft,
  useProgramLauncherDraft,
  usePublishProgramLauncherDraft,
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
  const draftQuery = useProgramLauncherDraft()
  const generateDraft = useGenerateProgramLauncherDraft()
  const regenerateSection = useRegenerateProgramLauncherSection()
  const saveDraft = useSaveProgramLauncherDraft()
  const publishDraft = usePublishProgramLauncherDraft()

  const [input, setInput] = useState(emptyInput)
  const [content, setContent] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [activeSection, setActiveSection] = useState(null)
  const [progressIndex, setProgressIndex] = useState(0)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const savedDraft = draftQuery.data?.data?.draft
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
    faq: Array.isArray(content.faq)
      ? content.faq.filter(Boolean)
      : String(content.faq || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
    contentAngles: Array.isArray(content.contentAngles)
      ? content.contentAngles.filter(Boolean)
      : String(content.contentAngles || '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
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
      setMessage('Program published and ready for affiliates.')
      setError(null)
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
      <div className='mx-auto max-w-6xl space-y-6 p-2 sm:p-6'>
        <header>
          <button
            type='button'
            onClick={() => navigate('/program/setup')}
            className='mb-5 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#D4AF37]'
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
            AscndLabs reads a few public pages, prepares a structured draft,
            and waits for your approval. Nothing is published automatically.
          </p>
        </header>

        <form
          onSubmit={handleGenerate}
          className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-7'
        >
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
              hint='Optional. Enter a number in your billing currency.'
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
        {savedDraft?.status === 'published' && (
          <div className='flex flex-col gap-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <p className='font-bold text-emerald-300'>
                This draft is published
              </p>
              <p className='mt-1 text-sm text-gray-400'>
                The approved settings and content now appear in Program
                Settings. Your invite link continues to use the published
                commission terms.
              </p>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <button
                type='button'
                onClick={() => navigate('/program/setup')}
                className='rounded-xl border border-emerald-500/25 px-4 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/10'
              >
                View published program
              </button>
              <button
                type='button'
                onClick={() => navigate('/invite')}
                className='rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-black'
              >
                Invite affiliates
              </button>
            </div>
          </div>
        )}

        {content && (
          <>
            <div className='flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0D0D0F] p-5 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='font-bold text-[#EDEDED]'>Ready for review</p>
                <p className='mt-1 text-xs text-gray-500'>
                  Version {savedDraft?.version || 1}
                  {formattedGeneratedAt ? ` · Generated ${formattedGeneratedAt}` : ''}
                  {savedDraft?.status === 'published' ? ' · Published' : ' · Draft'}
                </p>
              </div>
              <button
                type='button'
                onClick={() => setIsEditing((current) => !current)}
                className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-4 py-2.5 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
              >
                {isEditing ? <Check size={16} /> : <Pencil size={16} />}
                {isEditing ? 'Finish editing' : 'Edit manually'}
              </button>
            </div>

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
                description='Reusable email or direct-message copy for affiliate recruitment.'
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

            <div className='sticky bottom-3 z-20 flex flex-col gap-3 rounded-2xl border border-white/[0.10] bg-[#0B0B0D]/95 p-4 shadow-2xl backdrop-blur sm:flex-row sm:items-center sm:justify-end'>
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
                Publish program
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default ProgramLauncherPage
