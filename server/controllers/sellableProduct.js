import crypto from 'crypto'
import { createError } from '../error.js'
import DigitalProduct from '../models/DigitalProduct.js'
import SellableProduct from '../models/SellableProduct.js'
import {
  buildPdfBuffer,
  categoryForType,
  formatFileSize,
  generateSellableContent,
  reviseSellableContent,
  sanitizeEditorContent,
  writeProductPdf,
} from '../services/sellableProductService.js'

const TYPES = ['ebook', 'guide', 'checklist', 'workbook']

const serialize = (doc) => ({
  id: doc._id,
  productType: doc.productType,
  topic: doc.topic,
  audience: doc.audience,
  extraPrompt: doc.extraPrompt,
  content: doc.content,
  price: doc.price,
  status: doc.status,
  salesUrl: doc.salesUrl,
  affiliateUrl: doc.affiliateUrl,
  digitalProductId: doc.digitalProduct,
  revisionCount: doc.revisionNotes?.length || 0,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
})

const ensureReferralCode = async (user) => {
  if (user.referralCode) return user.referralCode
  const code = crypto.randomBytes(4).toString('hex').toUpperCase()
  user.referralCode = code
  await user.save()
  return code
}

const frontendBase = () =>
  (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')

export const generateSellableProduct = async (req, res, next) => {
  try {
    const topic = String(req.body.topic || '').trim()
    const productType = TYPES.includes(req.body.productType)
      ? req.body.productType
      : ''
    const audience = String(req.body.audience || '').trim().slice(0, 160)
    const extraPrompt = String(req.body.extraPrompt || '').trim().slice(0, 2000)

    if (!productType) {
      return next(createError(400, 'Choose a product type'))
    }
    if (topic.length < 4) {
      return next(createError(400, 'Enter a topic of at least 4 characters'))
    }

    const content = await generateSellableContent({
      productType,
      topic,
      audience,
      extraPrompt,
    })

    const product = await SellableProduct.create({
      user: req.user._id,
      productType,
      topic,
      audience,
      extraPrompt,
      content,
      price: content.suggestedPrice,
      status: 'ready',
    })

    res.status(201).json({
      status: 'success',
      data: { product: serialize(product) },
    })
  } catch (error) {
    next(createError(500, error.message || 'Failed to generate the product'))
  }
}

export const listSellableProducts = async (req, res, next) => {
  try {
    const products = await SellableProduct.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .limit(12)

    res.status(200).json({
      status: 'success',
      data: { products: products.map(serialize) },
    })
  } catch (error) {
    next(createError(500, 'Failed to load products'))
  }
}

export const getSellableProduct = async (req, res, next) => {
  try {
    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!product) return next(createError(404, 'Product not found'))

    res.status(200).json({
      status: 'success',
      data: { product: serialize(product) },
    })
  } catch (error) {
    next(createError(500, 'Failed to load the product'))
  }
}

export const reviseSellableProduct = async (req, res, next) => {
  try {
    const prompt = String(req.body.prompt || '').trim()
    if (prompt.length < 3) {
      return next(createError(400, 'Describe the change you want'))
    }

    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!product) return next(createError(404, 'Product not found'))
    if (!product.content?.title) {
      return next(createError(400, 'Generate a product before making changes'))
    }

    const content = await reviseSellableContent({
      content: product.content,
      productType: product.productType,
      prompt,
    })
    content.coverImage = product.content.coverImage
    const imageBlocks = (product.content.blocks || []).filter((block) => block.type === 'image')
    if (imageBlocks.length) {
      content.blocks = [...content.blocks, ...imageBlocks]
    }

    product.content = content
    product.price = content.suggestedPrice
    product.revisionNotes.push({ prompt })
    product.status = product.digitalProduct ? 'published' : 'ready'
    product.markModified('content')
    await product.save()

    res.status(200).json({
      status: 'success',
      data: { product: serialize(product) },
    })
  } catch (error) {
    next(createError(500, error.message || 'Failed to update the product'))
  }
}

export const saveSellableContent = async (req, res, next) => {
  try {
    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!product) return next(createError(404, 'Product not found'))

    product.content = sanitizeEditorContent(req.body.content || req.body, product.content)
    product.price = Number(req.body.price ?? product.price) || product.price
    product.status = product.digitalProduct ? 'published' : 'ready'
    product.markModified('content')
    await product.save()

    res.status(200).json({
      status: 'success',
      data: { product: serialize(product) },
    })
  } catch (error) {
    next(createError(400, error.message || 'Failed to save the document'))
  }
}

export const uploadSellableImage = async (req, res, next) => {
  try {
    if (!req.file) return next(createError(400, 'Choose an image to upload'))

    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!product) return next(createError(404, 'Product not found'))

    const url = `/uploads/products/${req.user._id}/${req.file.filename}`
    const image = {
      url,
      path: req.file.path,
      name: req.file.originalname,
    }

    res.status(201).json({
      status: 'success',
      data: { image },
    })
  } catch (error) {
    next(createError(500, 'Failed to upload the image'))
  }
}

export const updateSellablePrice = async (req, res, next) => {
  try {
    const price = Number(req.body.price)
    if (!Number.isFinite(price) || price < 0 || price > 99999) {
      return next(createError(400, 'Enter a valid price'))
    }

    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!product) return next(createError(404, 'Product not found'))

    product.price = Math.round(price * 100) / 100
    await product.save()

    res.status(200).json({
      status: 'success',
      data: { product: serialize(product) },
    })
  } catch (error) {
    next(createError(500, 'Failed to update the price'))
  }
}

export const downloadSellablePdf = async (req, res, next) => {
  try {
    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!product?.content?.title) {
      return next(createError(404, 'Product not found'))
    }

    const buffer = await buildPdfBuffer(product.content, product.productType)
    const filename = `${(product.content.title || 'product')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .slice(0, 40)}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (error) {
    next(createError(500, 'Failed to create the PDF'))
  }
}

export const publishSellableProduct = async (req, res, next) => {
  try {
    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
    if (!product?.content?.title) {
      return next(createError(404, 'Product not found'))
    }

    const price = Number(req.body.price ?? product.price)
    if (!Number.isFinite(price) || price < 0) {
      return next(createError(400, 'Enter a valid price'))
    }

    const file = await writeProductPdf(
      req.user._id,
      product.content,
      product.productType
    )
    const fileRecord = {
      name: file.filename,
      originalName: `${product.content.title}.pdf`,
      type: 'pdf',
      size: formatFileSize(file.sizeBytes),
      path: file.filePath,
      mimeType: 'application/pdf',
    }

    let digitalProduct = product.digitalProduct
      ? await DigitalProduct.findOne({
          _id: product.digitalProduct,
          creator: req.user._id,
          isDeleted: false,
        })
      : null

    if (digitalProduct) {
      digitalProduct.name = product.content.title
      digitalProduct.description = product.content.description
      digitalProduct.category = categoryForType(product.productType)
      digitalProduct.price = price
      digitalProduct.features = product.content.features || []
      digitalProduct.tags = product.content.tags || []
      digitalProduct.published = true
      digitalProduct.files = [fileRecord]
      await digitalProduct.save()
    } else {
      digitalProduct = await DigitalProduct.create({
        name: product.content.title,
        description: product.content.description,
        category: categoryForType(product.productType),
        price,
        type: 'digital',
        published: true,
        creator: req.user._id,
        features: product.content.features || [],
        tags: product.content.tags || [],
        files: [fileRecord],
      })
    }

    const referralCode = await ensureReferralCode(req.user)
    const origin = frontendBase()
    const salesUrl = `${origin}/product/checkout/${digitalProduct.slug || digitalProduct._id}`
    const affiliateUrl = `${salesUrl}?ref=${encodeURIComponent(referralCode)}`
    const commissionRate = Number.isFinite(
      Number(req.user.affiliateProgram?.commissionRate)
    )
      ? Number(req.user.affiliateProgram.commissionRate)
      : 40

    product.price = price
    product.digitalProduct = digitalProduct._id
    product.salesUrl = salesUrl
    product.affiliateUrl = affiliateUrl
    product.status = 'published'
    await product.save()

    res.status(200).json({
      status: 'success',
      data: {
        product: serialize(product),
        invitationMessage: `Promote "${product.content.title}" and earn ${commissionRate}% when someone buys through your link: ${affiliateUrl}`,
        commissionRate,
      },
    })
  } catch (error) {
    next(createError(500, error.message || 'Failed to create the affiliate link'))
  }
}
