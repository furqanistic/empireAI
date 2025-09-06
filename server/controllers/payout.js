// File: controllers/payout.js
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

// Create Stripe Connect account for user
export const createConnectAccountForUser = async (req, res, next) => {
  try {
    const { country = 'US' } = req.body
    const user = req.user

    // Check if user already has a Connect account
    if (user.stripeConnect?.accountId) {
      return next(createError(400, 'User already has a Connect account'))
    }

    // Validate country
    if (!CONNECT_CONFIG.supportedCountries.includes(country)) {
      return next(createError(400, `Country ${country} is not supported`))
    }

    // Create Connect account
    const account = await createConnectAccount(user, country)

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
        message: 'Connect account created successfully',
      },
    })
  } catch (error) {
    console.error('Error creating Connect account:', error)
    next(createError(500, `Failed to create Connect account: ${error.message}`))
  }
}

// Get Connect account onboarding link
export const getConnectOnboardingLink = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return next(createError(400, 'No Connect account found'))
    }

    // Check if onboarding is already completed
    if (user.stripeConnect.onboardingCompleted) {
      return next(createError(400, 'Onboarding already completed'))
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?setup=success`
    const refreshUrl = `${process.env.FRONTEND_URL}/dashboard/payouts?setup=refresh`

    const accountLink = await createAccountLink(
      user.stripeConnect.accountId,
      returnUrl,
      refreshUrl
    )

    res.status(200).json({
      status: 'success',
      data: {
        onboardingUrl: accountLink.url,
      },
    })
  } catch (error) {
    console.error('Error creating onboarding link:', error)
    next(createError(500, 'Failed to create onboarding link'))
  }
}

// Get Connect account status
export const getConnectAccountStatus = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeConnect?.accountId) {
      return res.status(200).json({
        status: 'success',
        data: {
          connected: false,
          message: 'No Connect account found',
        },
      })
    }

    // Sync with Stripe to get latest status
    try {
      const account = await retrieveConnectAccount(user.stripeConnect.accountId)
      await user.updateConnectAccountStatus(account)
    } catch (error) {
      console.error('Error syncing Connect account:', error)
      // Continue with cached data if sync fails
    }

    const connectStatus = {
      connected: true,
      accountId: user.stripeConnect.accountId,
      verified: user.stripeConnect.isVerified,
      onboardingCompleted: user.stripeConnect.onboardingCompleted,
      canReceivePayouts: user.canReceivePayouts(),
      requirements: user.stripeConnect.requirementsNeeded || [],
      capabilities: user.stripeConnect.capabilities,
      payoutSettings: user.stripeConnect.payoutSettings,
      minimumPayoutAmount: user.getMinimumPayoutAmount(),
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
