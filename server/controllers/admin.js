// File: controllers/admin.js - COMPLETE WITH FIXED REVENUE CALCULATIONS
import { getPlanDetails } from '../config/stripe.js'
import { createError } from '../error.js'
import Earnings from '../models/Earnings.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
import NotificationService from '../services/notificationService.js'

// Get admin statistics - FIXED TO EXCLUDE GIFTED SUBSCRIPTIONS FROM REVENUE
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

    // FIXED: Calculate total revenue EXCLUDING gifted subscriptions
    const revenueData = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ['active', 'trialing'] },
          isGifted: { $ne: true }, // EXCLUDE gifted subscriptions
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

    // FIXED: Calculate total commissions EXCLUDING earnings from gifted subscriptions
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
          // Only include earnings where subscription is NOT gifted
          $or: [
            { subscriptionData: { $size: 0 } }, // No subscription found (shouldn't happen)
            { 'subscriptionData.isGifted': { $ne: true } }, // Subscription exists but not gifted
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

    // Pending payouts (all pending, regardless of gifted status for payout requests)
    const pendingPayoutsCount = await Earnings.countDocuments({
      status: 'approved',
      payoutStatus: { $in: ['pending', 'approved'] },
    })

    // Count gifted subscriptions
    const giftedSubscriptions = await Subscription.countDocuments({
      isGifted: true,
      status: { $in: ['active', 'trialing'] },
    })

    // Additional stats
    const subscriptionStats = await Subscription.aggregate([
      {
        $match: {
          status: { $in: ['active', 'trialing'] },
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
        totalRevenue, // Now excludes gifted subscriptions
        totalCommissions, // Now excludes earnings from gifted subscriptions
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

// Update user subscription (admin can gift or modify plans) - ENHANCED
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
        'subscription.isTrialActive': false,
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

      // Clear Stripe IDs for gifted subscriptions
      if (isGifted) {
        subscription.stripeSubscriptionId = null
        subscription.stripePriceId = null
      }

      await subscription.save()
    } else {
      // Create new subscription
      subscription = new Subscription({
        user: userId,
        stripeCustomerId: user.stripeCustomerId || `gift_${userId}`,
        plan: planName,
        billingCycle: billingCycle,
        amount: amount,
        status: 'active',
        currentPeriodStart: currentPeriodStart,
        currentPeriodEnd: currentPeriodEnd,
        isGifted: isGifted,
        giftedBy: isGifted ? req.user._id : null,
        giftedAt: isGifted ? new Date() : null,
        stripeSubscriptionId: null, // No Stripe ID for gifted
        stripePriceId: null, // No Stripe price for gifted
      })

      await subscription.save()
    }

    // Update User model subscription field
    // Update User model subscription field
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': planName,
      'subscription.status': 'active',
      'subscription.isActive': true,
      'subscription.isTrialActive': false,
      'subscription.startDate': currentPeriodStart,
      'subscription.endDate': currentPeriodEnd,
      'subscription.daysRemaining': Math.ceil(
        (currentPeriodEnd - new Date()) / (1000 * 60 * 60 * 24) // ← Changed from currentPeriodStart to new Date()
      ),
      'subscription.isGifted': isGifted,
    })

    // Send notification
    try {
      await NotificationService.createNotification(userId, {
        title: isGifted ? '🎁 Subscription Gifted!' : '✅ Subscription Updated',
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
    } catch (notifError) {
      console.error('Error sending notification:', notifError)
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
      'subscription.isTrialActive': false,
      'subscription.daysRemaining': 0,
      'subscription.startDate': null,
      'subscription.endDate': null,
      'subscription.isGifted': false,
    })

    // Send notification
    try {
      const user = await User.findById(userId)
      await NotificationService.createNotification(userId, {
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled by admin.',
        type: 'subscription_cancelled',
        priority: 'high',
      })
    } catch (notifError) {
      console.error('Error sending notification:', notifError)
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
    // In reactivateUserSubscription
    await User.findByIdAndUpdate(userId, {
      'subscription.status': 'active',
      'subscription.isActive': true,
      'subscription.endDate': newEndDate,
      'subscription.daysRemaining': Math.ceil(
        (newEndDate - new Date()) / (1000 * 60 * 60 * 24) // ← Use new Date() not current time
      ),
    })

    // Send notification
    try {
      await NotificationService.createNotification(userId, {
        title: 'Subscription Reactivated',
        message: 'Your subscription has been reactivated by admin.',
        type: 'subscription_reactivated',
        priority: 'high',
      })
    } catch (notifError) {
      console.error('Error sending notification:', notifError)
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
