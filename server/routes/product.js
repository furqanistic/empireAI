// File: server/routes/products.js
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
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import {
  checkUsageLimit,
  logUsageAfterGeneration,
} from '../middleware/usageMiddleware.js'

const router = express.Router()

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

// Test AI service connection (for debugging)
router.get('/test-connection', testAIConnection)

// Test GROQ connection specifically (for debugging)
router.get('/test-groq', testGroqConnection)

// =============================================================================
// AUTHENTICATED USER ROUTES
// =============================================================================

// Generate complete digital product with usage limit enforcement
router.post(
  '/generate',
  verifyToken, // Authenticate user
  checkUsageLimit('product-generator'), // Check plan access and usage limits
  logUsageAfterGeneration('product-generator'), // Track usage after successful generation
  generateProduct // Generate product controller
)

// Export product to various formats (PDF, DOCX, XLSX, PPTX)
router.post(
  '/export',
  verifyToken,
  trackExport, // Track export analytics
  exportProduct
)

// Get user's product generation history
router.get('/history', verifyToken, getProductHistory)

// Get specific product generation by ID
router.get('/:id', verifyToken, getProductGeneration)

// Mark content section as copied (for analytics)
router.post('/:id/copy', verifyToken, markContentCopied)

// Mark product as downloaded (for analytics)
router.post('/:id/download', verifyToken, markProductDownloaded)

// Add feedback to a product generation
router.post('/:id/feedback', verifyToken, addFeedback)

// Get user's product generation statistics
router.get('/stats/user', verifyToken, getUserStats)

// Delete a product generation
router.delete('/:id', verifyToken, deleteProductGeneration)

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Get platform-wide product analytics (Admin only)
router.get(
  '/admin/analytics',
  verifyToken,
  restrictTo('admin'),
  getProductAnalytics
)

// Get all product generations (Admin only)
router.get(
  '/admin/all',
  verifyToken,
  restrictTo('admin'),
  getAllProductGenerations
)

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// Handle route-specific errors
router.use((error, req, res, next) => {
  console.error('Products Route Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id || 'Anonymous',
    body: req.method === 'POST' ? JSON.stringify(req.body, null, 2) : undefined,
    timestamp: new Date().toISOString(),
  })

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid product generation parameters',
      details: error.message,
      validationErrors: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message,
          }))
        : undefined,
    })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid product generation ID format',
    })
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate product generation request detected',
    })
  }

  // Handle AI service errors
  if (
    error.message?.includes('AI service') ||
    error.message?.includes('GROQ')
  ) {
    return res.status(503).json({
      success: false,
      error: 'AI service temporarily unavailable',
      message: 'Please try again in a few moments',
    })
  }

  // Handle export errors
  if (
    error.message?.includes('export') ||
    error.message?.includes('PDF') ||
    error.message?.includes('Excel')
  ) {
    return res.status(500).json({
      success: false,
      error: 'Export generation failed',
      message: 'Please try downloading again or contact support',
    })
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    })
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'An error occurred while processing product generation request',
  })
})

export default router
