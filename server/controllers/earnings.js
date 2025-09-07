// File: controllers/earnings.js - ADD MISSING SUMMARY ENDPOINT
import { calculateCommission, getCommissionRate } from '../config/stripe.js'
import { createError } from '../error.js'
import Earnings from '../models/Earnings.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'

// Create earning when a referral subscribes
export const createSubscriptionEarning = async (
  referrerId,
  subscription,
  source = 'subscription_purchase'
) => {
  try {
    if (!referrerId || !subscription) {
      throw new Error('Referrer ID and subscription are required')
    }

    // Get referrer user
    const referrer = await User.findById(referrerId)
    if (!referrer) {
      throw new Error('Referrer not found')
    }

    // Get referred user
    const referredUser = await User.findById(subscription.user)
    if (!referredUser) {
      throw new Error('Referred user not found')
    }

    // Calculate commission
    const commissionRate = getCommissionRate(subscription.plan)
    const commissionAmount = calculateCommission(
      subscription.amount,
      subscription.plan
    )

    // Create earning record
    const earning = new Earnings({
      user: referrerId,
      referredUser: subscription.user,
      source,
      subscription: subscription._id,
      grossAmount: subscription.amount,
      commissionRate,
      commissionAmount,
      currency: subscription.currency || 'USD',
      status: 'pending', // Will be approved after trial period or payment
      description: `${
        source === 'subscription_renewal' ? 'Renewal' : 'Subscription'
      } commission for ${subscription.plan} plan`,
      metadata: {
        planType: subscription.plan,
        billingCycle: subscription.billingCycle,
      },
    })

    await earning.save()

    // Update referrer's referral stats
    const existingReferral = referrer.referrals.find(
      (ref) => ref.user.toString() === subscription.user.toString()
    )

    if (existingReferral && !existingReferral.hasSubscribed) {
      existingReferral.hasSubscribed = true
      existingReferral.subscriptionValue = subscription.amount
      referrer.referralStats.paidReferrals += 1
      referrer.referralStats.conversionRate =
        (referrer.referralStats.paidReferrals /
          referrer.referralStats.totalReferrals) *
        100
      await referrer.save()
    }

    return earning
  } catch (error) {
    console.error('Error creating subscription earning:', error)
    throw error
  }
}

// Auto-approve earnings after trial period or successful payment
export const autoApproveEarning = async (earningId) => {
  try {
    const earning = await Earnings.findById(earningId)
    if (!earning || earning.status !== 'pending') {
      return false
    }

    // Auto-approve after successful payment
    await earning.approve()

    // Update user earnings info
    const user = await User.findById(earning.user)
    if (user) {
      await user.updateEarningsInfo()
    }

    return true
  } catch (error) {
    console.error('Error auto-approving earning:', error)
    throw error
  }
}

// Get earnings summary/stats - NEW ENDPOINT
export const getEarningsSummary = async (req, res, next) => {
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
    next(createError(500, 'Failed to retrieve earnings summary'))
  }
}

// Get user's earnings with filtering
export const getUserEarnings = async (req, res, next) => {
  try {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status
    const source = req.query.source
    const startDate = req.query.startDate
    const endDate = req.query.endDate

    // Build filter
    const filter = { user: userId }

    if (status) filter.status = status
    if (source) filter.source = source
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    // Get earnings
    const earnings = await Earnings.find(filter)
      .populate('referredUser', 'name email')
      .populate('subscription', 'plan billingCycle status')
      .populate('payout', 'status paidAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalEarnings = await Earnings.countDocuments(filter)

    // Get summary for this filter
    const summary = await Earnings.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    const summaryFormatted = {
      pending: { total: 0, count: 0 },
      approved: { total: 0, count: 0 },
      paid: { total: 0, count: 0 },
      disputed: { total: 0, count: 0 },
      cancelled: { total: 0, count: 0 },
    }

    summary.forEach((item) => {
      if (summaryFormatted[item._id]) {
        summaryFormatted[item._id] = {
          total: item.total,
          count: item.count,
          formatted: (item.total / 100).toFixed(2),
        }
      }
    })

    res.status(200).json({
      status: 'success',
      results: earnings.length,
      totalResults: totalEarnings,
      totalPages: Math.ceil(totalEarnings / limit),
      currentPage: page,
      data: {
        earnings,
        summary: summaryFormatted,
      },
    })
  } catch (error) {
    console.error('Error getting user earnings:', error)
    next(createError(500, 'Failed to retrieve earnings'))
  }
}

// Get earnings details
export const getEarningDetails = async (req, res, next) => {
  try {
    const { earningId } = req.params
    const userId = req.user._id

    const earning = await Earnings.findOne({
      _id: earningId,
      user: userId,
    })
      .populate('referredUser', 'name email createdAt')
      .populate(
        'subscription',
        'plan billingCycle status currentPeriodStart currentPeriodEnd'
      )
      .populate('payout', 'status amount paidAt')

    if (!earning) {
      return next(createError(404, 'Earning not found'))
    }

    res.status(200).json({
      status: 'success',
      data: {
        earning,
      },
    })
  } catch (error) {
    console.error('Error getting earning details:', error)
    next(createError(500, 'Failed to retrieve earning details'))
  }
}

// Admin: Get all earnings
export const getAllEarnings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status
    const source = req.query.source
    const userId = req.query.userId
    const startDate = req.query.startDate
    const endDate = req.query.endDate

    // Build filter
    const filter = {}

    if (status) filter.status = status
    if (source) filter.source = source
    if (userId) filter.user = userId
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) filter.createdAt.$gte = new Date(startDate)
      if (endDate) filter.createdAt.$lte = new Date(endDate)
    }

    const earnings = await Earnings.find(filter)
      .populate('user', 'name email referralCode')
      .populate('referredUser', 'name email')
      .populate('subscription', 'plan billingCycle status')
      .populate('payout', 'status paidAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalEarnings = await Earnings.countDocuments(filter)

    res.status(200).json({
      status: 'success',
      results: earnings.length,
      totalResults: totalEarnings,
      totalPages: Math.ceil(totalEarnings / limit),
      currentPage: page,
      data: {
        earnings,
      },
    })
  } catch (error) {
    console.error('Error getting all earnings:', error)
    next(createError(500, 'Failed to retrieve earnings'))
  }
}

// Admin: Approve earning
export const approveEarning = async (req, res, next) => {
  try {
    const { earningId } = req.params
    const adminId = req.user._id

    const earning = await Earnings.findById(earningId).populate(
      'user',
      'name email'
    )

    if (!earning) {
      return next(createError(404, 'Earning not found'))
    }

    if (earning.status !== 'pending') {
      return next(createError(400, 'Only pending earnings can be approved'))
    }

    await earning.approve(adminId)

    // Update user earnings info
    const user = await User.findById(earning.user._id)
    if (user) {
      await user.updateEarningsInfo()
    }

    res.status(200).json({
      status: 'success',
      data: {
        earning,
        message: 'Earning approved successfully',
      },
    })
  } catch (error) {
    console.error('Error approving earning:', error)
    next(createError(500, 'Failed to approve earning'))
  }
}

// Admin: Bulk approve earnings
export const bulkApproveEarnings = async (req, res, next) => {
  try {
    const { earningIds } = req.body
    const adminId = req.user._id

    if (!earningIds || !Array.isArray(earningIds) || earningIds.length === 0) {
      return next(createError(400, 'Earning IDs array is required'))
    }

    // Get pending earnings
    const earnings = await Earnings.find({
      _id: { $in: earningIds },
      status: 'pending',
    })

    if (earnings.length === 0) {
      return next(createError(400, 'No pending earnings found'))
    }

    // Approve all earnings
    const approvalPromises = earnings.map((earning) => earning.approve(adminId))
    await Promise.all(approvalPromises)

    // Update users' earnings info
    const userIds = [...new Set(earnings.map((e) => e.user.toString()))]
    const userUpdatePromises = userIds.map(async (userId) => {
      const user = await User.findById(userId)
      if (user) {
        return user.updateEarningsInfo()
      }
    })
    await Promise.all(userUpdatePromises)

    res.status(200).json({
      status: 'success',
      data: {
        approvedCount: earnings.length,
        message: `${earnings.length} earnings approved successfully`,
      },
    })
  } catch (error) {
    console.error('Error bulk approving earnings:', error)
    next(createError(500, 'Failed to bulk approve earnings'))
  }
}

// Admin: Dispute earning
export const disputeEarning = async (req, res, next) => {
  try {
    const { earningId } = req.params
    const { reason } = req.body

    if (!reason) {
      return next(createError(400, 'Dispute reason is required'))
    }

    const earning = await Earnings.findById(earningId).populate(
      'user',
      'name email'
    )

    if (!earning) {
      return next(createError(404, 'Earning not found'))
    }

    if (['paid', 'disputed', 'cancelled'].includes(earning.status)) {
      return next(createError(400, 'Cannot dispute this earning'))
    }

    await earning.dispute(reason)

    // Update user earnings info
    const user = await User.findById(earning.user._id)
    if (user) {
      await user.updateEarningsInfo()
    }

    res.status(200).json({
      status: 'success',
      data: {
        earning,
        message: 'Earning disputed successfully',
      },
    })
  } catch (error) {
    console.error('Error disputing earning:', error)
    next(createError(500, 'Failed to dispute earning'))
  }
}

// Admin: Cancel earning
export const cancelEarning = async (req, res, next) => {
  try {
    const { earningId } = req.params
    const { reason } = req.body

    if (!reason) {
      return next(createError(400, 'Cancellation reason is required'))
    }

    const earning = await Earnings.findById(earningId).populate(
      'user',
      'name email'
    )

    if (!earning) {
      return next(createError(404, 'Earning not found'))
    }

    if (['paid', 'cancelled'].includes(earning.status)) {
      return next(createError(400, 'Cannot cancel this earning'))
    }

    await earning.cancel(reason)

    // Update user earnings info
    const user = await User.findById(earning.user._id)
    if (user) {
      await user.updateEarningsInfo()
    }

    res.status(200).json({
      status: 'success',
      data: {
        earning,
        message: 'Earning cancelled successfully',
      },
    })
  } catch (error) {
    console.error('Error cancelling earning:', error)
    next(createError(500, 'Failed to cancel earning'))
  }
}

// Get earnings analytics
export const getEarningsAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id
    const { period = '30' } = req.query // days

    const days = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Earnings over time
    const earningsOverTime = await Earnings.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          totalEarnings: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ])

    // Earnings by source
    const earningsBySource = await Earnings.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$source',
          totalEarnings: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    // Earnings by plan type
    const earningsByPlan = await Earnings.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: 'subscription',
          foreignField: '_id',
          as: 'subscriptionData',
        },
      },
      {
        $group: {
          _id: '$subscriptionData.plan',
          totalEarnings: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    // Top referring performance
    const topReferrals = await Earnings.aggregate([
      {
        $match: {
          user: userId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$referredUser',
          totalEarnings: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalEarnings: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userData',
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        period: `${days} days`,
        earningsOverTime: earningsOverTime.map((item) => ({
          date: `${item._id.year}-${String(item._id.month).padStart(
            2,
            '0'
          )}-${String(item._id.day).padStart(2, '0')}`,
          totalEarnings: item.totalEarnings,
          count: item.count,
          formatted: (item.totalEarnings / 100).toFixed(2),
        })),
        earningsBySource: earningsBySource.map((item) => ({
          source: item._id,
          totalEarnings: item.totalEarnings,
          count: item.count,
          formatted: (item.totalEarnings / 100).toFixed(2),
        })),
        earningsByPlan: earningsByPlan.map((item) => ({
          plan: item._id,
          totalEarnings: item.totalEarnings,
          count: item.count,
          formatted: (item.totalEarnings / 100).toFixed(2),
        })),
        topReferrals: topReferrals.map((item) => ({
          user: item.userData[0]
            ? {
                id: item.userData[0]._id,
                name: item.userData[0].name,
                email: item.userData[0].email,
              }
            : null,
          totalEarnings: item.totalEarnings,
          count: item.count,
          formatted: (item.totalEarnings / 100).toFixed(2),
        })),
      },
    })
  } catch (error) {
    console.error('Error getting earnings analytics:', error)
    next(createError(500, 'Failed to retrieve earnings analytics'))
  }
}
