// File: routes/admin.js - NEW ADMIN ROUTES FOR SUBSCRIPTION MANAGEMENT
import express from 'express'
import {
  cancelUserSubscription,
  getAdminStats,
  reactivateUserSubscription,
  updateUserSubscription,
} from '../controllers/admin.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// All admin routes require authentication and admin role
router.use(verifyToken)
router.use(restrictTo('admin'))

// Admin statistics
router.get('/stats', getAdminStats)

// User subscription management routes
router.put('/users/:userId/subscription', updateUserSubscription)
router.post('/users/:userId/subscription/cancel', cancelUserSubscription)
router.post(
  '/users/:userId/subscription/reactivate',
  reactivateUserSubscription
)

export default router
