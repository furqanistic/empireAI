// File: server/routes/hooks.js
import express from 'express'
import {
  addFeedback,
  deleteHookGeneration,
  generateHooks,
  getAllHookGenerations,
  getHookGeneration,
  getHookHistory,
  getPlatformAnalytics,
  getUserStats,
  markHookCopied,
  testGroqConnection,
} from '../controllers/hookController.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import {
  checkUsageLimit,
  logUsageAfterGeneration,
} from '../middleware/usageMiddleware.js'

const router = express.Router()

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

// Test GROQ connection (for debugging)
router.get('/test-connection', testGroqConnection)

// =============================================================================
// AUTHENTICATED USER ROUTES
// =============================================================================

// Generate viral hooks with usage limit enforcement
router.post(
  '/generate',
  verifyToken, // Authenticate user
  checkUsageLimit('viral-hooks'), // Check plan access and usage limits
  logUsageAfterGeneration('viral-hooks'), // Track usage after successful generation
  generateHooks // Generate hooks controller
)

// Get user's hook generation history
router.get('/history', verifyToken, getHookHistory)

// Get specific hook generation by ID
router.get('/:id', verifyToken, getHookGeneration)

// Mark a specific hook as copied (for analytics)
router.post('/:id/copy', verifyToken, markHookCopied)

// Add feedback to a hook generation
router.post('/:id/feedback', verifyToken, addFeedback)

// Get user's hook generation statistics
router.get('/stats/user', verifyToken, getUserStats)

// Delete a hook generation
router.delete('/:id', verifyToken, deleteHookGeneration)

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Get platform-wide hook analytics (Admin only)
router.get(
  '/admin/analytics',
  verifyToken,
  restrictTo('admin'),
  getPlatformAnalytics
)

// Get all hook generations (Admin only)
router.get(
  '/admin/all',
  verifyToken,
  restrictTo('admin'),
  getAllHookGenerations
)

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// Handle route-specific errors
router.use((error, req, res, next) => {
  console.error('Hooks Route Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id || 'Anonymous',
    timestamp: new Date().toISOString(),
  })

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      details: error.message,
    })
  }

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
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
    error: 'An error occurred while processing hook generation request',
  })
})

export default router
