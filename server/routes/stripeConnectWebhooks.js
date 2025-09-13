// File: routes/stripeConnectWebhooks.js - IMPROVED WITH DEBUG
import express from 'express'
import { handleStripeConnectWebhook } from '../controllers/stripeConnectWebhook.js'

const router = express.Router()

// Debug endpoint to test webhook configuration
router.get('/stripe-connect/debug', (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    webhookEndpoint: '/api/webhooks/stripe-connect',
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasConnectWebhookSecret: !!process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
      webhookSecretLength:
        process.env.STRIPE_CONNECT_WEBHOOK_SECRET?.length || 0,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix:
        process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing',
    },
    expectedHeaders: ['stripe-signature', 'content-type: application/json'],
    requirements: [
      'Raw body parsing (not JSON)',
      'Valid Stripe signature',
      'Correct webhook secret',
    ],
  }

  res.status(200).json({
    status: 'debug',
    data: debugInfo,
    message: 'Webhook debug information',
  })
})

// Test endpoint to verify webhook is reachable
router.post('/stripe-connect/test', express.json(), (req, res) => {
  console.log('🧪 Test webhook called:', {
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString(),
  })

  res.status(200).json({
    status: 'success',
    message: 'Test webhook received',
    timestamp: new Date().toISOString(),
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'stripe-signature': req.headers['stripe-signature']
        ? 'present'
        : 'missing',
    },
  })
})

// Main Stripe Connect webhook endpoint
// IMPORTANT: This must receive raw body, not JSON parsed
router.post(
  '/stripe-connect',
  express.raw({ type: 'application/json' }),
  handleStripeConnectWebhook
)

export default router
