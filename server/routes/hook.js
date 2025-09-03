// File: routes/hook.js
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
import {
  checkActiveUser,
  restrictTo,
  verifyToken,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// Test route for GROQ connection (admin only)
router.get(
  '/test-connection',
  verifyToken,
  restrictTo('admin'),
  testGroqConnection
)

// Protected routes (require authentication)
router.use(verifyToken)
router.use(checkActiveUser)

// Main hook generation endpoint
router.post('/generate', generateHooks)

// Get user's hook generation history
router.get('/history', getHookHistory)

// Get user's hook generation statistics
router.get('/stats', getUserStats)

// Get specific hook generation by ID
router.get('/:id', getHookGeneration)

// Mark a hook as copied (for analytics)
router.post('/:id/copy', markHookCopied)

// Add feedback to a hook generation
router.post('/:id/feedback', addFeedback)

// Delete a hook generation
router.delete(
  '/:id',

  deleteHookGeneration
)

// Admin only routes
router.use(restrictTo('admin'))

// Get platform analytics (admin only)
router.get(
  '/admin/analytics',

  getPlatformAnalytics
)

// Get all hook generations (admin only)
router.get(
  '/admin/all',

  getAllHookGenerations
)

export default router
