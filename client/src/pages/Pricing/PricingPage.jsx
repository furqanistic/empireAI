// File: client/src/pages/Pricing/PricingPage.jsx - COMPLETE FIXED VERSION
import {
  useCreateBillingPortalSession,
  useCreateCheckoutSession,
  useCurrentUser,
  useGetPlans,
  useSubscriptionStatus,
  useUpdateSubscription,
} from '@/hooks/useAuth'
import {
  AlertTriangle,
  Bot,
  Check,
  Crown,
  DollarSign,
  Loader,
  MessageCircle,
  Rocket,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../Layout/Layout'

const PricingPage = () => {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState('monthly')
  const currentUser = useCurrentUser()

  // Stripe hooks
  const {
    data: plansData,
    isLoading: plansLoading,
    error: plansError,
  } = useGetPlans()
  const { subscriptionStatus, isLoading: subscriptionLoading } =
    useSubscriptionStatus()
  const createCheckoutSession = useCreateCheckoutSession()
  const updateSubscription = useUpdateSubscription()
  const createBillingPortal = useCreateBillingPortalSession()

  // Map your local plans to Stripe plans
  const mapPlanToStripe = (localPlan) => {
    const stripeMapping = {
      Starter: 'starter',
      Pro: 'pro',
      Empire: 'empire',
    }
    return stripeMapping[localPlan] || localPlan.toLowerCase()
  }

  const handleGetStarted = async (planName) => {
    if (!currentUser) {
      navigate('/auth?redirect=pricing')
      return
    }

    const stripePlanName = mapPlanToStripe(planName)

    // If user has an active subscription
    if (subscriptionStatus.hasSubscription && subscriptionStatus.isActive) {
      // If clicking on the same plan they already have
      if (subscriptionStatus.plan === stripePlanName) {
        alert('You are already subscribed to this plan')
        return
      }

      // HANDLE PLAN CHANGE
      console.log(
        'Changing plan from',
        subscriptionStatus.plan,
        'to',
        stripePlanName
      )

      // Check if it's an upgrade or downgrade
      const planHierarchy = { starter: 1, pro: 2, empire: 3 }
      const currentPlanLevel = planHierarchy[subscriptionStatus.plan] || 0
      const newPlanLevel = planHierarchy[stripePlanName] || 0

      const isUpgrade = newPlanLevel > currentPlanLevel

      // Confirm plan change with user
      const confirmMessage = isUpgrade
        ? `Upgrade to ${planName} plan? You'll be charged the prorated difference immediately.`
        : `Downgrade to ${planName} plan? The change will take effect at the end of your current billing period.`

      if (!window.confirm(confirmMessage)) {
        return
      }

      // Update the subscription
      try {
        await updateSubscription.mutateAsync({
          planName: stripePlanName,
          billingCycle: billingCycle,
        })
        alert(
          `Successfully ${
            isUpgrade ? 'upgraded' : 'changed'
          } to ${planName} plan!`
        )
        // Optionally reload to show updated subscription status
        window.location.reload()
      } catch (error) {
        console.error('Failed to update subscription:', error)
        alert('Failed to update subscription. Please try again.')
      }

      return
    }

    // For new subscriptions (no active subscription)
    console.log(
      'Creating checkout session for new subscription:',
      stripePlanName
    )
    createCheckoutSession.mutate({
      planName: stripePlanName,
      billingCycle: billingCycle,
    })
  }

  const getButtonText = (planName) => {
    if (!currentUser) return 'Get Started'
    if (subscriptionLoading || updateSubscription.isLoading) return 'Loading...'

    const stripePlan = mapPlanToStripe(planName)

    if (subscriptionStatus.hasSubscription && subscriptionStatus.isActive) {
      if (subscriptionStatus.plan === stripePlan) {
        return 'Current Plan'
      }
      // Show different text for plan changes
      const planHierarchy = { starter: 1, pro: 2, empire: 3 }
      const currentLevel = planHierarchy[subscriptionStatus.plan] || 0
      const targetLevel = planHierarchy[stripePlan] || 0

      if (targetLevel > currentLevel) {
        return 'Upgrade to This Plan'
      } else {
        return 'Switch to This Plan'
      }
    }

    return 'Start Free Trial'
  }

  const isCurrentPlan = (planName) => {
    const stripePlan = mapPlanToStripe(planName)
    return subscriptionStatus.plan === stripePlan && subscriptionStatus.isActive
  }

  const PricingCard = ({
    plan,
    price,
    monthlyPrice,
    yearlyPrice,
    description,
    features,
    popular = false,
    icon,
    buttonText = 'Get Started',
    buttonVariant = 'primary',
    affiliateEarnings,
  }) => {
    const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice
    const savings =
      billingCycle === 'yearly'
        ? Math.round(
            ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
          )
        : 0

    const actualButtonText = getButtonText(plan)
    const isDisabled =
      createCheckoutSession.isLoading ||
      updateSubscription.isLoading ||
      (isCurrentPlan(plan) && subscriptionStatus.billingCycle === billingCycle)

    return (
      <div
        className={`relative bg-[#121214] border rounded-xl p-6 transition-all duration-300 hover:border-[#D4AF37]/40 hover:bg-[#1A1A1C]/50 flex flex-col h-full ${
          popular
            ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/20'
            : 'border-[#1E1E21]'
        }`}
      >
        {popular && (
          <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
            <div className='bg-[#D4AF37] text-black px-4 py-1 rounded-lg text-sm font-bold uppercase tracking-wider'>
              Popular
            </div>
          </div>
        )}

        <div className='flex items-center gap-3 mb-4'>
          <div
            className={`p-2 rounded-xl ${
              popular ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/10'
            }`}
          >
            {React.cloneElement(icon, {
              size: 20,
              className: popular ? 'text-black' : 'text-[#D4AF37]',
            })}
          </div>
          <h3 className='text-xl font-bold text-[#EDEDED]'>{plan}</h3>
          {isCurrentPlan(plan) && (
            <div className='bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-xs font-medium'>
              Active
            </div>
          )}
        </div>

        <p className='text-gray-400 text-sm mb-6 leading-relaxed'>
          {description}
        </p>

        <div className='mb-6'>
          <div className='flex items-baseline gap-2 mb-2'>
            <span className='text-3xl font-bold text-[#EDEDED]'>
              ${displayPrice}
            </span>
            <span className='text-gray-400 text-sm'>
              /{billingCycle === 'monthly' ? 'month' : 'year'}
            </span>
          </div>
          {billingCycle === 'yearly' && savings > 0 && (
            <div className='text-emerald-400 text-sm font-medium'>
              Save {savings}% with yearly billing
            </div>
          )}

          {/* Founder Pricing Badge */}
          <div className='inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-medium mt-2'>
            🚀 Founder Pricing - Limited Time
          </div>

          {/* Trial Notice */}
          {!isCurrentPlan(plan) &&
            currentUser &&
            !subscriptionStatus.hasSubscription && (
              <div className='text-blue-400 text-xs font-medium mt-2'>
                14-day free trial included
              </div>
            )}

          {/* Current billing cycle notice */}
          {isCurrentPlan(plan) &&
            subscriptionStatus.billingCycle !== billingCycle && (
              <div className='text-yellow-400 text-xs font-medium mt-2'>
                Currently on {subscriptionStatus.billingCycle} billing
              </div>
            )}
        </div>

        <div className='space-y-3 mb-6 flex-1'>
          {features.map((feature, index) => (
            <div key={index} className='flex items-center gap-3'>
              <div className='flex-shrink-0'>
                <Check size={16} className='text-[#D4AF37]' />
              </div>
              <span className='text-[#EDEDED] text-sm'>{feature}</span>
            </div>
          ))}
        </div>

        {/* Affiliate Earnings Info */}
        <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3 mb-4'>
          <div className='text-center'>
            <div className='text-xs text-gray-400 mb-1'>Affiliate Earnings</div>
            <div className='text-sm font-semibold text-[#D4AF37]'>
              L1: ${affiliateEarnings.l1}/mo • L2: ${affiliateEarnings.l2}/mo
            </div>
          </div>
        </div>

        <button
          onClick={() => handleGetStarted(plan)}
          disabled={isDisabled}
          className={`w-full h-10 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 mt-auto flex items-center justify-center gap-2 ${
            isDisabled
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : buttonVariant === 'primary' || popular
              ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 shadow-lg hover:shadow-[#D4AF37]/20'
              : 'bg-[#1E1E21] text-[#EDEDED] hover:bg-[#2A2A2D] border border-[#1E1E21]'
          }`}
        >
          {createCheckoutSession.isLoading || updateSubscription.isLoading ? (
            <>
              <Loader size={14} className='animate-spin' />
              Processing...
            </>
          ) : (
            actualButtonText
          )}
        </button>
      </div>
    )
  }

  const FeatureHighlight = ({ icon, title, description }) => (
    <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 hover:border-[#D4AF37]/40 hover:bg-[#1A1A1C]/50 transition-all duration-300'>
      <div className='flex items-center gap-3 mb-3'>
        <div className='bg-[#D4AF37]/10 p-2 rounded-xl'>
          {React.cloneElement(icon, { size: 20, className: 'text-[#D4AF37]' })}
        </div>
        <h3 className='text-lg font-semibold text-[#EDEDED]'>{title}</h3>
      </div>
      <p className='text-gray-400 text-sm leading-relaxed'>{description}</p>
    </div>
  )

  const pricingPlans = [
    {
      plan: 'Starter',
      monthlyPrice: 5,
      yearlyPrice: 50,
      description: 'Perfect for beginners starting their digital journey.',
      features: [
        'AI Product Generator',
        'Basic Content Creation',
        'Starter Templates',
        'Community Access',
        'Email Support',
      ],
      icon: <Rocket />,
      affiliateEarnings: { l1: '2.00', l2: '0.50' },
    },
    {
      plan: 'Pro',
      monthlyPrice: 12,
      yearlyPrice: 120,
      description: 'For serious creators ready to scale and monetize.',
      features: [
        'Everything in Starter',
        'AI Product Generator Pro',
        'Viral Hook Factory',
        'Pro AI Strategist',
        'Advanced Templates',
        'Priority Support',
      ],
      icon: <Crown />,
      popular: true,
      affiliateEarnings: { l1: '4.80', l2: '1.20' },
    },
    {
      plan: 'Empire',
      monthlyPrice: 25,
      yearlyPrice: 250,
      description: 'For empire builders who want total domination.',
      features: [
        'Everything in Pro',
        'Empire AI Life OS',
        'Full Automation Suite',
        'Empire Architect AI',
        'Direct Mentor Access',
      ],
      icon: <Star />,
      buttonText: 'Go Empire',
      affiliateEarnings: { l1: '10.00', l2: '2.50' },
    },
  ]

  // Loading state
  if (plansLoading) {
    return (
      <Layout>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <Loader className='mx-auto h-8 w-8 animate-spin text-[#D4AF37] mb-4' />
            <div className='text-[#EDEDED] text-lg'>
              Loading pricing plans...
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Error state
  if (plansError) {
    return (
      <Layout>
        <div className='min-h-screen flex items-center justify-center'>
          <div className='text-center'>
            <AlertTriangle className='mx-auto h-12 w-12 text-red-400 mb-4' />
            <div className='text-red-400 text-xl mb-4'>
              Error loading pricing plans
            </div>
            <button
              onClick={() => window.location.reload()}
              className='bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700'
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-8 sm:space-y-12'>
        {/* Header Section */}
        <div className='text-center space-y-4 sm:space-y-6 max-w-5xl mx-auto'>
          <div className='inline-flex items-center gap-2 bg-[#121214] border border-[#1E1E21] rounded-xl px-4 py-2'>
            <DollarSign size={16} className='text-[#D4AF37]' />
            <span className='text-[#EDEDED] text-sm font-medium'>
              Founder Pricing - Limited Time
            </span>
          </div>

          <h1 className='text-3xl sm:text-4xl lg:text-6xl font-bold text-[#EDEDED] leading-tight'>
            Choose Your <span className='text-[#D4AF37]'>Empire</span> Level
          </h1>

          <p className='text-gray-400 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed'>
            Start building your digital empire today. Lock in founder pricing
            and scale from creator to mogul with our AI-powered platform.
          </p>

          {/* Current Subscription Status */}
          {subscriptionStatus.hasSubscription && (
            <div className='bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 max-w-md mx-auto'>
              <div className='flex flex-col items-center justify-center space-y-2'>
                <div className='flex items-center space-x-2 text-blue-200'>
                  <Star size={16} />
                  <span>
                    Current Plan:{' '}
                    <strong className='text-[#D4AF37] capitalize'>
                      {subscriptionStatus.plan} (
                      {subscriptionStatus.billingCycle})
                    </strong>
                  </span>
                </div>
                {subscriptionStatus.trialActive && (
                  <span className='text-green-300 text-sm'>
                    Trial: {subscriptionStatus.daysRemaining} days remaining
                  </span>
                )}
                {subscriptionStatus.cancelAtPeriodEnd && (
                  <span className='text-yellow-300 text-sm'>
                    Cancels at period end
                  </span>
                )}
                <button
                  onClick={() => createBillingPortal.mutate()}
                  className='text-blue-300 hover:text-blue-200 underline text-sm mt-2'
                >
                  Manage Billing & Invoices
                </button>
              </div>
            </div>
          )}

          {/* Founder Pricing Alert */}
          <div className='bg-gradient-to-r from-emerald-500/10 via-emerald-400/5 to-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 max-w-3xl mx-auto'>
            <div className='flex items-center justify-center gap-2 text-emerald-400 mb-2'>
              <Star size={16} />
              <span className='font-semibold text-sm'>Early Bird Special</span>
            </div>
            <p className='text-emerald-300 text-sm'>
              Get grandfathered pricing! Early users keep these rates forever,
              even when we raise prices later.
            </p>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className='flex justify-center'>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-1 flex'>
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-[#EDEDED] hover:text-[#D4AF37]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                billingCycle === 'yearly'
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-[#EDEDED] hover:text-[#D4AF37]'
              }`}
            >
              Yearly
              <div className='absolute -top-1 -right-1 bg-emerald-500 text-white text-xs px-1 rounded text-[10px]'>
                SAVE
              </div>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>

        {/* Affiliate Program Highlight */}
        <div className='bg-gradient-to-r from-[#121214] via-[#1A1A1C] to-[#121214] border border-[#1E1E21] rounded-xl p-6 sm:p-8'>
          <div className='text-center mb-6'>
            <h2 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-3'>
              💰 2-Tier Affiliate Program
            </h2>
            <p className='text-gray-400 text-lg mb-4'>
              Earn recurring commissions by referring others to Ascend AI
            </p>

            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-4 max-w-2xl mx-auto mb-6'>
              <h3 className='text-[#D4AF37] font-semibold text-sm mb-3'>
                How the 2-Tier System Works:
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-left'>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='w-6 h-6 bg-[#D4AF37] text-black text-xs font-bold rounded-full flex items-center justify-center'>
                      L1
                    </div>
                    <span className='text-[#EDEDED] font-medium text-sm'>
                      Level 1 (Direct)
                    </span>
                  </div>
                  <p className='text-gray-400 text-xs'>
                    People YOU directly refer to Ascend AI. You earn 40%
                    recurring commission on their subscription.
                  </p>
                </div>
                <div>
                  <div className='flex items-center gap-2 mb-1'>
                    <div className='w-6 h-6 bg-[#D4AF37]/70 text-black text-xs font-bold rounded-full flex items-center justify-center'>
                      L2
                    </div>
                    <span className='text-[#EDEDED] font-medium text-sm'>
                      Level 2 (Sub-Affiliates)
                    </span>
                  </div>
                  <p className='text-gray-400 text-xs'>
                    People that YOUR referrals bring in. You earn 10% override
                    commission on their subscriptions too.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-4'>
              <div className='text-2xl font-bold text-[#D4AF37] mb-2'>40%</div>
              <div className='text-sm text-gray-400 mb-2'>
                Level 1 Commission
              </div>
              <div className='text-xs text-gray-500'>On direct referrals</div>
            </div>
            <div className='text-center bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-4'>
              <div className='text-2xl font-bold text-[#D4AF37] mb-2'>10%</div>
              <div className='text-sm text-gray-400 mb-2'>Level 2 Override</div>
              <div className='text-xs text-gray-500'>
                On sub-affiliate referrals
              </div>
            </div>
            <div className='text-center bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-4'>
              <div className='text-2xl font-bold text-[#D4AF37] mb-2'>∞</div>
              <div className='text-sm text-gray-400 mb-2'>Recurring</div>
              <div className='text-xs text-gray-500'>
                As long as they subscribe
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className='space-y-6 sm:space-y-8'>
          <div className='text-center'>
            <h2 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-3'>
              Everything You Need to Build Your Empire
            </h2>
            <p className='text-gray-400 text-lg max-w-2xl mx-auto'>
              Our AI-powered tools and systems are designed to accelerate your
              journey from startup to empire.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <FeatureHighlight
              icon={<Bot />}
              title='AI-Powered Creation'
              description='Generate products, content, and strategies with advanced AI that understands your market and audience.'
            />
            <FeatureHighlight
              icon={<Users />}
              title='Affiliate Army System'
              description='Build and manage a powerful affiliate network that scales your reach exponentially across all channels.'
            />
            <FeatureHighlight
              icon={<TrendingUp />}
              title='Advanced Analytics'
              description='Deep insights into your performance, revenue streams, and growth opportunities with actionable recommendations.'
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className='bg-gradient-to-r from-[#121214] via-[#1A1A1C] to-[#121214] border border-[#1E1E21] rounded-xl p-6 sm:p-8 text-center'>
          <div className='max-w-3xl mx-auto space-y-6'>
            <div className='flex items-center justify-center gap-3 mb-4'>
              <div className='bg-[#D4AF37] p-2.5 rounded-xl'>
                <MessageCircle size={24} className='text-black' />
              </div>
              <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold text-[#EDEDED]'>
                Ready to Start Your Empire?
              </h2>
            </div>

            <p className='text-gray-400 text-lg leading-relaxed'>
              Join thousands of entrepreneurs who are building their digital
              empires with our AI-powered platform. Lock in founder pricing with
              a 14-day free trial.
            </p>

            <div className='flex items-center justify-center gap-6 text-sm text-gray-400'>
              <div className='flex items-center gap-2'>
                <Check size={16} className='text-[#D4AF37]' />
                <span>14-day free trial</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check size={16} className='text-[#D4AF37]' />
                <span>No credit card required</span>
              </div>
              <div className='flex items-center gap-2'>
                <Check size={16} className='text-[#D4AF37]' />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default PricingPage
