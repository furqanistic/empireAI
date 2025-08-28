// File: controllers/referral.js
import { createError } from '../error.js'
import User from '../models/User.js'
import NotificationService from '../services/notificationService.js'

// Get user's referral stats and information
export const getReferralStats = async (req, res, next) => {
  try {
    // If accessing /my-stats route, use current user's ID
    const userId = req.params.id || req.user.id

    const user = await User.findById(userId)
      .populate('referrals.user', 'name email createdAt isActive')
      .populate('referredBy', 'name email referralCode')

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Calculate additional stats
    const activeReferrals = user.referrals.filter(
      (ref) => ref.status === 'active'
    )
    const thisMonthReferrals = user.referrals.filter((ref) => {
      const refDate = new Date(ref.joinedAt)
      const now = new Date()
      return (
        refDate.getMonth() === now.getMonth() &&
        refDate.getFullYear() === now.getFullYear()
      )
    })

    const referralStats = {
      referralCode: user.referralCode,
      referralUrl: user.referralUrl,
      referralStats: user.referralStats,
      referredBy: user.referredBy,
      referrals: user.referrals,
      summary: {
        totalReferrals: user.referralStats.totalReferrals,
        activeReferrals: activeReferrals.length,
        thisMonthReferrals: thisMonthReferrals.length,
        totalRewards: user.referralStats.referralRewards,
        conversionRate:
          user.referralStats.totalReferrals > 0
            ? (
                (activeReferrals.length / user.referralStats.totalReferrals) *
                100
              ).toFixed(2) + '%'
            : '0%',
      },
    }

    res.status(200).json({
      status: 'success',
      data: {
        referralStats,
      },
    })
  } catch (error) {
    console.error('Error in getReferralStats:', error)
    next(error)
  }
}

// Validate a referral code
export const validateReferralCode = async (req, res, next) => {
  try {
    const { code } = req.params

    if (!code || code.trim().length < 3) {
      return next(createError(400, 'Please provide a valid referral code'))
    }

    const referrer = await User.findByReferralCode(
      code.trim().toUpperCase()
    ).select('name email referralCode createdAt')

    if (!referrer) {
      return res.status(200).json({
        status: 'success',
        data: {
          isValid: false,
          message: 'Invalid referral code',
        },
      })
    }

    res.status(200).json({
      status: 'success',
      data: {
        isValid: true,
        referrer: {
          name: referrer.name,
          referralCode: referrer.referralCode,
          memberSince: referrer.createdAt,
        },
        message: `You will be referred by ${referrer.name}`,
      },
    })
  } catch (error) {
    console.error('Error in validateReferralCode:', error)
    next(error)
  }
}

// Get referral leaderboard
export const getReferralLeaderboard = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10
    const timeframe = req.query.timeframe || 'all' // all, month, week

    let matchCondition = { isDeleted: false, isActive: true }

    // Add time-based filtering if needed
    if (timeframe === 'month') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      matchCondition.createdAt = { $gte: startOfMonth }
    } else if (timeframe === 'week') {
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      startOfWeek.setHours(0, 0, 0, 0)
      matchCondition.createdAt = { $gte: startOfWeek }
    }

    const leaderboard = await User.aggregate([
      { $match: matchCondition },
      {
        $project: {
          name: 1,
          email: 1,
          referralCode: 1,
          createdAt: 1,
          totalReferrals: '$referralStats.totalReferrals',
          activeReferrals: '$referralStats.activeReferrals',
          referralRewards: '$referralStats.referralRewards',
        },
      },
      { $sort: { totalReferrals: -1, referralRewards: -1 } },
      { $limit: limit },
      {
        $addFields: {
          rank: {
            $add: [{ $indexOfArray: [{ $range: [0, limit] }, '$_id'] }, 1],
          },
        },
      },
    ])

    // Add rank manually since $indexOfArray doesn't work as expected
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
    }))

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: rankedLeaderboard,
        timeframe,
        totalResults: rankedLeaderboard.length,
      },
    })
  } catch (error) {
    console.error('Error in getReferralLeaderboard:', error)
    next(error)
  }
}

// Generate a new referral code (in case user wants to change it)
export const generateNewReferralCode = async (req, res, next) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId)

    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Check if user has changed their referral code recently (optional rate limiting)
    const lastCodeChange = user.referralCodeLastChanged
    if (lastCodeChange) {
      const daysSinceChange = Math.floor(
        (Date.now() - lastCodeChange.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceChange < 30) {
        // Allow change only once per month
        return next(
          createError(
            400,
            `You can change your referral code only once per month. Next change available in ${
              30 - daysSinceChange
            } days.`
          )
        )
      }
    }

    let newReferralCode
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    // Generate unique referral code
    while (!isUnique && attempts < maxAttempts) {
      const namePrefix = user.name
        .replace(/\s+/g, '')
        .substring(0, 3)
        .toUpperCase()
      const randomSuffix = Math.random()
        .toString(36)
        .substring(2, 5)
        .toUpperCase()
      newReferralCode = `${namePrefix}${randomSuffix}`

      const existingUser = await User.findOne({
        referralCode: newReferralCode,
        _id: { $ne: userId },
      })

      if (!existingUser) {
        isUnique = true
      }
      attempts++
    }

    if (!isUnique) {
      return next(
        createError(
          500,
          'Unable to generate unique referral code. Please try again.'
        )
      )
    }

    user.referralCode = newReferralCode
    user.referralCodeLastChanged = new Date()
    await user.save()

    res.status(200).json({
      status: 'success',
      data: {
        referralCode: newReferralCode,
        referralUrl: user.referralUrl,
        message: 'Referral code updated successfully',
      },
    })
  } catch (error) {
    console.error('Error in generateNewReferralCode:', error)
    next(error)
  }
}

// Get referral analytics (for admin/marketing)
export const getReferralAnalytics = async (req, res, next) => {
  try {
    const timeframe = req.query.timeframe || 'month' // day, week, month, year
    let groupBy, dateRange

    const now = new Date()

    switch (timeframe) {
      case 'day':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        break
      case 'week':
        groupBy = { $dateToString: { format: '%Y-W%U', date: '$createdAt' } }
        dateRange = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000) // Last 12 weeks
        break
      case 'month':
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
        dateRange = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000) // Last 12 months
        break
      default:
        groupBy = { $dateToString: { format: '%Y', date: '$createdAt' } }
        dateRange = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000) // Last 5 years
    }

    const analytics = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: groupBy,
          totalUsers: { $sum: 1 },
          referredUsers: {
            $sum: {
              $cond: [{ $ne: ['$referredBy', null] }, 1, 0],
            },
          },
          organicUsers: {
            $sum: {
              $cond: [{ $eq: ['$referredBy', null] }, 1, 0],
            },
          },
          totalReferrals: { $sum: '$referralStats.totalReferrals' },
          totalRewards: { $sum: '$referralStats.referralRewards' },
        },
      },
      { $sort: { _id: 1 } },
    ])

    // Calculate overall stats
    const overallStats = await User.aggregate([
      {
        $match: { isDeleted: false },
      },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalReferrals: { $sum: '$referralStats.totalReferrals' },
          totalRewards: { $sum: '$referralStats.referralRewards' },
          avgReferralsPerUser: { $avg: '$referralStats.totalReferrals' },
          usersWithReferrals: {
            $sum: {
              $cond: [{ $gt: ['$referralStats.totalReferrals', 0] }, 1, 0],
            },
          },
          referredUsers: {
            $sum: {
              $cond: [{ $ne: ['$referredBy', null] }, 1, 0],
            },
          },
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        analytics,
        overallStats: overallStats[0] || {},
        timeframe,
      },
    })
  } catch (error) {
    console.error('Error in getReferralAnalytics:', error)
    next(error)
  }
}

// Helper function to check and create achievement notifications
const checkAndCreateAchievementNotifications = async (
  userId,
  totalReferrals
) => {
  try {
    const milestones = [
      { count: 1, type: 'first_referral' },
      { count: 5, type: 'milestone_5_referrals' },
      { count: 10, type: 'milestone_10_referrals' },
      { count: 50, type: 'milestone_50_referrals' },
      { count: 100, type: 'milestone_100_referrals' },
    ]

    const milestone = milestones.find((m) => m.count === totalReferrals)

    if (milestone) {
      await NotificationService.createAchievementNotification(
        userId,
        milestone.type,
        { referralCount: totalReferrals }
      )
    }
  } catch (error) {
    console.error('Error creating achievement notification:', error)
    // Don't throw error as this is not critical
  }
}

// Award referral commission (can be called when referred user makes a purchase)
export const awardReferralCommission = async (req, res, next) => {
  try {
    const { referredUserId, amount, transactionId } = req.body

    if (!referredUserId || !amount) {
      return next(createError(400, 'Referred user ID and amount are required'))
    }

    // Find the referred user
    const referredUser = await User.findById(referredUserId).populate(
      'referredBy'
    )

    if (!referredUser || !referredUser.referredBy) {
      return next(createError(404, 'Referred user or referrer not found'))
    }

    const referrer = referredUser.referredBy
    const commissionAmount = amount * 0.1 // 10% commission (adjust as needed)

    // Update referrer's reward balance
    referrer.referralStats.referralRewards += commissionAmount
    await referrer.save()

    // Create reward notification
    await NotificationService.createReferralRewardNotification(
      referrer._id,
      commissionAmount,
      referredUser.name
    )

    res.status(200).json({
      status: 'success',
      data: {
        referrer: {
          id: referrer._id,
          name: referrer.name,
        },
        commissionAmount,
        transactionId,
        message: 'Referral commission awarded successfully',
      },
    })
  } catch (error) {
    console.error('Error in awardReferralCommission:', error)
    next(error)
  }
}
