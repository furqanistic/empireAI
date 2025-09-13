// File: config/stripe.js - UPDATED WITH STRIPE CONNECT
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
    name: 'Empire', // Display name for frontend
    description: 'For empire builders who want total domination.',
    features: [
      'Everything in Pro',
      'Empire AI Life OS',
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

// STRIPE CONNECT CONFIGURATION
export const CONNECT_CONFIG = {
  // Commission rates for different plan types
  commissionRates: {
    starter: 0.05, // 5%
    pro: 0.08, // 8%
    empire: 0.12, // 12%
  },

  // Minimum payout amounts (in cents)
  minimumPayout: {
    USD: 1000, // $10.00
    EUR: 1000, // €10.00
    GBP: 800, // £8.00
  },

  // Payout schedules
  payoutSchedule: {
    manual: 'Manual payouts on request',
    weekly: 'Weekly automatic payouts',
    monthly: 'Monthly automatic payouts',
  },

  // Connect account capabilities
  capabilities: ['card_payments', 'transfers'],

  // Countries supported for Connect accounts
  supportedCountries: [
    'US',
    'CA',
    'GB',
    'AU',
    'NZ',
    'JP',
    'SG',
    'HK',
    'AT',
    'BE',
    'BG',
    'HR',
    'CY',
    'CZ',
    'DK',
    'EE',
    'FI',
    'FR',
    'DE',
    'GR',
    'HU',
    'IE',
    'IT',
    'LV',
    'LT',
    'LU',
    'MT',
    'NL',
    'NO',
    'PL',
    'PT',
    'RO',
    'SK',
    'SI',
    'ES',
    'SE',
    'CH',
    'BR',
    'MX',
  ],
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

// NEW: Helper function to get commission rate
export const getCommissionRate = (planName) => {
  if (!SUBSCRIPTION_PLANS[planName]) {
    throw new Error(`Invalid plan: ${planName}`)
  }
  return CONNECT_CONFIG.commissionRates[planName] || 0.05
}

// NEW: Helper function to calculate commission
export const calculateCommission = (amount, planName) => {
  const rate = getCommissionRate(planName)
  return Math.floor(amount * rate) // Return in cents
}

// NEW: Helper function to validate minimum payout
export const validateMinimumPayout = (amount, currency = 'USD') => {
  const minimum =
    CONNECT_CONFIG.minimumPayout[currency] || CONNECT_CONFIG.minimumPayout.USD
  return amount >= minimum
}

// Free trial configuration - CHANGED FROM 14 TO 7 DAYS
export const TRIAL_PERIOD_DAYS = 7

// Stripe webhook events we care about (UPDATED WITH CONNECT EVENTS)
export const STRIPE_EVENTS = {
  // Subscription events
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',

  // Connect events
  ACCOUNT_UPDATED: 'account.updated',
  ACCOUNT_APPLICATION_DEAUTHORIZED: 'account.application.deauthorized',
  CAPABILITY_UPDATED: 'capability.updated',
  PERSON_CREATED: 'person.created',
  PERSON_UPDATED: 'person.updated',

  // Payout events
  PAYOUT_CREATED: 'payout.created',
  PAYOUT_UPDATED: 'payout.updated',
  PAYOUT_PAID: 'payout.paid',
  PAYOUT_FAILED: 'payout.failed',
  PAYOUT_CANCELED: 'payout.canceled',

  // Transfer events
  TRANSFER_CREATED: 'transfer.created',
  TRANSFER_UPDATED: 'transfer.updated',
  TRANSFER_PAID: 'transfer.paid',
  TRANSFER_FAILED: 'transfer.failed',
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

// NEW: Helper function to create Stripe Connect account
export const createConnectAccount = async (user, countryCode = 'US') => {
  try {
    // Validate country
    if (!CONNECT_CONFIG.supportedCountries.includes(countryCode)) {
      throw new Error(
        `Country ${countryCode} is not supported for Connect accounts`
      )
    }

    const account = await stripe.accounts.create({
      type: 'express',
      country: countryCode,
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

    return account
  } catch (error) {
    console.error('Error creating Connect account:', error)
    throw error
  }
}

// NEW: Helper function to create account link for onboarding
export const createAccountLink = async (accountId, returnUrl, refreshUrl) => {
  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    })

    return accountLink
  } catch (error) {
    console.error('Error creating account link:', error)
    throw error
  }
}

// NEW: Helper function to retrieve Connect account
export const retrieveConnectAccount = async (accountId) => {
  try {
    const account = await stripe.accounts.retrieve(accountId)
    return account
  } catch (error) {
    console.error('Error retrieving Connect account:', error)
    throw error
  }
}
