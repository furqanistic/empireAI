// File: server/config/commission.js

// Commission rates for direct referrals
export const COMMISSION_RATES = {
  starter: {
    monthly: 0.4, // 40% of $19 = $7.60
    yearly: 0.4, // 40% of $190 = $76
  },
  pro: {
    monthly: 0.4, // 40% of $49 = $19.60
    yearly: 0.4, // 40% of $490 = $196
  },
  empire: {
    monthly: 0.4, // 40% of $99 = $39.60
    yearly: 0.4, // 40% of $990 = $396
  },
}

// Sub-affiliate rate (2-tier system)
export const SUB_AFFILIATE_RATE = 0.1 // 10% of referral earnings

// Minimum payout threshold (in cents)
export const MINIMUM_PAYOUT = 1000 // $10.00

// Earnings approval settings
export const EARNINGS_CONFIG = {
  // How long to wait before auto-approving earnings (in days)
  autoApprovalDelay: 14,

  // Whether to create earnings immediately or wait for payment
  createOnPurchase: true,

  // Whether to create renewal earnings
  createOnRenewal: true,
}

// Get commission rate for a plan and billing cycle
export const getCommissionRate = (plan, billingCycle = 'monthly') => {
  if (!COMMISSION_RATES[plan]) {
    console.warn(`No commission rate found for plan: ${plan}`)
    return 0
  }
  return COMMISSION_RATES[plan][billingCycle] || COMMISSION_RATES[plan].monthly
}

// Calculate commission amount
export const calculateCommission = (amount, plan, billingCycle = 'monthly') => {
  const rate = getCommissionRate(plan, billingCycle)
  return Math.floor(amount * rate) // Amount in cents
}

// Calculate sub-affiliate commission (10% of the referrer's earning)
export const calculateSubAffiliateCommission = (referralEarning) => {
  return Math.floor(referralEarning * SUB_AFFILIATE_RATE)
}
