// File: controllers/admin.js - FIXED: Handle missing NotificationService
import { getPlanDetails } from '../config/stripe.js'
import { createError } from '../error.js'
import Earnings from '../models/Earnings.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import NotificationService from '../services/notificationService.js'

// Get admin statistics
export const getAdminStats = async (req, res, next) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments({ isDeleted: false })

    // Active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = await User.countDocuments({
      isDeleted: false,
      lastLogin: { $gte: thirtyDaysAgo },
    })

    // New users today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today },
      isDeleted: false,
    })

    // Calculate total revenue EXCLUDING gifted subscriptions
    const revenueData = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ['active'] },
          isGifted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ])

    // Convert from cents to dollars
    const totalRevenue =
      revenueData.length > 0
        ? (revenueData[0].totalRevenue / 100).toFixed(2)
        : '0.00'

    // Calculate total commissions EXCLUDING earnings from gifted subscriptions
    const commissionsData = await Earnings.aggregate([
      {
        $match: {
          status: { $in: ['approved', 'paid'] },
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
        $match: {
          $or: [
            { subscriptionData: { $size: 0 } },
            { 'subscriptionData.isGifted': { $ne: true } },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: '$commissionAmount' },
        },
      },
    ])

    // Convert from cents to dollars
    const totalCommissions =
      commissionsData.length > 0
        ? (commissionsData[0].totalCommissions / 100).toFixed(2)
        : '0.00'

    // Pending payouts
    const pendingPayoutsCount = await Earnings.countDocuments({
      status: 'approved',
      payoutStatus: { $in: ['pending', 'approved'] },
    })

    // Count gifted subscriptions
    const giftedSubscriptions = await Subscription.countDocuments({
      isGifted: true,
      status: { $in: ['active'] },
    })

    // Additional stats
    const subscriptionStats = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ['active'] },
        },
      },
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 },
          isGifted: { $sum: { $cond: ['$isGifted', 1, 0] } },
          isPaid: { $sum: { $cond: [{ $ne: ['$isGifted', true] }, 1, 0] } },
        },
      },
    ])

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        newUsersToday,
        totalRevenue,
        totalCommissions,
        pendingPayouts: pendingPayoutsCount,
        giftedSubscriptions,
        subscriptionBreakdown: subscriptionStats,
        revenueNote:
          giftedSubscriptions > 0
            ? `Revenue excludes ${giftedSubscriptions} admin-gifted subscription${
                giftedSubscriptions !== 1 ? 's' : ''
              }`
            : null,
      },
    })
  } catch (error) {
    console.error('Error getting admin stats:', error)
    next(createError(500, 'Failed to retrieve admin statistics'))
  }
}

// Update user subscription (admin can gift or modify plans)
export const updateUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params
    const { planName, billingCycle = 'monthly', isGifted = false } = req.body

    if (!planName) {
      return next(createError(400, 'Plan name is required'))
    }

    // Validate plan
    const validPlans = ['starter', 'pro', 'empire', 'free']
    if (!validPlans.includes(planName)) {
      return next(createError(400, 'Invalid plan name'))
    }

    // Get user
    const user = await User.findById(userId)
    if (!user) {
      return next(createError(404, 'User not found'))
    }

    // Handle free plan
    if (planName === 'free') {
      // Remove any existing subscription
      await Subscription.findOneAndDelete({ user: userId })

      // Update user model
      await User.findByIdAndUpdate(userId, {
        'subscription.plan': 'free',
        'subscription.status': 'inactive',
        'subscription.isActive': false,
        'subscription.daysRemaining': 0,
        'subscription.startDate': null,
        'subscription.endDate': null,
        'subscription.isGifted': false,
      })

      return res.status(200).json({
        status: 'success',
        message: 'Subscription removed, user set to free plan',
        data: {
          plan: 'free',
          isGifted: false,
        },
      })
    }

    // For paid plans
    const planDetails = getPlanDetails(planName, billingCycle)
    const amount = planDetails.pricing.amount

    // Calculate period dates
    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    if (billingCycle === 'monthly') {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)
    } else {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1)
    }

    // Find or create subscription
    let subscription = await Subscription.findOne({ user: userId })

    if (subscription) {
      // Update existing subscription
      subscription.plan = planName
      subscription.billingCycle = billingCycle
      subscription.amount = amount
      subscription.status = 'active'
      subscription.currentPeriodStart = currentPeriodStart
      subscription.currentPeriodEnd = currentPeriodEnd
      subscription.isGifted = isGifted
      subscription.giftedBy = isGifted ? req.user._id : null
      subscription.giftedAt = isGifted ? new Date() : null

      // FIXED: Clear ALL Stripe IDs for gifted subscriptions
      if (isGifted) {
        subscription.stripeSubscriptionId = null
        subscription.stripePriceId = null
        subscription.stripeCustomerId = null
      }

      await subscription.save()
    } else {
      // Create new subscription
      subscription = new Subscription({
        user: userId,
        // Only set stripeCustomerId if NOT gifted
        ...(isGifted ? {} : { stripeCustomerId: user.stripeCustomerId }),
        plan: planName,
        billingCycle: billingCycle,
        amount: amount,
        status: 'active',
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        isGifted: isGifted,
        giftedBy: isGifted ? req.user._id : null,
        giftedAt: isGifted ? new Date() : null,
        stripeSubscriptionId: null,
        stripePriceId: null,
      })

      await subscription.save()
    }

    // Update User model subscription field
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': planName,
      'subscription.status': 'active',
      'subscription.isActive': true,
      'subscription.startDate': currentPeriodStart,
      'subscription.endDate': currentPeriodEnd,
      'subscription.daysRemaining': Math.ceil(
        (currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24)
      ),
      'subscription.isGifted': isGifted,
    })

    // Send notification - FIXED: Check if service exists
    try {
      if (
        NotificationService &&
        typeof NotificationService.createNotification === 'function'
      ) {
        await NotificationService.createNotification(userId, {
          title: isGifted
            ? '🎁 Subscription Gifted!'
            : '✅ Subscription Updated',
          message: isGifted
            ? `You've been gifted a ${planDetails.name} plan by admin! Enjoy your free access.`
            : `Your subscription has been updated to ${planDetails.name} (${billingCycle}).`,
          type: isGifted ? 'subscription_gifted' : 'subscription_update',
          priority: 'high',
          data: {
            plan: planName,
            billingCycle: billingCycle,
            isGifted: isGifted,
            periodEnd: currentPeriodEnd,
          },
        })
      }
    } catch (notifError) {
      console.warn('Warning: Could not send notification:', notifError.message)
    }

    res.status(200).json({
      status: 'success',
      message: isGifted
        ? `${planDetails.name} plan gifted to user successfully`
        : `User subscription updated to ${planDetails.name}`,
      data: {
        subscription,
        isGifted,
        note: isGifted
          ? 'This gifted subscription does not count toward revenue or earnings'
          : null,
      },
    })
  } catch (error) {
    console.error('Error updating user subscription:', error)
    next(createError(500, 'Failed to update user subscription'))
  }
}

// Cancel user subscription (admin)
export const cancelUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params

    const subscription = await Subscription.findOne({ user: userId })

    if (!subscription) {
      return next(createError(404, 'No subscription found for this user'))
    }

    // Delete the subscription
    await Subscription.findByIdAndDelete(subscription._id)

    // Update User model
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': 'free',
      'subscription.status': 'inactive',
      'subscription.isActive': false,
      'subscription.daysRemaining': 0,
      'subscription.startDate': null,
      'subscription.endDate': null,
      'subscription.isGifted': false,
    })

    // Send notification - FIXED: Check if service exists
    try {
      if (
        NotificationService &&
        typeof NotificationService.createNotification === 'function'
      ) {
        const user = await User.findById(userId)
        await NotificationService.createNotification(userId, {
          title: 'Subscription Cancelled',
          message: 'Your subscription has been cancelled by admin.',
          type: 'subscription_cancelled',
          priority: 'high',
        })
      }
    } catch (notifError) {
      console.warn('Warning: Could not send notification:', notifError.message)
    }

    res.status(200).json({
      status: 'success',
      message: 'User subscription cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling user subscription:', error)
    next(createError(500, 'Failed to cancel user subscription'))
  }
}

// Reactivate user subscription (admin)
export const reactivateUserSubscription = async (req, res, next) => {
  try {
    const { userId } = req.params

    const subscription = await Subscription.findOne({ user: userId })

    if (!subscription) {
      return next(createError(404, 'No subscription found for this user'))
    }

    if (subscription.status === 'active') {
      return next(createError(400, 'Subscription is already active'))
    }

    // Reactivate subscription
    subscription.status = 'active'
    const newEndDate = new Date()
    if (subscription.billingCycle === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1)
    } else {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
    }
    subscription.currentPeriodEnd = newEndDate
    await subscription.save()

    // Update User model
    await User.findByIdAndUpdate(userId, {
      'subscription.status': 'active',
      'subscription.isActive': true,
      'subscription.endDate': newEndDate,
      'subscription.daysRemaining': Math.ceil(
        (newEndDate - new Date()) / (1000 * 60 * 60 * 24)
      ),
    })

    // Send notification - FIXED: Check if service exists
    try {
      if (
        NotificationService &&
        typeof NotificationService.createNotification === 'function'
      ) {
        await NotificationService.createNotification(userId, {
          title: 'Subscription Reactivated',
          message: 'Your subscription has been reactivated by admin.',
          type: 'subscription_reactivated',
          priority: 'high',
        })
      }
    } catch (notifError) {
      console.warn('Warning: Could not send notification:', notifError.message)
    }

    res.status(200).json({
      status: 'success',
      message: 'User subscription reactivated successfully',
      data: { subscription },
    })
  } catch (error) {
    console.error('Error reactivating user subscription:', error)
    next(createError(500, 'Failed to reactivate user subscription'))
  }
}
