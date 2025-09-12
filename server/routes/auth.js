// File: server/routes/auth.js - UPDATED WITH ADMIN STATS ENDPOINT
import express from 'express'
import { getAdminStats } from '../controllers/admin.js' // Import admin stats
import {
  changePassword,
  claimDailyPoints,
  deleteUser,
  getAllUsers,
  getPointsLeaderboard,
  getPointsStatus,
  getUserProfile,
  logout,
  signin,
  signup,
  updateUser,
} from '../controllers/auth.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import discordRoutes from './discord.js'

const router = express.Router()

// Public routes
router.post('/signup', signup)
router.post('/signin', signin)
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
router.post('/create-user', signup)
router.put('/admin/users/:id', updateUser)
router.delete('/admin/users/:id', deleteUser)
router.get('/admin/stats', getAdminStats) // Add admin stats endpoint

export default router
