// File: server/index.js (UPDATED WITH PAYOUT ROUTES)
// CRITICAL FIX: Load dotenv FIRST, before any other imports
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

// Now import everything else AFTER dotenv is loaded
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'

import authRoute from './routes/auth.js'
import businessPlanRoute from './routes/businessPlan.js'
import earningsRoutes from './routes/earnings.js'
import hookRoute from './routes/hook.js'
import notificationRoute from './routes/notification.js'
import productRoute from './routes/product.js' // Your existing product routes
import referralRoute from './routes/referral.js'
import stripeRoute from './routes/stripe.js'
// NEW IMPORTS
import digitalProductsRoute from './routes/digitalProducts.js'
import digitalProductWebhooksRoute from './routes/digitalProductWebhooks.js'
import payoutRoute from './routes/payout.js' // NEW: Payout routes
import stripeConnectWebhooksRoute from './routes/stripeConnectWebhooks.js'
// Import middleware
import {
  applySubscriptionLimits,
  checkSubscriptionAccess,
  logHookActivity,
} from './middleware/hookMiddleware.js'

const app = express()

// CORS configuration (keep your existing setup)
const isOriginAllowed = (origin) => {
  if (!origin) return true
  const devOrigins = ['http://localhost:5173', 'http://localhost:5174']
  const prodOrigins = ['https://ascndlabs.com', 'https://api.ascndlabs.com']
  const allowedOrigins =
    process.env.NODE_ENV === 'production' ? prodOrigins : devOrigins

  if (allowedOrigins.includes(origin)) return true

  if (process.env.NODE_ENV === 'production') {
    const subdomainPattern = /^https:\/\/[\w-]+\.ascndlabs\.com$/
    if (subdomainPattern.test(origin)) return true
  }

  return false
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}

app.use(cors(corsOptions))

// IMPORTANT: Webhook routes MUST come before express.json() middleware
app.use('/api/webhooks/', digitalProductWebhooksRoute)

// Regular middleware
app.use(cookieParser())
app.use(express.json())

// Existing routes
app.use('/api/auth/', authRoute)
app.use('/api/referral/', referralRoute)
app.use('/api/notifications/', notificationRoute)
app.use('/api/stripe/', stripeRoute)
app.use('/api/products/', productRoute) // Your existing products
app.use('/api/webhooks/', stripeConnectWebhooksRoute)
// NEW ROUTES
app.use('/api/digital-products/', digitalProductsRoute)
app.use('/api/payouts/', payoutRoute) // NEW: Payout management routes
app.use('/api/earnings', earningsRoutes)
// Hook routes with middleware
app.use(
  '/api/hooks/',
  [checkSubscriptionAccess, applySubscriptionLimits, logHookActivity],
  hookRoute
)

// Business plan routes
app.use('/api/business-plans/', businessPlanRoute)

// Global error handling
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500
  const message = error.message || 'Something went wrong!'
  console.error(`Error ${statusCode}: ${message}`)
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  })
})

// Database connection
const connect = () => {
  mongoose
    .connect(process.env.MONGO)
    .then(() => {
      console.log('✅ Connected to MongoDB')
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err)
      process.exit(1)
    })
}

const PORT = process.env.PORT || 8800
app.listen(PORT, () => {
  connect()
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(
    `🎯 GROQ Status: ${
      process.env.GROQ_API_KEY ? '✅ Connected' : '❌ Missing API Key'
    }`
  )
})
