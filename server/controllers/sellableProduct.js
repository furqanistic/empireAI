import crypto from 'crypto'
import mongoose from 'mongoose'
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
const DEFAULT_COMMISSION_RATE = 40

const completedPurchases = (digitalProduct) =>
  (digitalProduct?.purchases || []).filter((p) => p.status === 'completed')

// Sales figures for one product, derived from the linked DigitalProduct.
const statsFor = (digitalProduct) => {
  const purchases = completedPurchases(digitalProduct)
  const affiliatePurchases = purchases.filter((p) => p.affiliate)
  const revenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0)
  const affiliateRevenue = affiliatePurchases.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  )
  const commissionOwed = affiliatePurchases.reduce(
    (sum, p) => sum + (p.commissionAmount || 0),
    0
  )
  const views = digitalProduct?.views || 0
  return {
    sales: purchases.length,
    revenue,
    affiliateSales: affiliatePurchases.length,
    affiliateRevenue,
    commissionOwed: commissionOwed / 100,
    views,
    conversionRate: views > 0 ? Number(((purchases.length / views) * 100).toFixed(1)) : 0,
    lastSaleAt: purchases.length
      ? purchases.reduce(
          (latest, p) =>
            !latest || new Date(p.purchasedAt) > new Date(latest)
              ? p.purchasedAt
              : latest,
          null
        )
      : null,
  }
}

const commissionRateFor = (user) => {
  const rate = Number(user?.affiliateProgram?.commissionRate)
  return Number.isFinite(rate) ? rate : DEFAULT_COMMISSION_RATE
}

const isPopulated = (value) =>
  value && typeof value === 'object' && !(value instanceof mongoose.Types.ObjectId)

const serialize = (doc) => {
  const linked = isPopulated(doc.digitalProduct) ? doc.digitalProduct : null
  return {
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
    digitalProductId: linked ? linked._id : doc.digitalProduct,
    revisionCount: doc.revisionNotes?.length || 0,
    stats: linked ? statsFor(linked) : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

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
      .limit(24)
      .populate('digitalProduct', 'views purchases')

    const serialized = products.map(serialize)
    const totals = serialized.reduce(
      (acc, product) => {
        if (product.status === 'published') acc.published += 1
        if (product.stats) {
          acc.sales += product.stats.sales
          acc.revenue += product.stats.revenue
          acc.affiliateSales += product.stats.affiliateSales
          acc.commissionOwed += product.stats.commissionOwed
        }
        return acc
      },
      { published: 0, sales: 0, revenue: 0, affiliateSales: 0, commissionOwed: 0 }
    )

    res.status(200).json({
      status: 'success',
      data: {
        products: serialized,
        totals,
        commissionRate: commissionRateFor(req.user),
        programName: req.user.affiliateProgram?.name || '',
      },
    })
  } catch (error) {
    next(createError(500, 'Failed to load products'))
  }
}

// Sales + affiliate breakdown for one published product.
export const getSellableProductPerformance = async (req, res, next) => {
  try {
    const product = await SellableProduct.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate({
      path: 'digitalProduct',
      select: 'views purchases',
      populate: { path: 'purchases.affiliate', select: 'name email referralCode' },
    })
    if (!product) return next(createError(404, 'Product not found'))

    const linked = isPopulated(product.digitalProduct) ? product.digitalProduct : null
    const purchases = completedPurchases(linked)

    const byAffiliate = new Map()
    purchases.forEach((purchase) => {
      if (!purchase.affiliate) return
      const affiliate = purchase.affiliate
      const key = String(affiliate._id || affiliate)
      const entry = byAffiliate.get(key) || {
        id: key,
        name: affiliate.name || 'Affiliate',
        email: affiliate.email || '',
        referralCode: affiliate.referralCode || purchase.referralCode || '',
        sales: 0,
        revenue: 0,
        commission: 0,
        lastSaleAt: null,
      }
      entry.sales += 1
      entry.revenue += purchase.amount || 0
      entry.commission += (purchase.commissionAmount || 0) / 100
      if (!entry.lastSaleAt || new Date(purchase.purchasedAt) > new Date(entry.lastSaleAt)) {
        entry.lastSaleAt = purchase.purchasedAt
      }
      byAffiliate.set(key, entry)
    })

    const recentSales = [...purchases]
      .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
      .slice(0, 8)
      .map((purchase) => ({
        id: purchase._id,
        customerName: purchase.name,
        amount: purchase.amount,
        purchasedAt: purchase.purchasedAt,
        affiliateName: purchase.affiliate?.name || null,
        commission: (purchase.commissionAmount || 0) / 100,
      }))

    res.status(200).json({
      status: 'success',
      data: {
        stats: linked ? statsFor(linked) : statsFor(null),
        affiliates: [...byAffiliate.values()].sort((a, b) => b.revenue - a.revenue),
        recentSales,
        commissionRate: commissionRateFor(req.user),
      },
    })
  } catch (error) {
    next(createError(500, 'Failed to load product performance'))
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
    const commissionRate = commissionRateFor(req.user)

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
        invitationMessage: `Promote "${product.content.title}" ($${price}) and earn ${commissionRate}% on every sale made through your tracking link. Your link: ${salesUrl}?ref=YOUR-CODE (use the code shown on your Affiliates page).`,
        commissionRate,
      },
    })
  } catch (error) {
    next(createError(500, error.message || 'Failed to create the affiliate link'))
  }
}
