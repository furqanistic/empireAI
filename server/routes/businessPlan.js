// File: routes/businessPlan.js - NO RATE LIMITING
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
import {
  checkActiveUser,
  restrictTo,
  verifyToken,
} from '../middleware/authMiddleware.js'

const router = express.Router()

// Protected routes (require authentication)
router.use(verifyToken)
router.use(checkActiveUser)

// Main business plan generation endpoint
router.post('/generate', generateBusinessPlan)

// Get user's business plan history
router.get('/history', getBusinessPlanHistory)

// Get user's business plan statistics
router.get('/stats', getUserStats)

// Get specific business plan by ID
router.get('/:id', getBusinessPlan)

// Mark a business plan as downloaded (for analytics)
router.post('/:id/download', markAsDownloaded)

// Add feedback to a business plan
router.post('/:id/feedback', addFeedback)

// Delete a business plan
router.delete('/:id', deleteBusinessPlan)

// Admin only routes
router.use(restrictTo('admin'))

// Get niche analytics (admin only)
router.get('/admin/analytics', getNicheAnalytics)

// Get all business plans (admin only)
router.get('/admin/all', getAllBusinessPlans)

export default router
