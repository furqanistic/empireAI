import {
  BookOpen,
  Check,
  ClipboardList,
  Copy,
  Download,
  FileText,
  Link2,
  Loader2,
  NotebookPen,
  Sparkles,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import ProductDocumentEditor, {
  withBlocks,
} from '../../components/AIBuilder/ProductDocumentEditor.jsx'
import {
  useGenerateSellableProduct,
  usePublishSellableProduct,
  useReviseSellableProduct,
  useSaveSellableContent,
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

const errorText = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback

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

  const draftRef = useRef(null)
  const productIdRef = useRef(null)

  const listQuery = useSellableProducts()
  const generate = useGenerateSellableProduct()
  const revise = useReviseSellableProduct()
  const publish = usePublishSellableProduct()
  const save = useSaveSellableContent()

  const history = listQuery.data?.data?.products || []
  const busy = generate.isPending || revise.isPending || publish.isPending

  draftRef.current = draft
  productIdRef.current = product?.id

  const applyProduct = (next, extra = {}) => {
    const content = withBlocks(next.content)
    setProduct({ ...next, content })
    setDraft(content)
    setPrice(String(next.price || content?.suggestedPrice || 19))
    if (extra.invitationMessage !== undefined) {
      setInvitationMessage(extra.invitationMessage)
    }
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
      applyProduct(result.data.product)
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
    await navigator.clipboard.writeText(value)
    setCopied(key)
    window.setTimeout(() => setCopied(''), 1800)
  }

  const formError = useMemo(
    () =>
      generate.isError
        ? errorText(generate.error, 'Could not generate the product')
        : '',
    [generate.error, generate.isError]
  )

  return (
    <Layout>
      <div className='space-y-6'>
        <header>
          <div className='mb-3 inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#D4AF37]'>
            <Sparkles size={14} />
            Product studio
          </div>
          <h1 className='text-3xl font-bold text-[#EDEDED] sm:text-4xl'>
            Write a product you can sell
          </h1>
          <p className='mt-2 max-w-3xl text-gray-400'>
            Generate a draft, then edit the page like a document — titles,
            formatting, cover art, and photos. Download the PDF or publish a
            checkout link affiliates can share.
          </p>
        </header>

        <form
          onSubmit={handleGenerate}
          className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5 sm:p-7'
        >
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

        {history.length > 0 && (
          <section className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5'>
            <h2 className='mb-3 text-sm font-semibold text-[#EDEDED]'>Recent drafts</h2>
            <div className='flex flex-wrap gap-2'>
              {history.map((item) => (
                <button
                  key={item.id}
                  type='button'
                  onClick={() => applyProduct(item, { invitationMessage: '' })}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    product?.id === item.id
                      ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {item.content?.title || item.topic}
                </button>
              ))}
            </div>
          </section>
        )}

        {draft?.title && (
          <section className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'>
            <ProductDocumentEditor
              content={draft}
              disabled={busy}
              saveStatus={saveLabel}
              onChange={setDraft}
              onUploadImage={handleUploadImage}
            />

            <aside className='space-y-4 xl:sticky xl:top-4 xl:self-start'>
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

              <div className='rounded-2xl border border-white/[0.08] bg-[#121214] p-5'>
                <h3 className='font-bold text-[#EDEDED]'>Sell and share</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Edits save automatically. The PDF includes your formatting
                  and images.
                </p>

                <label className='mt-5 block space-y-2'>
                  <span className='text-sm font-semibold text-[#EDEDED]'>Price (USD)</span>
                  <input
                    type='number'
                    min='0'
                    step='1'
                    value={price}
                    disabled={busy}
                    onChange={(event) => setPrice(event.target.value)}
                    className='h-12 w-full rounded-xl border border-white/[0.10] bg-[#09090B] px-4 text-sm text-[#EDEDED] outline-none focus:border-[#D4AF37]/50'
                  />
                </label>

                <button
                  type='button'
                  onClick={handleDownload}
                  disabled={busy}
                  className='mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-4 text-sm font-semibold text-[#EDEDED] hover:border-[#D4AF37]/40'
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button
                  type='button'
                  onClick={handlePublish}
                  disabled={busy}
                  className='mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-sm font-bold text-black disabled:opacity-60'
                >
                  {publish.isPending ? (
                    <Loader2 size={16} className='animate-spin' />
                  ) : (
                    <Link2 size={16} />
                  )}
                  {product.status === 'published'
                    ? 'Refresh affiliate link'
                    : 'Create affiliate link'}
                </button>

                {uploadError && (
                  <p className='mt-3 text-sm text-red-300'>{uploadError}</p>
                )}
                {downloadError && (
                  <p className='mt-3 text-sm text-red-300'>{downloadError}</p>
                )}
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

                {product.salesUrl && (
                  <div className='mt-5 space-y-3'>
                    <LinkRow
                      label='Customer checkout'
                      value={product.salesUrl}
                      copied={copied === 'sales'}
                      onCopy={() => copyValue('sales', product.salesUrl)}
                    />
                    <LinkRow
                      label='Affiliate link'
                      value={product.affiliateUrl}
                      copied={copied === 'affiliate'}
                      onCopy={() => copyValue('affiliate', product.affiliateUrl)}
                    />
                    {invitationMessage && (
                      <LinkRow
                        label='Invite message'
                        value={invitationMessage}
                        copied={copied === 'invite'}
                        onCopy={() => copyValue('invite', invitationMessage)}
                      />
                    )}
                  </div>
                )}
              </div>
            </aside>
          </section>
        )}
      </div>
    </Layout>
  )
}

const LinkRow = ({ label, value, copied, onCopy }) => (
  <div className='rounded-xl border border-white/[0.08] bg-black/30 p-3'>
    <p className='mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500'>
      {label}
    </p>
    <div className='flex items-center gap-2'>
      <p className='min-w-0 flex-1 truncate font-mono text-xs text-gray-300'>{value}</p>
      <button
        type='button'
        onClick={onCopy}
        className='inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-[#EDEDED]'
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  </div>
)

export default SellableProductStudio
