// File: routes/payout.js - FIXED WITH PROPER STRIPE IMPORT
import express from 'express'
import { stripe } from '../config/stripe.js' // ADD THIS IMPORT
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
  cleanupInvalidConnectAccounts,
  createAccountManagementLink,
  createConnectAccountForUser,
  getAllPayouts,
  getConnectAccountStatus,
  getConnectOnboardingLink,
  getEarningsSummary,
  getPayoutHistory,
  getPayoutStatistics,
  handleOnboardingReturn,
  processPayout,
  refreshConnectAccountStatus,
  requestPayout,
  resetConnectAccount,
  updatePayoutSettings,
} from '../controllers/payout.js'
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import User from '../models/User.js'

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

// Get management link for updating bank details
router.get('/connect/management-link', createAccountManagementLink)

// Refresh account status
router.post('/connect/refresh-status', refreshConnectAccountStatus)

// Reset Connect account (dev/testing)
router.delete('/connect/reset', resetConnectAccount)

// Update payout settings
router.put('/connect/settings', updatePayoutSettings)

// Cleanup invalid accounts (admin/dev utility)
router.post('/connect/cleanup-invalid', cleanupInvalidConnectAccounts)

// Handle onboarding return
router.post('/connect/onboarding-return', handleOnboardingReturn)

// FIXED DEBUG ROUTE with proper stripe import
router.get('/connect/debug', async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    let accountStatus = null
    if (user.stripeConnect?.accountId) {
      try {
        const account = await stripe.accounts.retrieve(
          user.stripeConnect.accountId
        )
        accountStatus = {
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
          requirements: account.requirements?.currently_due || [],
          external_accounts:
            account.external_accounts?.data?.map((ea) => ({
              id: ea.id,
              object: ea.object,
              last4: ea.last4,
              bank_name: ea.bank_name,
              currency: ea.currency,
              status: ea.status,
              default_for_currency: ea.default_for_currency,
            })) || [],
        }
      } catch (error) {
        accountStatus = { error: error.message }
      }
    }

    res.json({
      userConnect: user.stripeConnect,
      stripeAccount: accountStatus,
      webhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET
        ? 'Set'
        : 'Missing',
    })
  } catch (error) {
    next(error)
  }
})

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
