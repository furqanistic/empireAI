// File: server/routes/auth.js - COMPLETE WITH OTP SYSTEM
import express from 'express'
import { getAdminStats } from '../controllers/admin.js' // Import admin stats
import {
  changePassword,
  claimDailyPoints,
  deleteUser,
  forgotPassword, // Password reset: Step 1 - Send OTP
  getAllUsers,
  getPointsLeaderboard,
  getPointsStatus,
  getUserProfile,
  logout,
  resetPassword, // Password reset: Step 3 - Reset password with token
  sendSignupOTP, // NEW: Signup: Step 1 - Send OTP for email verification
  signin,
  updateUser,
  verifyOTP, // Password reset: Step 2 - Verify OTP
  verifySignupOTP, // NEW: Signup: Step 2 - Verify OTP and create account
} from '../controllers/auth.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import discordRoutes from './discord.js'

const router = express.Router()

// Public routes (no authentication required)

// NEW: OTP-BASED SIGNUP FLOW
router.post('/signup/send-otp', sendSignupOTP) // Step 1: Send OTP for signup verification
router.post('/signup/verify-otp', verifySignupOTP) // Step 2: Verify OTP and create account

// Resend signup OTP endpoint
router.post('/signup/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return next(createError(400, 'Please provide email address'))
    }

    // Check if there's pending signup data for this email
    const tempData = global.signupOTPStore?.get(email.toLowerCase().trim())

    if (!tempData) {
      return next(
        createError(
          400,
          'No pending registration found. Please start the signup process again.'
        )
      )
    }

    // Resend using the same data but with new OTP
    const userData = {
      name: tempData.name,
      email: tempData.email,
      password: tempData.password,
      referralCode: tempData.referralCode,
    }

    // Forward to sendSignupOTP
    req.body = userData
    return sendSignupOTP(req, res, next)
  } catch (error) {
    console.error('Error in resend signup OTP:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
})

// SIGNIN
router.post('/signin', signin)

// PASSWORD RESET FLOW (OTP-based)
router.post('/forgot-password', forgotPassword) // Step 1: Send OTP to email
router.post('/verify-otp', verifyOTP) // Step 2: Verify OTP and get reset token
router.post('/reset-password', resetPassword) // Step 3: Reset password with reset token

// Resend password reset OTP endpoint
router.post('/forgot-password/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body

    if (!email) {
      return next(createError(400, 'Please provide email address'))
    }

    // Forward to forgotPassword to resend OTP
    return forgotPassword(req, res, next)
  } catch (error) {
    console.error('Error in resend password reset OTP:', error)
    next(
      createError(500, 'An unexpected error occurred. Please try again later.')
    )
  }
})

// Discord routes
router.use('/discord', discordRoutes)

// Protected routes (require authentication)
router.use(verifyToken)

// Basic user routes (available to all authenticated users)
router.get('/profile/:id', getUserProfile)
router.put('/change-password', changePassword)
router.post('/logout', logout)

// Points system routes
router.post('/claim-daily-points', claimDailyPoints)
router.get('/points-status', getPointsStatus)
router.get('/points-leaderboard', getPointsLeaderboard)

// Self-profile management (users can update their own profile)
router.put(
  '/profile',
  (req, res, next) => {
    req.params.id = req.user.id
    next()
  },
  updateUser
)

// User management routes - users can only access their own profile
router.put(
  '/users/:id',
  (req, res, next) => {
    if (
      req.user.role === 'admin' ||
      req.user._id.toString() === req.params.id
    ) {
      next()
    } else {
      const error = new Error('You can only access your own profile')
      error.statusCode = 403
      next(error)
    }
  },
  updateUser
)

// Admin only routes
router.use(restrictTo('admin'))
router.get('/all-users', getAllUsers)
router.put('/admin/users/:id', updateUser)
router.delete('/admin/users/:id', deleteUser)
router.get('/admin/stats', getAdminStats) // Add admin stats endpoint

export default router
