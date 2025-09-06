// File: controllers/digitalProduct.js
import fs from 'fs'
import path from 'path'
import { createError } from '../error.js'
import DigitalProduct from '../models/DigitalProduct.js'

// Helper function to convert bytes to human readable format
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Create a new digital product
export const createDigitalProduct = async (req, res, next) => {
  try {
    const { name, description, category, price, type, features, tags } =
      req.body

    // Validate required fields
    if (!name || !description || !price) {
      return next(createError(400, 'Name, description, and price are required'))
    }

    // Validate price
    if (isNaN(price) || price < 0) {
      return next(createError(400, 'Price must be a valid positive number'))
    }

    // Create the product
    const productData = {
      name: name.trim(),
      description: description.trim(),
      category: category || 'Course',
      price: parseFloat(price),
      type: type || 'digital',
      creator: req.user._id,
      features: features ? features.filter((f) => f.trim()) : [],
      tags: tags ? tags.filter((t) => t.trim()) : [],
    }

    const product = new DigitalProduct(productData)
    await product.save()

    // Populate creator info for response
    await product.populate('creator', 'name email')

    res.status(201).json({
      status: 'success',
      data: {
        product,
      },
    })
  } catch (error) {
    console.error('Error creating digital product:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message)
      return next(createError(400, messages.join('. ')))
    }
    next(createError(500, 'Failed to create product'))
  }
}

// Get all products for the authenticated user
export const getUserDigitalProducts = async (req, res, next) => {
  try {
    const { category, search, published, page = 1, limit = 10 } = req.query

    const filters = {
      category: category !== 'all' ? category : undefined,
      search,
      published: published !== undefined ? published === 'true' : undefined,
    }

    // Remove undefined values
    Object.keys(filters).forEach(
      (key) => filters[key] === undefined && delete filters[key]
    )

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const products = await DigitalProduct.getUserProducts(req.user._id, filters)
      .skip(skip)
      .limit(limitNum)

    const totalProducts = await DigitalProduct.countDocuments({
      creator: req.user._id,
      isDeleted: false,
      ...(filters.category && {
        category:
          filters.category.charAt(0).toUpperCase() + filters.category.slice(1),
      }),
      ...(filters.published !== undefined && { published: filters.published }),
      ...(filters.search && {
        $or: [
          { name: { $regex: filters.search, $options: 'i' } },
          { description: { $regex: filters.search, $options: 'i' } },
        ],
      }),
    })

    // Calculate stats
    const stats = await DigitalProduct.aggregate([
      { $match: { creator: req.user._id, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalRevenue: { $sum: '$revenue' },
          publishedProducts: {
            $sum: { $cond: [{ $eq: ['$published', true] }, 1, 0] },
          },
          totalSales: { $sum: '$sales' },
        },
      },
    ])

    const productStats = stats[0] || {
      totalProducts: 0,
      totalRevenue: 0,
      publishedProducts: 0,
      totalSales: 0,
    }

    res.status(200).json({
      status: 'success',
      results: products.length,
      totalResults: totalProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
      data: {
        products,
        stats: productStats,
      },
    })
  } catch (error) {
    console.error('Error getting user products:', error)
    next(createError(500, 'Failed to retrieve products'))
  }
}

// Get a specific product by ID (for the owner)
export const getDigitalProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    const product = await DigitalProduct.findOne({
      _id: id,
      creator: req.user._id,
      isDeleted: false,
    }).populate('creator', 'name email')

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    })
  } catch (error) {
    console.error('Error getting product:', error)
    next(createError(500, 'Failed to retrieve product'))
  }
}

// Update a digital product
export const updateDigitalProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      category,
      price,
      type,
      features,
      tags,
      published,
    } = req.body

    const product = await DigitalProduct.findOne({
      _id: id,
      creator: req.user._id,
      isDeleted: false,
    })

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    // Validate price if provided
    if (price !== undefined && (isNaN(price) || price < 0)) {
      return next(createError(400, 'Price must be a valid positive number'))
    }

    // Update fields
    if (name !== undefined) product.name = name.trim()
    if (description !== undefined) product.description = description.trim()
    if (category !== undefined) product.category = category
    if (price !== undefined) product.price = parseFloat(price)
    if (type !== undefined) product.type = type
    if (published !== undefined) product.published = published
    if (features !== undefined)
      product.features = features.filter((f) => f.trim())
    if (tags !== undefined) product.tags = tags.filter((t) => t.trim())

    await product.save()
    await product.populate('creator', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        product,
      },
    })
  } catch (error) {
    console.error('Error updating product:', error)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message)
      return next(createError(400, messages.join('. ')))
    }
    next(createError(500, 'Failed to update product'))
  }
}

// Toggle product published status
export const toggleProductPublished = async (req, res, next) => {
  try {
    const { id } = req.params

    const product = await DigitalProduct.findOne({
      _id: id,
      creator: req.user._id,
      isDeleted: false,
    })

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    product.published = !product.published
    await product.save()

    res.status(200).json({
      status: 'success',
      data: {
        product: {
          _id: product._id,
          published: product.published,
          checkoutUrl: product.checkoutUrl,
        },
      },
    })
  } catch (error) {
    console.error('Error toggling product status:', error)
    next(createError(500, 'Failed to update product status'))
  }
}

// Delete a digital product (soft delete)
export const deleteDigitalProduct = async (req, res, next) => {
  try {
    const { id } = req.params

    const product = await DigitalProduct.findOne({
      _id: id,
      creator: req.user._id,
      isDeleted: false,
    })

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    await product.softDelete()

    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    next(createError(500, 'Failed to delete product'))
  }
}

// Upload files for a product
export const uploadProductFiles = async (req, res, next) => {
  try {
    const { id } = req.params

    const product = await DigitalProduct.findOne({
      _id: id,
      creator: req.user._id,
      isDeleted: false,
    })

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    if (!req.files || req.files.length === 0) {
      return next(createError(400, 'No files uploaded'))
    }

    // Process uploaded files
    const newFiles = req.files.map((file) => ({
      name: file.filename,
      originalName: file.originalname,
      type: path.extname(file.originalname).slice(1).toLowerCase(),
      size: formatFileSize(file.size),
      path: file.path,
      mimeType: file.mimetype,
    }))

    // Add files to product
    product.files.push(...newFiles)
    await product.save()

    res.status(200).json({
      status: 'success',
      data: {
        files: newFiles,
        totalFiles: product.files.length,
      },
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    next(createError(500, 'Failed to upload files'))
  }
}

// Delete a file from a product
export const deleteProductFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params

    const product = await DigitalProduct.findOne({
      _id: id,
      creator: req.user._id,
      isDeleted: false,
    })

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    const fileIndex = product.files.findIndex(
      (file) => file._id.toString() === fileId
    )

    if (fileIndex === -1) {
      return next(createError(404, 'File not found'))
    }

    const file = product.files[fileIndex]

    // Delete physical file
    try {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    } catch (fsError) {
      console.error('Error deleting physical file:', fsError)
      // Continue with database cleanup even if file deletion fails
    }

    // Remove file from product
    product.files.splice(fileIndex, 1)
    await product.save()

    res.status(204).json({
      status: 'success',
      data: null,
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    next(createError(500, 'Failed to delete file'))
  }
}

// Download a file (for the product owner)
export const downloadProductFile = async (req, res, next) => {
  try {
    const { id, fileId } = req.params

    const product = await DigitalProduct.findOne({
      _id: id,
      creator: req.user._id,
      isDeleted: false,
    })

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    const file = product.files.find((file) => file._id.toString() === fileId)

    if (!file) {
      return next(createError(404, 'File not found'))
    }

    // Check if file exists
    if (!fs.existsSync(file.path)) {
      return next(createError(404, 'File not found on server'))
    }

    // Set headers for download
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`
    )
    res.setHeader('Content-Type', file.mimeType)

    // Send file
    res.sendFile(path.resolve(file.path))
  } catch (error) {
    console.error('Error downloading file:', error)
    next(createError(500, 'Failed to download file'))
  }
}

// File: controllers/digitalProduct.js - FIXED getPublicProduct with safety checks

export const getPublicProduct = async (req, res, next) => {
  try {
    // DEBUG: Log all request information
    console.log('=== getPublicProduct DEBUG ===')
    console.log('req.params:', req.params)
    console.log('req.url:', req.url)
    console.log('req.originalUrl:', req.originalUrl)
    console.log('req.path:', req.path)

    // Try multiple ways to get the identifier
    const { slug } = req.params
    const { identifier } = req.params
    const { id } = req.params

    console.log('slug from params:', slug)
    console.log('identifier from params:', identifier)
    console.log('id from params:', id)

    // Get identifier from any available source
    const productIdentifier = slug || identifier || id

    console.log('Final productIdentifier:', productIdentifier)
    console.log('productIdentifier type:', typeof productIdentifier)

    // FIXED: Add safety check for undefined identifier
    if (!productIdentifier) {
      console.error('No product identifier found in request params')
      console.error('Available params:', Object.keys(req.params))
      return next(createError(400, 'Product identifier is required'))
    }

    console.log('Getting public product with identifier:', productIdentifier)

    let product

    // FIXED: Check if it's a valid MongoDB ObjectId with proper validation
    if (
      productIdentifier &&
      typeof productIdentifier === 'string' &&
      productIdentifier.match(/^[0-9a-fA-F]{24}$/)
    ) {
      // It's a valid MongoDB ObjectId
      console.log('Searching by MongoDB ID:', productIdentifier)
      product = await DigitalProduct.findOne({
        _id: productIdentifier,
        published: true,
        isDeleted: false,
      }).populate('creator', 'name email')
    } else if (productIdentifier && typeof productIdentifier === 'string') {
      // It's a slug
      console.log('Searching by slug:', productIdentifier)
      product = await DigitalProduct.getPublicProduct(productIdentifier)
    }

    if (!product) {
      console.log('Product not found for identifier:', productIdentifier)
      return next(createError(404, 'Product not found or not available'))
    }

    console.log('Product found:', product.name)

    // Increment view count
    product.views += 1
    product.lastViewedAt = new Date()
    await product.save()

    // Don't expose sensitive data in public view
    const publicProduct = product.toObject()

    // Only include safe file information
    publicProduct.files = publicProduct.files.map((file) => ({
      _id: file._id, // Include file ID for download purposes
      name: file.name,
      originalName: file.originalName,
      type: file.type,
      size: file.size,
    }))

    // Remove sensitive creator information
    if (publicProduct.creator) {
      publicProduct.creator = {
        name: publicProduct.creator.name,
        // Don't expose email in public view
      }
    }

    console.log('Returning product successfully')

    res.status(200).json({
      status: 'success',
      data: {
        product: publicProduct,
      },
    })
  } catch (error) {
    console.error('Error getting public product:', error)
    next(createError(500, 'Failed to retrieve product'))
  }
}

// Admin: Get all digital products
export const getAllDigitalProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, published } = req.query

    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const filter = { isDeleted: false }
    if (category && category !== 'all') {
      filter.category = category.charAt(0).toUpperCase() + category.slice(1)
    }
    if (published !== undefined) {
      filter.published = published === 'true'
    }

    const products = await DigitalProduct.find(filter)
      .populate('creator', 'name email')
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 })

    const totalProducts = await DigitalProduct.countDocuments(filter)

    // Get platform stats
    const platformStats = await DigitalProduct.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalRevenue: { $sum: '$revenue' },
          totalSales: { $sum: '$sales' },
          publishedProducts: {
            $sum: { $cond: [{ $eq: ['$published', true] }, 1, 0] },
          },
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      results: products.length,
      totalResults: totalProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
      data: {
        products,
        platformStats: platformStats[0] || {
          totalProducts: 0,
          totalRevenue: 0,
          totalSales: 0,
          publishedProducts: 0,
        },
      },
    })
  } catch (error) {
    console.error('Error getting all products:', error)
    next(createError(500, 'Failed to retrieve products'))
  }
}
