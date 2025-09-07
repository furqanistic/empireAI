// File: routes/stripeConnectWebhooks.js
import express from 'express'
import { handleStripeConnectWebhook } from '../controllers/stripeConnectWebhook.js'

const router = express.Router()

// Stripe Connect webhook endpoint
// Note: This route should receive raw body, not JSON parsed
router.post(
  '/stripe-connect',
  express.raw({ type: 'application/json' }),
  handleStripeConnectWebhook
)

export default router
