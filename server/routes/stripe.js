// File: routes/stripe.js - UPDATED WITH ENHANCED DEBUGGING
import express from 'express'
import {
  cancelSubscription,
  createBillingPortalSession,
  createCheckoutSession,
  getAllSubscriptions,
  getCurrentSubscription,
  getPlans,
  reactivateSubscription,
  syncWithStripe,
  updateSubscription,
  verifyCheckoutSession,
  verifyWebhookPayment,
} from '../controllers/stripe.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/plans', getPlans)

// Webhook endpoint (must be before other middleware)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  verifyWebhookPayment
)

// Protected routes (require authentication)
router.use(verifyToken)

// DEBUG ROUTES - Enhanced debugging for live payments

// Subscription management routes
router.post('/create-checkout-session', createCheckoutSession)

// ENHANCED verification with debugging middleware
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
