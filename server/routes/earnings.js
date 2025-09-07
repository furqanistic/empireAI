// File: server/routes/earnings.js - FIXED ROUTE ORDERING AND MISSING ENDPOINTS
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
import { restrictTo, verifyToken } from '../middleware/authMiddleware.js'
import Earnings from '../models/Earnings.js'

const router = express.Router()

// All earnings routes require authentication
router.use(verifyToken)

// =============================================================================
// USER ROUTES - ORDER MATTERS: Specific routes BEFORE parameterized routes
// =============================================================================

// Get user's earnings with filtering and pagination
router.get('/', getUserEarnings)

// Get earnings analytics for charts
router.get('/analytics', getEarningsAnalytics)

// Get earnings summary/stats (MUST come before /:earningId)
router.get('/summary', async (req, res, next) => {
  try {
    const userId = req.user._id

    // Get earnings summary using the static method
    const summary = await Earnings.getEarningsSummary(userId)

    res.status(200).json({
      status: 'success',
      data: summary,
    })
  } catch (error) {
    console.error('Error getting earnings summary:', error)
    next(error)
  }
})

// Export earnings data
router.get('/export', async (req, res, next) => {
  try {
    const userId = req.user._id
    const { status, source, startDate, endDate, format = 'csv' } = req.query

    // Build filter
    const filter = { user: userId }
    if (status) filter.status = status
    if (source) filter.source = source
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    // Get earnings data
    const earnings = await Earnings.find(filter)
      .populate('referredUser', 'name email')
      .populate('subscription', 'plan billingCycle status')
      .sort({ createdAt: -1 })

    // Convert to CSV format
    if (format === 'csv') {
      const csvHeader = [
        'Date',
        'Customer',
        'Customer Email',
        'Plan',
        'Source',
        'Gross Amount',
        'Commission Rate',
        'Commission Amount',
        'Status',
        'Currency',
      ].join(',')

      const csvRows = earnings.map((earning) =>
        [
          earning.createdAt.toISOString().split('T')[0],
          earning.referredUser?.name || 'N/A',
          earning.referredUser?.email || 'N/A',
          earning.subscription?.plan || 'N/A',
          earning.source,
          (earning.grossAmount / 100).toFixed(2),
          `${(earning.commissionRate * 100).toFixed(1)}%`,
          (earning.commissionAmount / 100).toFixed(2),
          earning.status,
          earning.currency,
        ].join(',')
      )

      const csvContent = [csvHeader, ...csvRows].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="earnings-export.csv"'
      )
      res.send(csvContent)
    } else {
      // Return JSON format
      res.json({
        status: 'success',
        data: {
          earnings: earnings.map((earning) => ({
            date: earning.createdAt,
            customer: earning.referredUser?.name,
            customerEmail: earning.referredUser?.email,
            plan: earning.subscription?.plan,
            source: earning.source,
            grossAmount: earning.grossAmount,
            commissionRate: earning.commissionRate,
            commissionAmount: earning.commissionAmount,
            status: earning.status,
            currency: earning.currency,
            formattedAmounts: earning.formattedAmounts,
          })),
        },
      })
    }
  } catch (error) {
    console.error('Error exporting earnings:', error)
    next(error)
  }
})

// Get specific earning details (MUST come after all specific routes)
router.get('/:earningId', getEarningDetails)

// =============================================================================
// ADMIN ROUTES
// =============================================================================

// Admin only routes
router.use('/admin', restrictTo('admin'))

// Get all earnings (admin)
router.get('/admin/all', getAllEarnings)

// Approve specific earning
router.put('/admin/:earningId/approve', approveEarning)

// Bulk approve earnings
router.put('/admin/bulk-approve', bulkApproveEarnings)

// Dispute earning
router.put('/admin/:earningId/dispute', disputeEarning)

// Cancel earning
router.put('/admin/:earningId/cancel', cancelEarning)

export default router
