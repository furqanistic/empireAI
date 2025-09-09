// File: controllers/stripe.js - ORIGINAL WITH MINIMAL FIX
import {
  createOrRetrieveCustomer,
  getAllPlans,
  getAmount,
  getPlanDetails,
  getPriceId,
  stripe,
  TRIAL_PERIOD_DAYS,
  validatePlanAndBilling,
} from '../config/stripe.js'
import { createError } from '../error.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
// NEW: Import earnings integration
import {
  approveEarningAfterPayment,
  createEarningForSubscription,
} from '../utils/earningsIntegration.js'

// ADDED: Simple helper function to sync User model subscription field
const updateUserSubscriptionField = async (userId, subscription) => {
  try {
    // Status mapping code (as before)
    const statusMapping = {
      trialing: 'trial',
      active: 'active',
      past_due: 'active',
      canceled: 'cancelled',
      unpaid: 'inactive',
      incomplete: 'inactive',
      incomplete_expired: 'inactive',
    }

    const updateData = {
      subscription: {
        plan: subscription.plan,
        status: statusMapping[subscription.status] || 'inactive',
        startDate: subscription.currentPeriodStart,
        endDate: subscription.currentPeriodEnd,
        isActive: subscription.isActive,
        isTrialActive: subscription.isTrialActive,
        trialStartDate: subscription.trialStart,
        trialEndDate: subscription.trialEnd,
        daysRemaining: subscription.daysRemaining,
      },
    }

    const user = await User.findByIdAndUpdate(userId, updateData, { new: true })
    console.log(
      `Updated User subscription field for user ${userId} to ${subscription.plan}`
    )

    // ADD THIS: Automatic Discord role update
    if (user?.discord?.isConnected) {
      try {
        const { updateUserDiscordRoles } = await import('./discordAuth.js')
        const discordResult = await updateUserDiscordRoles(user)

        if (discordResult.success) {
          console.log(
            `Auto-updated Discord roles for ${user.name}: ${JSON.stringify(
              discordResult.actions
            )}`
          )
        } else {
          console.log(
            `Failed to auto-update Discord roles for ${user.name}: ${discordResult.reason}`
          )
        }
      } catch (discordError) {
        console.error('Error auto-updating Discord roles:', discordError)
        // Don't throw error to avoid breaking subscription flow
      }
    }

    return user
  } catch (error) {
    console.error('Error updating user subscription field:', error)
    return null
  }
}
// DEBUG ROUTE - Add this temporarily to check subscriptions
export const debugSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ user: req.user._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })

    res.status(200).json({
      status: 'success',
      userId: req.user._id,
      userEmail: req.user.email,
      count: subscriptions.length,
      subscriptions: subscriptions,
      message: `Found ${subscriptions.length} subscriptions`,
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({
      status: 'error',
      error: error.message,
    })
  }
}

// Get all available plans
export const getPlans = async (req, res, next) => {
  try {
    const plans = getAllPlans()

    res.status(200).json({
      status: 'success',
      data: {
        plans,
        trialPeriodDays: TRIAL_PERIOD_DAYS,
      },
    })
  } catch (error) {
    console.error('Error getting plans:', error)
    next(createError(500, 'Failed to retrieve plans'))
  }
}

// Create a checkout session for new subscription
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { planName, billingCycle = 'monthly' } = req.body
    const user = req.user

    if (!planName) {
      return next(createError(400, 'Plan name is required'))
    }

    // Validate plan and billing cycle
    validatePlanAndBilling(planName, billingCycle)

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active', 'trialing'] },
    })

    if (existingSubscription) {
      return next(createError(400, 'You already have an active subscription'))
    }

    // Create or retrieve Stripe customer
    const customer = await createOrRetrieveCustomer(user)

    // Update user with Stripe customer ID if not already set
    if (!user.stripeCustomerId) {
      await User.findByIdAndUpdate(user._id, {
        stripeCustomerId: customer.id,
      })
    }

    const priceId = getPriceId(planName, billingCycle)

    // UPDATED SUCCESS URL TO MATCH THE ACTUAL COMPONENT PATH
    const successUrl = `${process.env.FRONTEND_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.FRONTEND_URL}/pricing?canceled=true`

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: TRIAL_PERIOD_DAYS,
        metadata: {
          userId: user._id.toString(),
          planName: planName,
          billingCycle: billingCycle,
        },
      },
      metadata: {
        userId: user._id.toString(),
        planName: planName,
        billingCycle: billingCycle,
      },
    })

    res.status(200).json({
      status: 'success',
      data: {
        sessionId: session.id,
        url: session.url,
      },
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    next(
      createError(500, `Failed to create checkout session: ${error.message}`)
    )
  }
}

// Verify checkout session and create subscription - UPDATED WITH USER SYNC
export const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body
    const user = req.user

    if (!sessionId) {
      console.error('No session ID provided')
      return next(createError(400, 'Session ID is required'))
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })

    if (session.metadata.userId !== user._id.toString()) {
      console.error('User mismatch:', {
        sessionUserId: session.metadata.userId,
        currentUserId: user._id.toString(),
      })
      return next(createError(403, 'Unauthorized access to this session'))
    }

    // For subscriptions with trials, payment_status might be 'unpaid' initially
    if (session.status !== 'complete') {
      console.error('Session not complete:', {
        status: session.status,
        payment_status: session.payment_status,
      })
      return next(createError(400, 'Checkout session not completed'))
    }

    if (!session.subscription) {
      console.error('No subscription created in session')
      return next(createError(400, 'No subscription created'))
    }

    // Get subscription details from Stripe
    const stripeSubscription = session.subscription

    // Check if subscription already exists
    let subscription = await Subscription.findOne({
      user: user._id,
    })

    // FIXED: Handle undefined period dates during trial
    const subscriptionData = {
      user: user._id,
      stripeCustomerId: session.customer.id || session.customer,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0].price.id,
      plan: session.metadata.planName,
      billingCycle: session.metadata.billingCycle,
      status: stripeSubscription.status,
      amount: getAmount(
        session.metadata.planName,
        session.metadata.billingCycle
      ),
      // Handle undefined dates during trial period
      currentPeriodStart: stripeSubscription.current_period_start
        ? new Date(stripeSubscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000)
        : null,
      trialStart: stripeSubscription.trial_start
        ? new Date(stripeSubscription.trial_start * 1000)
        : null,
      trialEnd: stripeSubscription.trial_end
        ? new Date(stripeSubscription.trial_end * 1000)
        : null,
    }

    try {
      if (subscription) {
        Object.assign(subscription, subscriptionData)
        await subscription.save()
      } else {
        subscription = new Subscription(subscriptionData)
        await subscription.save()
      }

      // Verify the subscription was saved
      const savedSubscription = await Subscription.findById(subscription._id)

      // ADDED: Update User model's subscription field
      await updateUserSubscriptionField(user._id, subscription)

      // NEW: Create earning for referral commission
      try {
        await createEarningForSubscription(subscription, user._id)
      } catch (earningError) {
        console.error('Error creating earning:', earningError)
        // Don't fail the subscription creation if earning creation fails
      }
    } catch (saveError) {
      console.error('Error saving subscription to database:', saveError)
      return next(
        createError(500, `Failed to save subscription: ${saveError.message}`)
      )
    }

    // Populate the subscription for response
    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription created successfully',
      },
    })
  } catch (error) {
    console.error('Error verifying checkout session:', error)
    next(
      createError(500, `Failed to verify checkout session: ${error.message}`)
    )
  }
}

// NEW: Handle successful payments (for approving earnings)
export const handleSuccessfulPayment = async (
  paymentIntentId,
  subscriptionId
) => {
  try {
    // This would be called from a webhook handler
    await approveEarningAfterPayment(subscriptionId, paymentIntentId)
  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

// Get current subscription
export const getCurrentSubscription = async (req, res, next) => {
  try {
    const user = req.user

    const subscription = await Subscription.findOne({
      user: user._id,
    }).populate('user', 'name email')

    if (!subscription) {
      return res.status(200).json({
        status: 'success',
        data: {
          subscription: null,
          message: 'No subscription found',
        },
      })
    }

    // Sync with Stripe to get latest data
    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        )
        await subscription.updateFromStripe(stripeSubscription)

        // ADDED: Update User model's subscription field
        await updateUserSubscriptionField(user._id, subscription)
      } catch (error) {
        console.error('Error syncing with Stripe:', error)
        // Continue with database data if Stripe sync fails
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
      },
    })
  } catch (error) {
    console.error('Error getting current subscription:', error)
    next(createError(500, 'Failed to retrieve subscription'))
  }
}

// Update subscription (change plan)
export const updateSubscription = async (req, res, next) => {
  try {
    const { planName, billingCycle } = req.body
    const user = req.user

    if (!planName || !billingCycle) {
      return next(createError(400, 'Plan name and billing cycle are required'))
    }

    // Validate new plan and billing cycle
    validatePlanAndBilling(planName, billingCycle)

    // Get current subscription
    const subscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active', 'trialing'] },
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return next(createError(404, 'No active subscription found'))
    }

    // Don't allow changing to the same plan
    if (
      subscription.plan === planName &&
      subscription.billingCycle === billingCycle
    ) {
      return next(createError(400, 'You are already subscribed to this plan'))
    }

    const newPriceId = getPriceId(planName, billingCycle)

    // Get current subscription item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )
    const currentItemId = stripeSubscription.items.data[0].id

    // Update subscription in Stripe
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentItemId,
            price: newPriceId,
          },
        ],
        proration_behavior: 'create_prorations',
        metadata: {
          userId: user._id.toString(),
          planName: planName,
          billingCycle: billingCycle,
        },
      }
    )

    // Update subscription in database
    subscription.plan = planName
    subscription.billingCycle = billingCycle
    subscription.stripePriceId = newPriceId
    subscription.amount = getAmount(planName, billingCycle)
    await subscription.updateFromStripe(updatedStripeSubscription)

    // ADDED: Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription updated successfully',
      },
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    next(createError(500, 'Failed to update subscription'))
  }
}

// Cancel subscription
export const cancelSubscription = async (req, res, next) => {
  try {
    const { immediate = false } = req.body
    const user = req.user

    // Get current subscription
    const subscription = await Subscription.findOne({
      user: user._id,
      status: { $in: ['active', 'trialing'] },
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return next(createError(404, 'No active subscription found'))
    }

    let stripeSubscription

    if (immediate) {
      // Cancel immediately
      stripeSubscription = await stripe.subscriptions.cancel(
        subscription.stripeSubscriptionId
      )
    } else {
      // Cancel at period end
      stripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      )
    }

    // Update subscription in database
    await subscription.updateFromStripe(stripeSubscription)

    // ADDED: Update User model's subscription field
    if (immediate) {
      // Set to free plan if canceled immediately
      const freeSubscriptionData = {
        plan: 'free',
        status: 'inactive',
        isActive: false,
        isTrialActive: false,
        daysRemaining: 0,
      }
      await updateUserSubscriptionField(user._id, freeSubscriptionData)
    } else {
      await updateUserSubscriptionField(user._id, subscription)
    }

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: immediate
          ? 'Subscription canceled immediately'
          : 'Subscription will be canceled at the end of the current period',
      },
    })
  } catch (error) {
    console.error('Error canceling subscription:', error)
    next(createError(500, 'Failed to cancel subscription'))
  }
}

// Reactivate subscription (if canceled at period end)
export const reactivateSubscription = async (req, res, next) => {
  try {
    const user = req.user

    // Get current subscription
    const subscription = await Subscription.findOne({
      user: user._id,
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return next(createError(404, 'No subscription found'))
    }

    if (!subscription.cancelAtPeriodEnd) {
      return next(createError(400, 'Subscription is not set to cancel'))
    }

    // Reactivate subscription in Stripe
    const stripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        cancel_at_period_end: false,
      }
    )

    // Update subscription in database
    await subscription.updateFromStripe(stripeSubscription)

    // ADDED: Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription reactivated successfully',
      },
    })
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    next(createError(500, 'Failed to reactivate subscription'))
  }
}

// Get billing portal session (for customers to manage their billing)
export const createBillingPortalSession = async (req, res, next) => {
  try {
    const user = req.user

    if (!user.stripeCustomerId) {
      return next(createError(400, 'No Stripe customer found'))
    }

    const returnUrl = `${process.env.FRONTEND_URL}/dashboard/subscription`

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    })

    res.status(200).json({
      status: 'success',
      data: {
        url: session.url,
      },
    })
  } catch (error) {
    console.error('Error creating billing portal session:', error)
    next(createError(500, 'Failed to create billing portal session'))
  }
}

// Admin: Get all subscriptions
export const getAllSubscriptions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit

    const filter = {}
    if (req.query.status) {
      filter.status = req.query.status
    }
    if (req.query.plan) {
      filter.plan = req.query.plan
    }

    const subscriptions = await Subscription.find(filter)
      .populate('user', 'name email createdAt')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })

    const totalSubscriptions = await Subscription.countDocuments(filter)

    res.status(200).json({
      status: 'success',
      results: subscriptions.length,
      totalResults: totalSubscriptions,
      totalPages: Math.ceil(totalSubscriptions / limit),
      currentPage: page,
      data: {
        subscriptions,
      },
    })
  } catch (error) {
    console.error('Error getting all subscriptions:', error)
    next(createError(500, 'Failed to retrieve subscriptions'))
  }
}

// Sync subscription with Stripe (manual sync)
export const syncWithStripe = async (req, res, next) => {
  try {
    const user = req.user

    const subscription = await Subscription.findOne({
      user: user._id,
    })

    if (!subscription || !subscription.stripeSubscriptionId) {
      return next(createError(404, 'No subscription found'))
    }

    // Get latest data from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )

    // Update local subscription
    await subscription.updateFromStripe(stripeSubscription)

    // ADDED: Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription synced with Stripe successfully',
      },
    })
  } catch (error) {
    console.error('Error syncing with Stripe:', error)
    next(createError(500, 'Failed to sync with Stripe'))
  }
}
