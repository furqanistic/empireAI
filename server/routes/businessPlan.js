// File: server/routes/businessPlans.js
import express from 'express'
import {
  addFeedback,
  deleteBusinessPlan,
  generateBusinessPlan,
  getAllBusinessPlans,
  getBusinessPlan,
  getBusinessPlanHistory,
  getNicheAnalytics,
  getUserStats,
  markAsDownloaded,
} from '../controllers/businessPlanController.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import {
  checkUsageLimit,
  logUsageAfterGeneration,
} from '../middleware/usageMiddleware.js'

const router = express.Router()

// =============================================================================
// AUTHENTICATED USER ROUTES
// =============================================================================

// Generate comprehensive business plan with usage limit enforcement
router.post(
  '/generate',
  verifyToken, // Authenticate user
  checkUsageLimit('niche-launchpad'), // Check plan access and usage limits
  logUsageAfterGeneration('niche-launchpad'), // Track usage after successful generation
  generateBusinessPlan // Generate business plan controller
)

// Get user's business plan generation history
router.get('/history', verifyToken, getBusinessPlanHistory)

// Get specific business plan by ID
router.get('/:id', verifyToken, getBusinessPlan)

// Mark business plan as downloaded (for analytics)
router.post('/:id/download', verifyToken, markAsDownloaded)

// Add feedback to a business plan generation
router.post('/:id/feedback', verifyToken, addFeedback)

// Get user's business plan generation statistics
router.get('/stats/user', verifyToken, getUserStats)

// Delete a business plan generation
router.delete('/:id', verifyToken, deleteBusinessPlan)

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Get niche-specific analytics (Admin only)
router.get(
  '/admin/analytics/niches',
  verifyToken,
  restrictTo('admin'),
  getNicheAnalytics
)

// Get all business plan generations (Admin only)
router.get('/admin/all', verifyToken, restrictTo('admin'), getAllBusinessPlans)

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// Handle route-specific errors
router.use((error, req, res, next) => {
  console.error('Business Plans Route Error:', {
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
      error: 'Invalid business plan generation parameters',
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
      error: 'Invalid business plan ID format',
    })
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate business plan generation request detected',
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
      message:
        'Please try again in a few moments. If the issue persists, a fallback plan will be generated.',
    })
  }

  // Handle chart generation errors
  if (
    error.message?.includes('chart') ||
    error.message?.includes('data visualization')
  ) {
    return res.status(500).json({
      success: false,
      error: 'Chart generation failed',
      message:
        'Business plan generated successfully but charts could not be created',
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
    error:
      'An error occurred while processing business plan generation request',
  })
})

export default router
