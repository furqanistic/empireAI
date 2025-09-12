// File: server/index.js (UPDATED)
import dotenv from 'dotenv'
dotenv.config({ quiet: true })

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import adminRoutes from './routes/admin.js'
import authRoute from './routes/auth.js'
import businessPlanRoute from './routes/businessPlan.js'
import digitalProductsRoute from './routes/digitalProducts.js'
import digitalProductWebhooksRoute from './routes/digitalProductWebhooks.js'
import discordRoute from './routes/discord.js'
import earningsRoutes from './routes/earnings.js'
import hookRoute from './routes/hook.js'
import notificationRoute from './routes/notification.js'
import payoutRoute from './routes/payout.js'
import productRoute from './routes/product.js'
import referralRoute from './routes/referral.js'
import stripeRoute from './routes/stripe.js'
import stripeConnectWebhooksRoute from './routes/stripeConnectWebhooks.js'

// CHAT ROUTE - SIMPLIFIED
import chatRoute from './routes/chat.js'

// Import middleware for hooks
import {
  applySubscriptionLimits,
  checkSubscriptionAccess,
  logHookActivity,
} from './middleware/hookMiddleware.js'

const app = express()

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins =
      process.env.NODE_ENV === 'production'
        ? ['https://ascndlabs.com', 'https://api.ascndlabs.com']
        : ['http://localhost:5173', 'http://localhost:5174']

    if (!origin || allowedOrigins.includes(origin)) {
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

// Webhook routes (before express.json())
app.use('/api/webhooks/', digitalProductWebhooksRoute)
app.use('/api/webhooks/', stripeConnectWebhooksRoute)

// Regular middleware
app.use(cookieParser())
app.use(express.json())

// API Routes
app.use('/api/auth/', authRoute)
app.use('/api/referral/', referralRoute)
app.use('/api/notifications/', notificationRoute)
app.use('/api/stripe/', stripeRoute)
app.use('/api/products/', productRoute)
app.use('/api/digital-products/', digitalProductsRoute)
app.use('/api/payouts/', payoutRoute)
app.use('/api/earnings', earningsRoutes)
app.use('/api/auth/discord/', discordRoute)
app.use('/api/admin', adminRoutes)
app.use('/api/business-plans/', businessPlanRoute)

// SIMPLIFIED CHAT ROUTES
app.use('/api/chat/', chatRoute)

// Hook routes with middleware
app.use(
  '/api/hooks/',
  [checkSubscriptionAccess, applySubscriptionLimits, logHookActivity],
  hookRoute
)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    chat: {
      enabled: true,
      status: process.env.GROQ_API_KEY ? 'Ready' : 'Missing API Key',
    },
  })
})

// Error handling
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
    `💬 Chat: ${process.env.GROQ_API_KEY ? '✅ Ready' : '❌ API Key Required'}`
  )
})
