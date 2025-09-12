// File: controllers/payout.js - COMPLETE FINAL VERSION WITH ERROR HANDLING
import {
  CONNECT_CONFIG,
  createAccountLink,
  createConnectAccount,
  retrieveConnectAccount,
  stripe,
  validateMinimumPayout,
} from '../config/stripe.js'
import { createError } from '../error.js'
import Earnings from '../models/Earnings.js'
import Payout from '../models/Payout.js'
import User from '../models/User.js'

// Helper function to get status messages
const getStatusMessage = (accountState, hasRequirements) => {
  switch (accountState) {
    case 'onboarding_incomplete':
      return 'Please complete your account setup to receive payouts'
    case 'verification_required':
      return 'Additional information required for verification'
    case 'pending_verification':
      return 'Account verification in progress'
    case 'verified':
      return 'Account verified and ready for payouts'
    case 'sync_error':
      return 'Unable to sync account status. This may be a temporary issue.'
    default:
      return 'Account status unknown'
  }
}

// Create Stripe Connect account for user - IMPROVED WITH ERROR HANDLING
export const createConnectAccountForUser = async (req, res, next) => {
  try {
    const { country = 'US' } = req.body
    const user = req.user

    // Check if user already has a VERIFIED Connect account
    if (user.stripeConnect?.accountId && user.stripeConnect.isVerified) {
      return next(
        createError(400, 'User already has a verified Connect account')
      )
    }

    // Validate country
    if (!CONNECT_CONFIG.supportedCountries.includes(country)) {
      return next(createError(400, `Country ${country} is not supported`))
    }

    let account
    let isNewAccount = false

    // If user has partial account, try to retrieve it first
    if (user.stripeConnect?.accountId) {
      try {
        account = await retrieveConnectAccount(user.stripeConnect.accountId)
        console.log('Retrieved existing Connect account:', account.id)
      } catch (error) {
        console.log(
          'Existing account not found or inaccessible, creating new one'
        )

        // Reset invalid account data
        user.stripeConnect = {
          accountId: null,
          isVerified: false,
          onboardingCompleted: false,
          capabilities: {},
          requirementsNeeded: [],
        }
        await user.save()

        account = null
      }
    }

    // Create new account if needed
    if (!account) {
      account = await createConnectAccount(user, country)
      isNewAccount = true
      console.log('Created new Connect account:', account.id)
    }

    // Update user with Connect account info
    await user.updateConnectAccountStatus(account)

    // Create onboarding link
    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?setup=success`
    const refreshUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?setup=refresh`

    const accountLink = await createAccountLink(
      account.id,
      returnUrl,
      refreshUrl
    )

    res.status(200).json({
      status: 'success',
      data: {
        accountId: account.id,
        onboardingUrl: accountLink.url,
        isNewAccount,
        message: isNewAccount
          ? 'Connect account created successfully'
          : 'Resuming Connect account setup',
      },
    })
  } catch (error) {
    console.error('Error creating Connect account:', error)
    next(createError(500, `Failed to create Connect account: ${error.message}`))
  }
}

// Get Connect account onboarding link - IMPROVED
export const getConnectOnboardingLink = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return next(
        createError(400, 'No Connect account found. Please create one first.')
      )
    }

    // Always allow re-onboarding if not completed or not verified
    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?setup=success`
    const refreshUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?setup=refresh`

    try {
      const accountLink = await createAccountLink(
        user.stripeConnect.accountId,
        returnUrl,
        refreshUrl
      )

      res.status(200).json({
        status: 'success',
        data: {
          onboardingUrl: accountLink.url,
          message: 'Onboarding link created',
        },
      })
    } catch (error) {
      // If account is invalid, reset it
      if (
        error.code === 'account_invalid' ||
        error.type === 'StripePermissionError'
      ) {
        user.stripeConnect = {
          accountId: null,
          isVerified: false,
          onboardingCompleted: false,
          capabilities: {},
          requirementsNeeded: [],
        }
        await user.save()

        return next(
          createError(
            400,
            'Account was invalid and has been reset. Please create a new account.'
          )
        )
      }

      throw error
    }
  } catch (error) {
    console.error('Error creating onboarding link:', error)
    next(createError(500, 'Failed to create onboarding link'))
  }
}

// Create account management link (for updating bank details)
export const createAccountManagementLink = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return next(createError(400, 'No Connect account found'))
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/payouts`

    try {
      // Create account link for account update
      const accountLink = await stripe.accountLinks.create({
        account: user.stripeConnect.accountId,
        refresh_url: returnUrl,
        return_url: returnUrl,
        type: 'account_update',
      })

      res.status(200).json({
        status: 'success',
        data: {
          managementUrl: accountLink.url,
          message: 'Account management link created',
        },
      })
    } catch (error) {
      // If account is invalid, reset it
      if (
        error.code === 'account_invalid' ||
        error.type === 'StripePermissionError'
      ) {
        user.stripeConnect = {
          accountId: null,
          isVerified: false,
          onboardingCompleted: false,
          capabilities: {},
          requirementsNeeded: [],
        }
        await user.save()

        return next(
          createError(
            400,
            'Account was invalid and has been reset. Please create a new account.'
          )
        )
      }

      throw error
    }
  } catch (error) {
    console.error('Error creating management link:', error)
    next(createError(500, 'Failed to create account management link'))
  }
}

// Get Connect account status - IMPROVED WITH ERROR HANDLING
export const getConnectAccountStatus = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return res.status(200).json({
        status: 'success',
        data: {
          connected: false,
          needsSetup: true,
          message: 'No Connect account found',
          actions: {
            canCreateAccount: true,
            canRetryOnboarding: false,
            canManageAccount: false,
          },
        },
      })
    }

    let account = null
    let syncError = false
    let shouldResetAccount = false

    // Sync with Stripe to get latest status
    try {
      account = await retrieveConnectAccount(user.stripeConnect.accountId)
      await user.updateConnectAccountStatus(account)
    } catch (error) {
      console.error('Error syncing Connect account:', error)
      syncError = true

      // Check if this is an invalid account error
      if (
        error.code === 'account_invalid' ||
        error.type === 'StripePermissionError' ||
        error.message?.includes('does not have access to account') ||
        error.message?.includes('account does not exist')
      ) {
        console.log(
          `Invalid Connect account detected for user ${user._id}: ${user.stripeConnect.accountId}`
        )
        shouldResetAccount = true
      }
      // Continue with cached data for other errors
    }

    // If account is invalid, reset it and return setup state
    if (shouldResetAccount) {
      console.log(`Resetting invalid Connect account for user ${user._id}`)

      // Reset user's Connect data
      user.stripeConnect = {
        accountId: null,
        isVerified: false,
        onboardingCompleted: false,
        capabilities: {},
        requirementsNeeded: [],
      }

      await user.save()

      return res.status(200).json({
        status: 'success',
        data: {
          connected: false,
          needsSetup: true,
          accountReset: true,
          message: 'Previous account was invalid and has been reset',
          actions: {
            canCreateAccount: true,
            canRetryOnboarding: false,
            canManageAccount: false,
          },
        },
      })
    }

    // Determine account state
    const hasRequirements = user.stripeConnect.requirementsNeeded?.length > 0
    const isVerified = user.stripeConnect.isVerified
    const onboardingCompleted = user.stripeConnect.onboardingCompleted
    const canReceivePayouts = user.canReceivePayouts()

    let accountState = 'unknown'
    let needsAction = true

    if (syncError && !shouldResetAccount) {
      accountState = 'sync_error'
    } else if (!onboardingCompleted) {
      accountState = 'onboarding_incomplete'
    } else if (hasRequirements) {
      accountState = 'verification_required'
    } else if (isVerified && canReceivePayouts) {
      accountState = 'verified'
      needsAction = false
    } else {
      accountState = 'pending_verification'
    }

    const connectStatus = {
      connected: true,
      accountId: user.stripeConnect.accountId,
      verified: isVerified,
      onboardingCompleted,
      canReceivePayouts,
      accountState,
      needsAction,
      syncError,
      requirements: user.stripeConnect.requirementsNeeded || [],
      capabilities: user.stripeConnect.capabilities,
      payoutSettings: user.stripeConnect.payoutSettings,
      minimumPayoutAmount: user.getMinimumPayoutAmount(),
      actions: {
        canCreateAccount: false,
        canRetryOnboarding: !onboardingCompleted || hasRequirements,
        canManageAccount: onboardingCompleted && !syncError,
        canRequestPayout: canReceivePayouts && !syncError,
      },
      messages: {
        primary: getStatusMessage(accountState, hasRequirements),
        requirements: hasRequirements
          ? `Please complete: ${user.stripeConnect.requirementsNeeded.join(
              ', '
            )}`
          : null,
        syncError:
          syncError && !shouldResetAccount
            ? 'Unable to sync with Stripe. Account data may be outdated.'
            : null,
      },
    }

    res.status(200).json({
      status: 'success',
      data: connectStatus,
    })
  } catch (error) {
    console.error('Error getting Connect account status:', error)
    next(createError(500, 'Failed to retrieve account status'))
  }
}

// Force refresh account status
export const refreshConnectAccountStatus = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return next(createError(400, 'No Connect account found'))
    }

    // Force refresh from Stripe
    try {
      const account = await retrieveConnectAccount(user.stripeConnect.accountId)
      await user.updateConnectAccountStatus(account)
    } catch (error) {
      // Handle invalid account during refresh
      if (
        error.code === 'account_invalid' ||
        error.type === 'StripePermissionError'
      ) {
        user.stripeConnect = {
          accountId: null,
          isVerified: false,
          onboardingCompleted: false,
          capabilities: {},
          requirementsNeeded: [],
        }
        await user.save()

        return next(
          createError(
            400,
            'Account was invalid and has been reset. Please create a new account.'
          )
        )
      }
      throw error
    }

    // Return updated status
    return getConnectAccountStatus(req, res, next)
  } catch (error) {
    console.error('Error refreshing Connect account status:', error)
    next(createError(500, 'Failed to refresh account status'))
  }
}

// Delete/Reset Connect account (for testing)
export const resetConnectAccount = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return next(createError(400, 'No Connect account to reset'))
    }

    // In test mode, we can delete the account
    if (process.env.NODE_ENV !== 'production') {
      try {
        await stripe.accounts.del(user.stripeConnect.accountId)
      } catch (error) {
        console.log('Error deleting Stripe account:', error.message)
        // Continue even if deletion fails
      }
    }

    // Reset user's Connect data
    user.stripeConnect = {
      accountId: null,
      isVerified: false,
      onboardingCompleted: false,
      capabilities: {},
      requirementsNeeded: [],
    }

    await user.save()

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Connect account reset successfully',
      },
    })
  } catch (error) {
    console.error('Error resetting Connect account:', error)
    next(createError(500, 'Failed to reset Connect account'))
  }
}

// Helper function to clean up invalid Connect accounts (Admin/Dev utility)
export const cleanupInvalidConnectAccounts = async (req, res, next) => {
  try {
    // Only allow in development or for admins
    if (process.env.NODE_ENV === 'production' && req.user.role !== 'admin') {
      return next(createError(403, 'Not authorized'))
    }

    const usersWithConnect = await User.find({
      'stripeConnect.accountId': { $exists: true, $ne: null },
    })

    let cleanedCount = 0
    let validCount = 0

    console.log(`Found ${usersWithConnect.length} users with Connect accounts`)

    for (const user of usersWithConnect) {
      try {
        // Try to retrieve the account
        await retrieveConnectAccount(user.stripeConnect.accountId)
        validCount++
      } catch (error) {
        if (
          error.code === 'account_invalid' ||
          error.type === 'StripePermissionError' ||
          error.message?.includes('does not have access to account') ||
          error.message?.includes('account does not exist')
        ) {
          console.log(
            `Cleaning up invalid account for user ${user._id}: ${user.stripeConnect.accountId}`
          )

          // Reset user's Connect data
          user.stripeConnect = {
            accountId: null,
            isVerified: false,
            onboardingCompleted: false,
            capabilities: {},
            requirementsNeeded: [],
          }

          await user.save()
          cleanedCount++
        }
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalChecked: usersWithConnect.length,
        validAccounts: validCount,
        cleanedAccounts: cleanedCount,
        message: `Cleanup complete: ${cleanedCount} invalid accounts reset, ${validCount} valid accounts found`,
      },
    })
  } catch (error) {
    console.error('Error during cleanup:', error)
    next(createError(500, 'Failed to cleanup invalid accounts'))
  }
}

// Update payout settings
export const updatePayoutSettings = async (req, res, next) => {
  try {
    const { schedule, minimumAmount, currency } = req.body
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return next(createError(400, 'No Connect account found'))
    }

    // Validate settings
    if (schedule && !['manual', 'weekly', 'monthly'].includes(schedule)) {
      return next(createError(400, 'Invalid payout schedule'))
    }

    if (minimumAmount && minimumAmount < 1000) {
      return next(
        createError(400, 'Minimum payout amount must be at least $10')
      )
    }

    // Update settings
    if (!user.stripeConnect.payoutSettings) {
      user.stripeConnect.payoutSettings = {}
    }

    if (schedule) user.stripeConnect.payoutSettings.schedule = schedule
    if (minimumAmount)
      user.stripeConnect.payoutSettings.minimumAmount = minimumAmount
    if (currency)
      user.stripeConnect.payoutSettings.currency = currency.toUpperCase()

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

// Get user's earnings summary
export const getEarningsSummary = async (req, res, next) => {
  try {
    const user = req.user

    // Update earnings info
    await user.updateEarningsInfo()

    // Get detailed earnings summary
    const summary = await Earnings.getEarningsSummary(user._id)
    const recentEarnings = await Earnings.getRecentEarnings(user._id, 30, 10)
    const payableEarnings = await Earnings.getPayableEarnings(
      user._id,
      user.getMinimumPayoutAmount()
    )

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          ...summary,
          formatted: {
            pending: (summary.pending.total / 100).toFixed(2),
            approved: (summary.approved.total / 100).toFixed(2),
            paid: (summary.paid.total / 100).toFixed(2),
            total: (
              (summary.pending.total +
                summary.approved.total +
                summary.paid.total) /
              100
            ).toFixed(2),
          },
        },
        recentEarnings,
        payableEarnings,
        userEarningsInfo: user.formattedEarnings,
        canRequestPayout:
          payableEarnings.length > 0 && user.canReceivePayouts(),
      },
    })
  } catch (error) {
    console.error('Error getting earnings summary:', error)
    next(createError(500, 'Failed to retrieve earnings summary'))
  }
}

// Request a payout
export const requestPayout = async (req, res, next) => {
  try {
    const { amount, method = 'standard' } = req.body
    const user = req.user

    // Validate user can receive payouts
    if (!user.canReceivePayouts()) {
      return next(
        createError(
          400,
          'Account not eligible for payouts. Please complete verification.'
        )
      )
    }

    // Validate minimum amount
    const minimumAmount = user.getMinimumPayoutAmount()
    if (!amount || amount < minimumAmount) {
      return next(
        createError(
          400,
          `Minimum payout amount is ${minimumAmount / 100} ${
            user.stripeConnect.payoutSettings?.currency || 'USD'
          }`
        )
      )
    }

    // Check if user has enough approved earnings
    const approvedEarnings = await Earnings.getPayableEarnings(user._id)
    const totalApproved = approvedEarnings.reduce(
      (sum, earning) => sum + earning.commissionAmount,
      0
    )

    if (totalApproved < amount) {
      return next(
        createError(
          400,
          `Insufficient approved earnings. Available: ${(
            totalApproved / 100
          ).toFixed(2)}`
        )
      )
    }

    // Check for pending payouts
    const pendingPayouts = await Payout.find({
      user: user._id,
      status: { $in: ['pending', 'processing'] },
    })

    if (pendingPayouts.length > 0) {
      return next(createError(400, 'You have a pending payout request'))
    }

    // Select earnings for this payout (oldest first)
    const earningsForPayout = []
    let remainingAmount = amount

    for (const earning of approvedEarnings) {
      if (remainingAmount <= 0) break

      const earningAmount = Math.min(earning.commissionAmount, remainingAmount)
      earningsForPayout.push(earning._id)
      remainingAmount -= earningAmount
    }

    // Create payout request
    const payout = new Payout({
      user: user._id,
      amount,
      currency: user.stripeConnect.payoutSettings?.currency || 'USD',
      stripeConnectAccountId: user.stripeConnect.accountId,
      method,
      earnings: earningsForPayout,
      status: 'pending',
      requestedAt: new Date(),
    })

    // Calculate fees
    payout.calculateFees()
    await payout.save()

    // Mark earnings as part of this payout
    await Earnings.updateMany(
      { _id: { $in: earningsForPayout } },
      { payout: payout._id }
    )

    await payout.populate('earnings', 'source commissionAmount description')

    res.status(200).json({
      status: 'success',
      data: {
        payout,
        message: 'Payout request created successfully',
      },
    })
  } catch (error) {
    console.error('Error creating payout request:', error)
    next(createError(500, 'Failed to create payout request'))
  }
}

// Process a payout (Admin only)
export const processPayout = async (req, res, next) => {
  try {
    const { payoutId } = req.params
    const { approve } = req.body // true to approve, false to reject

    const payout = await Payout.findById(payoutId).populate(
      'user',
      'name email stripeConnect'
    )

    if (!payout) {
      return next(createError(404, 'Payout not found'))
    }

    if (payout.status !== 'pending') {
      return next(createError(400, 'Payout is not pending'))
    }

    if (!approve) {
      // Reject payout
      await payout.cancel('Rejected by admin')

      // Release earnings
      await Earnings.updateMany(
        { _id: { $in: payout.earnings } },
        { $unset: { payout: 1 } }
      )

      return res.status(200).json({
        status: 'success',
        data: {
          payout,
          message: 'Payout rejected',
        },
      })
    }

    // Approve and process payout
    try {
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

      // Create payout on Connect account
      const stripePayout = await stripe.payouts.create(
        {
          amount: payout.netAmount,
          currency: payout.currency.toLowerCase(),
          method: payout.method === 'instant' ? 'instant' : 'standard',
          metadata: {
            payoutId: payout._id.toString(),
            transferId: transfer.id,
          },
        },
        {
          stripeAccount: payout.stripeConnectAccountId,
        }
      )

      // Update payout record
      await payout.markAsProcessing(stripePayout.id, req.user._id)
      payout.stripeTransferId = transfer.id

      // Mark earnings as paid
      await Earnings.updateMany(
        { _id: { $in: payout.earnings } },
        {
          status: 'paid',
          paidAt: new Date(),
          stripeTransferId: transfer.id,
        }
      )

      // Update user earnings info
      await payout.user.updateEarningsInfo()

      await payout.save()
      await payout.populate('earnings', 'source commissionAmount description')

      res.status(200).json({
        status: 'success',
        data: {
          payout,
          transfer: {
            id: transfer.id,
            amount: transfer.amount,
          },
          stripePayout: {
            id: stripePayout.id,
            expectedArrival: stripePayout.arrival_date,
          },
          message: 'Payout processed successfully',
        },
      })
    } catch (stripeError) {
      console.error('Stripe error processing payout:', stripeError)

      // Mark payout as failed
      await payout.markAsFailed(stripeError.code, stripeError.message)

      // Release earnings
      await Earnings.updateMany(
        { _id: { $in: payout.earnings } },
        { $unset: { payout: 1 } }
      )

      return next(
        createError(500, `Failed to process payout: ${stripeError.message}`)
      )
    }
  } catch (error) {
    console.error('Error processing payout:', error)
    next(createError(500, 'Failed to process payout'))
  }
}

// Cancel a payout request
export const cancelPayoutRequest = async (req, res, next) => {
  try {
    const { payoutId } = req.params
    const user = req.user

    const payout = await Payout.findOne({
      _id: payoutId,
      user: user._id,
    })

    if (!payout) {
      return next(createError(404, 'Payout not found'))
    }

    if (payout.status !== 'pending') {
      return next(createError(400, 'Can only cancel pending payouts'))
    }

    // Cancel payout
    await payout.cancel('Cancelled by user')

    // Release earnings
    await Earnings.updateMany(
      { _id: { $in: payout.earnings } },
      { $unset: { payout: 1 } }
    )

    res.status(200).json({
      status: 'success',
      data: {
        payout,
        message: 'Payout cancelled successfully',
      },
    })
  } catch (error) {
    console.error('Error cancelling payout:', error)
    next(createError(500, 'Failed to cancel payout'))
  }
}

// Get payout history
export const getPayoutHistory = async (req, res, next) => {
  try {
    const user = req.user
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status

    const payouts = await Payout.getUserPayoutHistory(
      user._id,
      limit,
      status
    ).skip((page - 1) * limit)

    const totalPayouts = await Payout.countDocuments({
      user: user._id,
      ...(status && { status }),
    })

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
    console.error('Error getting payout history:', error)
    next(createError(500, 'Failed to retrieve payout history'))
  }
}

// Get all payouts (Admin only)
export const getAllPayouts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const status = req.query.status

    const filter = {}
    if (status) {
      filter.status = status
    }

    const payouts = await Payout.find(filter)
      .populate('user', 'name email stripeConnect.accountId')
      .populate('earnings', 'source commissionAmount description')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalPayouts = await Payout.countDocuments(filter)

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

// Get payout statistics (Admin only)
export const getPayoutStatistics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    let dateRange = null
    if (startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate),
      }
    }

    const stats = await Payout.getPayoutStats(dateRange)

    // Get additional metrics
    const totalUsers = await User.countDocuments({
      'stripeConnect.accountId': { $exists: true },
    })

    const verifiedUsers = await User.countDocuments({
      'stripeConnect.isVerified': true,
    })

    const totalEarnings = await Earnings.aggregate([
      ...(dateRange
        ? [
            {
              $match: {
                createdAt: { $gte: dateRange.start, $lte: dateRange.end },
              },
            },
          ]
        : []),
      {
        $group: {
          _id: null,
          total: { $sum: '$commissionAmount' },
          count: { $sum: 1 },
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        payoutStats: stats,
        userStats: {
          totalConnectedUsers: totalUsers,
          verifiedUsers,
          verificationRate:
            totalUsers > 0
              ? ((verifiedUsers / totalUsers) * 100).toFixed(2)
              : 0,
        },
        earningsStats: {
          totalEarnings: totalEarnings[0]?.total || 0,
          totalEarningsCount: totalEarnings[0]?.count || 0,
        },
        dateRange,
      },
    })
  } catch (error) {
    console.error('Error getting payout statistics:', error)
    next(createError(500, 'Failed to retrieve payout statistics'))
  }
}
