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
  logUserActivity,
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
router.post('/generate', logUserActivity('generate_hooks'), generateHooks)

// Get user's hook generation history
router.get('/history', logUserActivity('view_hook_history'), getHookHistory)

// Get user's hook generation statistics
router.get('/stats', logUserActivity('view_hook_stats'), getUserStats)

// Get specific hook generation by ID
router.get('/:id', logUserActivity('view_hook_generation'), getHookGeneration)

// Mark a hook as copied (for analytics)
router.post('/:id/copy', logUserActivity('copy_hook'), markHookCopied)

// Add feedback to a hook generation
router.post('/:id/feedback', logUserActivity('add_hook_feedback'), addFeedback)

// Delete a hook generation
router.delete(
  '/:id',
  logUserActivity('delete_hook_generation'),
  deleteHookGeneration
)

// Admin only routes
router.use(restrictTo('admin'))

// Get platform analytics (admin only)
router.get(
  '/admin/analytics',
  logUserActivity('view_platform_analytics'),
  getPlatformAnalytics
)

// Get all hook generations (admin only)
router.get(
  '/admin/all',
  logUserActivity('view_all_hook_generations'),
  getAllHookGenerations
)

export default router
