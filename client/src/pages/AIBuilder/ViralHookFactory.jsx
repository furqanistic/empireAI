import {
  AlertCircle,
  ArrowDownToLine,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  Instagram,
  Linkedin,
  LoaderCircle,
  MessageCircle,
  Music2,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Volume2,
  WandSparkles,
  Youtube,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import React, { useMemo, useState } from 'react'

import hookStudioImage from '@/assets/ai-builder/viral-hook-studio.webp'
import PlanGate from '@/components/Layout/PlanGate'
import { useCopyHook, useGenerateHooks } from '@/hooks/useHooks'
import Layout from '../Layout/Layout'

const MotionParagraph = motion.p

const platforms = [
  { id: 'tiktok', name: 'TikTok', icon: Music2 },
  { id: 'instagram', name: 'Instagram', icon: Instagram },
  { id: 'youtube', name: 'YouTube', icon: Youtube },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
]

const directions = [
  {
    name: 'Pattern interrupt',
    tone: 'controversial',
    description: 'Break the expected pattern.',
    demo: 'Stop posting random. Start posting with intent.',
  },
  {
    name: 'Confession',
    tone: 'emotional',
    description: 'Lead with a relatable admission.',
    demo: 'I wasted a year creating content nobody remembered.',
  },
  {
    name: 'Hard truth',
    tone: 'authority',
    description: 'Say what your audience avoids.',
    demo: 'Your content is not inconsistent. It is forgettable.',
  },
  {
    name: 'Before / after',
    tone: 'storytelling',
    description: 'Make the transformation tangible.',
    demo: 'From invisible creator to daily inbound leads in 30 days.',
  },
  {
    name: 'Open loop',
    tone: 'curiosity',
    description: 'Create a question they need answered.',
    demo: 'The smallest change doubled my watch time overnight.',
  },
]

const nicheOptions = [
  ['marketing', 'Marketing'],
  ['entrepreneurship', 'Entrepreneurship'],
  ['technology', 'Technology'],
  ['self-improvement', 'Self-improvement'],
  ['finance', 'Personal finance'],
  ['fitness', 'Fitness'],
  ['education', 'Education'],
  ['health', 'Health & wellness'],
]

const SelectField = ({ icon: Icon, label, value, onChange, children }) => (
  <label className='block'>
    <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45'>
      {label}
    </span>
    <div className='relative'>
      {Icon && (
        <Icon
          size={15}
          className='pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35'
        />
      )}
      <select
        value={value}
        onChange={onChange}
        className={`h-11 w-full appearance-none rounded-lg border border-white/[0.08] bg-[#101011] pr-10 text-sm text-white/80 outline-none transition focus:border-[#D4AF37]/60 ${
          Icon ? 'pl-10' : 'pl-3.5'
        }`}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        className='pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-white/35'
      />
    </div>
  </label>
)

const ViralHookFactory = () => {
  const [platform, setPlatform] = useState('tiktok')
  const [niche, setNiche] = useState('marketing')
  const [audience, setAudience] = useState('Creators & solopreneurs (20–35)')
  const [objective, setObjective] = useState('Grow audience')
  const [voice, setVoice] = useState('Bold & direct')
  const [premise, setPremise] = useState(
    'I help creators turn ideas into scroll-stopping shorts that grow their audience.'
  )
  const [referenceVoice, setReferenceVoice] = useState(
    'Stop posting random. Start posting with intent.'
  )
  const [mustInclude, setMustInclude] = useState('audience growth')
  const [mustAvoid, setMustAvoid] = useState('buzzwords')
  const [generatedHooks, setGeneratedHooks] = useState([])
  const [generationId, setGenerationId] = useState(null)
  const [activeDirection, setActiveDirection] = useState(0)
  const [copyFeedback, setCopyFeedback] = useState('')
  const [savedHooks, setSavedHooks] = useState([])
  const [versions, setVersions] = useState([])

  const generateHooksMutation = useGenerateHooks()
  const copyHookMutation = useCopyHook()

  const visibleHooks = useMemo(
    () =>
      directions.map((direction, index) => ({
        ...direction,
        content: generatedHooks[index] || direction.demo,
      })),
    [generatedHooks]
  )

  const currentHook = visibleHooks[activeDirection]
  const isGenerating = generateHooksMutation.isPending
  const canGenerate = premise.trim().length >= 12

  const combinedPrompt = [
    premise.trim(),
    `Target audience: ${audience}.`,
    `Objective: ${objective}. Voice: ${voice}.`,
    referenceVoice.trim() && `Reference voice: "${referenceVoice.trim()}".`,
    mustInclude.trim() && `Must include: ${mustInclude.trim()}.`,
    mustAvoid.trim() && `Avoid: ${mustAvoid.trim()}.`,
  ]
    .filter(Boolean)
    .join(' ')

  const generateHooks = async (toneOverride) => {
    if (!canGenerate) return

    try {
      const result = await generateHooksMutation.mutateAsync({
        platform,
        niche,
        tone: toneOverride || directions[activeDirection].tone,
        customPrompt: combinedPrompt,
      })

      if (result.status === 'success' && result.data) {
        const hooks = result.data.hooks || []
        setGeneratedHooks(hooks)
        setGenerationId(result.data.id)
        setActiveDirection(0)
        setVersions((previous) =>
          [
            {
              id: result.data.id || Date.now(),
              label: `v${previous.length + 1}`,
              direction: directions[activeDirection].name,
              time: new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              }),
              hook: hooks[0],
            },
            ...previous,
          ].slice(0, 3)
        )
      }
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }

  const copyText = async (text, hookIndex = activeDirection) => {
    try {
      await copyHookMutation.mutateAsync({
        hookContent: text,
        generationId,
        hookIndex,
      })
      setCopyFeedback('Copied')
      window.setTimeout(() => setCopyFeedback(''), 1800)
    } catch {
      setCopyFeedback('Copy failed')
      window.setTimeout(() => setCopyFeedback(''), 1800)
    }
  }

  const toggleSavedHook = () => {
    setSavedHooks((previous) =>
      previous.includes(currentHook.content)
        ? previous.filter((hook) => hook !== currentHook.content)
        : [...previous, currentHook.content]
    )
  }

  const exportScript = () => {
    const script = [
      'ASCNDLABS — VIRAL HOOK SCRIPT',
      '',
      `Platform: ${platform}`,
      `Audience: ${audience}`,
      `Objective: ${objective}`,
      '',
      `HOOK`,
      currentHook.content,
      '',
      `CONTENT PREMISE`,
      premise,
      '',
      `CREATIVE DIRECTION`,
      currentHook.name,
    ].join('\n')
    const blob = new Blob([script], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'ascndlabs-viral-hook-script.txt'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout>
      <PlanGate requiredFeature='viral-hooks'>
        <div className='min-h-full bg-[#050505] text-white'>
          <header className='flex min-h-[78px] flex-col justify-center gap-3 border-b border-white/[0.07] px-5 py-4 sm:px-7 lg:flex-row lg:items-center lg:justify-between lg:py-0'>
            <div className='flex items-center gap-3'>
              <div className='flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] text-[#D4AF37]'>
                <MessageCircle size={17} />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <h1 className='text-lg font-black tracking-[-0.025em]'>
                    Viral Hook Factory
                  </h1>
                  <span className='rounded border border-[#D4AF37]/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]'>
                    Pro
                  </span>
                </div>
                <p className='text-xs text-white/35'>
                  Build the line they can’t scroll past
                </p>
              </div>
            </div>
            <div className='flex items-center gap-2 text-xs text-white/45'>
              <span className='h-1.5 w-1.5 rounded-full bg-[#D4AF37]' />
              Live creative workspace
              {savedHooks.length > 0 && (
                <span className='ml-2 border-l border-white/10 pl-3 text-[#D4AF37]'>
                  {savedHooks.length} saved
                </span>
              )}
            </div>
          </header>

          {generateHooksMutation.isError && (
            <div className='mx-5 mt-5 flex items-start gap-3 border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-200 sm:mx-7'>
              <AlertCircle size={18} className='mt-0.5 shrink-0 text-red-400' />
              <div>
                <p className='font-semibold'>Generation failed</p>
                <p className='mt-0.5 text-xs text-red-200/65'>
                  {generateHooksMutation.error?.response?.data?.message ||
                    generateHooksMutation.error?.message ||
                    'Please try again in a moment.'}
                </p>
              </div>
            </div>
          )}

          <main className='grid min-h-[calc(100vh-142px)] grid-cols-1 xl:grid-cols-[minmax(310px,0.82fr)_minmax(420px,1fr)_minmax(250px,0.58fr)]'>
            <section className='border-b border-white/[0.07] px-5 py-5 sm:px-7 xl:border-b-0 xl:border-r'>
              <div className='mb-4'>
                <p className='text-2xl font-black leading-tight tracking-[-0.035em] sm:text-[28px]'>
                  Write the line{' '}
                  <em className='font-black text-[#D4AF37]'>
                    they can’t ignore.
                  </em>
                </p>
                <p className='mt-1.5 max-w-md text-xs leading-relaxed text-white/40'>
                  Give the AI context, a voice, and a clear creative boundary.
                  Better inputs create sharper hooks.
                </p>
              </div>

              <label className='block'>
                <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45'>
                  Content premise
                </span>
                <textarea
                  value={premise}
                  onChange={(event) => setPremise(event.target.value)}
                  maxLength={300}
                  className='h-20 w-full resize-none rounded-xl border border-white/[0.09] bg-[#101011] px-4 py-3 text-sm leading-relaxed text-white/85 outline-none transition placeholder:text-white/20 focus:border-[#D4AF37]/60'
                  placeholder='What are you creating and why should people care?'
                />
                <span className='mt-1.5 block text-right text-[10px] text-white/25'>
                  {premise.length} / 300
                </span>
              </label>

              <div className='mt-3'>
                <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45'>
                  Platform
                </p>
                <div className='grid grid-cols-2 gap-2'>
                  {platforms.map(({ id, name, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPlatform(id)}
                      className={`flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition ${
                        platform === id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-white/[0.08] bg-[#0C0C0D] text-white/45 hover:border-white/20 hover:text-white/80'
                      }`}
                    >
                      {React.createElement(Icon, { size: 14 })}
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className='mt-3 grid grid-cols-2 gap-3'>
                <SelectField
                  label='Target audience'
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                >
                  <option>Creators & solopreneurs (20–35)</option>
                  <option>Coaches & consultants</option>
                  <option>Small business owners</option>
                  <option>First-time founders</option>
                </SelectField>
                <SelectField
                  label='Objective'
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                >
                  <option>Grow audience</option>
                  <option>Drive engagement</option>
                  <option>Generate leads</option>
                  <option>Sell an offer</option>
                </SelectField>
                <SelectField
                  label='Voice'
                  value={voice}
                  onChange={(event) => setVoice(event.target.value)}
                >
                  <option>Bold & direct</option>
                  <option>Warm & candid</option>
                  <option>Sharp & contrarian</option>
                  <option>Expert & composed</option>
                </SelectField>
                <SelectField
                  label='Niche'
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                >
                  {nicheOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </SelectField>
              </div>

              <label className='mt-3 block'>
                <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45'>
                  Reference voice
                </span>
                <input
                  value={referenceVoice}
                  onChange={(event) => setReferenceVoice(event.target.value)}
                  className='h-11 w-full rounded-lg border border-white/[0.08] bg-[#101011] px-3.5 text-sm text-white/75 outline-none transition focus:border-[#D4AF37]/60'
                  placeholder='Paste one example line'
                />
              </label>

              <div className='mt-3 grid grid-cols-2 gap-3'>
                <label>
                  <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45'>
                    Must include
                  </span>
                  <input
                    value={mustInclude}
                    onChange={(event) => setMustInclude(event.target.value)}
                    className='h-11 w-full rounded-lg border border-white/[0.08] bg-[#101011] px-3.5 text-sm text-white/75 outline-none transition focus:border-[#D4AF37]/60'
                  />
                </label>
                <label>
                  <span className='mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45'>
                    Must avoid
                  </span>
                  <input
                    value={mustAvoid}
                    onChange={(event) => setMustAvoid(event.target.value)}
                    className='h-11 w-full rounded-lg border border-white/[0.08] bg-[#101011] px-3.5 text-sm text-white/75 outline-none transition focus:border-[#D4AF37]/60'
                  />
                </label>
              </div>

              <button
                onClick={() => generateHooks()}
                disabled={!canGenerate || isGenerating}
                className='mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-[#D4AF37] text-sm font-black text-black shadow-[0_12px_40px_rgba(212,175,55,0.12)] transition hover:bg-[#E4C455] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30'
              >
                {isGenerating ? (
                  <>
                    <LoaderCircle size={17} className='animate-spin' />
                    Building directions...
                  </>
                ) : (
                  <>
                    <WandSparkles size={17} />
                    Generate 5 directions
                  </>
                )}
              </button>
            </section>

            <section className='border-b border-white/[0.07] px-5 py-7 sm:px-7 xl:border-b-0 xl:border-r'>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-2 text-xs font-semibold text-white/65'>
                  <span className='h-1.5 w-1.5 rounded-full bg-[#D4AF37]' />
                  Live preview
                </div>
                <span className='text-[10px] uppercase tracking-[0.15em] text-white/25'>
                  00:03 / 00:15
                </span>
              </div>

              <div className='mx-auto max-w-[500px] overflow-hidden rounded-xl border border-white/10 bg-[#0C0C0C]'>
                <div className='relative aspect-[4/5] min-h-[430px] overflow-hidden'>
                  <img
                    src={hookStudioImage}
                    alt='Creator working in a dark studio'
                    className='absolute inset-0 h-full w-full object-cover object-center'
                  />
                  <div className='absolute inset-0 bg-gradient-to-b from-black/5 via-black/5 to-black/85' />
                  <div className='absolute inset-x-0 bottom-0 p-6 sm:p-8'>
                    <AnimatePresence mode='wait'>
                      <MotionParagraph
                        key={currentHook.content}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className='max-w-[12ch] text-[34px] font-black uppercase leading-[0.96] tracking-[-0.045em] text-white drop-shadow-2xl sm:text-[44px]'
                      >
                        {currentHook.content}
                      </MotionParagraph>
                    </AnimatePresence>
                    <div className='mt-6 flex items-center gap-3'>
                      <button
                        aria-label='Play preview'
                        className='flex h-8 w-8 items-center justify-center rounded-full bg-white text-black'
                      >
                        <Play size={13} fill='currentColor' />
                      </button>
                      <div className='h-0.5 flex-1 bg-white/20'>
                        <div className='h-full w-[38%] bg-[#D4AF37]' />
                      </div>
                      <Volume2 size={15} className='text-white/70' />
                    </div>
                  </div>
                </div>
              </div>

              <div className='mx-auto mt-6 max-w-[540px]'>
                <div className='mb-2 flex items-center justify-between'>
                  <p className='text-xs font-semibold text-white/55'>
                    Hook editor · {currentHook.name}
                  </p>
                  <span className='text-[10px] text-white/25'>
                    {currentHook.content.length} characters
                  </span>
                </div>
                <textarea
                  value={currentHook.content}
                  onChange={(event) =>
                    setGeneratedHooks((previous) => {
                      const next = visibleHooks.map((hook) => hook.content)
                      next[activeDirection] = event.target.value
                      return previous.length ? next : next
                    })
                  }
                  className='h-24 w-full resize-none rounded-lg border border-white/[0.09] bg-[#0E0E0F] px-4 py-3 text-lg font-semibold leading-snug text-white/85 outline-none transition focus:border-[#D4AF37]/60'
                />

                <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4'>
                  <button
                    onClick={() => generateHooks(currentHook.tone)}
                    disabled={isGenerating}
                    className='flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-semibold text-white/65 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
                  >
                    <Sparkles size={14} />
                    3 variants
                  </button>
                  <button
                    onClick={() =>
                      copyText(`${currentHook.content}\n\n${premise}`)
                    }
                    className='flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-semibold text-white/65 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
                  >
                    <FileText size={14} />
                    Caption
                  </button>
                  <button
                    onClick={() => copyText(currentHook.content)}
                    className='flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] text-xs font-semibold text-white/65 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]'
                  >
                    {copyFeedback === 'Copied' ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                    {copyFeedback || 'Copy'}
                  </button>
                  <button
                    onClick={exportScript}
                    className='flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D4AF37]/45 bg-[#D4AF37]/[0.06] text-xs font-semibold text-[#D4AF37] transition hover:bg-[#D4AF37]/15'
                  >
                    <ArrowDownToLine size={14} />
                    Export
                  </button>
                </div>
              </div>
            </section>

            <aside className='px-5 py-7 sm:px-7'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-lg font-black'>5 directions</p>
                  <p className='mt-1 text-xs text-white/35'>
                    Explore the same idea from a new angle.
                  </p>
                </div>
                <button
                  onClick={toggleSavedHook}
                  aria-label='Save current hook'
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                    savedHooks.includes(currentHook.content)
                      ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-white/10 text-white/35 hover:text-white'
                  }`}
                >
                  <Bookmark
                    size={15}
                    fill={
                      savedHooks.includes(currentHook.content)
                        ? 'currentColor'
                        : 'none'
                    }
                  />
                </button>
              </div>

              <div className='mt-5 divide-y divide-white/[0.07] border-y border-white/[0.07]'>
                {visibleHooks.map((direction, index) => (
                  <button
                    key={direction.name}
                    onClick={() => setActiveDirection(index)}
                    className={`group flex w-full items-start gap-4 py-4 text-left transition ${
                      activeDirection === index
                        ? 'text-white'
                        : 'text-white/40 hover:text-white/75'
                    }`}
                  >
                    <span
                      className={`mt-0.5 text-sm font-black ${
                        activeDirection === index
                          ? 'text-[#D4AF37]'
                          : 'text-white/20'
                      }`}
                    >
                      0{index + 1}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='flex items-center justify-between'>
                        <span className='text-sm font-bold'>
                          {direction.name}
                        </span>
                        {activeDirection === index && (
                          <span className='h-1.5 w-1.5 rounded-full bg-[#D4AF37]' />
                        )}
                      </span>
                      <span className='mt-1 block text-xs leading-relaxed text-white/30'>
                        {direction.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className='mt-8'>
                <div className='mb-3 flex items-center justify-between'>
                  <p className='text-sm font-black text-[#D4AF37]'>
                    Version history
                  </p>
                  {versions.length > 0 && (
                    <button
                      onClick={() => setVersions([])}
                      className='text-[10px] text-white/30 hover:text-white/60'
                    >
                      Clear
                    </button>
                  )}
                </div>

                {versions.length ? (
                  <div className='divide-y divide-white/[0.07] border-y border-white/[0.07]'>
                    {versions.map((version) => (
                      <button
                        key={version.id}
                        onClick={() => {
                          const next = [...generatedHooks]
                          next[0] = version.hook
                          setGeneratedHooks(next)
                          setActiveDirection(0)
                        }}
                        className='flex w-full items-center gap-3 py-3 text-left text-xs'
                      >
                        <span className='font-black text-[#D4AF37]'>
                          {version.label}
                        </span>
                        <span className='min-w-0 flex-1 truncate text-white/55'>
                          {version.direction}
                        </span>
                        <span className='text-[10px] text-white/25'>
                          {version.time}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className='border-y border-white/[0.07] py-5 text-center'>
                    <Clock3 size={17} className='mx-auto text-white/20' />
                    <p className='mt-2 text-xs text-white/30'>
                      New generations appear here.
                    </p>
                  </div>
                )}
              </div>

              <div className='mt-8 border-t border-white/[0.07] pt-5'>
                <p className='text-[11px] leading-relaxed text-white/30'>
                  <span className='font-semibold text-white/55'>Pro tip:</span>{' '}
                  Specific outcomes and unexpected contrast usually create the
                  strongest opening line.
                </p>
                <button
                  onClick={() => generateHooks()}
                  disabled={isGenerating}
                  className='mt-4 flex items-center gap-2 text-xs font-bold text-[#D4AF37] transition hover:text-[#E4C455]'
                >
                  <RefreshCw
                    size={13}
                    className={isGenerating ? 'animate-spin' : ''}
                  />
                  Regenerate set
                  <Plus size={12} />
                </button>
              </div>
            </aside>
          </main>
        </div>
      </PlanGate>
    </Layout>
  )
}

export default ViralHookFactory
