// File: client/src/pages/Pricing/PricingPage.jsx
import {
  Bot,
  Check,
  Crown,
  DollarSign,
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
import Layout from '../Layout/Layout'

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly')

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
  }) => {
    const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice
    const savings =
      billingCycle === 'yearly'
        ? Math.round(
            ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
          )
        : 0

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

        <button
          className={`w-full h-8 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 mt-auto ${
            buttonVariant === 'primary' || popular
              ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 shadow-lg hover:shadow-[#D4AF37]/20'
              : 'bg-[#1E1E21] text-[#EDEDED] hover:bg-[#2A2A2D] border border-[#1E1E21]'
          }`}
        >
          {buttonText}
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
      plan: 'Pro',
      monthlyPrice: 29,
      yearlyPrice: 290,
      description: 'For serious creators ready to monetize.',
      features: [
        'AI Product Generator',
        'Viral Hook Factory',
        'Pro AI Strategist',
        'Basic Analytics',
      ],
      icon: <Rocket />,
      popular: true,
    },
    {
      plan: 'Empire',
      monthlyPrice: 99,
      yearlyPrice: 990,
      description: 'For empire builders ready to scale.',
      features: [
        'Everything in Pro',
        'Empire Architect AI',
        'Affiliate Army System',
        'Advanced Analytics',
        'Direct Mentor Access',
      ],
      icon: <Crown />,
    },
    {
      plan: 'Ultimate',
      monthlyPrice: 299,
      yearlyPrice: 2990,
      description: 'For those who want it all. Total domination.',
      features: [
        'Everything in Empire',
        'Ultimate AI Life OS',
        'Full Automation Suite',
        'Founder Access',
        'Priority Support',
      ],
      icon: <Star />,
      buttonText: 'Go Ultimate',
      buttonVariant: 'secondary',
    },
  ]

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-8 sm:space-y-12'>
        {/* Header Section */}
        <div className='text-center space-y-4 sm:space-y-6'>
          <div className='inline-flex items-center gap-2 bg-[#121214] border border-[#1E1E21] rounded-xl px-4 py-2'>
            <DollarSign size={16} className='text-[#D4AF37]' />
            <span className='text-[#EDEDED] text-sm font-medium'>
              Simple, Transparent Pricing
            </span>
          </div>

          <h1 className='text-3xl sm:text-4xl lg:text-5xl font-bold text-[#EDEDED] leading-tight'>
            Choose Your <span className='text-[#D4AF37]'>Empire</span> Level
          </h1>

          <p className='text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed'>
            Start building your digital empire today. Scale from creator to
            mogul with our AI-powered platform.
          </p>
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
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8'>
          {pricingPlans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
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
              empires with our AI-powered platform. Start your journey today
              with a 14-day free trial.
            </p>

            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <button className='w-full sm:w-auto bg-[#D4AF37] text-black h-8 px-6 rounded-xl font-semibold text-sm hover:bg-[#D4AF37]/90 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-[#D4AF37]/20'>
                Start Free Trial
              </button>
              <button className='w-full sm:w-auto bg-[#1E1E21] text-[#EDEDED] h-8 px-6 rounded-xl font-semibold text-sm hover:bg-[#2A2A2D] transition-all duration-300 border border-[#1E1E21]'>
                Schedule Demo
              </button>
            </div>

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
