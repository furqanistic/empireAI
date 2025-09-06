// File: routes/payout.js
import express from 'express'
import {
  approveEarning,
  bulkApproveEarnings,
  cancelEarning,
  disputeEarning,
  getAllEarnings,
  getEarningDetails,
  getEarningsAnalytics,
  getUserEarnings,
} from '../controllers/earnings.js'
import {
  cancelPayoutRequest,
  createConnectAccountForUser,
  getAllPayouts,
  getConnectAccountStatus,
  getConnectOnboardingLink,
  getEarningsSummary,
  getPayoutHistory,
  getPayoutStatistics,
  processPayout,
  requestPayout,
  updatePayoutSettings,
} from '../controllers/payout.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// All routes require authentication
router.use(verifyToken)

// STRIPE CONNECT ROUTES
// Create Connect account
router.post('/connect/create-account', createConnectAccountForUser)

// Get Connect account status
router.get('/connect/status', getConnectAccountStatus)

// Get onboarding link
router.get('/connect/onboarding-link', getConnectOnboardingLink)

// Update payout settings
router.put('/connect/settings', updatePayoutSettings)

// EARNINGS ROUTES
// Get user's earnings summary
router.get('/earnings/summary', getEarningsSummary)

// Get user's earnings with filtering
router.get('/earnings', getUserEarnings)

// Get specific earning details
router.get('/earnings/:earningId', getEarningDetails)

// Get earnings analytics
router.get('/earnings/analytics', getEarningsAnalytics)

// PAYOUT ROUTES
// Request a payout
router.post('/request', requestPayout)

// Get payout history
router.get('/history', getPayoutHistory)

// Cancel payout request
router.delete('/:payoutId/cancel', cancelPayoutRequest)

// ADMIN ONLY ROUTES
router.use(restrictTo('admin'))

// Admin: Get all earnings
router.get('/admin/earnings', getAllEarnings)

// Admin: Approve earning
router.post('/admin/earnings/:earningId/approve', approveEarning)

// Admin: Bulk approve earnings
router.post('/admin/earnings/bulk-approve', bulkApproveEarnings)

// Admin: Dispute earning
router.post('/admin/earnings/:earningId/dispute', disputeEarning)

// Admin: Cancel earning
router.post('/admin/earnings/:earningId/cancel', cancelEarning)

// Admin: Get all payouts
router.get('/admin/payouts', getAllPayouts)

// Admin: Process payout
router.post('/admin/payouts/:payoutId/process', processPayout)

// Admin: Get payout statistics
router.get('/admin/statistics', getPayoutStatistics)

export default router
