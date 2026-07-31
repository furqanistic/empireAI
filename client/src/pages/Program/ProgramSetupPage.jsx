import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cookie,
  FileText,
  Lightbulb,
  Loader2,
  Percent,
  Save,
  Sparkles,
  Target,
  Settings2,
} from 'lucide-react'
import { createElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAffiliateProgram,
  useUpdateAffiliateProgram,
} from '../../hooks/useAuth.js'
import Layout from '../Layout/Layout.jsx'

const defaultForm = {
  name: '',
  commissionRate: '40',
  cookieDays: '30',
  status: 'active',
}

const Field = ({ id, label, hint, icon, error, ...inputProps }) => (
  <label htmlFor={id} className='block space-y-2'>
    <span className='text-sm font-semibold text-[#EDEDED]'>{label}</span>
    <div
      className={`flex items-center gap-3 rounded-xl border-[0.5px] bg-[#0A0A0C] px-4 transition-colors focus-within:border-[#D4AF37]/55 ${
        error ? 'border-red-500/60' : 'border-white/[0.12]'
      }`}
    >
      {createElement(icon, {
        size: 18,
        className: 'shrink-0 text-[#D4AF37]',
      })}
      <input
        id={id}
        className='h-12 w-full appearance-none bg-transparent text-[#EDEDED] outline-none placeholder:text-gray-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
        {...inputProps}
      />
    </div>
    <span className={`block text-xs ${error ? 'text-red-400' : 'text-gray-500'}`}>
      {error || hint}
    </span>
  </label>
)

const ProgramSetupPage = () => {
  const navigate = useNavigate()
  const [form, setForm] = useState(defaultForm)
  const [errors, setErrors] = useState({})
  const [savedProgram, setSavedProgram] = useState(null)
  const programQuery = useAffiliateProgram()
  const updateProgram = useUpdateAffiliateProgram()

  const program = programQuery.data?.data?.affiliateProgram

  useEffect(() => {
    if (!program) return

    setForm({
      name: program.name || '',
      commissionRate: String(program.commissionRate ?? 40),
      cookieDays: String(program.cookieDays ?? 30),
      status: program.status || 'active',
    })
    setSavedProgram(program)
  }, [program])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }))
  }

  const validate = () => {
    const nextErrors = {}
    const commissionRate = Number(form.commissionRate)
    const cookieDays = Number(form.cookieDays)

    if (!form.name.trim()) {
      nextErrors.name = 'Enter a program name.'
    } else if (form.name.trim().length > 80) {
      nextErrors.name = 'Use 80 characters or fewer.'
    }

    if (
      form.commissionRate === '' ||
      !Number.isFinite(commissionRate) ||
      commissionRate < 0 ||
      commissionRate > 100
    ) {
      nextErrors.commissionRate = 'Enter a rate from 0 to 100.'
    }

    if (
      form.cookieDays === '' ||
      !Number.isInteger(cookieDays) ||
      cookieDays < 1 ||
      cookieDays > 365
    ) {
      nextErrors.cookieDays = 'Enter a whole number from 1 to 365.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return

    try {
      const response = await updateProgram.mutateAsync({
        name: form.name.trim(),
        commissionRate: Number(form.commissionRate),
        cookieDays: Number(form.cookieDays),
        status: form.status,
      })
      setSavedProgram(response.data?.affiliateProgram)
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message ||
          'We could not save your program. Please try again.',
      })
    }
  }

  if (programQuery.isLoading) {
    return (
      <Layout>
        <div className='flex min-h-[60vh] items-center justify-center'>
          <div className='text-center text-gray-400'>
            <Loader2 className='mx-auto mb-3 animate-spin text-[#D4AF37]' />
            Loading program settings...
          </div>
        </div>
      </Layout>
    )
  }

  if (programQuery.isError) {
    return (
      <Layout>
        <div className='mx-auto mt-16 max-w-lg rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center'>
          <h1 className='mb-2 text-xl font-bold text-[#EDEDED]'>
            Program settings are unavailable
          </h1>
          <p className='mb-5 text-sm text-red-300'>
            {programQuery.error?.response?.data?.message ||
              'We could not load your affiliate program.'}
          </p>
          <button
            type='button'
            onClick={() => programQuery.refetch()}
            className='rounded-xl bg-[#D4AF37] px-5 py-2.5 font-semibold text-black'
          >
            Try again
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className='mx-auto max-w-4xl space-y-6 p-2 sm:p-6'>
        <div>
          <div className='mb-3 inline-flex items-center gap-2 rounded-full border-[0.5px] border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D4AF37]'>
            <Settings2 size={14} />
            Program settings
          </div>
          <h1 className='text-3xl font-bold text-[#EDEDED] sm:text-4xl'>
            {program ? 'Edit your affiliate program' : 'Create your affiliate program'}
          </h1>
          <p className='mt-2 max-w-2xl text-gray-400'>
            Set the core terms affiliates need. You can update these settings at any time.
          </p>
          <button
            type='button'
            onClick={() => navigate('/program/launcher')}
            className='mt-5 inline-flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2.5 text-sm font-bold text-[#D4AF37] transition-colors hover:bg-[#D4AF37]/15'
          >
            <Sparkles size={17} />
            Launch from your website with AI
          </button>
        </div>

        {savedProgram && (
          <div className='flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 sm:flex-row sm:items-center sm:justify-between'>
            <div className='flex items-start gap-3'>
              <CheckCircle2 className='mt-0.5 shrink-0 text-emerald-400' size={22} />
              <div>
                <p className='font-semibold text-emerald-300'>
                  Program {savedProgram.status === 'active' ? 'active' : 'saved'}
                </p>
                <p className='text-sm text-gray-400'>
                  {savedProgram.name} · {savedProgram.commissionRate}% commission · {savedProgram.cookieDays}-day cookie
                </p>
              </div>
            </div>
            <button
              type='button'
              onClick={() => navigate('/invite')}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-black transition-transform hover:scale-[1.02]'
            >
              Invite affiliates
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className='rounded-2xl border-[0.5px] border-white/[0.08] bg-[#121214] p-5 shadow-2xl shadow-black/20 sm:p-8'
        >
          <div className='grid gap-6 md:grid-cols-2'>
            <div className='md:col-span-2'>
              <Field
                id='program-name'
                label='Program name'
                hint='The name affiliates will recognize.'
                icon={Settings2}
                type='text'
                maxLength={80}
                placeholder='Acme Partner Program'
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                error={errors.name}
              />
            </div>

            <Field
              id='commission-rate'
              label='Commission rate'
              hint='Percentage paid on an attributed sale.'
              icon={Percent}
              type='number'
              min='0'
              max='100'
              step='0.01'
              inputMode='decimal'
              value={form.commissionRate}
              onChange={(event) => updateField('commissionRate', event.target.value)}
              error={errors.commissionRate}
            />

            <Field
              id='cookie-days'
              label='Cookie duration'
              hint='Number of days a referral remains attributed.'
              icon={Cookie}
              type='number'
              min='1'
              max='365'
              step='1'
              inputMode='numeric'
              value={form.cookieDays}
              onChange={(event) => updateField('cookieDays', event.target.value)}
              error={errors.cookieDays}
            />
          </div>

          <div className='mt-6 flex items-center justify-between gap-4 rounded-xl border-[0.5px] border-white/[0.10] bg-[#0A0A0C] p-4'>
            <div>
              <label htmlFor='program-active' className='font-semibold text-[#EDEDED]'>
                Program active
              </label>
              <p className='mt-1 text-xs text-gray-500'>
                Inactive programs keep their settings but indicate that invitations are paused.
              </p>
            </div>
            <button
              id='program-active'
              type='button'
              role='switch'
              aria-checked={form.status === 'active'}
              onClick={() =>
                updateField(
                  'status',
                  form.status === 'active' ? 'inactive' : 'active'
                )
              }
              className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                form.status === 'active' ? 'bg-[#D4AF37]' : 'bg-[#343438]'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  form.status === 'active' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
              <span className='sr-only'>Toggle program status</span>
            </button>
          </div>

          {errors.general && (
            <p className='mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300'>
              {errors.general}
            </p>
          )}

          <div className='flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-end'>
            {program && (
              <button
                type='button'
                onClick={() => navigate('/invite')}
                className='rounded-xl border-[0.5px] border-white/[0.12] px-5 py-3 font-semibold text-gray-300 hover:border-[#D4AF37]/40 hover:text-white'
              >
                View affiliates
              </button>
            )}
            <button
              type='submit'
              disabled={updateProgram.isPending}
              className='inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-black transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60'
            >
              {updateProgram.isPending ? (
                <Loader2 size={18} className='animate-spin' />
              ) : (
                <Save size={18} />
              )}
              {updateProgram.isPending
                ? 'Saving...'
                : program
                  ? 'Save changes'
                  : 'Create program'}
            </button>
          </div>
        </form>

        {program?.programDescription && (
          <section className='overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#121214]'>
            <div className='flex flex-col gap-4 border-b border-white/[0.08] bg-[#D4AF37]/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6'>
              <div>
                <div className='mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300'>
                  <CheckCircle2 size={12} />
                  Published program
                </div>
                <h2 className='text-xl font-bold text-[#EDEDED]'>
                  Your affiliate program kit
                </h2>
                <p className='mt-1 text-sm text-gray-400'>
                  These are the approved AI Launcher fields currently saved to
                  your live program.
                </p>
              </div>
              <div className='flex flex-col gap-2 sm:flex-row'>
                <button
                  type='button'
                  onClick={() => navigate('/program/launcher')}
                  className='inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-4 py-2.5 text-sm font-semibold text-gray-200 hover:border-[#D4AF37]/40'
                >
                  <Sparkles size={16} />
                  Edit with AI
                </button>
                <button
                  type='button'
                  onClick={() => navigate('/invite')}
                  className='inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black'
                >
                  Invite affiliates
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className='grid gap-px bg-white/[0.06] md:grid-cols-2'>
              <article className='bg-[#121214] p-5 sm:p-6'>
                <div className='mb-3 flex items-center gap-2 text-[#D4AF37]'>
                  <FileText size={17} />
                  <h3 className='font-bold'>Program description</h3>
                </div>
                <p className='whitespace-pre-wrap text-sm leading-6 text-gray-300'>
                  {program.programDescription}
                </p>
              </article>

              <article className='bg-[#121214] p-5 sm:p-6'>
                <div className='mb-3 flex items-center gap-2 text-[#D4AF37]'>
                  <Target size={17} />
                  <h3 className='font-bold'>Ideal affiliate profile</h3>
                </div>
                <p className='whitespace-pre-wrap text-sm leading-6 text-gray-300'>
                  {program.idealAffiliateProfile || 'Not provided'}
                </p>
              </article>

              <article className='bg-[#121214] p-5 sm:p-6'>
                <div className='mb-3 flex items-center gap-2 text-[#D4AF37]'>
                  <BookOpen size={17} />
                  <h3 className='font-bold'>Invitation message</h3>
                </div>
                <p className='whitespace-pre-wrap text-sm leading-6 text-gray-300'>
                  {program.invitationMessage || 'Not provided'}
                </p>
              </article>

              <article className='bg-[#121214] p-5 sm:p-6'>
                <div className='mb-3 flex items-center gap-2 text-[#D4AF37]'>
                  <FileText size={17} />
                  <h3 className='font-bold'>Terms summary</h3>
                </div>
                <p className='whitespace-pre-wrap text-sm leading-6 text-gray-300'>
                  {program.termsSummary || 'Not provided'}
                </p>
              </article>
            </div>

            <div className='grid gap-6 border-t border-white/[0.08] p-5 sm:p-6 md:grid-cols-2'>
              <div>
                <div className='mb-3 flex items-center gap-2 text-[#D4AF37]'>
                  <BookOpen size={17} />
                  <h3 className='font-bold'>Affiliate FAQ</h3>
                </div>
                {program.faq?.length ? (
                  <ul className='space-y-2 text-sm leading-6 text-gray-300'>
                    {program.faq.map((item, index) => (
                      <li key={`${item}-${index}`} className='rounded-lg bg-black/20 px-3 py-2'>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-gray-500'>No FAQ published.</p>
                )}
              </div>

              <div>
                <div className='mb-3 flex items-center gap-2 text-[#D4AF37]'>
                  <Lightbulb size={17} />
                  <h3 className='font-bold'>Promotional angles</h3>
                </div>
                {program.contentAngles?.length ? (
                  <ul className='space-y-2 text-sm leading-6 text-gray-300'>
                    {program.contentAngles.map((item, index) => (
                      <li key={`${item}-${index}`} className='rounded-lg bg-black/20 px-3 py-2'>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className='text-sm text-gray-500'>
                    No promotional angles published.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  )
}

export default ProgramSetupPage
