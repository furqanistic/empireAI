import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const TYPES = ['ebook', 'guide', 'checklist', 'workbook']

const TYPE_GUIDE = {
  ebook: {
    label: 'ebook / PDF book',
    chapters: '5 to 7 chapters',
    length: 'each chapter 180 to 280 words of useful, specific teaching',
  },
  guide: {
    label: 'short practical PDF guide',
    chapters: '4 to 6 sections',
    length: 'each section 140 to 220 words with clear steps',
  },
  checklist: {
    label: 'printable checklist PDF',
    chapters: '6 to 10 groups',
    length: 'each group has a short intro and 4 to 8 checkbox items',
  },
  workbook: {
    label: 'fill-in workbook PDF',
    chapters: '5 sections',
    length: 'each section has teaching plus 3 to 5 prompts or exercises',
  },
}

const parseJson = (raw) => {
  if (!raw || typeof raw !== 'string') {
    throw new Error('The AI returned an empty product')
  }

  const cleaned = raw
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) {
    throw new Error('The AI did not return a valid product')
  }

  return JSON.parse(cleaned.slice(start, end + 1))
}

const cleanText = (value, maxLength = 8000) => {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

const cleanList = (value, maxItems = 8, maxLength = 120) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => cleanText(String(item), maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

const escapeHtml = (value) =>
  String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

export const newBlockId = () =>
  `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

export const htmlToPlain = (html) =>
  String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

export const sectionsToBlocks = (sections) => {
  const blocks = []
  for (const section of sections || []) {
    blocks.push({
      id: newBlockId(),
      type: 'heading',
      level: 2,
      text: section.heading,
      align: 'left',
    })
    if (section.content) {
      section.content
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean)
        .forEach((part) => {
          blocks.push({
            id: newBlockId(),
            type: 'text',
            html: `<p>${escapeHtml(part)}</p>`,
            align: 'left',
          })
        })
    }
    if (section.items?.length) {
      blocks.push({
        id: newBlockId(),
        type: 'list',
        style: 'check',
        align: 'left',
        items: section.items.map((text) => ({
          id: newBlockId(),
          text,
          checked: false,
        })),
      })
    }
  }
  return blocks
}

export const blocksToSections = (blocks) => {
  const sections = []
  let current = null

  for (const block of blocks || []) {
    if (block.type === 'heading') {
      if (current) sections.push(current)
      current = {
        heading: cleanText(block.text || 'Untitled', 120) || 'Untitled',
        content: '',
        items: [],
      }
      continue
    }
    if (!current) {
      current = { heading: 'Chapter', content: '', items: [] }
    }
    if (block.type === 'text' || block.type === 'quote') {
      const text = htmlToPlain(block.html || block.text)
      current.content = [current.content, text].filter(Boolean).join('\n\n')
    }
    if (block.type === 'list') {
      current.items.push(
        ...(block.items || []).map((item) => item.text || item).filter(Boolean)
      )
    }
  }

  if (current) sections.push(current)
  return sections.length
    ? sections
    : [{ heading: 'Product', content: '', items: [] }]
}

export const normalizeContent = (raw, productType) => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Generated product is incomplete')
  }

  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((section) => ({
          heading: cleanText(section?.heading || section?.title, 120),
          content: cleanText(section?.content || section?.body, 4000),
          items: cleanList(section?.items, 12, 180),
        }))
        .filter((section) => section.heading && (section.content || section.items.length))
        .slice(0, 12)
    : []

  if (sections.length < 3) {
    throw new Error('Generated product needs at least three sections')
  }

  const suggestedPrice = Number(raw.suggestedPrice)
  const price = Number.isFinite(suggestedPrice)
    ? Math.min(999, Math.max(5, Math.round(suggestedPrice)))
    : 19

  const title = cleanText(raw.title, 100)
  const description = cleanText(raw.description, 500)
  if (!title || !description) {
    throw new Error('Generated product is missing a title or description')
  }

  return {
    title,
    subtitle: cleanText(raw.subtitle, 160),
    description,
    suggestedPrice: price,
    features: cleanList(raw.features, 6, 90),
    tags: cleanList(raw.tags, 6, 24),
    productType,
    coverImage: raw.coverImage || { url: '', path: '', name: '' },
    sections,
    blocks: sectionsToBlocks(sections),
  }
}

const callGroq = async (system, user, maxTokens) => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  let lastError
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45_000)

    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: attempt === 1 ? 0.7 : 0.4,
          max_tokens: maxTokens,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(
          payload.error?.message || `Groq returned status ${response.status}`
        )
      }

      return parseJson(payload.choices?.[0]?.message?.content || '')
    } catch (error) {
      lastError =
        error.name === 'AbortError'
          ? new Error('The AI took too long to respond')
          : error
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error('Could not generate the product')
}

const buildGeneratePrompt = ({ productType, topic, audience, extraPrompt }) => {
  const guide = TYPE_GUIDE[productType]
  return `Create a complete, ready-to-sell ${guide.label}.

Topic: ${topic}
Audience: ${audience || 'beginners who want a practical result'}
Extra instructions: ${extraPrompt || 'None'}

Requirements:
- ${guide.chapters}
- ${guide.length}
- Specific, useful, and original. No filler, no guaranteed-income claims.
- Write in plain English.

Return JSON only with this shape:
{
  "title": "string",
  "subtitle": "string",
  "description": "string, max 400 characters, sales description",
  "suggestedPrice": 19,
  "features": ["string"],
  "tags": ["string"],
  "sections": [
    { "heading": "string", "content": "string", "items": ["optional bullet or checklist item"] }
  ]
}`
}

export const generateSellableContent = async (input) => {
  const productType = TYPES.includes(input.productType) ? input.productType : 'ebook'
  const raw = await callGroq(
    'You write complete digital products people can sell as PDFs. Return valid JSON only.',
    buildGeneratePrompt({ ...input, productType }),
    7000
  )
  return normalizeContent(raw, productType)
}

export const reviseSellableContent = async ({ content, productType, prompt }) => {
  const raw = await callGroq(
    'You edit an existing digital product. Apply the user request and return the full updated product as JSON only. Keep the same structure. Do not drop sections unless asked.',
    `Current product JSON:\n${JSON.stringify(content)}\n\nUser request:\n${prompt}\n\nReturn the complete updated product JSON with title, subtitle, description, suggestedPrice, features, tags, and sections.`,
    7000
  )
  return normalizeContent(raw, productType)
}

const decodeHtml = (value) =>
  String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')

const tokenizeHtml = (html) => {
  const source = String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<div[^>]*>/gi, '')

  const parts = []
  const tagRe = /<\/?(strong|b|em|i|u)[^>]*>/gi
  let last = 0
  let bold = false
  let italic = false
  let underline = false
  let match = tagRe.exec(source)
  while (match) {
    if (match.index > last) {
      parts.push({
        text: decodeHtml(source.slice(last, match.index).replace(/<[^>]+>/g, '')),
        bold,
        italic,
        underline,
      })
    }
    const closing = match[0].startsWith('</')
    const tag = match[1].toLowerCase()
    if (tag === 'strong' || tag === 'b') bold = !closing
    if (tag === 'em' || tag === 'i') italic = !closing
    if (tag === 'u') underline = !closing
    last = match.index + match[0].length
    match = tagRe.exec(source)
  }
  if (last < source.length) {
    parts.push({
      text: decodeHtml(source.slice(last).replace(/<[^>]+>/g, '')),
      bold,
      italic,
      underline,
    })
  }
  return parts.filter((part) => part.text)
}

const writeRichText = (doc, html, { width, align }) => {
  const parts = tokenizeHtml(html)
  if (!parts.length) {
    doc.font('Times-Roman').fontSize(12).fillColor('#222222').text(htmlToPlain(html), {
      width,
      align,
      lineGap: 4,
    })
    return
  }

  parts.forEach((part, index) => {
    const font =
      part.bold && part.italic
        ? 'Times-BoldItalic'
        : part.bold
          ? 'Times-Bold'
          : part.italic
            ? 'Times-Italic'
            : 'Times-Roman'
    doc.font(font).fontSize(12).fillColor('#222222').text(part.text, {
      width,
      align,
      lineGap: 4,
      underline: part.underline,
      continued: index < parts.length - 1,
    })
  })
}

const ensureSpace = (doc, needed = 80) => {
  const bottom = doc.page.height - doc.page.margins.bottom
  if (doc.y + needed > bottom) doc.addPage()
}

const drawImage = (doc, imagePath, contentWidth) => {
  if (!imagePath || !fs.existsSync(imagePath)) return
  try {
    ensureSpace(doc, 220)
    doc.image(imagePath, {
      fit: [contentWidth, 320],
      align: 'center',
    })
    doc.moveDown(0.8)
  } catch {
    // Skip unsupported image formats such as webp in PDFKit.
  }
}

export const buildPdfBuffer = (content, productType) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 56,
      size: 'A4',
      info: {
        Title: content.title,
        Author: 'AscndLabs',
        Subject: content.subtitle || content.description,
      },
    })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const contentWidth = doc.page.width - 112
    const gold = '#B8941F'
    const blocks = content.blocks?.length
      ? content.blocks
      : sectionsToBlocks(content.sections || [])

    doc.font('Times-Bold').fontSize(11).fillColor(gold).text('ASCNDLABS')
    doc.moveDown(1.2)
    drawImage(doc, content.coverImage?.path, contentWidth)
    doc.font('Times-Bold').fontSize(26).fillColor('#111111').text(content.title || 'Untitled', {
      width: contentWidth,
    })
    if (content.subtitle) {
      doc.moveDown(0.35)
      doc.font('Times-Italic').fontSize(13).fillColor('#444444').text(content.subtitle, {
        width: contentWidth,
      })
    }
    if (content.description) {
      doc.moveDown(0.7)
      doc.font('Times-Roman').fontSize(11).fillColor('#333333').text(content.description, {
        width: contentWidth,
        lineGap: 3,
      })
    }
    doc.moveDown(0.5)
    doc.fontSize(9).fillColor('#888888').text(TYPE_GUIDE[productType]?.label || 'PDF')

    blocks.forEach((block) => {
      if (block.type === 'heading') {
        doc.addPage()
        const size = block.level === 1 ? 22 : block.level === 3 ? 14 : 18
        doc.font('Times-Bold').fontSize(size).fillColor('#111111').text(block.text || '', {
          width: contentWidth,
          align: block.align || 'left',
        })
        doc.moveDown(0.6)
        return
      }

      if (block.type === 'text') {
        ensureSpace(doc, 60)
        writeRichText(doc, block.html, {
          width: contentWidth,
          align: block.align || 'left',
        })
        doc.moveDown(0.6)
        return
      }

      if (block.type === 'quote') {
        ensureSpace(doc, 70)
        doc.font('Times-Italic').fontSize(12).fillColor('#444444').text(block.text || htmlToPlain(block.html), {
          width: contentWidth,
          align: block.align || 'left',
        })
        doc.moveDown(0.7)
        return
      }

      if (block.type === 'list') {
        ;(block.items || []).forEach((item) => {
          ensureSpace(doc, 24)
          const mark = block.style === 'check' ? (item.checked ? '[x]  ' : '[ ]  ') : '•  '
          doc.font('Times-Roman').fontSize(12).fillColor('#222222').text(
            `${mark}${item.text || item}`,
            { width: contentWidth, lineGap: 3 }
          )
          doc.moveDown(0.2)
        })
        doc.moveDown(0.4)
        return
      }

      if (block.type === 'image') {
        drawImage(doc, block.imagePath, contentWidth)
        if (block.caption) {
          doc.font('Times-Italic').fontSize(9).fillColor('#666666').text(block.caption, {
            width: contentWidth,
            align: 'center',
          })
          doc.moveDown(0.6)
        }
        return
      }

      if (block.type === 'divider') {
        ensureSpace(doc, 24)
        doc.moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.margins.left + contentWidth, doc.y)
        doc.strokeColor('#CCCCCC').stroke()
        doc.moveDown(0.8)
      }
    })

    doc.end()
  })

const sanitizeHtml = (html) =>
  String(html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .slice(0, 20000)

export const sanitizeEditorContent = (incoming = {}, previous = {}) => {
  const title = cleanText(incoming.title || previous.title, 100)
  const description = cleanText(incoming.description || previous.description, 500)
  if (!title) throw new Error('Add a title before saving')

  const blocks = Array.isArray(incoming.blocks) ? incoming.blocks.slice(0, 80) : previous.blocks || []
  const cleanBlocks = blocks
    .map((block) => {
      const type = ['heading', 'text', 'list', 'image', 'quote', 'divider'].includes(block?.type)
        ? block.type
        : 'text'
      return {
        id: String(block.id || newBlockId()),
        type,
        text: cleanText(block.text, type === 'quote' ? 2000 : 200),
        html: sanitizeHtml(block.html),
        level: [1, 2, 3].includes(Number(block.level)) ? Number(block.level) : 2,
        align: ['left', 'center', 'right'].includes(block.align) ? block.align : 'left',
        style: block.style === 'check' || block.style === 'number' ? block.style : 'bullet',
        items: Array.isArray(block.items)
          ? block.items.slice(0, 20).map((item) => ({
              id: String(item.id || newBlockId()),
              text: cleanText(item.text || item, 240),
              checked: Boolean(item.checked),
            }))
          : [],
        imageUrl: String(block.imageUrl || '').slice(0, 500),
        imagePath: String(block.imagePath || '').slice(0, 500),
        caption: cleanText(block.caption, 160),
      }
    })
    .filter((block) => {
      if (block.type === 'image') return Boolean(block.imageUrl || block.imagePath)
      return Boolean(block)
    })

  return {
    title,
    subtitle: cleanText(incoming.subtitle || previous.subtitle, 160),
    description,
    suggestedPrice: previous.suggestedPrice || 19,
    features: cleanList(incoming.features ?? previous.features, 8, 90),
    tags: cleanList(incoming.tags ?? previous.tags, 8, 24),
    coverImage: incoming.coverImage || previous.coverImage || { url: '', path: '', name: '' },
    blocks: cleanBlocks,
    sections: blocksToSections(cleanBlocks),
  }
}

export const writeProductPdf = async (userId, content, productType) => {
  const buffer = await buildPdfBuffer(content, productType)
  const uploadPath = path.join(process.cwd(), 'uploads', 'products', userId.toString())
  fs.mkdirSync(uploadPath, { recursive: true })
  const safeName = (content.title || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const filename = `${safeName || 'product'}-${Date.now()}.pdf`
  const filePath = path.join(uploadPath, filename)
  fs.writeFileSync(filePath, buffer)
  return {
    buffer,
    filename,
    filePath,
    sizeBytes: buffer.length,
  }
}

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 Bytes'
  const units = ['Bytes', 'KB', 'MB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export const categoryForType = (productType) =>
  productType === 'checklist' ? 'Templates' : 'E-book'
