// File: config/stripe.js
import dotenv from 'dotenv'
import Stripe from 'stripe'
dotenv.config({ quiet: true })

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Subscription Plans Configuration - UPDATED TO MATCH FRONTEND
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    description: 'Perfect for beginners starting their digital journey.',
    features: [
      'AI Product Generator',
      'Basic Content Creation',
      'Starter Templates',
      'Community Access',
      'Email Support',
    ],
    limits: {
      referralLinks: 10,
      monthlyClicks: 1000,
    },
    pricing: {
      monthly: {
        amount: 500, // $5.00 in cents - UPDATED TO MATCH FRONTEND
        priceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID,
        interval: 'month',
      },
      yearly: {
        amount: 5000, // $50.00 in cents - UPDATED TO MATCH FRONTEND
        priceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID,
        interval: 'year',
      },
    },
  },
  pro: {
    name: 'Pro',
    description: 'For serious creators ready to scale and monetize.',
    features: [
      'Everything in Starter',
      'AI Product Generator Pro',
      'Viral Hook Factory',
      'Pro AI Strategist',
      'Advanced Templates',
      'Priority Support',
    ],
    limits: {
      referralLinks: -1, // Unlimited
      monthlyClicks: 10000,
    },
    pricing: {
      monthly: {
        amount: 1200, // $12.00 in cents - UPDATED TO MATCH FRONTEND
        priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
        interval: 'month',
      },
      yearly: {
        amount: 12000, // $120.00 in cents - UPDATED TO MATCH FRONTEND
        priceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
        interval: 'year',
      },
    },
  },
  empire: {
    name: 'Ultimate', // Display name for frontend
    description: 'For empire builders who want total domination.',
    features: [
      'Everything in Pro',
      'Ultimate AI Life OS',
      'Full Automation Suite',
      'Empire Architect AI',
      'Direct Mentor Access',
      'White-label Rights',
      '1-on-1 Strategy Calls',
    ],
    limits: {
      referralLinks: -1, // Unlimited
      monthlyClicks: -1, // Unlimited
    },
    pricing: {
      monthly: {
        amount: 2500, // $25.00 in cents - UPDATED TO MATCH FRONTEND
        priceId: process.env.STRIPE_EMPIRE_MONTHLY_PRICE_ID,
        interval: 'month',
      },
      yearly: {
        amount: 25000, // $250.00 in cents - UPDATED TO MATCH FRONTEND
        priceId: process.env.STRIPE_EMPIRE_YEARLY_PRICE_ID,
        interval: 'year',
      },
    },
  },
}

// Helper function to get plan details
export const getPlanDetails = (planName, billingCycle = 'monthly') => {
  const plan = SUBSCRIPTION_PLANS[planName]
  if (!plan) {
    throw new Error(`Plan ${planName} not found`)
  }

  return {
    ...plan,
    pricing: plan.pricing[billingCycle],
    billingCycle,
  }
}

// Helper function to get all plans
export const getAllPlans = () => {
  return Object.keys(SUBSCRIPTION_PLANS).map((planKey) => ({
    key: planKey,
    ...SUBSCRIPTION_PLANS[planKey],
  }))
}

// Helper function to validate plan and billing cycle
export const validatePlanAndBilling = (planName, billingCycle) => {
  if (!SUBSCRIPTION_PLANS[planName]) {
    throw new Error(`Invalid plan: ${planName}`)
  }

  if (!['monthly', 'yearly'].includes(billingCycle)) {
    throw new Error(`Invalid billing cycle: ${billingCycle}`)
  }

  if (!SUBSCRIPTION_PLANS[planName].pricing[billingCycle]) {
    throw new Error(
      `Billing cycle ${billingCycle} not available for plan ${planName}`
    )
  }

  return true
}

// Helper function to get price ID
export const getPriceId = (planName, billingCycle) => {
  validatePlanAndBilling(planName, billingCycle)
  return SUBSCRIPTION_PLANS[planName].pricing[billingCycle].priceId
}

// Helper function to get amount
export const getAmount = (planName, billingCycle) => {
  validatePlanAndBilling(planName, billingCycle)
  return SUBSCRIPTION_PLANS[planName].pricing[billingCycle].amount
}

// Free trial configuration
export const TRIAL_PERIOD_DAYS = 14

// Stripe webhook events we care about
export const STRIPE_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
}

// Helper function to create or retrieve Stripe customer
export const createOrRetrieveCustomer = async (user) => {
  try {
    // Check if user already has a Stripe customer ID
    if (user.stripeCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(user.stripeCustomerId)
        return customer
      } catch (error) {
        console.log(
          'Stripe customer not found, creating new one:',
          error.message
        )
      }
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    })

    return customer
  } catch (error) {
    console.error('Error creating/retrieving Stripe customer:', error)
    throw error
  }
}
