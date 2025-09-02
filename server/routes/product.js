// File: routes/product.js
import express from 'express'
import {
  addFeedback,
  deleteProductGeneration,
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
} from '../controllers/productController.js'
import {
  checkActiveUser,
  logUserActivity,
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

// Main product generation endpoint - NO LIMITS!
router.post(
  '/generate',
  validateEnhancedProductRequest, // Enhanced validation with better error messages
  validateContentAppropriateNess, // Basic content filtering
  trackProductAnalytics, // Analytics tracking
  enhancedProductLogging, // Detailed logging
  logUserActivity('generate_product'), // User activity logging
  generateProduct // Main generation function
)

// Alternative generation endpoint with basic validation (for backwards compatibility)
router.post(
  '/generate-basic',
  validateProductRequest, // Basic validation only
  logUserActivity('generate_product_basic'),
  generateProduct
)

// Get user's product generation history - NO LIMITS!
router.get(
  '/history',
  logUserActivity('view_product_history'),
  getProductHistory
)

// Get user's product generation statistics - NO LIMITS!
router.get('/stats', logUserActivity('view_product_stats'), getUserStats)

// Get specific product generation by ID - NO LIMITS!
router.get(
  '/:id',
  logUserActivity('view_product_generation'),
  getProductGeneration
)

// Mark content as copied (for analytics) - NO LIMITS!
router.post(
  '/:id/copy',
  logUserActivity('copy_product_content'),
  markContentCopied
)

// Mark product as downloaded (for analytics) - NO LIMITS!
router.post(
  '/:id/download',
  logUserActivity('download_product'),
  markProductDownloaded
)

// Add feedback to a product generation - NO LIMITS!
router.post(
  '/:id/feedback',
  logUserActivity('add_product_feedback'),
  addFeedback
)

// Delete a product generation - NO LIMITS!
router.delete(
  '/:id',
  logUserActivity('delete_product_generation'),
  deleteProductGeneration
)

// Bulk generation endpoint (for power users) - NO LIMITS!
router.post(
  '/generate-bulk',
  validateEnhancedProductRequest,
  trackProductAnalytics,
  logUserActivity('generate_bulk_products'),
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

// Admin only routes - NO LIMITS!
router.use(restrictTo('admin'))

// Get product analytics (admin only) - NO LIMITS!
router.get(
  '/admin/analytics',
  logUserActivity('view_product_analytics'),
  getProductAnalytics
)

// Get all product generations (admin only) - NO LIMITS!
router.get(
  '/admin/all',
  logUserActivity('view_all_product_generations'),
  getAllProductGenerations
)

// Admin bulk operations - NO LIMITS!
router.post(
  '/admin/bulk-operations',
  logUserActivity('admin_bulk_operations'),
  async (req, res, next) => {
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
      next(error)
    }
  }
)

export default router
