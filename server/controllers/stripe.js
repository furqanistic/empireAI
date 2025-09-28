// File: controllers/stripe.js - UPDATED WITH REFERRAL DISCOUNT FUNCTIONALITY
import {
  calculateDiscountedAmount,
  createOrRetrieveCustomer,
  createOrRetrieveReferralCoupon,
  getAllPlans,
  getAmount,
  getPlanDetails,
  getPriceId,
  REFERRAL_DISCOUNT,
  stripe,
  TRIAL_PERIOD_DAYS,
  validatePlanAndBilling,
} from '../config/stripe.js'
import { createError } from '../error.js'
import Subscription from '../models/Subscription.js'
import User from '../models/User.js'
// Import notification service
import NotificationService from '../services/notificationService.js'
// Import earnings integration
import {
  approveEarningAfterPayment,
  createEarningForSubscription,
} from '../utils/earningsIntegration.js'

// Helper function to sync User model subscription field
const updateUserSubscriptionField = async (userId, subscription) => {
  try {
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

    // Automatic Discord role update
    if (user?.discord?.isConnected) {
      try {
        const { updateUserDiscordRoles } = await import('./discordAuth.js')
        const discordResult = await updateUserDiscordRoles(user)
      } catch (discordError) {
        console.error('Error auto-updating Discord roles:', discordError)
      }
    }

    return user
  } catch (error) {
    console.error('Error updating user subscription field:', error)
    return null
  }
}

export const debugVerifyCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body
    const user = req.user

    console.log('=== PAYMENT VERIFICATION DEBUG ===')
    console.log('Environment:', process.env.NODE_ENV)
    console.log(
      'Stripe Mode:',
      process.env.STRIPE_SECRET_KEY.includes('test') ? 'TEST' : 'LIVE'
    )
    console.log('Session ID:', sessionId)
    console.log('User ID:', user._id.toString())
    console.log('User Email:', user.email)
    console.log('Timestamp:', new Date().toISOString())

    if (!sessionId) {
      console.error('❌ No session ID provided')
      return next(createError(400, 'Session ID is required'))
    }

    // Retrieve the checkout session with expanded data
    console.log('🔍 Retrieving session from Stripe...')
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer', 'payment_intent'],
    })

    console.log('✅ Session retrieved successfully')
    console.log('Session Status:', session.status)
    console.log('Payment Status:', session.payment_status)
    console.log('Session Mode:', session.mode)
    console.log('Customer ID:', session.customer?.id || session.customer)
    console.log('Subscription ID:', session.subscription?.id)
    console.log('Amount Total:', session.amount_total)
    console.log('Currency:', session.currency)
    console.log('Session Metadata:', session.metadata)

    // Validate user match
    if (session.metadata.userId !== user._id.toString()) {
      console.error('❌ User mismatch')
      console.error('Session User ID:', session.metadata.userId)
      console.error('Current User ID:', user._id.toString())
      return next(createError(403, 'Unauthorized access to this session'))
    }

    // Check session completion
    if (session.status !== 'complete') {
      console.error('❌ Session not complete')
      console.error('Session Status:', session.status)
      console.error('Payment Status:', session.payment_status)
      return next(
        createError(
          400,
          `Checkout session not completed. Status: ${session.status}`
        )
      )
    }

    // Check subscription creation
    if (!session.subscription) {
      console.error('❌ No subscription created in session')
      return next(createError(400, 'No subscription created'))
    }

    console.log('✅ Session validation passed')

    // Check for existing subscription
    console.log('🔍 Checking for existing subscription...')
    let existingSubscription = await Subscription.findOne({
      $or: [
        { user: user._id },
        { stripeSubscriptionId: session.subscription.id },
      ],
    })

    if (existingSubscription) {
      console.log(
        '📋 Found existing subscription:',
        existingSubscription._id.toString()
      )
      console.log('Existing Status:', existingSubscription.status)
    } else {
      console.log('📋 No existing subscription found')
    }

    // Validate price ID
    const sessionPriceId = session.subscription.items.data[0].price.id
    console.log('💰 Session Price ID:', sessionPriceId)

    // Check if price ID exists in our configuration
    const planName = session.metadata.planName
    const billingCycle = session.metadata.billingCycle
    const expectedPriceId = getPriceId(planName, billingCycle)

    console.log('💰 Expected Price ID:', expectedPriceId)
    console.log('💰 Plan Name:', planName)
    console.log('💰 Billing Cycle:', billingCycle)

    if (sessionPriceId !== expectedPriceId) {
      console.warn('⚠️ Price ID mismatch - this might be normal for discounts')
    }

    // Continue with original verification logic...
    req.debugSession = session
    next()
  } catch (error) {
    console.error('❌ Debug verification error:', error)
    console.error('Error Code:', error.code)
    console.error('Error Type:', error.type)
    console.error('Error Message:', error.message)

    if (error.type === 'StripeInvalidRequestError') {
      return next(createError(400, `Invalid Stripe request: ${error.message}`))
    }

    next(createError(500, `Payment verification failed: ${error.message}`))
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
        referralDiscount: {
          percentage: REFERRAL_DISCOUNT.percentage,
          description: REFERRAL_DISCOUNT.description,
          availableFor: 'First month only with valid referral code',
        },
      },
    })
  } catch (error) {
    console.error('Error getting plans:', error)
    next(createError(500, 'Failed to retrieve plans'))
  }
}

// Create a checkout session for new subscription - UPDATED WITH REFERRAL DISCOUNT
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

    const successUrl = `${process.env.FRONTEND_URL}/pricing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.FRONTEND_URL}/pricing?canceled=true`

    // NEW: Check if user has a referral and apply discount
    let discountCoupon = null
    let hasReferralDiscount = false

    // Check if user was referred by someone (and hasn't used a discount before)
    const userWithReferral = await User.findById(user._id).populate(
      'referredBy',
      'name referralCode'
    )

    if (
      userWithReferral.referredBy &&
      !userWithReferral.hasUsedReferralDiscount
    ) {
      console.log(
        `User ${user.email} has referral from ${userWithReferral.referredBy.name}, applying 10% discount`
      )

      try {
        // Create or retrieve the referral discount coupon
        discountCoupon = await createOrRetrieveReferralCoupon()
        hasReferralDiscount = true

        console.log(`✅ Referral discount coupon ready: ${discountCoupon.id}`)
      } catch (couponError) {
        console.error('Error setting up referral discount:', couponError)
        // Continue without discount if there's an error
        hasReferralDiscount = false
      }
    }

    // Create checkout session configuration
    const sessionConfig = {
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
          hasReferralDiscount: hasReferralDiscount.toString(),
          referredBy: userWithReferral.referredBy?._id?.toString() || '',
        },
      },
      metadata: {
        userId: user._id.toString(),
        planName: planName,
        billingCycle: billingCycle,
        hasReferralDiscount: hasReferralDiscount.toString(),
        referredBy: userWithReferral.referredBy?._id?.toString() || '',
      },
    }

    // Add discount if user has referral
    if (hasReferralDiscount && discountCoupon) {
      sessionConfig.discounts = [
        {
          coupon: discountCoupon.id,
        },
      ]

      console.log(
        `✅ Applied referral discount to checkout session for ${user.email}`
      )
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    // If we applied a referral discount, mark user as having used it
    if (hasReferralDiscount) {
      try {
        await User.findByIdAndUpdate(user._id, {
          hasUsedReferralDiscount: true,
          referralDiscountUsedAt: new Date(),
        })
        console.log(
          `✅ Marked user ${user.email} as having used referral discount`
        )
      } catch (updateError) {
        console.error('Error marking referral discount as used:', updateError)
        // Don't fail the checkout creation for this
      }
    }

    // Calculate discount info for response
    let discountInfo = null
    if (hasReferralDiscount) {
      const originalAmount = getAmount(planName, billingCycle)
      const discountCalculation = calculateDiscountedAmount(
        originalAmount,
        REFERRAL_DISCOUNT.percentage
      )

      discountInfo = {
        applied: true,
        percentage: REFERRAL_DISCOUNT.percentage,
        originalAmount: (originalAmount / 100).toFixed(2),
        discountAmount: (discountCalculation.discountAmount / 100).toFixed(2),
        finalAmount: (discountCalculation.discountedAmount / 100).toFixed(2),
        referrerName: userWithReferral.referredBy.name,
        description: `10% off first month thanks to ${userWithReferral.referredBy.name}'s referral`,
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        sessionId: session.id,
        url: session.url,
        referralDiscount: discountInfo,
      },
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    next(
      createError(500, `Failed to create checkout session: ${error.message}`)
    )
  }
}

// Verify checkout session and create subscription - UPDATED WITH NOTIFICATIONS
export const verifyCheckoutSession = async (req, res, next) => {
  try {
    const session =
      req.debugSession ||
      (await stripe.checkout.sessions.retrieve(req.body.sessionId, {
        expand: ['subscription', 'customer'],
      }))
    const user = req.user

    console.log('💾 Starting database operations...')

    // Get subscription details from Stripe
    const stripeSubscription = session.subscription

    // Check if subscription already exists
    let subscription = await Subscription.findOne({
      $or: [
        { user: user._id },
        { stripeSubscriptionId: stripeSubscription.id },
      ],
    })

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
      metadata: {
        hasReferralDiscount: session.metadata.hasReferralDiscount === 'true',
        referredBy: session.metadata.referredBy || null,
        discountApplied:
          session.metadata.hasReferralDiscount === 'true'
            ? REFERRAL_DISCOUNT.percentage
            : 0,
      },
    }

    console.log('💾 Subscription data to save:', {
      user: subscriptionData.user.toString(),
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      amount: subscriptionData.amount,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
    })

    try {
      if (subscription) {
        console.log('📝 Updating existing subscription...')
        Object.assign(subscription, subscriptionData)
        await subscription.save()
        console.log('✅ Subscription updated successfully')
      } else {
        console.log('📝 Creating new subscription...')
        subscription = new Subscription(subscriptionData)
        await subscription.save()
        console.log('✅ New subscription created successfully')
      }

      // Update User model's subscription field
      console.log('👤 Updating user subscription field...')
      await updateUserSubscriptionField(user._id, subscription)
      console.log('✅ User subscription field updated')

      // Send notifications
      console.log('📧 Sending notifications...')
      try {
        const planDisplayName = getPlanDetails(session.metadata.planName).name

        if (subscription.trialEnd && subscription.status === 'trialing') {
          await NotificationService.notifyTrialStarted(
            user._id,
            planDisplayName,
            subscription.trialEnd
          )
          console.log('✅ Trial notification sent')
        }

        await NotificationService.notifySubscriptionActivated(user._id, {
          planName: planDisplayName,
          amount: subscription.amount,
          currency: subscription.currency,
          billingCycle: subscription.billingCycle,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd,
          referralDiscount: subscription.metadata?.hasReferralDiscount
            ? {
                percentage: REFERRAL_DISCOUNT.percentage,
                description: 'First month 10% referral discount applied',
              }
            : null,
        })
        console.log('✅ Activation notification sent')
      } catch (notificationError) {
        console.error(
          '⚠️ Notification error (non-critical):',
          notificationError
        )
      }

      // Create earning for referral commission
      console.log('💰 Creating referral earnings...')
      try {
        await createEarningForSubscription(subscription, user._id)
        console.log('✅ Referral earnings created')
      } catch (earningError) {
        console.error('⚠️ Earning creation error (non-critical):', earningError)
      }
    } catch (saveError) {
      console.error('❌ Database save error:', saveError)
      console.error('Error details:', {
        name: saveError.name,
        message: saveError.message,
        code: saveError.code,
      })
      return next(
        createError(500, `Failed to save subscription: ${saveError.message}`)
      )
    }

    // Populate the subscription for response
    await subscription.populate('user', 'name email')

    console.log('🎉 Payment verification completed successfully!')
    console.log('=== END VERIFICATION DEBUG ===')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: 'Subscription created successfully',
        referralDiscount: subscription.metadata?.hasReferralDiscount
          ? {
              applied: true,
              percentage: REFERRAL_DISCOUNT.percentage,
              description: 'First month discount applied',
            }
          : null,
      },
    })
  } catch (error) {
    console.error('❌ Final verification error:', error)
    next(
      createError(500, `Failed to verify checkout session: ${error.message}`)
    )
  }
}

// Add a webhook verification endpoint for live payments
export const verifyWebhookPayment = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature']
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET // You'll need this

    if (!endpointSecret) {
      console.warn('⚠️ No webhook secret configured')
      return res.status(400).send('Webhook secret not configured')
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    console.log('🎣 Webhook received:', event.type)

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object

      console.log('💳 Processing completed checkout session:', session.id)

      // Find user by customer ID or session metadata
      const userId = session.metadata?.userId
      if (!userId) {
        console.error('❌ No user ID in session metadata')
        return res.status(400).send('No user ID found')
      }

      const user = await User.findById(userId)
      if (!user) {
        console.error('❌ User not found:', userId)
        return res.status(400).send('User not found')
      }

      // Process the subscription creation via webhook
      // This is a backup in case the frontend verification fails
      console.log('🔄 Processing subscription via webhook...')

      // You can call the same subscription creation logic here
      // or mark the payment as webhook-verified
    }

    res.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    res.status(500).send('Webhook processing failed')
  }
}

// Add route to check live Stripe configuration
export const checkStripeConfig = async (req, res, next) => {
  try {
    console.log('🔧 Checking Stripe configuration...')

    const isLive = !process.env.STRIPE_SECRET_KEY.includes('test')
    console.log('Stripe Mode:', isLive ? 'LIVE' : 'TEST')

    // Test Stripe connection
    const account = await stripe.accounts.retrieve()
    console.log('Stripe Account:', account.id)
    console.log('Country:', account.country)
    console.log('Currency:', account.default_currency)

    // Check price IDs
    const plans = getAllPlans()
    const priceChecks = []

    for (const plan of plans) {
      try {
        const monthlyPrice = await stripe.prices.retrieve(
          plan.pricing.monthly.priceId
        )
        const yearlyPrice = await stripe.prices.retrieve(
          plan.pricing.yearly.priceId
        )

        priceChecks.push({
          plan: plan.key,
          monthly: {
            id: monthlyPrice.id,
            active: monthlyPrice.active,
            amount: monthlyPrice.unit_amount,
            currency: monthlyPrice.currency,
          },
          yearly: {
            id: yearlyPrice.id,
            active: yearlyPrice.active,
            amount: yearlyPrice.unit_amount,
            currency: yearlyPrice.currency,
          },
        })
      } catch (priceError) {
        priceChecks.push({
          plan: plan.key,
          error: priceError.message,
        })
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        stripeMode: isLive ? 'LIVE' : 'TEST',
        account: {
          id: account.id,
          country: account.country,
          currency: account.default_currency,
        },
        priceIds: priceChecks,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('❌ Stripe config check error:', error)
    res.status(500).json({
      status: 'error',
      message: error.message,
    })
  }
}

// Handle successful payments (for approving earnings)
export const handleSuccessfulPayment = async (
  paymentIntentId,
  subscriptionId
) => {
  try {
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
          trialInfo: null,
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

        // Update User model's subscription field
        await updateUserSubscriptionField(user._id, subscription)
      } catch (error) {
        console.error('Error syncing with Stripe:', error)
      }
    }

    // Calculate trial info
    let trialInfo = null
    if (subscription.status === 'trialing' && subscription.trialEnd) {
      const now = new Date()
      const trialEnd = new Date(subscription.trialEnd)
      const daysRemaining = Math.max(
        0,
        Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24))
      )
      const hoursRemaining = Math.max(
        0,
        Math.ceil((trialEnd - now) / (1000 * 60 * 60))
      )

      trialInfo = {
        isTrialing: true,
        trialEnd: subscription.trialEnd,
        daysRemaining,
        hoursRemaining,
        displayText:
          daysRemaining > 0
            ? `${daysRemaining} day${
                daysRemaining !== 1 ? 's' : ''
              } left in trial`
            : `${hoursRemaining} hour${
                hoursRemaining !== 1 ? 's' : ''
              } left in trial`,
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        trialInfo,
      },
    })
  } catch (error) {
    console.error('Error getting current subscription:', error)
    next(createError(500, 'Failed to retrieve subscription'))
  }
}

// Update subscription (change plan) - UPDATED WITH NOTIFICATIONS
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

    // If no active subscription, redirect to checkout instead of trying to update
    if (!subscription || !subscription.stripeSubscriptionId) {
      // User needs to create a new subscription, not update
      return res.status(400).json({
        status: 'error',
        message:
          'No active subscription found. Please use checkout to start a new subscription.',
        requiresCheckout: true,
        data: {
          planName,
          billingCycle,
        },
      })
    }

    // Don't allow changing to the same plan
    if (
      subscription.plan === planName &&
      subscription.billingCycle === billingCycle
    ) {
      return next(createError(400, 'You are already subscribed to this plan'))
    }

    // Store old plan for notification
    const oldPlanName = getPlanDetails(subscription.plan).name
    const newPlanName = getPlanDetails(planName).name

    // Determine if upgrade or downgrade
    const planHierarchy = { starter: 1, pro: 2, empire: 3 }
    const oldPlanLevel = planHierarchy[subscription.plan] || 0
    const newPlanLevel = planHierarchy[planName] || 0
    const isUpgrade = newPlanLevel > oldPlanLevel

    const newPriceId = getPriceId(planName, billingCycle)

    // Get current subscription item ID
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    )
    const currentItemId = stripeSubscription.items.data[0].id

    // Update subscription in Stripe with proper proration
    const updatedStripeSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: currentItemId,
            price: newPriceId,
          },
        ],
        proration_behavior: isUpgrade ? 'always_invoice' : 'create_prorations',
        payment_behavior: isUpgrade
          ? 'pending_if_incomplete'
          : 'allow_incomplete',
        metadata: {
          userId: user._id.toString(),
          planName: planName,
          billingCycle: billingCycle,
        },
      }
    )

    // If upgrade requires payment, return payment required status
    if (
      updatedStripeSubscription.status === 'incomplete' ||
      updatedStripeSubscription.status === 'past_due'
    ) {
      return res.status(402).json({
        status: 'payment_required',
        message: 'Payment required to complete upgrade',
        data: {
          subscription: updatedStripeSubscription,
          paymentUrl:
            updatedStripeSubscription.latest_invoice?.hosted_invoice_url,
        },
      })
    }

    // Update subscription in database
    subscription.plan = planName
    subscription.billingCycle = billingCycle
    subscription.stripePriceId = newPriceId
    subscription.amount = getAmount(planName, billingCycle)
    await subscription.updateFromStripe(updatedStripeSubscription)

    // Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    // Send notification for plan change
    try {
      const notificationData = {
        oldPlan: oldPlanName,
        newPlan: newPlanName,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
      }

      if (isUpgrade) {
        await NotificationService.notifySubscriptionUpgraded(
          user._id,
          oldPlanName,
          newPlanName,
          notificationData
        )
        console.log(`✅ Upgrade notification sent to ${user.email}`)
      } else {
        await NotificationService.notifySubscriptionDowngraded(
          user._id,
          oldPlanName,
          newPlanName,
          notificationData
        )
        console.log(`✅ Downgrade notification sent to ${user.email}`)
      }
    } catch (notificationError) {
      console.error(
        'Error sending subscription update notification:',
        notificationError
      )
    }

    await subscription.populate('user', 'name email')

    res.status(200).json({
      status: 'success',
      data: {
        subscription,
        message: `Subscription ${
          isUpgrade ? 'upgraded' : 'changed'
        } successfully`,
      },
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    next(createError(500, 'Failed to update subscription'))
  }
}

// Cancel subscription - UPDATED WITH NOTIFICATIONS
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

    const planDisplayName = getPlanDetails(subscription.plan).name

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

    // FIXED: Update User model's subscription field - FORCE FREE PLAN FOR IMMEDIATE CANCELLATION
    if (immediate) {
      // For immediate cancellation, set to free plan
      await User.findByIdAndUpdate(user._id, {
        'subscription.plan': 'free',
        'subscription.status': 'inactive',
        'subscription.isActive': false,
        'subscription.isTrialActive': false,
        'subscription.daysRemaining': 0,
        'subscription.startDate': null,
        'subscription.endDate': null,
        'subscription.trialStartDate': null,
        'subscription.trialEndDate': null,
      })
    } else {
      // For cancel at period end, keep current plan until period ends
      const daysRemaining = subscription.currentPeriodEnd
        ? Math.max(
            0,
            Math.ceil(
              (new Date(subscription.currentPeriodEnd) - new Date()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 0

      await User.findByIdAndUpdate(user._id, {
        'subscription.plan': subscription.plan, // Keep current plan until period end
        'subscription.status': subscription.isActive ? 'active' : 'inactive',
        'subscription.isActive': subscription.isActive,
        'subscription.isTrialActive': subscription.isTrialActive,
        'subscription.daysRemaining': daysRemaining,
        'subscription.startDate': subscription.currentPeriodStart,
        'subscription.endDate': subscription.currentPeriodEnd,
        'subscription.trialStartDate': subscription.trialStart,
        'subscription.trialEndDate': subscription.trialEnd,
      })
    }

    // Send cancellation notification
    try {
      await NotificationService.notifySubscriptionCancelled(user._id, {
        planName: planDisplayName,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        periodEnd: subscription.currentPeriodEnd,
        immediate,
      })
      console.log(`✅ Cancellation notification sent to ${user.email}`)
    } catch (notificationError) {
      console.error(
        'Error sending cancellation notification:',
        notificationError
      )
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

// Reactivate subscription (if canceled at period end) - UPDATED WITH NOTIFICATIONS
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

    // Update User model's subscription field
    await updateUserSubscriptionField(user._id, subscription)

    // Send reactivation notification
    try {
      const planDisplayName = getPlanDetails(subscription.plan).name
      await NotificationService.notifySubscriptionActivated(user._id, {
        planName: planDisplayName,
        amount: subscription.amount,
        currency: subscription.currency,
        billingCycle: subscription.billingCycle,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        reactivated: true,
      })
      console.log(`✅ Reactivation notification sent to ${user.email}`)
    } catch (notificationError) {
      console.error(
        'Error sending reactivation notification:',
        notificationError
      )
    }

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

    // Update User model's subscription field
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
