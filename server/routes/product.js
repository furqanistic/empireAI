// File: server/routes/product.js - Complete with all missing routes
import express from 'express'

import {
  addFeedback,
  deleteProductGeneration,
  exportProduct,
  generateProduct,
  getAllProductGenerations,
  getProductAnalytics,
  getProductGeneration,
  getProductHistory,
  getUserStats,
  markContentCopied,
  markProductDownloaded,
  testAIConnection,
  testGroqConnection,
  trackExport,
} from '../controllers/productController.js'
import {
  checkActiveUser,
  restrictTo,
  verifyToken,
} from '../middleware/authMiddleware.js'
import {
  addRateInfoHeaders,
  enhancedProductLogging,
  enrichUserContext,
  logProductActivity,
  trackProductAnalytics,
  validateContentAppropriateNess,
  validateEnhancedProductRequest,
  validateProductRequest,
} from '../middleware/productMiddleware.js'

const router = express.Router()

// Public test route (no authentication required)
router.get('/test-groq', testGroqConnection)

// Test route for AI connection (admin only)
router.get(
  '/test-connection',
  verifyToken,
  restrictTo('admin'),
  testAIConnection
)

// Protected routes (require authentication)
router.use(verifyToken)
router.use(checkActiveUser)

// Add unlimited access context and headers
router.use(enrichUserContext)
router.use(addRateInfoHeaders)

// Enhanced logging for all product operations
router.use(logProductActivity)

// Main product generation endpoint
router.post(
  '/generate',
  validateEnhancedProductRequest,
  validateContentAppropriateNess,
  trackProductAnalytics,
  enhancedProductLogging,
  generateProduct
)

// Alternative generation endpoint with basic validation (for backwards compatibility)
router.post('/generate-basic', validateProductRequest, generateProduct)

// FIXED: Export product - removed wrong validation middleware
router.post('/export', trackExport, exportProduct)

// ADDED: Get user's product generation history - This was missing!
router.get('/history', getProductHistory)

// ADDED: Get user's product generation statistics - This was missing!

// Get specific product generation by ID
router.get('/:id', getProductGeneration)

// Mark content as copied (for analytics)
router.post('/:id/copy', markContentCopied)

// Mark product as downloaded (for analytics)
router.post('/:id/download', markProductDownloaded)

// Add feedback to a product generation
router.post('/:id/feedback', addFeedback)

// Delete a product generation
router.delete('/:id', deleteProductGeneration)

// Bulk generation endpoint (for power users)
router.post(
  '/generate-bulk',
  validateEnhancedProductRequest,
  trackProductAnalytics,
  async (req, res, next) => {
    // Handle bulk generation (generate multiple products at once)
    const { bulkConfig } = req.body

    if (!bulkConfig || !Array.isArray(bulkConfig)) {
      return res.status(400).json({
        status: 'error',
        message: 'Bulk config must be an array of product configurations',
      })
    }

    if (bulkConfig.length > 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum 10 products per bulk request',
      })
    }

    try {
      const results = []

      for (const config of bulkConfig) {
        req.body = { ...config }
        const result = await generateProduct(req, res, next)
        results.push(result)
      }

      res.status(200).json({
        status: 'success',
        message: `Generated ${results.length} products successfully`,
        data: { products: results },
      })
    } catch (error) {
      next(error)
    }
  }
)

// Admin only routes
router.use(restrictTo('admin'))

// Get product analytics (admin only)
router.get('/admin/analytics', getProductAnalytics)

// Get all product generations (admin only)
router.get('/admin/all', getAllProductGenerations)

// Admin bulk operations
router.post('/admin/bulk-operations', async (req, res, next) => {
  const { operation, filters } = req.body

  try {
    switch (operation) {
      case 'cleanup-failed':
        // Clean up failed generations
        const deleted = await ProductGeneration.deleteMany({
          status: 'failed',
          createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Older than 24 hours
        })

        res.json({
          status: 'success',
          message: `Cleaned up ${deleted.deletedCount} failed generations`,
        })
        break

      case 'export-data':
        // Export generation data
        const generations = await ProductGeneration.find(filters || {})
          .populate('user', 'email')
          .lean()

        res.json({
          status: 'success',
          data: { generations },
          count: generations.length,
        })
        break

      default:
        res.status(400).json({
          status: 'error',
          message: 'Invalid bulk operation',
        })
    }
  } catch (error) {
    console.error('Admin bulk operation error:', error)
    next(error)
  }
})

export default router
