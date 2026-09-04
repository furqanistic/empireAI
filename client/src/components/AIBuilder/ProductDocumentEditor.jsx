import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Plus,
  Quote,
  Trash2,
  Underline,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const apiHost = (
  import.meta.env.VITE_API_URL || 'http://localhost:8800/api'
).replace(/\/api\/?$/, '')

const mediaUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }
  return `${apiHost}${url}`
}

const uid = () => `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

const emptyText = () => ({
  id: uid(),
  type: 'text',
  html: '<p></p>',
  align: 'left',
})

export const withBlocks = (content) => {
  if (!content) return content
  if (content.blocks?.length) return content
  const blocks = []
  for (const section of content.sections || []) {
    blocks.push({
      id: uid(),
      type: 'heading',
      level: 2,
      text: section.heading,
      align: 'left',
    })
    if (section.content) {
      blocks.push({
        id: uid(),
        type: 'text',
        html: `<p>${String(section.content)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')}</p>`,
        align: 'left',
      })
    }
    if (section.items?.length) {
      blocks.push({
        id: uid(),
        type: 'list',
        style: 'check',
        align: 'left',
        items: section.items.map((text) => ({ id: uid(), text, checked: false })),
      })
    }
  }
  return { ...content, blocks: blocks.length ? blocks : [emptyText()] }
}

const ToolButton = ({ active, onClick, children, title }) => (
  <button
    type='button'
    title={title}
    onMouseDown={(event) => {
      event.preventDefault()
      onClick?.()
    }}
    className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
      active ? 'bg-[#D4AF37] text-black' : 'text-[#E8E2D4] hover:bg-white/10'
    }`}
  >
    {children}
  </button>
)

const TextBlock = ({ html, align, onChange, onFocus }) => {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    if (document.activeElement === ref.current) return
    if (ref.current.innerHTML !== (html || '<p></p>')) {
      ref.current.innerHTML = html || '<p></p>'
    }
  }, [html])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onFocus={onFocus}
      onInput={() => onChange(ref.current.innerHTML)}
      className='min-h-8 text-[16px] leading-8 text-[#2A251C] outline-none [&_a]:underline [&_a]:text-[#8A6B12] [&_b]:font-semibold [&_strong]:font-semibold [&_em]:italic [&_i]:italic [&_u]:underline [&_ul]:ml-5 [&_ul]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal'
      style={{ textAlign: align || 'left' }}
    />
  )
}

const ProductDocumentEditor = ({
  content,
  onChange,
  onUploadImage,
  disabled,
  saveStatus = '',
}) => {
  const [selectedId, setSelectedId] = useState(null)
  const [dragId, setDragId] = useState(null)
  const fileRef = useRef(null)
  const insertMode = useRef('block')
  const contentRef = useRef(content)
  contentRef.current = content
  const blocks = content?.blocks || []

  const patch = (partial) => onChange({ ...contentRef.current, ...partial })
  const setBlocks = (next) => patch({ blocks: next })

  const updateBlock = (id, partial) =>
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, ...partial } : block)))

  const insertBlock = (block, afterId = selectedId) => {
    const index = blocks.findIndex((item) => item.id === afterId)
    const next = [...blocks]
    next.splice(index >= 0 ? index + 1 : next.length, 0, block)
    setBlocks(next)
    setSelectedId(block.id)
  }

  const removeBlock = (id) => {
    setBlocks(blocks.filter((block) => block.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const run = (command, value) => {
    document.execCommand(command, false, value)
  }

  const pickImage = (mode) => {
    insertMode.current = mode
    fileRef.current?.click()
  }

  const addImage = useCallback(
    async (file) => {
      if (!file || !onUploadImage) return
      const image = await onUploadImage(file)
      const latest = contentRef.current
      const currentBlocks = latest.blocks || []
      if (insertMode.current === 'cover') {
        onChange({ ...latest, coverImage: image })
        return
      }
      if (insertMode.current === 'replace' && selectedId) {
        onChange({
          ...latest,
          blocks: currentBlocks.map((block) =>
            block.id === selectedId
              ? { ...block, imageUrl: image.url, imagePath: image.path }
              : block
          ),
        })
        insertMode.current = 'block'
        return
      }
      const index = currentBlocks.findIndex((item) => item.id === selectedId)
      const next = [...currentBlocks]
      next.splice(index >= 0 ? index + 1 : next.length, 0, {
        id: uid(),
        type: 'image',
        imageUrl: image.url,
        imagePath: image.path,
        caption: '',
        align: 'center',
      })
      onChange({ ...latest, blocks: next })
    },
    [onChange, onUploadImage, selectedId]
  )

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    await addImage(file)
  }

  const onDrop = useCallback(
    async (files) => {
      insertMode.current = 'block'
      if (files[0]) await addImage(files[0])
    },
    [addImage]
  )

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/gif': [], 'image/webp': [] },
    disabled,
  })

  const onDropReorder = (targetId) => {
    if (!dragId || dragId === targetId) return
    const from = blocks.findIndex((block) => block.id === dragId)
    const to = blocks.findIndex((block) => block.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...blocks]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setBlocks(next)
    setDragId(null)
  }

  const addLink = () => {
    const url = window.prompt('Paste a link')
    if (url) run('createLink', url)
  }

  return (
    <div className='overflow-hidden rounded-2xl border border-white/[0.08] bg-[#121214]'>
      <div className='sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-white/[0.08] bg-[#121214]/95 px-3 py-2 backdrop-blur'>
        <ToolButton title='Bold' onClick={() => run('bold')}>
          <Bold size={14} />
        </ToolButton>
        <ToolButton title='Italic' onClick={() => run('italic')}>
          <Italic size={14} />
        </ToolButton>
        <ToolButton title='Underline' onClick={() => run('underline')}>
          <Underline size={14} />
        </ToolButton>
        <ToolButton title='Highlight' onClick={() => run('hiliteColor', '#F6E7A8')}>
          <Highlighter size={14} />
        </ToolButton>
        <ToolButton title='Link' onClick={addLink}>
          <LinkIcon size={14} />
        </ToolButton>
        <span className='mx-1 h-4 w-px bg-white/10' />
        <ToolButton
          title='Title'
          onClick={() =>
            insertBlock({ id: uid(), type: 'heading', level: 1, text: 'New title', align: 'left' })
          }
        >
          <Heading1 size={14} />
        </ToolButton>
        <ToolButton
          title='Heading'
          onClick={() =>
            insertBlock({ id: uid(), type: 'heading', level: 2, text: 'New chapter', align: 'left' })
          }
        >
          <Heading2 size={14} />
        </ToolButton>
        <ToolButton
          title='Subheading'
          onClick={() =>
            insertBlock({ id: uid(), type: 'heading', level: 3, text: 'New section', align: 'left' })
          }
        >
          <Heading3 size={14} />
        </ToolButton>
        <ToolButton title='Bullet list' onClick={() => run('insertUnorderedList')}>
          <List size={14} />
        </ToolButton>
        <ToolButton title='Numbered list' onClick={() => run('insertOrderedList')}>
          <ListOrdered size={14} />
        </ToolButton>
        <ToolButton
          title='Checklist'
          onClick={() =>
            insertBlock({
              id: uid(),
              type: 'list',
              style: 'check',
              align: 'left',
              items: [{ id: uid(), text: 'New item', checked: false }],
            })
          }
        >
          <ListChecks size={14} />
        </ToolButton>
        <ToolButton
          title='Quote'
          onClick={() => insertBlock({ id: uid(), type: 'quote', text: 'Add a pull quote', align: 'left' })}
        >
          <Quote size={14} />
        </ToolButton>
        <ToolButton title='Image' onClick={() => pickImage('block')}>
          <ImagePlus size={14} />
        </ToolButton>
        <ToolButton title='Divider' onClick={() => insertBlock({ id: uid(), type: 'divider' })}>
          <Minus size={14} />
        </ToolButton>
        <span className='mx-1 h-4 w-px bg-white/10' />
        <ToolButton title='Align left' onClick={() => selectedId && updateBlock(selectedId, { align: 'left' })}>
          <AlignLeft size={14} />
        </ToolButton>
        <ToolButton
          title='Align center'
          onClick={() => selectedId && updateBlock(selectedId, { align: 'center' })}
        >
          <AlignCenter size={14} />
        </ToolButton>
        <ToolButton
          title='Align right'
          onClick={() => selectedId && updateBlock(selectedId, { align: 'right' })}
        >
          <AlignRight size={14} />
        </ToolButton>
        <p className='ml-2 hidden text-[11px] text-gray-500 sm:block'>
          {saveStatus || 'Click any text to edit'}
        </p>
        <button
          type='button'
          disabled={disabled}
          onClick={() => insertBlock(emptyText())}
          className='ml-auto inline-flex h-8 items-center gap-1 rounded-md bg-[#D4AF37] px-3 text-xs font-bold text-black disabled:opacity-50'
        >
          <Plus size={12} />
          Add block
        </button>
      </div>

      <div className='bg-[#0B0B0D] px-3 py-8 sm:px-8'>
        <article
          {...getRootProps()}
          className={`relative mx-auto min-h-[70vh] max-w-3xl rounded-sm bg-[#F6F1E6] px-7 py-10 text-[#1F1B14] shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-14 sm:py-14 ${
            isDragActive ? 'ring-2 ring-[#D4AF37]' : ''
          }`}
        >
          {isDragActive && (
            <div className='pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-[#D4AF37] bg-[#F6F1E6]/80 text-sm font-semibold text-[#8A6B12]'>
              Drop an image onto the page
            </div>
          )}

          <button
            type='button'
            disabled={disabled}
            onClick={() => pickImage('cover')}
            className='group relative mb-8 block w-full overflow-hidden rounded-xl bg-[#E8DFCC]'
          >
            {content.coverImage?.url ? (
              <img
                src={mediaUrl(content.coverImage.url)}
                alt='Cover'
                className='h-56 w-full object-cover sm:h-72'
              />
            ) : (
              <div className='flex h-44 flex-col items-center justify-center gap-2 text-[#7A6F5A]'>
                <ImagePlus size={22} />
                <span className='text-sm font-medium'>Add a cover image</span>
                <span className='text-xs'>JPG, PNG, or WebP</span>
              </div>
            )}
            <span className='pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/40 text-sm font-semibold text-white group-hover:flex'>
              Change cover
            </span>
          </button>

          <input
            ref={fileRef}
            type='file'
            accept='image/jpeg,image/png,image/gif,image/webp'
            className='hidden'
            onChange={handleFile}
          />

          <textarea
            value={content.title || ''}
            disabled={disabled}
            onChange={(event) => patch({ title: event.target.value })}
            placeholder='Product title'
            rows={2}
            className='w-full resize-none bg-transparent text-4xl font-semibold leading-tight text-[#1A1610] outline-none placeholder:text-[#C4B79E]'
          />
          <textarea
            value={content.subtitle || ''}
            disabled={disabled}
            onChange={(event) => patch({ subtitle: event.target.value })}
            placeholder='Subtitle'
            rows={1}
            className='mt-2 w-full resize-none bg-transparent text-lg italic text-[#6B6253] outline-none placeholder:text-[#C4B79E]'
          />
          <textarea
            value={content.description || ''}
            disabled={disabled}
            onChange={(event) => patch({ description: event.target.value })}
            placeholder='Short sales description'
            rows={2}
            className='mt-4 w-full resize-none bg-transparent text-sm leading-6 text-[#4A4338] outline-none placeholder:text-[#C4B79E]'
          />

          <div className='mt-4 flex flex-wrap gap-2'>
            {(content.features || []).map((feature, index) => (
              <span
                key={`feature-${index}`}
                className='inline-flex items-center gap-1 rounded-full border border-[#D8CDB6] bg-white/40 pl-3 pr-1'
              >
                <input
                  value={feature}
                  disabled={disabled}
                  onChange={(event) => {
                    const features = [...(content.features || [])]
                    features[index] = event.target.value
                    patch({ features })
                  }}
                  className='w-28 bg-transparent py-1 text-xs text-[#4A4338] outline-none sm:w-40'
                />
                <button
                  type='button'
                  onClick={() =>
                    patch({
                      features: (content.features || []).filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                  className='flex h-5 w-5 items-center justify-center rounded-full text-[#7A6F5A] hover:bg-black/10'
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              type='button'
              disabled={disabled}
              onClick={() => patch({ features: [...(content.features || []), 'New feature'] })}
              className='rounded-full border border-dashed border-[#D8CDB6] px-3 py-1 text-xs text-[#7A6F5A]'
            >
              + feature
            </button>
          </div>

          <div className='mt-10 space-y-1'>
            {blocks.map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={() => setDragId(block.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onDropReorder(block.id)}
                onClick={() => setSelectedId(block.id)}
                className={`group relative rounded-lg py-2 pl-7 pr-8 ${
                  selectedId === block.id ? 'bg-[#EFE6D4]' : 'hover:bg-[#F0E8D6]/80'
                }`}
              >
                <span className='absolute left-1 top-3 cursor-grab text-[#C4B79E] opacity-0 group-hover:opacity-100'>
                  <GripVertical size={14} />
                </span>
                <button
                  type='button'
                  onClick={(event) => {
                    event.stopPropagation()
                    removeBlock(block.id)
                  }}
                  className='absolute right-1 top-2 hidden h-6 w-6 items-center justify-center rounded-full bg-[#1A1610] text-white group-hover:flex'
                >
                  <Trash2 size={11} />
                </button>

                {block.type === 'heading' && (
                  <input
                    value={block.text || ''}
                    disabled={disabled}
                    onFocus={() => setSelectedId(block.id)}
                    onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                    className={`w-full bg-transparent font-semibold text-[#1A1610] outline-none ${
                      block.level === 1 ? 'text-3xl' : block.level === 3 ? 'text-lg' : 'text-2xl'
                    }`}
                    style={{ textAlign: block.align || 'left' }}
                  />
                )}

                {block.type === 'text' && (
                  <TextBlock
                    html={block.html}
                    align={block.align}
                    onFocus={() => setSelectedId(block.id)}
                    onChange={(html) => updateBlock(block.id, { html })}
                  />
                )}

                {block.type === 'quote' && (
                  <textarea
                    value={block.text || ''}
                    disabled={disabled}
                    onFocus={() => setSelectedId(block.id)}
                    onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                    className='w-full resize-none border-l-2 border-[#D4AF37] bg-transparent pl-4 text-lg italic text-[#5A5144] outline-none'
                    rows={2}
                  />
                )}

                {block.type === 'list' && (
                  <ul className='space-y-2'>
                    {(block.items || []).map((item, itemIndex) => (
                      <li key={item.id} className='flex items-start gap-2'>
                        {block.style === 'check' ? (
                          <input
                            type='checkbox'
                            checked={Boolean(item.checked)}
                            onChange={(event) => {
                              const items = [...block.items]
                              items[itemIndex] = { ...item, checked: event.target.checked }
                              updateBlock(block.id, { items })
                            }}
                            className='mt-1.5'
                          />
                        ) : (
                          <span className='mt-1 text-sm text-[#7A6F5A]'>•</span>
                        )}
                        <input
                          value={item.text || ''}
                          disabled={disabled}
                          onChange={(event) => {
                            const items = [...block.items]
                            items[itemIndex] = { ...item, text: event.target.value }
                            updateBlock(block.id, { items })
                          }}
                          className='flex-1 bg-transparent text-[15px] leading-7 outline-none'
                        />
                      </li>
                    ))}
                    <button
                      type='button'
                      onClick={() =>
                        updateBlock(block.id, {
                          items: [...(block.items || []), { id: uid(), text: '', checked: false }],
                        })
                      }
                      className='text-xs text-[#7A6F5A]'
                    >
                      + item
                    </button>
                  </ul>
                )}

                {block.type === 'image' && (
                  <figure>
                    <button
                      type='button'
                      className='block w-full'
                      onClick={() => {
                        setSelectedId(block.id)
                        pickImage('replace')
                      }}
                    >
                      <img
                        src={mediaUrl(block.imageUrl)}
                        alt={block.caption || 'Product image'}
                        className='max-h-96 w-full rounded-lg object-cover'
                      />
                    </button>
                    <input
                      value={block.caption || ''}
                      disabled={disabled}
                      onChange={(event) => updateBlock(block.id, { caption: event.target.value })}
                      placeholder='Caption — click the image to replace it'
                      className='mt-2 w-full bg-transparent text-center text-xs italic text-[#7A6F5A] outline-none'
                    />
                  </figure>
                )}

                {block.type === 'divider' && <hr className='border-[#D8CDB6]' />}
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  )
}

export default ProductDocumentEditor
