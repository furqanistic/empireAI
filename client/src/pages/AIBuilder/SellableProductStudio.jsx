import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ClipboardList,
  Copy,
  DollarSign,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Link2,
  Loader2,
  Mail,
  NotebookPen,
  Package,
  Share2,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductDocumentEditor from '../../components/AIBuilder/ProductDocumentEditor.jsx'
import { mediaUrl, withBlocks } from '../../components/AIBuilder/productDocument.js'
import { useAffiliateProgram, useReferralStats } from '../../hooks/useAuth.js'
import {
  useGenerateSellableProduct,
  usePublishSellableProduct,
  useReviseSellableProduct,
  useSaveSellableContent,
  useSellableProductPerformance,
  useSellableProducts,
} from '../../hooks/useSellableProduct.js'
import { sellableProductService } from '../../services/sellableProductService.js'
import Layout from '../Layout/Layout.jsx'

const TYPES = [
  {
    id: 'ebook',
    label: 'Ebook / PDF book',
    hint: 'Chapters people can read and keep',
    icon: BookOpen,
  },
  {
    id: 'guide',
    label: 'Short guide',
    hint: 'A focused how-to they can finish fast',
    icon: FileText,
  },
  {
    id: 'checklist',
    label: 'Checklist',
    hint: 'Printable steps they can tick off',
    icon: ClipboardList,
  },
  {
    id: 'workbook',
    label: 'Workbook',
    hint: 'Exercises and prompts to fill in',
    icon: NotebookPen,
  },
]

const TYPE_BY_ID = Object.fromEntries(TYPES.map((type) => [type.id, type]))

const DEFAULT_COMMISSION_RATE = 40

const errorText = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback

const money = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number(value) % 1 === 0 ? 0 : 2,
  }).format(Number(value) || 0)

const shortDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const splitPrice = (price, ratePercent) => {
  const gross = Math.max(0, Number(price) || 0)
  const affiliate = Math.round(gross * ratePercent) / 100
  return { gross, affiliate, owner: Math.max(0, gross - affiliate) }
}

const affiliateLinkFor = (salesUrl, code) => {
  if (!salesUrl || !code) return ''
  return `${salesUrl}${salesUrl.includes('?') ? '&' : '?'}ref=${encodeURIComponent(code)}`
}

const SellableProductStudio = () => {
  const [productType, setProductType] = useState('ebook')
  const [topic, setTopic] = useState('')
  const [audience, setAudience] = useState('')
  const [extraPrompt, setExtraPrompt] = useState('')
  const [changePrompt, setChangePrompt] = useState('')
  const [price, setPrice] = useState('19')
  const [product, setProduct] = useState(null)
  const [draft, setDraft] = useState(null)
  const [invitationMessage, setInvitationMessage] = useState('')
  const [copied, setCopied] = useState('')
  const [downloadError, setDownloadError] = useState('')
  const [saveLabel, setSaveLabel] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [affiliateSearch, setAffiliateSearch] = useState('')

  const draftRef = useRef(null)
  const productIdRef = useRef(null)
  const workspaceRef = useRef(null)

  const listQuery = useSellableProducts()
  const programQuery = useAffiliateProgram()
  const referralQuery = useReferralStats()
  const generate = useGenerateSellableProduct()
  const revise = useReviseSellableProduct()
  const publish = usePublishSellableProduct()
  const save = useSaveSellableContent()

  const isPublished = product?.status === 'published'
  const performanceQuery = useSellableProductPerformance(product?.id, isPublished)

  const historyData = listQuery.data?.data?.products
  const history = useMemo(() => historyData || [], [historyData])
  const totals = listQuery.data?.data?.totals
  const program = programQuery.data?.data?.affiliateProgram
  const commissionRate = Number.isFinite(Number(program?.commissionRate))
    ? Number(program.commissionRate)
    : Number.isFinite(Number(listQuery.data?.data?.commissionRate))
      ? Number(listQuery.data.data.commissionRate)
      : DEFAULT_COMMISSION_RATE
  const programName = program?.name || ''
  const referralStats = referralQuery.data?.data?.referralStats
  const affiliateList = referralStats?.referrals
  const affiliates = useMemo(() => affiliateList || [], [affiliateList])
  const performance = performanceQuery.data?.data
  const busy = generate.isPending || revise.isPending || publish.isPending

  draftRef.current = draft
  productIdRef.current = product?.id

  const split = useMemo(() => splitPrice(price, commissionRate), [price, commissionRate])

  const filteredAffiliates = useMemo(() => {
    const needle = affiliateSearch.trim().toLowerCase()
    const withLinks = affiliates.filter((entry) => entry?.user?.referralCode)
    if (!needle) return withLinks
    return withLinks.filter((entry) => {
      const name = entry.user?.name?.toLowerCase() || ''
      const email = entry.user?.email?.toLowerCase() || ''
      return name.includes(needle) || email.includes(needle)
    })
  }, [affiliates, affiliateSearch])

  const applyProduct = (next, extra = {}) => {
    const content = withBlocks(next.content)
    setProduct({ ...next, content })
    setDraft(content)
    setPrice(String(next.price || content?.suggestedPrice || 19))
    if (extra.invitationMessage !== undefined) {
      setInvitationMessage(extra.invitationMessage)
    }
  }

  const openProduct = (item) => {
    applyProduct(item, { invitationMessage: '' })
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const persist = async () => {
    if (!productIdRef.current || !draftRef.current) return null
    const result = await save.mutateAsync({
      id: productIdRef.current,
      content: draftRef.current,
      price: Number(price),
    })
    setProduct((prev) =>
      prev
        ? {
            ...prev,
            ...result.data.product,
            content: draftRef.current,
          }
        : result.data.product
    )
    return result.data.product
  }

  useEffect(() => {
    if (!product?.id || !draft) return undefined
    setSaveLabel('Saving…')
    const timer = window.setTimeout(async () => {
      try {
        await persist()
        setSaveLabel('Saved')
      } catch {
        setSaveLabel('Could not save')
      }
    }, 1500)
    return () => window.clearTimeout(timer)
    // persist reads the latest draft/product through refs; only re-run on content changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, price, product?.id])

  const handleGenerate = async (event) => {
    event.preventDefault()
    setInvitationMessage('')
    setDownloadError('')
    try {
      const result = await generate.mutateAsync({
        productType,
        topic,
        audience,
        extraPrompt,
      })
      openProduct(result.data.product)
      setSaveLabel('Ready to edit')
    } catch {
      // surfaced below
    }
  }

  const handleRevise = async (event) => {
    event.preventDefault()
    if (!product?.id) return
    try {
      await persist()
      const result = await revise.mutateAsync({
        id: product.id,
        prompt: changePrompt,
      })
      applyProduct(result.data.product)
      setChangePrompt('')
    } catch {
      // surfaced below
    }
  }

  const handlePublish = async () => {
    if (!product?.id) return
    try {
      await persist()
      const result = await publish.mutateAsync({
        id: product.id,
        price: Number(price),
      })
      applyProduct(result.data.product, {
        invitationMessage: result.data.invitationMessage || '',
      })
    } catch {
      // surfaced below
    }
  }

  const handleDownload = async () => {
    if (!product?.id) return
    setDownloadError('')
    try {
      await persist()
      await sellableProductService.downloadPdf(
        product.id,
        `${draft?.title || 'product'}.pdf`
      )
    } catch (error) {
      setDownloadError(errorText(error, 'Could not download the PDF'))
    }
  }

  const handleUploadImage = async (file) => {
    setUploadError('')
    try {
      const result = await sellableProductService.uploadImage(product.id, file)
      return result.data.image
    } catch (error) {
      setUploadError(errorText(error, 'Could not upload the image'))
      throw error
    }
  }

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

  const formError = useMemo(
    () =>
      generate.isError
        ? errorText(generate.error, 'Could not generate the product')
        : '',
    [generate.error, generate.isError]
  )

  const affiliateInvite = useMemo(() => {
    if (!product?.salesUrl) return ''
    const title = draft?.title || product.content?.title || 'this product'
    return (
      invitationMessage ||
      `Promote "${title}" (${money(price)}) and earn ${commissionRate}% on every sale made through your tracking link. Your link: ${product.salesUrl}?ref=YOUR-CODE (use the code shown on your Affiliates page).`
    )
  }, [commissionRate, draft?.title, invitationMessage, price, product])

  const stepState = useMemo(() => {
    const hasDraft = !!draft?.title
    const published = product?.status === 'published'
    const listed = history.find((item) => String(item.id) === String(product?.id))
    const shared =
      (performance?.stats?.affiliateSales ||
        listed?.stats?.affiliateSales ||
        product?.stats?.affiliateSales ||
        0) > 0
    return [
      { label: 'Generate', done: hasDraft },
      { label: 'Edit & price', done: published || (hasDraft && (product?.revisionCount || 0) > 0) },
      { label: 'Publish', done: published },
      { label: 'Affiliates sell', done: shared },
    ]
  }, [draft?.title, history, performance?.stats?.affiliateSales, product])

  const showStats = history.length > 0

  return (
    <Layout>
      <div className='space-y-6'>
        <header className='flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
          <div>
            <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D4AF37]'>
              <Sparkles size={14} />
              Product studio
            </div>
            <h1 className='text-3xl font-bold text-[#EDEDED] sm:text-4xl'>
              Give your affiliates something to sell
            </h1>
            <p className='mt-2 max-w-3xl text-gray-400'>
              Write a digital product with AI, edit it like a document, publish
              a checkout page, and hand every affiliate their own tracked link.
              Sales through those links pay your program commission
              automatically.
            </p>
          </div>
          <Link
            to='/program/setup'
            className='inline-flex shrink-0 items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#121214] px-4 py-3 text-sm transition-colors hover:border-[#D4AF37]/40'
          >
            <span className='flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/15 text-[#D4AF37]'>
              <DollarSign size={16} />
            </span>
            <span>
              <span className='block text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                {programName || 'Affiliate program'}
              </span>
              <span className='block font-semibold text-[#EDEDED]'>
                Affiliates earn {commissionRate}% per sale
              </span>
            </span>
            <ArrowRight size={14} className='text-gray-500' />
          </Link>
        </header>

        <ol className='grid gap-2 sm:grid-cols-4'>
          {stepState.map((step, index) => {
            const active =
              !step.done && stepState.slice(0, index).every((prev) => prev.done)
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

        {showStats && (
          <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
            <StatCard
              label='Published products'
              value={totals?.published ?? 0}
              icon={Package}
              tone='bg-[#D4AF37]/15 text-[#D4AF37]'
              loading={listQuery.isLoading}
            />
            <StatCard
              label='Total sales'
              value={totals?.sales ?? 0}
              icon={ShoppingBag}
              tone='bg-blue-400/15 text-blue-300'
              loading={listQuery.isLoading}
            />
            <StatCard
              label='Revenue'
              value={money(totals?.revenue ?? 0)}
              icon={DollarSign}
              tone='bg-emerald-400/15 text-emerald-300'
              loading={listQuery.isLoading}
            />
            <StatCard
              label='Affiliate sales'
              value={totals?.affiliateSales ?? 0}
              hint={
                totals?.commissionOwed
                  ? `${money(totals.commissionOwed)} commission owed`
                  : 'Sales made through affiliate links'
              }
              icon={Users}
              tone='bg-purple-400/15 text-purple-300'
              loading={listQuery.isLoading}
            />
          </div>
        )}

        <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]'>
          <form
            onSubmit={handleGenerate}
            className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-7'
          >
            <div className='mb-5'>
              <h2 className='font-bold text-[#EDEDED]'>Create a new product</h2>
              <p className='mt-1 text-xs text-gray-500'>
                Pick a format and describe the topic. You can rewrite any part
                afterwards.
              </p>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              {TYPES.map((type) => {
                const Icon = type.icon
                const active = productType === type.id
                return (
                  <button
                    key={type.id}
                    type='button'
                    onClick={() => setProductType(type.id)}
                    disabled={busy}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      active
                        ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10'
                        : 'border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <Icon size={18} className={active ? 'text-[#D4AF37]' : 'text-gray-500'} />
                    <p className='mt-3 text-sm font-semibold text-[#EDEDED]'>{type.label}</p>
                    <p className='mt-1 text-xs text-gray-500'>{type.hint}</p>
                  </button>
                )
              })}
            </div>

            <div className='mt-6 grid gap-5 md:grid-cols-2'>
              <label className='block space-y-2 md:col-span-2'>
                <span className='text-sm font-semibold text-[#EDEDED]'>Topic</span>
                <input
                  required
                  minLength={4}
                  value={topic}
                  disabled={busy}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder='Example: a 7-day morning routine for busy founders'
                  className='h-12 w-full rounded-xl border border-white/[0.10] bg-[#09090B] px-4 text-sm text-[#EDEDED] outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50'
                />
              </label>
              <label className='block space-y-2'>
                <span className='text-sm font-semibold text-[#EDEDED]'>Who is it for</span>
                <input
                  value={audience}
                  disabled={busy}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder='New coaches, Shopify owners, students...'
                  className='h-12 w-full rounded-xl border border-white/[0.10] bg-[#09090B] px-4 text-sm text-[#EDEDED] outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50'
                />
              </label>
              <label className='block space-y-2'>
                <span className='text-sm font-semibold text-[#EDEDED]'>Extra instructions</span>
                <input
                  value={extraPrompt}
                  disabled={busy}
                  onChange={(event) => setExtraPrompt(event.target.value)}
                  placeholder='Keep it short. Use simple language. Add examples.'
                  className='h-12 w-full rounded-xl border border-white/[0.10] bg-[#09090B] px-4 text-sm text-[#EDEDED] outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50'
                />
              </label>
            </div>

            {formError && (
              <p className='mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300'>
                {formError}
              </p>
            )}

            <button
              type='submit'
              disabled={busy || topic.trim().length < 4}
              className='mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 py-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60'
            >
              {generate.isPending ? <Loader2 size={16} className='animate-spin' /> : <Sparkles size={16} />}
              {generate.isPending ? 'Writing your product...' : 'Generate product'}
            </button>
          </form>

          <aside className='rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#D4AF37]/[0.08] via-[#121214] to-[#121214] p-5 sm:p-6'>
            <div className='mb-4 flex items-center gap-2'>
              <Share2 size={17} className='text-[#D4AF37]' />
              <h2 className='font-bold text-[#EDEDED]'>How affiliates sell it</h2>
            </div>
            <ol className='space-y-4 text-sm'>
              <HowStep n='1' title='Publish a checkout page'>
                Set a price and publish. Buyers pay by card and get the PDF
                instantly.
              </HowStep>
              <HowStep n='2' title='Give each affiliate their link'>
                Every affiliate in your program gets{' '}
                <span className='font-mono text-xs text-gray-300'>?ref=CODE</span>{' '}
                on the checkout URL. Copy links per person below.
              </HowStep>
              <HowStep n='3' title={`They earn ${commissionRate}% per sale`}>
                Commission is recorded in their Earnings the moment a sale
                clears, using the rate from your program.
              </HowStep>
            </ol>
            <div className='mt-5 rounded-xl border border-white/[0.08] bg-black/30 p-4'>
              <p className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                Example split on {money(price || 0)}
              </p>
              <div className='mt-2 flex items-end justify-between gap-3'>
                <div>
                  <p className='text-xs text-gray-500'>Affiliate</p>
                  <p className='text-lg font-black text-[#D4AF37]'>{money(split.affiliate)}</p>
                </div>
                <div className='text-right'>
                  <p className='text-xs text-gray-500'>You keep</p>
                  <p className='text-lg font-black text-emerald-300'>{money(split.owner)}</p>
                </div>
              </div>
            </div>
            <Link
              to='/invite'
              className='mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#D4AF37] hover:underline'
            >
              <UserPlus size={15} />
              {affiliates.length
                ? `${affiliates.length} affiliate${affiliates.length === 1 ? '' : 's'} in your program`
                : 'Invite your first affiliate'}
              <ArrowRight size={14} />
            </Link>
          </aside>
        </div>

        {(history.length > 0 || listQuery.isLoading) && (
          <section className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-6'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <div>
                <h2 className='font-bold text-[#EDEDED]'>Your products</h2>
                <p className='mt-1 text-xs text-gray-500'>
                  Open any product to edit, publish, or share it.
                </p>
              </div>
              <span className='text-xs text-gray-500'>
                {history.length} {history.length === 1 ? 'product' : 'products'}
              </span>
            </div>
            {listQuery.isLoading ? (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {[1, 2, 3].map((item) => (
                  <div key={item} className='h-40 animate-pulse rounded-xl bg-white/[0.04]' />
                ))}
              </div>
            ) : (
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {history.map((item) => (
                  <ProductCard
                    key={item.id}
                    item={item}
                    active={product?.id === item.id}
                    onOpen={() => openProduct(item)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {draft?.title && (
          <section ref={workspaceRef} className='scroll-mt-4 space-y-6'>
            <div className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]'>
              <ProductDocumentEditor
                content={draft}
                disabled={busy}
                saveStatus={saveLabel}
                onChange={setDraft}
                onUploadImage={handleUploadImage}
              />

              <aside className='space-y-4 xl:sticky xl:top-4 xl:self-start'>
                <div className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5'>
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <h3 className='font-bold text-[#EDEDED]'>Price & publish</h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        Edits save automatically.
                      </p>
                    </div>
                    <StatusBadge status={product.status} />
                  </div>

                  <label className='mt-5 block space-y-2'>
                    <span className='text-sm font-semibold text-[#EDEDED]'>Price (USD)</span>
                    <div className='relative'>
                      <span className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500'>
                        $
                      </span>
                      <input
                        type='number'
                        min='0'
                        step='1'
                        value={price}
                        disabled={busy}
                        onChange={(event) => setPrice(event.target.value)}
                        className='h-12 w-full rounded-xl border border-white/[0.10] bg-[#09090B] pl-8 pr-4 text-sm text-[#EDEDED] outline-none focus:border-[#D4AF37]/50'
                      />
                    </div>
                  </label>

                  <div className='mt-3 grid grid-cols-2 gap-2 text-sm'>
                    <div className='rounded-xl border border-white/[0.06] bg-black/30 p-3'>
                      <p className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                        Affiliate gets
                      </p>
                      <p className='mt-1 font-bold text-[#D4AF37]'>
                        {money(split.affiliate)}{' '}
                        <span className='text-xs font-semibold text-gray-500'>({commissionRate}%)</span>
                      </p>
                    </div>
                    <div className='rounded-xl border border-white/[0.06] bg-black/30 p-3'>
                      <p className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                        You keep
                      </p>
                      <p className='mt-1 font-bold text-emerald-300'>{money(split.owner)}</p>
                    </div>
                  </div>

                  <button
                    type='button'
                    onClick={handlePublish}
                    disabled={busy}
                    className='mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-bold text-black disabled:opacity-60'
                  >
                    {publish.isPending ? (
                      <Loader2 size={16} className='animate-spin' />
                    ) : (
                      <Link2 size={16} />
                    )}
                    {isPublished ? 'Update checkout page' : 'Publish checkout page'}
                  </button>
                  <button
                    type='button'
                    onClick={handleDownload}
                    disabled={busy}
                    className='mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-4 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                  >
                    <Download size={16} />
                    Download PDF
                  </button>

                  {uploadError && <p className='mt-3 text-sm text-red-300'>{uploadError}</p>}
                  {downloadError && <p className='mt-3 text-sm text-red-300'>{downloadError}</p>}
                  {publish.isError && (
                    <p className='mt-3 text-sm text-red-300'>
                      {errorText(publish.error, 'Could not publish the product')}
                    </p>
                  )}
                  {save.isError && (
                    <p className='mt-3 text-sm text-red-300'>
                      {errorText(save.error, 'Could not save the document')}
                    </p>
                  )}
                </div>

                <form
                  onSubmit={handleRevise}
                  className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5'
                >
                  <label className='block space-y-2'>
                    <span className='text-sm font-semibold text-[#EDEDED]'>
                      Ask AI to rewrite a part
                    </span>
                    <textarea
                      value={changePrompt}
                      disabled={busy}
                      onChange={(event) => setChangePrompt(event.target.value)}
                      placeholder='Make chapter 2 shorter. Add a beginner example...'
                      className='min-h-24 w-full resize-y rounded-xl border border-white/[0.10] bg-[#09090B] px-4 py-3 text-sm text-[#EDEDED] outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/50'
                    />
                  </label>
                  {revise.isError && (
                    <p className='mt-3 text-sm text-red-300'>
                      {errorText(revise.error, 'Could not apply that change')}
                    </p>
                  )}
                  <button
                    type='submit'
                    disabled={busy || changePrompt.trim().length < 3}
                    className='mt-4 inline-flex items-center gap-2 rounded-xl border border-white/[0.12] px-4 py-2.5 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40 disabled:opacity-50'
                  >
                    {revise.isPending ? (
                      <Loader2 size={14} className='animate-spin' />
                    ) : (
                      <Sparkles size={14} />
                    )}
                    Apply AI edit
                  </button>
                </form>

                {product.salesUrl && (
                  <div className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5'>
                    <h3 className='font-bold text-[#EDEDED]'>Checkout page</h3>
                    <p className='mt-1 text-sm text-gray-500'>
                      Public link buyers use. Affiliate links below add tracking
                      to this URL.
                    </p>
                    <div className='mt-4 space-y-3'>
                      <LinkRow
                        label='Customer checkout'
                        value={product.salesUrl}
                        copied={copied === 'sales'}
                        onCopy={() => copyValue('sales', product.salesUrl)}
                        href={product.salesUrl}
                      />
                      <LinkRow
                        label='Your own tracking link'
                        value={product.affiliateUrl}
                        copied={copied === 'affiliate'}
                        onCopy={() => copyValue('affiliate', product.affiliateUrl)}
                      />
                    </div>
                  </div>
                )}
              </aside>
            </div>

            {product.salesUrl && (
              <div className='grid gap-6 xl:grid-cols-2'>
                <section className='rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#D4AF37]/[0.07] via-[#121214] to-[#121214] p-5 sm:p-6'>
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                    <div className='flex items-start gap-3'>
                      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-black'>
                        <Users size={18} />
                      </span>
                      <div>
                        <h3 className='font-bold text-[#EDEDED]'>Affiliate links</h3>
                        <p className='mt-1 text-sm text-gray-500'>
                          One tracked link per affiliate. Sales through it pay
                          them {commissionRate}% ({money(split.affiliate)} on this
                          price).
                        </p>
                      </div>
                    </div>
                    {filteredAffiliates.length > 4 && (
                      <input
                        type='search'
                        value={affiliateSearch}
                        onChange={(event) => setAffiliateSearch(event.target.value)}
                        placeholder='Search affiliates'
                        className='h-10 rounded-xl border border-white/[0.08] bg-black/30 px-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-[#D4AF37]/40 sm:w-52'
                      />
                    )}
                  </div>

                  <div className='mt-5 space-y-2'>
                    {referralQuery.isLoading ? (
                      [1, 2].map((item) => (
                        <div key={item} className='h-14 animate-pulse rounded-xl bg-white/[0.04]' />
                      ))
                    ) : filteredAffiliates.length === 0 ? (
                      <div className='rounded-xl border border-dashed border-white/[0.12] bg-black/20 p-5 text-center'>
                        <p className='font-semibold text-[#EDEDED]'>
                          {affiliates.length
                            ? 'No affiliates match that search'
                            : 'No affiliates yet'}
                        </p>
                        <p className='mx-auto mt-1 max-w-sm text-sm text-gray-500'>
                          {affiliates.length
                            ? 'Try another name or email.'
                            : 'Invite people to your program first. Each person who joins gets their own tracked link for this product here.'}
                        </p>
                        {!affiliates.length && (
                          <Link
                            to='/invite'
                            className='mt-4 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-bold text-black'
                          >
                            <UserPlus size={15} />
                            Invite affiliates
                          </Link>
                        )}
                      </div>
                    ) : (
                      filteredAffiliates.slice(0, 12).map((entry) => {
                        const link = affiliateLinkFor(product.salesUrl, entry.user.referralCode)
                        const key = `aff-${entry.user._id}`
                        return (
                          <div
                            key={key}
                            className='flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/30 px-3 py-2.5'
                          >
                            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 text-sm font-bold text-[#D4AF37]'>
                              {(entry.user.name || entry.user.email || 'A').charAt(0).toUpperCase()}
                            </span>
                            <div className='min-w-0 flex-1'>
                              <p className='truncate text-sm font-semibold text-[#EDEDED]'>
                                {entry.user.name || entry.user.email}
                              </p>
                              <p className='truncate font-mono text-[11px] text-gray-500'>{link}</p>
                            </div>
                            <button
                              type='button'
                              onClick={() => copyValue(key, link)}
                              className='inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                            >
                              {copied === key ? <Check size={12} /> : <Copy size={12} />}
                              {copied === key ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )
                      })
                    )}
                    {filteredAffiliates.length > 12 && (
                      <p className='text-xs text-gray-500'>
                        Showing 12 of {filteredAffiliates.length}. Use search to find others.
                      </p>
                    )}
                  </div>

                  <div className='mt-5 rounded-xl border border-white/[0.08] bg-black/30 p-4'>
                    <div className='mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                      <Mail size={13} />
                      Invitation message
                    </div>
                    <p className='text-sm leading-relaxed text-gray-300'>{affiliateInvite}</p>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      <button
                        type='button'
                        onClick={() => copyValue('invite', affiliateInvite)}
                        className='inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                      >
                        {copied === 'invite' ? <Check size={12} /> : <Copy size={12} />}
                        {copied === 'invite' ? 'Copied' : 'Copy message'}
                      </button>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(
                          `Earn ${commissionRate}% promoting "${draft?.title || 'my product'}"`
                        )}&body=${encodeURIComponent(affiliateInvite)}`}
                        className='inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                      >
                        <Mail size={12} />
                        Send by email
                      </a>
                    </div>
                  </div>
                </section>

                <section className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-6'>
                  <div className='flex items-start gap-3'>
                    <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-400/15 text-blue-300'>
                      <BarChart3 size={18} />
                    </span>
                    <div>
                      <h3 className='font-bold text-[#EDEDED]'>Performance</h3>
                      <p className='mt-1 text-sm text-gray-500'>
                        Sales for this product, and which affiliates drove them.
                      </p>
                    </div>
                  </div>

                  {performanceQuery.isError ? (
                    <p className='mt-5 text-sm text-red-300'>
                      {errorText(performanceQuery.error, 'Could not load performance')}
                    </p>
                  ) : (
                    <>
                      <div className='mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4'>
                        <MiniStat
                          label='Sales'
                          value={performance?.stats?.sales ?? 0}
                          loading={performanceQuery.isLoading}
                        />
                        <MiniStat
                          label='Revenue'
                          value={money(performance?.stats?.revenue ?? 0)}
                          loading={performanceQuery.isLoading}
                        />
                        <MiniStat
                          label='Via affiliates'
                          value={performance?.stats?.affiliateSales ?? 0}
                          loading={performanceQuery.isLoading}
                        />
                        <MiniStat
                          label='Commission owed'
                          value={money(performance?.stats?.commissionOwed ?? 0)}
                          loading={performanceQuery.isLoading}
                        />
                      </div>

                      <div className='mt-5'>
                        <p className='mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                          Top affiliates
                        </p>
                        {performanceQuery.isLoading ? (
                          <div className='h-12 animate-pulse rounded-xl bg-white/[0.04]' />
                        ) : performance?.affiliates?.length ? (
                          <div className='overflow-hidden rounded-xl border border-white/[0.08]'>
                            <table className='w-full text-left text-sm'>
                              <thead className='bg-black/30 text-[10px] font-black uppercase tracking-wider text-gray-600'>
                                <tr>
                                  <th className='px-3 py-2'>Affiliate</th>
                                  <th className='px-3 py-2 text-right'>Sales</th>
                                  <th className='px-3 py-2 text-right'>Revenue</th>
                                  <th className='px-3 py-2 text-right'>Commission</th>
                                </tr>
                              </thead>
                              <tbody>
                                {performance.affiliates.slice(0, 6).map((row) => (
                                  <tr key={row.id} className='border-t border-white/[0.05]'>
                                    <td className='max-w-[180px] truncate px-3 py-2 text-[#EDEDED]'>
                                      {row.name}
                                    </td>
                                    <td className='px-3 py-2 text-right text-gray-300'>{row.sales}</td>
                                    <td className='px-3 py-2 text-right text-gray-300'>{money(row.revenue)}</td>
                                    <td className='px-3 py-2 text-right text-[#D4AF37]'>{money(row.commission)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className='rounded-xl border border-dashed border-white/[0.12] bg-black/20 p-4 text-sm text-gray-500'>
                            No affiliate sales yet. Share the links on the left
                            and the first tracked sale will appear here.
                          </p>
                        )}
                      </div>

                      <div className='mt-5'>
                        <p className='mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
                          Recent sales
                        </p>
                        {performanceQuery.isLoading ? (
                          <div className='h-12 animate-pulse rounded-xl bg-white/[0.04]' />
                        ) : performance?.recentSales?.length ? (
                          <ul className='divide-y divide-white/[0.05] rounded-xl border border-white/[0.08]'>
                            {performance.recentSales.map((sale) => (
                              <li
                                key={sale.id}
                                className='flex items-center justify-between gap-3 px-3 py-2.5 text-sm'
                              >
                                <div className='min-w-0'>
                                  <p className='truncate text-[#EDEDED]'>{sale.customerName}</p>
                                  <p className='truncate text-xs text-gray-500'>
                                    {shortDate(sale.purchasedAt)}
                                    {sale.affiliateName ? ` · via ${sale.affiliateName}` : ' · direct'}
                                  </p>
                                </div>
                                <span className='shrink-0 font-semibold text-emerald-300'>
                                  {money(sale.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className='flex items-center gap-2 text-sm text-gray-500'>
                            <Eye size={14} />
                            {performance?.stats?.views
                              ? `${performance.stats.views} checkout views, no sales yet.`
                              : 'No sales yet.'}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}
          </section>
        )}
      </div>
    </Layout>
  )
}

const HowStep = ({ n, title, children }) => (
  <li className='flex gap-3'>
    <span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/15 text-xs font-bold text-[#D4AF37]'>
      {n}
    </span>
    <div>
      <p className='font-semibold text-[#EDEDED]'>{title}</p>
      <p className='mt-0.5 text-xs leading-5 text-gray-500'>{children}</p>
    </div>
  </li>
)

const StatCard = ({ label, value, hint, icon, tone, loading }) => (
  <div className='rounded-2xl border border-white/[0.06] bg-[#121214] p-5'>
    <div className='mb-3 flex items-center justify-between gap-3'>
      <span className='text-xs font-bold uppercase tracking-[0.1em] text-gray-500'>{label}</span>
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        {createElement(icon, { size: 16 })}
      </span>
    </div>
    {loading ? (
      <div className='h-8 w-20 animate-pulse rounded-md bg-white/[0.08]' />
    ) : (
      <p className='text-2xl font-black tracking-tight text-white'>{value}</p>
    )}
    {hint && !loading && <p className='mt-1 truncate text-xs text-gray-500'>{hint}</p>}
  </div>
)

const MiniStat = ({ label, value, loading }) => (
  <div className='rounded-xl border border-white/[0.06] bg-black/30 p-3'>
    <p className='text-[11px] font-bold uppercase tracking-wider text-gray-500'>{label}</p>
    {loading ? (
      <div className='mt-2 h-5 w-12 animate-pulse rounded bg-white/[0.08]' />
    ) : (
      <p className='mt-1 text-lg font-black text-white'>{value}</p>
    )}
  </div>
)

const StatusBadge = ({ status }) => {
  const styles =
    status === 'published'
      ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
      : status === 'ready'
        ? 'border-[#D4AF37]/25 bg-[#D4AF37]/10 text-[#D4AF37]'
        : 'border-white/10 bg-white/[0.04] text-gray-400'
  const label = status === 'published' ? 'Live' : status === 'ready' ? 'Draft' : 'Draft'
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${styles}`}
    >
      {label}
    </span>
  )
}

const ProductCard = ({ item, active, onOpen }) => {
  const type = TYPE_BY_ID[item.productType] || TYPES[0]
  const Icon = type.icon
  const cover = item.content?.coverImage?.url
  const stats = item.stats
  return (
    <button
      type='button'
      onClick={onOpen}
      className={`group flex overflow-hidden rounded-xl border text-left transition-colors ${
        active
          ? 'border-[#D4AF37]/50 bg-[#D4AF37]/[0.06]'
          : 'border-white/[0.08] bg-black/20 hover:border-white/20'
      }`}
    >
      <div className='flex w-24 shrink-0 items-center justify-center bg-black/40 sm:w-28'>
        {cover ? (
          <img src={mediaUrl(cover)} alt='' className='h-full w-full object-cover' />
        ) : (
          <Icon size={22} className='text-gray-600' />
        )}
      </div>
      <div className='min-w-0 flex-1 p-4'>
        <div className='flex items-start justify-between gap-2'>
          <p className='line-clamp-2 text-sm font-semibold text-[#EDEDED]'>
            {item.content?.title || item.topic}
          </p>
          <StatusBadge status={item.status} />
        </div>
        <p className='mt-1 text-xs text-gray-500'>
          {type.label} · {money(item.price)}
        </p>
        <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400'>
          {stats ? (
            <>
              <span>
                <span className='font-semibold text-[#EDEDED]'>{stats.sales}</span> sales
              </span>
              <span>
                <span className='font-semibold text-[#EDEDED]'>{money(stats.revenue)}</span> revenue
              </span>
              {stats.affiliateSales > 0 && (
                <span>
                  <span className='font-semibold text-[#D4AF37]'>{stats.affiliateSales}</span> via affiliates
                </span>
              )}
            </>
          ) : (
            <span className='inline-flex items-center gap-1 text-gray-500 group-hover:text-[#D4AF37]'>
              Open to publish <ArrowRight size={12} />
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

const LinkRow = ({ label, value, copied, onCopy, href }) => (
  <div className='rounded-xl border border-white/[0.08] bg-black/30 p-3'>
    <p className='mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
      {label}
    </p>
    <div className='flex items-center gap-2'>
      <p className='min-w-0 flex-1 truncate font-mono text-xs text-gray-300'>{value}</p>
      {href && (
        <a
          href={href}
          target='_blank'
          rel='noreferrer'
          aria-label='Open link'
          className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-gray-300 hover:border-[#D4AF37]/40 hover:text-white'
        >
          <ExternalLink size={12} />
        </a>
      )}
      <button
        type='button'
        onClick={onCopy}
        className='inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  </div>
)

export default SellableProductStudio
