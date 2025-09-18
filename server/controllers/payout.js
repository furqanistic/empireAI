// File: controllers/payout.js - COMPLETE ROBUST VERSION
import { retrieveConnectAccount, stripe } from '../config/stripe.js'
import { createError } from '../error.js'
import Earnings from '../models/Earnings.js'
import Payout from '../models/Payout.js'
import User from '../models/User.js'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Safe earnings info update with fallback
const safeUpdateEarningsInfo = async (user) => {
  try {
    if (typeof user.updateEarningsInfo === 'function') {
      return await user.updateEarningsInfo()
    } else {
      // Fallback: manually calculate earnings if method doesn't exist
      console.log(
        'updateEarningsInfo method not found, using fallback calculation'
      )
      return await calculateEarningsInfoFallback(user._id)
    }
  } catch (error) {
    console.error('Error updating earnings info:', error)
    // Return safe defaults on error
    return {
      totalEarned: 0,
      availableForPayout: 0,
      pendingEarnings: 0,
      totalPaidOut: 0,
      lastUpdated: new Date(),
    }
  }
}

// Fallback method to calculate earnings info
const calculateEarningsInfoFallback = async (userId) => {
  try {
    const earningsData = await Earnings.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$commissionAmount' },
        },
      },
    ])

    const earningsInfo = {
      totalEarned: 0,
      availableForPayout: 0,
      pendingEarnings: 0,
      totalPaidOut: 0,
      lastUpdated: new Date(),
    }

    earningsData.forEach((item) => {
      switch (item._id) {
        case 'pending':
          earningsInfo.pendingEarnings = item.total
          break
        case 'approved':
          earningsInfo.availableForPayout = item.total
          break
        case 'paid':
          earningsInfo.totalPaidOut = item.total
          break
      }
      if (!['cancelled', 'disputed'].includes(item._id)) {
        earningsInfo.totalEarned += item.total
      }
    })

    return earningsInfo
  } catch (error) {
    console.error('Error in fallback earnings calculation:', error)
    return {
      totalEarned: 0,
      availableForPayout: 0,
      pendingEarnings: 0,
      totalPaidOut: 0,
      lastUpdated: new Date(),
    }
  }
}

// Safe Connect account validation
const validateConnectAccount = async (user) => {
  if (!user.stripeConnect?.accountId) {
    return { isValid: false, reason: 'no_account' }
  }

  try {
    const account = await retrieveConnectAccount(user.stripeConnect.accountId)
    return { isValid: true, account }
  } catch (error) {
    console.log(
      `Invalid Connect account for user ${user._id}: ${error.message}`
    )

    if (
      error.type === 'StripePermissionError' ||
      error.code === 'account_invalid'
    ) {
      try {
        // Safe reset of Connect account
        if (typeof user.safeResetConnectAccount === 'function') {
          await user.safeResetConnectAccount()
        } else {
          // Fallback reset
          user.stripeConnect = {
            accountId: null,
            isVerified: false,
            onboardingCompleted: false,
            capabilities: {},
            requirementsNeeded: [],
          }
          await user.save()
        }
        return { isValid: false, reason: 'account_invalid', wasReset: true }
      } catch (resetError) {
        console.error('Error resetting Connect account:', resetError)
        return { isValid: false, reason: 'reset_failed', error: resetError }
      }
    }
    throw error
  }
}

// Get account state for frontend
const getAccountState = (account, connectData) => {
  if (!account || !connectData?.accountId) return 'not_connected'
  if (connectData.isVerified && connectData.onboardingCompleted)
    return 'verified'
  if (connectData.onboardingCompleted && !connectData.isVerified)
    return 'verification_required'
  if (!connectData.onboardingCompleted) return 'onboarding_incomplete'
  return 'sync_error'
}

// Get action flags for frontend
const getActionFlags = (accountState, connectData) => ({
  canCreateAccount: accountState === 'not_connected',
  canRetryOnboarding: [
    'onboarding_incomplete',
    'verification_required',
  ].includes(accountState),
  canManageAccount: accountState === 'verified',
  canRequestPayout:
    accountState === 'verified' && connectData?.canReceivePayouts,
})

// Get status messages
const getStatusMessages = (accountState, requirements = []) => {
  const messages = {
    not_connected: {
      primary:
        'Connect your bank account to start receiving payouts for your referral commissions.',
      secondary: 'Quick and secure setup through Stripe.',
    },
    onboarding_incomplete: {
      primary: 'Complete your account setup to start receiving payouts.',
      secondary: `${requirements.length} items need to be completed.`,
    },
    verification_required: {
      primary: 'Additional verification required to enable payouts.',
      secondary: 'Please provide the requested information to continue.',
    },
    verified: {
      primary: 'Your payout account is active and ready to receive payments.',
      secondary: 'You can request payouts and manage your banking details.',
    },
    sync_error: {
      primary: 'There was an issue syncing your account status.',
      secondary: 'Please refresh or contact support if this persists.',
    },
  }
  return messages[accountState] || messages.sync_error
}

// Get status icon helper
const getStatusIcon = (state) => {
  switch (state) {
    case 'verified':
      return 'check'
    case 'sync_error':
      return 'alert-circle'
    default:
      return 'alert-circle'
  }
}

// ============================================================================
// STRIPE CONNECT ACCOUNT MANAGEMENT
// ============================================================================

// Get Connect account status
export const getConnectAccountStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const validation = await validateConnectAccount(user)

    if (!validation.isValid) {
      const accountState = 'not_connected'
      const actions = getActionFlags(accountState, null)
      const messages = getStatusMessages(accountState)

      return res.status(200).json({
        status: 'success',
        data: {
          connected: false,
          accountState,
          actions,
          messages,
          requirements: [],
          minimumPayoutAmount: 1000,
          hasAccount: false,
          isVerified: false,
          canReceivePayouts: false,
          needsOnboarding: true,
          wasReset: validation.wasReset || false,
        },
      })
    }

    const account = validation.account

    // Safe update of Connect account status
    try {
      if (typeof user.updateConnectAccountStatus === 'function') {
        await user.updateConnectAccountStatus(account)
      } else {
        console.log(
          'updateConnectAccountStatus method not found, skipping update'
        )
      }
    } catch (error) {
      console.error('Error updating Connect account status:', error)
    }

    // Refresh user data
    const updatedUser = await User.findById(user._id)
    const connectData = updatedUser.stripeConnect || {}

    const accountState = getAccountState(account, connectData)
    const canReceivePayouts =
      typeof updatedUser.canReceivePayouts === 'function'
        ? updatedUser.canReceivePayouts()
        : !!(connectData.isVerified && connectData.onboardingCompleted)

    const actions = getActionFlags(accountState, { canReceivePayouts })
    const messages = getStatusMessages(
      accountState,
      connectData.requirementsNeeded
    )

    const minimumPayoutAmount =
      typeof updatedUser.getMinimumPayoutAmount === 'function'
        ? updatedUser.getMinimumPayoutAmount()
        : 1000

    const responseData = {
      connected: true,
      accountState,
      accountId: account.id,
      actions,
      messages,
      requirements: connectData.requirementsNeeded || [],
      minimumPayoutAmount,
      hasAccount: true,
      isVerified: connectData.isVerified || false,
      canReceivePayouts,
      needsOnboarding: !connectData.onboardingCompleted,
      capabilities: connectData.capabilities || {},
      payoutSettings: connectData.payoutSettings || {},
      businessProfile: connectData.businessProfile || {},
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      lastUpdated: connectData.lastUpdated,
    }

    res.status(200).json({
      status: 'success',
      data: responseData,
    })
  } catch (error) {
    console.error('Error getting Connect account status:', error)
    next(createError(500, 'Failed to retrieve account status'))
  }
}

// Create Connect account for user
export const createConnectAccountForUser = async (req, res, next) => {
  try {
    const { country = 'US' } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    const validation = await validateConnectAccount(user)
    if (validation.isValid) {
      return next(createError(400, 'User already has a valid Connect account'))
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: country,
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: user._id.toString(),
        userEmail: user.email,
      },
    })

    // Safe update of user Connect info
    if (!user.stripeConnect) {
      user.stripeConnect = {}
    }

    user.stripeConnect.accountId = account.id
    user.stripeConnect.isVerified = false
    user.stripeConnect.onboardingCompleted = false
    user.stripeConnect.lastUpdated = new Date()

    await user.save()

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?onboarded=true`
    const refreshUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?refresh=true`

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    res.status(201).json({
      status: 'success',
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url,
        message: 'Connect account created successfully',
      },
    })
  } catch (error) {
    console.error('Error creating Connect account:', error)
    next(createError(500, 'Failed to create Connect account'))
  }
}

// Get onboarding link
export const getConnectOnboardingLink = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return next(createError(404, 'User not found'))

    const validation = await validateConnectAccount(user)
    if (!validation.isValid) {
      return next(
        createError(
          400,
          'No valid Connect account found. Please create one first.'
        )
      )
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?onboarded=true`
    const refreshUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?refresh=true`

    const accountLink = await stripe.accountLinks.create({
      account: validation.account.id,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    res.status(200).json({
      status: 'success',
      data: {
        url: accountLink.url,
        onboardingUrl: accountLink.url,
        expiresAt: accountLink.expires_at,
      },
    })
  } catch (error) {
    console.error('Error creating onboarding link:', error)
    next(createError(500, 'Failed to create onboarding link'))
  }
}

// Create account management link
export const createAccountManagementLink = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return next(createError(404, 'User not found'))

    const validation = await validateConnectAccount(user)
    if (!validation.isValid) {
      return next(createError(400, 'No valid Connect account found'))
    }

    if (!user.stripeConnect?.onboardingCompleted) {
      return next(
        createError(
          400,
          'Complete onboarding first before managing your account'
        )
      )
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/payouts`
    const loginLink = await stripe.accounts.createLoginLink(
      validation.account.id,
      {
        redirect_url: returnUrl,
      }
    )

    res.status(200).json({
      status: 'success',
      data: {
        url: loginLink.url,
        managementUrl: loginLink.url,
      },
    })
  } catch (error) {
    console.error('Error creating management link:', error)
    next(createError(500, 'Failed to create management link'))
  }
}

// Refresh Connect account status
export const refreshConnectAccountStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) return next(createError(404, 'User not found'))

    const validation = await validateConnectAccount(user)

    if (!validation.isValid) {
      return res.status(200).json({
        status: 'success',
        data: {
          hasAccount: false,
          connected: false,
          accountState: 'not_connected',
          message:
            validation.reason === 'account_invalid'
              ? 'Account was invalid and has been reset'
              : 'No Connect account found',
        },
      })
    }

    // Safe update of user Connect status
    try {
      if (typeof user.updateConnectAccountStatus === 'function') {
        await user.updateConnectAccountStatus(validation.account)
      }
    } catch (error) {
      console.error('Error updating Connect account status:', error)
    }

    const updatedUser = await User.findById(user._id)
    const connectData = updatedUser.stripeConnect || {}
    const accountState = getAccountState(validation.account, connectData)

    const canReceivePayouts =
      typeof updatedUser.canReceivePayouts === 'function'
        ? updatedUser.canReceivePayouts()
        : !!(connectData.isVerified && connectData.onboardingCompleted)

    res.status(200).json({
      status: 'success',
      data: {
        hasAccount: true,
        connected: true,
        accountState,
        isVerified: connectData.isVerified || false,
        canReceivePayouts,
        requirements: connectData.requirementsNeeded || [],
        capabilities: connectData.capabilities || {},
        lastUpdated: connectData.lastUpdated,
        message: 'Account status refreshed successfully',
      },
    })
  } catch (error) {
    console.error('Error refreshing Connect account status:', error)
    next(createError(500, 'Failed to refresh account status'))
  }
}

// Reset Connect account (for development/testing)
export const resetConnectAccount = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return next(
        createError(403, 'This operation is not allowed in production')
      )
    }

    const user = await User.findById(req.user._id)
    if (!user) return next(createError(404, 'User not found'))

    // Safe reset
    try {
      if (typeof user.safeResetConnectAccount === 'function') {
        await user.safeResetConnectAccount()
      } else {
        // Fallback reset
        user.stripeConnect = {
          accountId: null,
          isVerified: false,
          onboardingCompleted: false,
          capabilities: {},
          requirementsNeeded: [],
          payoutSettings: {
            schedule: 'manual',
            minimumAmount: 1000,
            currency: 'USD',
          },
        }
        await user.save()
      }
    } catch (error) {
      console.error('Error in reset operation:', error)
      return next(createError(500, 'Failed to reset Connect account'))
    }

    res.status(200).json({
      status: 'success',
      message: 'Connect account reset successfully',
    })
  } catch (error) {
    console.error('Error resetting Connect account:', error)
    next(createError(500, 'Failed to reset Connect account'))
  }
}

// Update payout settings
export const updatePayoutSettings = async (req, res, next) => {
  try {
    const { schedule, minimumAmount, currency } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    if (!user.stripeConnect?.accountId) {
      return next(createError(400, 'Connect account required'))
    }

    // Validate settings
    const validSchedules = ['manual', 'weekly', 'monthly']
    if (schedule && !validSchedules.includes(schedule)) {
      return next(createError(400, 'Invalid payout schedule'))
    }

    if (minimumAmount && minimumAmount < 1000) {
      return next(
        createError(400, 'Minimum payout amount must be at least $10.00')
      )
    }

    // Update settings
    if (!user.stripeConnect.payoutSettings) {
      user.stripeConnect.payoutSettings = {}
    }

    if (schedule) user.stripeConnect.payoutSettings.schedule = schedule
    if (minimumAmount)
      user.stripeConnect.payoutSettings.minimumAmount = minimumAmount
    if (currency) user.stripeConnect.payoutSettings.currency = currency

    user.stripeConnect.lastUpdated = new Date()
    await user.save()

    res.status(200).json({
      status: 'success',
      data: {
        payoutSettings: user.stripeConnect.payoutSettings,
        message: 'Payout settings updated successfully',
      },
    })
  } catch (error) {
    console.error('Error updating payout settings:', error)
    next(createError(500, 'Failed to update payout settings'))
  }
}

// Cleanup invalid Connect accounts (utility)
export const cleanupInvalidConnectAccounts = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production' && req.user.role !== 'admin') {
      return next(
        createError(403, 'This operation requires admin access in production')
      )
    }

    const usersWithConnectAccounts = await User.find({
      'stripeConnect.accountId': { $exists: true, $ne: null },
    })

    let cleanedCount = 0
    const results = []

    for (const user of usersWithConnectAccounts) {
      try {
        const validation = await validateConnectAccount(user)

        if (!validation.isValid && validation.wasReset) {
          cleanedCount++
          results.push({
            userId: user._id,
            email: user.email,
            oldAccountId: user.stripeConnect?.accountId,
            status: 'cleaned',
          })
        } else if (validation.isValid) {
          results.push({
            userId: user._id,
            email: user.email,
            accountId: user.stripeConnect?.accountId,
            status: 'valid',
          })
        }
      } catch (error) {
        results.push({
          userId: user._id,
          email: user.email,
          accountId: user.stripeConnect?.accountId,
          status: 'error',
          error: error.message,
        })
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalChecked: usersWithConnectAccounts.length,
        cleanedCount,
        results,
      },
      message: `Cleaned up ${cleanedCount} invalid Connect accounts`,
    })
  } catch (error) {
    console.error('Error cleaning up invalid Connect accounts:', error)
    next(createError(500, 'Failed to cleanup invalid Connect accounts'))
  }
}

// ============================================================================
// EARNINGS MANAGEMENT
// ============================================================================

// Get earnings summary
export const getEarningsSummary = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Safe update of earnings info
    const earningsInfo = await safeUpdateEarningsInfo(user)

    // Get detailed breakdown with error handling
    let summary
    try {
      summary = await Earnings.getEarningsSummary(req.user._id)
    } catch (error) {
      console.error('Error getting earnings summary, using fallback:', error)
      // Fallback summary calculation
      const earningsData = await Earnings.aggregate([
        { $match: { user: req.user._id } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$commissionAmount' },
          },
        },
      ])

      summary = {
        pending: { count: 0, total: 0 },
        approved: { count: 0, total: 0 },
        paid: { count: 0, total: 0 },
        disputed: { count: 0, total: 0 },
        cancelled: { count: 0, total: 0 },
      }

      earningsData.forEach((item) => {
        if (summary[item._id]) {
          summary[item._id] = { count: item.count, total: item.total }
        }
      })
    }

    // Get recent earnings with error handling
    let recentEarnings = []
    try {
      recentEarnings = await Earnings.find({ user: req.user._id })
        .populate('referredUser', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
    } catch (error) {
      console.error('Error getting recent earnings:', error)
      recentEarnings = []
    }

    // Safe method calls with fallbacks
    const canReceivePayouts =
      typeof user.canReceivePayouts === 'function'
        ? user.canReceivePayouts()
        : !!(user.stripeConnect?.accountId && user.stripeConnect?.isVerified)

    const minimumPayout =
      typeof user.getMinimumPayoutAmount === 'function'
        ? user.getMinimumPayoutAmount()
        : 1000 // Default $10.00

    // Format earnings info safely
    const formattedEarnings = {
      totalEarned: ((earningsInfo.totalEarned || 0) / 100).toFixed(2),
      availableForPayout: (
        (earningsInfo.availableForPayout || 0) / 100
      ).toFixed(2),
      pendingEarnings: ((earningsInfo.pendingEarnings || 0) / 100).toFixed(2),
      totalPaidOut: ((earningsInfo.totalPaidOut || 0) / 100).toFixed(2),
      currency: 'USD',
    }

    // Format summary safely
    const formattedSummary = {
      ...summary,
      formatted: {
        pending: ((summary.pending?.total || 0) / 100).toFixed(2),
        approved: ((summary.approved?.total || 0) / 100).toFixed(2),
        paid: ((summary.paid?.total || 0) / 100).toFixed(2),
      },
    }

    const responseData = {
      summary: formattedSummary,
      userEarningsInfo: formattedEarnings,
      canReceivePayouts,
      minimumPayout,
      recentEarnings,
    }

    res.status(200).json({
      status: 'success',
      data: responseData,
    })
  } catch (error) {
    console.error('Error getting earnings summary:', error)
    next(createError(500, 'Failed to retrieve earnings summary'))
  }
}

// Get user earnings
export const getUserEarnings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status
    const skip = (page - 1) * limit

    const query = { user: req.user._id }
    if (status) {
      query.status = status
    }

    const earnings = await Earnings.find(query)
      .populate('referredUser', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalEarnings = await Earnings.countDocuments(query)

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
    console.error('Error getting user earnings:', error)
    next(createError(500, 'Failed to retrieve earnings'))
  }
}

// Get earning details
export const getEarningDetails = async (req, res, next) => {
  try {
    const { earningId } = req.params

    const earning = await Earnings.findOne({
      _id: earningId,
      user: req.user._id,
    })
      .populate('user', 'name email')
      .populate('referredUser', 'name email')
      .populate('subscription', 'plan billingCycle amount')
      .populate('payout', 'status amount requestedAt')

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

// Get earnings analytics
export const getEarningsAnalytics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get earnings data
    const earningsData = await Earnings.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate },
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
          avgEarning: { $avg: '$commissionAmount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ])

    // Get status breakdown
    const statusBreakdown = await Earnings.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$commissionAmount' },
        },
      },
    ])

    // Get referral source breakdown
    const sourceBreakdown = await Earnings.aggregate([
      {
        $match: {
          user: req.user._id,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          total: { $sum: '$commissionAmount' },
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        period,
        dateRange: { startDate, endDate },
        earningsData,
        statusBreakdown,
        sourceBreakdown,
      },
    })
  } catch (error) {
    console.error('Error getting earnings analytics:', error)
    next(createError(500, 'Failed to retrieve earnings analytics'))
  }
}

// ============================================================================
// PAYOUT MANAGEMENT
// ============================================================================

// Request payout
export const requestPayout = async (req, res, next) => {
  try {
    const { amount, method = 'standard' } = req.body
    const user = await User.findById(req.user._id)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Validate Connect account
    const validation = await validateConnectAccount(user)
    if (!validation.isValid) {
      return next(
        createError(400, 'Valid Connect account required to request payouts')
      )
    }

    const canReceivePayouts =
      typeof user.canReceivePayouts === 'function'
        ? user.canReceivePayouts()
        : !!(
            user.stripeConnect?.isVerified &&
            user.stripeConnect?.onboardingCompleted
          )

    if (!canReceivePayouts) {
      return next(
        createError(400, 'Your account is not yet verified to receive payouts')
      )
    }

    if (!amount || amount <= 0) {
      return next(createError(400, 'Valid amount is required'))
    }

    const minimumPayout =
      typeof user.getMinimumPayoutAmount === 'function'
        ? user.getMinimumPayoutAmount()
        : 1000

    if (amount < minimumPayout) {
      return next(
        createError(400, `Minimum payout amount is ${minimumPayout / 100} USD`)
      )
    }

    // Update earnings info to get latest available amount
    await safeUpdateEarningsInfo(user)

    const availableAmount = user.earningsInfo?.availableForPayout || 0
    if (amount > availableAmount) {
      return next(
        createError(400, 'Insufficient available earnings for payout')
      )
    }

    // Get approved earnings to include in payout
    const approvedEarnings = await Earnings.find({
      user: req.user._id,
      status: 'approved',
      payout: { $exists: false },
    }).sort({ createdAt: 1 })

    let totalAvailable = 0
    const earningsToInclude = []

    for (const earning of approvedEarnings) {
      if (totalAvailable + earning.commissionAmount <= amount) {
        earningsToInclude.push(earning._id)
        totalAvailable += earning.commissionAmount
      } else {
        break
      }
    }

    if (totalAvailable < amount) {
      return next(
        createError(
          400,
          'Not enough approved earnings available for this payout amount'
        )
      )
    }

    // Create payout request
    const payout = new Payout({
      user: req.user._id,
      amount: totalAvailable,
      currency: user.stripeConnect?.payoutSettings?.currency || 'USD',
      stripeConnectAccountId: user.stripeConnect.accountId,
      earnings: earningsToInclude,
      method,
    })

    await payout.save()

    // Mark earnings as being processed
    await Earnings.updateMany(
      { _id: { $in: earningsToInclude } },
      { payout: payout._id }
    )

    // Update user earnings info
    await safeUpdateEarningsInfo(user)

    await payout.populate('earnings', 'source commissionAmount description')

    res.status(201).json({
      status: 'success',
      data: {
        payout,
        message: 'Payout request created successfully',
      },
    })
  } catch (error) {
    console.error('Error requesting payout:', error)
    next(createError(500, 'Failed to create payout request'))
  }
}

// Get payout history
export const getPayoutHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const status = req.query.status

    const payouts = await Payout.getUserPayoutHistory(
      req.user._id,
      limit * page,
      status
    )

    const skip = (page - 1) * limit
    const paginatedPayouts = payouts.slice(skip, skip + limit)

    res.status(200).json({
      status: 'success',
      results: paginatedPayouts.length,
      data: {
        payouts: paginatedPayouts,
        pagination: {
          currentPage: page,
          hasMore: payouts.length > skip + limit,
        },
      },
    })
  } catch (error) {
    console.error('Error getting payout history:', error)
    next(createError(500, 'Failed to retrieve payout history'))
  }
}

// Cancel payout request
export const cancelPayoutRequest = async (req, res, next) => {
  try {
    const { payoutId } = req.params

    const payout = await Payout.findOne({
      _id: payoutId,
      user: req.user._id,
    })

    if (!payout) {
      return next(createError(404, 'Payout not found'))
    }

    if (payout.status !== 'pending') {
      return next(createError(400, 'Can only cancel pending payouts'))
    }

    await payout.cancel('Cancelled by user')

    // Release earnings back to available
    await Earnings.updateMany(
      { _id: { $in: payout.earnings } },
      { $unset: { payout: 1 } }
    )

    // Update user earnings info
    const user = await User.findById(req.user._id)
    await safeUpdateEarningsInfo(user)

    res.status(200).json({
      status: 'success',
      message: 'Payout request cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling payout:', error)
    next(createError(500, 'Failed to cancel payout request'))
  }
}

// ============================================================================
// ADMIN FUNCTIONS
// ============================================================================

// Get all earnings (admin)
export const getAllEarnings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status
    const skip = (page - 1) * limit

    const query = {}
    if (status) {
      query.status = status
    }

    const earnings = await Earnings.find(query)
      .populate('user', 'name email')
      .populate('referredUser', 'name email')
      .populate('subscription', 'plan billingCycle amount')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalEarnings = await Earnings.countDocuments(query)

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

// Approve earning (admin)
export const approveEarning = async (req, res, next) => {
  try {
    const { earningId } = req.params
    const { notes } = req.body

    const earning = await Earnings.findById(earningId)

    if (!earning) {
      return next(createError(404, 'Earning not found'))
    }

    if (earning.status !== 'pending') {
      return next(createError(400, 'Can only approve pending earnings'))
    }

    earning.status = 'approved'
    earning.approvedAt = new Date()
    earning.approvedBy = req.user._id
    if (notes) earning.adminNotes = notes

    await earning.save()

    // Update user earnings info
    const user = await User.findById(earning.user)
    if (user) {
      await safeUpdateEarningsInfo(user)
    }

    await earning.populate([
      { path: 'user', select: 'name email' },
      { path: 'referredUser', select: 'name email' },
      { path: 'approvedBy', select: 'name email' },
    ])

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

// Bulk approve earnings (admin)
export const bulkApproveEarnings = async (req, res, next) => {
  try {
    const { earningIds, notes } = req.body

    if (!earningIds || !Array.isArray(earningIds) || earningIds.length === 0) {
      return next(createError(400, 'earningIds array is required'))
    }

    const updateData = {
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user._id,
    }

    if (notes) {
      updateData.adminNotes = notes
    }

    const result = await Earnings.updateMany(
      {
        _id: { $in: earningIds },
        status: 'pending',
      },
      updateData
    )

    // Update earnings info for affected users
    const earnings = await Earnings.find({ _id: { $in: earningIds } }).distinct(
      'user'
    )
    for (const userId of earnings) {
      const user = await User.findById(userId)
      if (user) {
        await safeUpdateEarningsInfo(user)
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        approved: result.modifiedCount,
        message: `${result.modifiedCount} earnings approved successfully`,
      },
    })
  } catch (error) {
    console.error('Error bulk approving earnings:', error)
    next(createError(500, 'Failed to bulk approve earnings'))
  }
}

// Dispute earning (admin)
export const disputeEarning = async (req, res, next) => {
  try {
    const { earningId } = req.params
    const { reason, notes } = req.body

    if (!reason) {
      return next(createError(400, 'Dispute reason is required'))
    }

    const earning = await Earnings.findById(earningId)

    if (!earning) {
      return next(createError(404, 'Earning not found'))
    }

    earning.status = 'disputed'
    earning.disputedAt = new Date()
    earning.disputedBy = req.user._id
    earning.disputeReason = reason
    if (notes) earning.adminNotes = notes

    await earning.save()

    // Update user earnings info
    const user = await User.findById(earning.user)
    if (user) {
      await safeUpdateEarningsInfo(user)
    }

    await earning.populate([
      { path: 'user', select: 'name email' },
      { path: 'referredUser', select: 'name email' },
      { path: 'disputedBy', select: 'name email' },
    ])

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

// Cancel earning (admin)
export const cancelEarning = async (req, res, next) => {
  try {
    const { earningId } = req.params
    const { reason, notes } = req.body

    if (!reason) {
      return next(createError(400, 'Cancellation reason is required'))
    }

    const earning = await Earnings.findById(earningId)

    if (!earning) {
      return next(createError(404, 'Earning not found'))
    }

    if (earning.status === 'paid') {
      return next(createError(400, 'Cannot cancel paid earnings'))
    }

    earning.status = 'cancelled'
    earning.cancelledAt = new Date()
    earning.cancelledBy = req.user._id
    earning.cancellationReason = reason
    if (notes) earning.adminNotes = notes

    await earning.save()

    // Update user earnings info
    const user = await User.findById(earning.user)
    if (user) {
      await safeUpdateEarningsInfo(user)
    }

    await earning.populate([
      { path: 'user', select: 'name email' },
      { path: 'referredUser', select: 'name email' },
      { path: 'cancelledBy', select: 'name email' },
    ])

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

// Get all payouts (admin)
export const getAllPayouts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status
    const skip = (page - 1) * limit

    const query = {}
    if (status) {
      query.status = status
    }

    const payouts = await Payout.find(query)
      .populate('user', 'name email stripeConnect.accountId')
      .populate('earnings', 'source commissionAmount description')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    const totalPayouts = await Payout.countDocuments(query)

    res.status(200).json({
      status: 'success',
      results: payouts.length,
      totalResults: totalPayouts,
      totalPages: Math.ceil(totalPayouts / limit),
      currentPage: page,
      data: {
        payouts,
      },
    })
  } catch (error) {
    console.error('Error getting all payouts:', error)
    next(createError(500, 'Failed to retrieve payouts'))
  }
}

// Process payout (admin)
export const processPayout = async (req, res, next) => {
  try {
    const { payoutId } = req.params

    const payout = await Payout.findById(payoutId)
      .populate('user')
      .populate('earnings')

    if (!payout) {
      return next(createError(404, 'Payout not found'))
    }

    if (payout.status !== 'pending') {
      return next(createError(400, 'Can only process pending payouts'))
    }

    // Create transfer to Connect account
    const transfer = await stripe.transfers.create({
      amount: payout.netAmount,
      currency: payout.currency.toLowerCase(),
      destination: payout.stripeConnectAccountId,
      metadata: {
        payoutId: payout._id.toString(),
        userId: payout.user._id.toString(),
      },
    })

    // Update payout with transfer info
    await payout.markAsProcessing(null, req.user._id)
    payout.stripeTransferId = transfer.id
    await payout.save()

    // Mark earnings as paid
    await Earnings.updateMany(
      { _id: { $in: payout.earnings.map((e) => e._id) } },
      {
        status: 'paid',
        paidAt: new Date(),
      }
    )

    // Update user earnings info
    await safeUpdateEarningsInfo(payout.user)

    res.status(200).json({
      status: 'success',
      data: {
        payout,
        transfer,
        message: 'Payout processed successfully',
      },
    })
  } catch (error) {
    console.error('Error processing payout:', error)
    next(createError(500, 'Failed to process payout'))
  }
}

// Get payout statistics (admin)
export const getPayoutStatistics = async (req, res, next) => {
  try {
    const { period = '30d' } = req.query

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Get payout statistics
    const stats = await Payout.getPayoutStats({
      start: startDate,
      end: endDate,
    })

    // Get earnings statistics
    const earningsStats = await Earnings.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$commissionAmount' },
        },
      },
    ])

    // Get top earners
    let topEarners = []
    try {
      topEarners = await User.getTopEarners(10, period)
    } catch (error) {
      console.error('Error getting top earners:', error)
    }

    res.status(200).json({
      status: 'success',
      data: {
        period,
        dateRange: { startDate, endDate },
        payoutStats: stats,
        earningsStats,
        topEarners,
      },
    })
  } catch (error) {
    console.error('Error getting payout statistics:', error)
    next(createError(500, 'Failed to retrieve payout statistics'))
  }
}
