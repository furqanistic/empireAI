// File: controllers/digitalProductPayment.js - COMPLETE FILE

import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { stripe } from '../config/stripe.js'
import { createError } from '../error.js'
import DigitalProduct from '../models/DigitalProduct.js'
import User from '../models/User.js'
dotenv.config({ quiet: true })
// Create checkout session for a digital product
export const createProductCheckoutSession = async (req, res, next) => {
  try {
    // Accept multiple field names for backward compatibility
    const { productSlug, productIdentifier, slug, productId, customerInfo } =
      req.body

    // Support multiple field names that frontend might send
    const identifier = productSlug || productIdentifier || slug || productId

    if (!identifier) {
      return next(createError(400, 'Product identifier is required'))
    }

    if (
      !customerInfo ||
      !customerInfo.email ||
      !customerInfo.firstName ||
      !customerInfo.lastName
    ) {
      return next(
        createError(
          400,
          'Customer information (email, firstName, lastName) is required'
        )
      )
    }

    console.log('Creating checkout session for identifier:', identifier)

    // Try to get product by both MongoDB ID and slug
    let product

    // First try as MongoDB ID
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid MongoDB ObjectId
      product = await DigitalProduct.findOne({
        _id: identifier,
        published: true,
        isDeleted: false,
      }).populate('creator', 'name email')
    }

    // If not found, try as slug
    if (!product) {
      product = await DigitalProduct.getPublicProduct(identifier)
    }

    if (!product) {
      return next(createError(404, 'Product not found or not available'))
    }

    console.log('Product found for checkout:', product.name)

    // Create or get Stripe customer
    let customer
    try {
      // Try to find existing customer by email
      const existingCustomers = await stripe.customers.list({
        email: customerInfo.email,
        limit: 1,
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]

        // Update customer info if needed
        if (
          customer.name !== `${customerInfo.firstName} ${customerInfo.lastName}`
        ) {
          customer = await stripe.customers.update(customer.id, {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          })
        }
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: customerInfo.email,
          name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          metadata: {
            productId: product._id.toString(),
            productSlug: product.slug,
          },
        })
      }
    } catch (stripeError) {
      console.error('Stripe customer error:', stripeError)
      return next(createError(500, 'Failed to process customer information'))
    }

    console.log('Creating Stripe checkout session...')

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: product.name,
              description: product.description,
              metadata: {
                productId: product._id.toString(),
                creatorId: product.creator._id.toString(),
              },
            },
            unit_amount: Math.round(product.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/product/success?session_id={CHECKOUT_SESSION_ID}&product=${product._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/product/checkout/${product._id}?canceled=true`,
      metadata: {
        productId: product._id.toString(),
        productSlug: product.slug,
        creatorId: product.creator._id.toString(),
        customerEmail: customerInfo.email,
        customerFirstName: customerInfo.firstName,
        customerLastName: customerInfo.lastName,
      },
      billing_address_collection: 'auto',
      // REMOVED: shipping_address_collection (not needed for digital products)
      allow_promotion_codes: true,
      payment_intent_data: {
        metadata: {
          productId: product._id.toString(),
          customerEmail: customerInfo.email,
        },
      },
      // Additional settings for digital products
      invoice_creation: {
        enabled: true,
        invoice_data: {
          metadata: {
            productId: product._id.toString(),
            productName: product.name,
          },
        },
      },
    })

    console.log('Stripe checkout session created:', session.id)

    res.status(200).json({
      status: 'success',
      data: {
        sessionId: session.id,
        url: session.url,
        product: {
          name: product.name,
          price: product.price,
          slug: product.slug,
          _id: product._id,
        },
      },
    })
  } catch (error) {
    console.error('Error creating product checkout session:', error)

    // More specific error handling for Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return next(createError(400, `Stripe error: ${error.message}`))
    }

    next(
      createError(500, `Failed to create checkout session: ${error.message}`)
    )
  }
}

// Verify product checkout session and process purchase
export const verifyProductCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body

    if (!sessionId) {
      return next(createError(400, 'Session ID is required'))
    }

    console.log('Verifying checkout session:', sessionId)

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    })

    if (session.payment_status !== 'paid') {
      return next(createError(400, 'Payment not completed'))
    }

    console.log('Payment verified as completed')

    const {
      productId,
      productSlug,
      customerEmail,
      customerFirstName,
      customerLastName,
    } = session.metadata

    // Get the product
    const product = await DigitalProduct.findById(productId)

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    console.log('Product found:', product.name)

    // Check if this session was already processed
    const existingPurchase = product.purchases.find(
      (purchase) => purchase.stripeSessionId === sessionId
    )

    if (existingPurchase) {
      console.log('Purchase already processed for session:', sessionId)

      // Return existing purchase data
      return res.status(200).json({
        status: 'success',
        data: {
          purchase: existingPurchase,
          product: {
            name: product.name,
            slug: product.slug,
            _id: product._id,
            files: product.files.map((file) => ({
              _id: file._id,
              name: file.name,
              originalName: file.originalName,
              type: file.type,
              size: file.size,
            })),
          },
          downloadToken: generateDownloadToken(
            existingPurchase.user,
            productId
          ),
          message: 'Purchase already processed',
        },
      })
    }

    // Find existing user or create new one (handle duplicate email)
    let user = await User.findOne({ email: customerEmail })

    if (!user) {
      try {
        // Create a basic user account for the buyer
        user = new User({
          name: `${customerFirstName} ${customerLastName}`,
          email: customerEmail,
          password: 'temp_password_' + Date.now(), // Temporary password
          role: 'user',
        })
        await user.save()
        console.log('Created new user:', user.email)
      } catch (userCreateError) {
        // If user creation fails due to duplicate email, try to find existing user again
        if (userCreateError.code === 11000) {
          console.log('User already exists, finding existing user...')
          user = await User.findOne({ email: customerEmail })

          if (!user) {
            return next(
              createError(500, 'Failed to create or find user account')
            )
          }
        } else {
          throw userCreateError
        }
      }
    } else {
      console.log('Found existing user:', user.email)
    }

    // Create purchase record
    const purchaseData = {
      user: user._id,
      email: customerEmail,
      name: `${customerFirstName} ${customerLastName}`,
      amount: product.price,
      stripeSessionId: sessionId,
      stripePaymentIntentId: session.payment_intent.id,
      status: 'completed',
      purchasedAt: new Date(),
    }

    console.log('Adding purchase to product...')

    // Add purchase to product and update stats
    await product.addPurchase(purchaseData)

    console.log('Purchase added successfully')

    // Get the updated product with the new purchase
    const updatedProduct = await DigitalProduct.findById(productId).populate(
      'creator',
      'name email'
    )

    // Send success response with download access
    res.status(200).json({
      status: 'success',
      data: {
        purchase: purchaseData,
        product: {
          name: updatedProduct.name,
          slug: updatedProduct.slug,
          _id: updatedProduct._id,
          files: updatedProduct.files.map((file) => ({
            _id: file._id,
            name: file.name,
            originalName: file.originalName,
            type: file.type,
            size: file.size,
          })),
        },
        downloadToken: generateDownloadToken(user._id, productId),
        message: 'Purchase completed successfully',
      },
    })

    console.log('Purchase verification completed successfully')
  } catch (error) {
    console.error('Error verifying product checkout session:', error)
    next(
      createError(500, `Failed to verify checkout session: ${error.message}`)
    )
  }
}

// Generate a temporary download token
const generateDownloadToken = (userId, productId) => {
  const tokenData = `${userId}_${productId}_${Date.now()}`
  return crypto.createHash('sha256').update(tokenData).digest('hex')
}

// Download purchased product file
export const downloadPurchasedFile = async (req, res, next) => {
  try {
    const { productSlug, fileId } = req.params
    const { token, email } = req.query

    if (!token && !email) {
      return next(createError(400, 'Download token or email is required'))
    }

    console.log('Download request for:', {
      productSlug,
      fileId,
      email: email ? 'provided' : 'not provided',
    })

    // Get the product (handle both MongoDB ID and slug)
    let product
    if (productSlug.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB ID
      product = await DigitalProduct.findOne({
        _id: productSlug,
        published: true,
        isDeleted: false,
      })
    } else {
      // It's a slug
      product = await DigitalProduct.getPublicProduct(productSlug)
    }

    if (!product) {
      return next(createError(404, 'Product not found'))
    }

    // Find the file
    const file = product.files.find((f) => f._id.toString() === fileId)

    if (!file) {
      return next(createError(404, 'File not found'))
    }

    // Verify purchase access
    let hasAccess = false

    if (email) {
      // Check if email has purchased this product
      const purchase = product.purchases.find(
        (p) => p.email === email && p.status === 'completed'
      )
      hasAccess = !!purchase
      console.log('Access check by email:', hasAccess)
    }

    if (token && !hasAccess) {
      // For now, allow if token is provided (you can implement proper JWT verification)
      hasAccess = true
      console.log('Access granted by token')
    }

    if (!hasAccess) {
      return next(createError(403, 'Access denied. Purchase required.'))
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
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')

    // Send file
    res.sendFile(path.resolve(file.path))

    console.log('File download initiated for:', file.originalName)
  } catch (error) {
    console.error('Error downloading purchased file:', error)
    next(createError(500, 'Failed to download file'))
  }
}

// Get user's purchases
export const getUserPurchases = async (req, res, next) => {
  try {
    const userEmail = req.user?.email || req.query.email

    if (!userEmail) {
      return next(createError(400, 'Email is required'))
    }

    console.log('Getting purchases for email:', userEmail)

    // Find all products where this user has made a purchase
    const products = await DigitalProduct.find({
      'purchases.email': userEmail,
      'purchases.status': 'completed',
      isDeleted: false,
    }).populate('creator', 'name email')

    // Extract purchase information
    const purchases = []

    products.forEach((product) => {
      const userPurchases = product.purchases.filter(
        (p) => p.email === userEmail && p.status === 'completed'
      )

      userPurchases.forEach((purchase) => {
        purchases.push({
          _id: purchase._id,
          product: {
            _id: product._id,
            name: product.name,
            description: product.description,
            slug: product.slug,
            category: product.category,
            creator: product.creator,
            files: product.files.map((file) => ({
              _id: file._id,
              name: file.name,
              originalName: file.originalName,
              type: file.type,
              size: file.size,
            })),
          },
          amount: purchase.amount,
          status: purchase.status,
          purchasedAt: purchase.purchasedAt,
          stripeSessionId: purchase.stripeSessionId,
          email: purchase.email,
          name: purchase.name,
        })
      })
    })

    // Sort by purchase date (newest first)
    purchases.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))

    console.log(`Found ${purchases.length} purchases for user`)

    res.status(200).json({
      status: 'success',
      results: purchases.length,
      data: {
        purchases,
      },
    })
  } catch (error) {
    console.error('Error getting user purchases:', error)
    next(createError(500, 'Failed to retrieve purchases'))
  }
}

// Get product sales analytics (for product owner)
export const getProductAnalytics = async (req, res, next) => {
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

    // Calculate analytics
    const totalPurchases = product.purchases.filter(
      (p) => p.status === 'completed'
    ).length
    const totalRevenue = product.purchases
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)

    // Get purchases by month for chart data
    const purchasesByMonth = {}
    const revenueByMonth = {}

    product.purchases
      .filter((p) => p.status === 'completed')
      .forEach((purchase) => {
        const monthKey = new Date(purchase.purchasedAt)
          .toISOString()
          .slice(0, 7) // YYYY-MM

        purchasesByMonth[monthKey] = (purchasesByMonth[monthKey] || 0) + 1
        revenueByMonth[monthKey] =
          (revenueByMonth[monthKey] || 0) + purchase.amount
      })

    // Conversion rate
    const conversionRate =
      product.views > 0 ? (totalPurchases / product.views) * 100 : 0

    // Recent purchases (last 10)
    const recentPurchases = product.purchases
      .filter((p) => p.status === 'completed')
      .sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt))
      .slice(0, 10)

    res.status(200).json({
      status: 'success',
      data: {
        analytics: {
          totalPurchases,
          totalRevenue,
          totalViews: product.views,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          averageOrderValue:
            totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
        },
        chartData: {
          purchasesByMonth,
          revenueByMonth,
        },
        recentPurchases: recentPurchases.map((purchase) => ({
          _id: purchase._id,
          customerName: purchase.name,
          customerEmail: purchase.email,
          amount: purchase.amount,
          purchasedAt: purchase.purchasedAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error getting product analytics:', error)
    next(createError(500, 'Failed to retrieve analytics'))
  }
}

export default {
  createProductCheckoutSession,
  verifyProductCheckoutSession,
  downloadPurchasedFile,
  getUserPurchases,
  getProductAnalytics,
}
