// File: server/index.js - COMPLETELY CLEAN, NO RATE LIMITING FOR BUSINESS PLANS
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
// Import routes
import authRoute from './routes/auth.js'
import businessPlanRoute from './routes/businessPlan.js' // CLEAN - NO MIDDLEWARE
import hookRoute from './routes/hook.js'
import notificationRoute from './routes/notification.js'
import productRoute from './routes/product.js'
import referralRoute from './routes/referral.js'
import stripeRoute from './routes/stripe.js'
// Import hook middleware ONLY (not for business plans)
import {
  applySubscriptionLimits,
  checkSubscriptionAccess,
  logHookActivity,
} from './middleware/hookMiddleware.js'

const app = express()
dotenv.config({ quiet: true })

// Function to check if origin is allowed
const isOriginAllowed = (origin) => {
  // Allow requests with no origin (mobile apps, Postman, etc.)
  if (!origin) return true

  // Development origins
  const devOrigins = ['http://localhost:5173', 'http://localhost:5174']

  // Production origins (NO TRAILING SLASHES)
  const prodOrigins = ['https://ascndlabs.com', 'https://api.ascndlabs.com']

  const allowedOrigins =
    process.env.NODE_ENV === 'production' ? prodOrigins : devOrigins

  // Check if origin is in the allowed list
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // For production, also check subdomain pattern for ascndlabs.com
  if (process.env.NODE_ENV === 'production') {
    const subdomainPattern = /^https:\/\/[\w-]+\.ascndlabs\.com$/
    if (subdomainPattern.test(origin)) {
      return true
    }
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
app.use(cookieParser())
app.use(express.json())

// Basic routes (no middleware)
app.use('/api/auth/', authRoute)
app.use('/api/referral/', referralRoute)
app.use('/api/notifications/', notificationRoute)
app.use('/api/stripe/', stripeRoute)
app.use('/api/products/', productRoute)

// Hook Generation Routes with middleware (ONLY for hooks)
app.use(
  '/api/hooks/',
  [checkSubscriptionAccess, applySubscriptionLimits, logHookActivity],
  hookRoute
)

// Business Plan Routes - COMPLETELY CLEAN, NO MIDDLEWARE, NO RATE LIMITING
app.use('/api/business-plans/', businessPlanRoute)

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
  })
})

// GROQ API health check endpoint
app.get('/api/hooks/health', (req, res) => {
  const groqStatus = process.env.GROQ_API_KEY
    ? '✅ Connected'
    : '❌ Missing API Key'
  res.status(200).json({
    status: 'success',
    message: 'Hook Generation API is ready!',
    groq: groqStatus,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    timestamp: new Date().toISOString(),
  })
})

// Business Plan API health check endpoint - NO RATE LIMITING
app.get('/api/business-plans/health', (req, res) => {
  const groqStatus = process.env.GROQ_API_KEY
    ? '✅ Connected'
    : '❌ Missing API Key'
  res.status(200).json({
    status: 'success',
    message: 'Business Plan Generation API is ready! NO RATE LIMITS!',
    groq: groqStatus,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    rateLimiting: 'DISABLED',
    timestamp: new Date().toISOString(),
  })
})

// Global error handling middleware
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
    `🔔 Notifications API available at: http://localhost:${PORT}/api/notifications/`
  )
  console.log(
    `🤖 Hook Generation API available at: http://localhost:${PORT}/api/hooks/`
  )
  console.log(
    `💼 Business Plan API (NO RATE LIMITS) available at: http://localhost:${PORT}/api/business-plans/`
  )
  console.log(
    `🎯 GROQ Status: ${
      process.env.GROQ_API_KEY ? '✅ Connected' : '❌ Missing API Key'
    }`
  )
})
