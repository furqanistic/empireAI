// File: routes/digitalProductWebhooks.js
import express from 'express'
import { handleDigitalProductWebhook } from '../controllers/digitalProductWebhook.js'

const router = express.Router()

// Stripe webhook endpoint for digital product payments
// Note: This route should receive raw body, not JSON parsed
router.post(
  '/stripe-digital-products',
  express.raw({ type: 'application/json' }),
  handleDigitalProductWebhook
)

export default router
