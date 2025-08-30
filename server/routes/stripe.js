// File: routes/stripe.js - UPDATED WITH DEBUG ROUTE
import express from 'express'
import {
  cancelSubscription,
  createBillingPortalSession,
  createCheckoutSession,
  debugSubscriptions, // ADD THIS
  getAllSubscriptions,
  getCurrentSubscription,
  getPlans,
  reactivateSubscription,
  syncWithStripe,
  updateSubscription,
  verifyCheckoutSession,
} from '../controllers/stripe.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/plans', getPlans)

// Protected routes (require authentication)
router.use(verifyToken)

// DEBUG ROUTE - Add this temporarily
router.get('/debug/subscriptions', debugSubscriptions)

// Subscription management routes
router.post('/create-checkout-session', createCheckoutSession)
router.post('/verify-checkout-session', verifyCheckoutSession)
router.get('/subscription', getCurrentSubscription)
router.put('/subscription', updateSubscription)
router.post('/cancel-subscription', cancelSubscription)
router.post('/reactivate-subscription', reactivateSubscription)
router.post('/sync-with-stripe', syncWithStripe)

// Billing portal
router.post('/create-billing-portal-session', createBillingPortalSession)

// Admin only routes
router.use(restrictTo('admin'))
router.get('/admin/subscriptions', getAllSubscriptions)

export default router
