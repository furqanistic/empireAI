// File: routes/referral.js
import express from 'express'
import rateLimit from 'express-rate-limit'
import {
  generateNewReferralCode,
  getAffiliateProgram,
  getReferralAnalytics,
  getReferralLeaderboard,
  getReferralStats,
  updateAffiliateProgram,
  validateReferralCode,
} from '../controllers/referral.js'
import {
  generateProgramLauncherDraft,
  getProgramLauncherDraft,
  publishProgramLauncherDraft,
  regenerateProgramLauncherSection,
  saveProgramLauncherDraft,
} from '../controllers/programLauncherController.js'
import { createError } from '../error.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Public routes
router.get('/validate/:code', validateReferralCode)
router.get('/leaderboard', getReferralLeaderboard)

// Protected routes (require authentication)
router.use(verifyToken)

const programLauncherGenerationLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => req.user._id.toString(),
  message: {
    status: 'error',
    message: 'Daily AI Program Launcher limit reached. Try again tomorrow.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Helper function to check if user is accessing their own referral data or is admin
const checkSelfOrAdmin = (req, res, next) => {
  // If no ID provided (my-stats route), always allow
  if (!req.params.id) {
    return next()
  }

  if (req.user.role === 'admin' || req.user._id.toString() === req.params.id) {
    next()
  } else {
    next(createError(403, 'You can only access your own referral data'))
  }
}

// User referral routes
router.get('/my-stats', getReferralStats) // Shorthand for current user
router.get('/program', getAffiliateProgram)
router.put('/program', updateAffiliateProgram)
router.get('/program/launcher', getProgramLauncherDraft)
router.post(
  '/program/launcher/generate',
  programLauncherGenerationLimit,
  generateProgramLauncherDraft
)
router.post(
  '/program/launcher/regenerate',
  programLauncherGenerationLimit,
  regenerateProgramLauncherSection
)
router.put('/program/launcher/draft', saveProgramLauncherDraft)
router.post('/program/launcher/publish', publishProgramLauncherDraft)
router.get('/stats/:id', checkSelfOrAdmin, getReferralStats)
router.put('/generate-new-code', generateNewReferralCode)

// Admin only routes
router.use(restrictTo('admin'))
router.get('/analytics', getReferralAnalytics)

export default router
