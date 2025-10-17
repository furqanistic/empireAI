// File: client/src/pages/Home/HomePage.jsx
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  Crown,
  ExternalLink,
  Mail,
  Menu,
  MessageCircle,
  Rocket,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [counts, setCounts] = useState({ builders: 0, products: 0, revenue: 0 })

  const handleGetStarted = () => {
    window.location.href = '/auth'
  }

  useEffect(() => {
    const targets = { builders: 12500, products: 8900, revenue: 2400 }
    let currentStep = 0
    const timer = setInterval(() => {
      if (currentStep < 60) {
        const progress = currentStep / 60
        setCounts({
          builders: Math.floor(targets.builders * progress),
          products: Math.floor(targets.products * progress),
          revenue: Math.floor(targets.revenue * progress),
        })
        currentStep++
      } else {
        setCounts(targets)
        clearInterval(timer)
      }
    }, 33)
    return () => clearInterval(timer)
  }, [])

  const FeatureCard = ({ icon: Icon, title, description, index }) => (
    <div className='group relative p-6 rounded-lg border border-gray-800 bg-gray-950/40 backdrop-blur-sm hover:border-[#D4AF37]/50 hover:bg-gray-900/60 transition-all duration-300 cursor-pointer overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 group-hover:to-[#D4AF37]/10 transition-all duration-300' />

      <div className='relative z-10'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-12 h-12 rounded-lg bg-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#D4AF37]/20'>
            <Icon size={24} className='text-black' strokeWidth={1.5} />
          </div>
        </div>
        <h3 className='text-white font-semibold mb-2 text-lg group-hover:text-[#D4AF37] transition-colors duration-300'>
          {title}
        </h3>
        <p className='text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300'>
          {description}
        </p>
      </div>
    </div>
  )

  const TestimonialCard = ({ name, role, content, avatar }) => (
    <div className='p-6 rounded-lg border border-gray-800 bg-gray-950/40 hover:border-[#D4AF37]/30 transition-all duration-300'>
      <div className='flex items-center gap-2 mb-4'>
        {[...Array(5)].map((_, i) => (
          <span key={i} className='text-[#D4AF37]'>
            ★
          </span>
        ))}
      </div>
      <p className='text-gray-300 mb-4 leading-relaxed text-sm'>{content}</p>
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-black font-semibold text-sm'>
          {avatar}
        </div>
        <div>
          <p className='text-white font-semibold text-sm'>{name}</p>
          <p className='text-gray-400 text-xs'>{role}</p>
        </div>
      </div>
    </div>
  )

  const PricingCard = ({
    plan,
    price,
    description,
    features,
    popular = false,
    icon: Icon,
  }) => (
    <div
      className={`relative rounded-lg border transition-all duration-300 overflow-hidden ${
        popular
          ? 'border-[#D4AF37]/50 bg-gray-900/80 ring-1 ring-[#D4AF37]/20 hover:border-[#D4AF37]/80 hover:ring-[#D4AF37]/40'
          : 'border-gray-800 bg-gray-950/40 hover:border-gray-700 hover:bg-gray-900/60'
      }`}
    >
      {popular && (
        <div className='absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
          <span className='bg-[#D4AF37] text-black px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg shadow-[#D4AF37]/30'>
            Most Popular
          </span>
        </div>
      )}

      <div className='p-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              popular ? 'bg-[#D4AF37]' : 'bg-gray-800'
            }`}
          >
            <Icon
              size={24}
              className={popular ? 'text-black' : 'text-[#D4AF37]'}
              strokeWidth={1.5}
            />
          </div>
          <h3 className='text-xl font-semibold text-white'>{plan}</h3>
        </div>

        <p className='text-gray-400 text-sm mb-6 leading-relaxed'>
          {description}
        </p>

        <div className='mb-6 pb-6 border-b border-gray-800'>
          <div className='flex items-baseline gap-1 mb-2'>
            <span className='text-4xl font-bold text-white'>${price}</span>
            <span className='text-gray-400'>/month</span>
          </div>
          <p className='text-xs text-[#D4AF37]/80 font-medium'>
            Founder pricing • Limited time
          </p>
        </div>

        <ul className='space-y-3 mb-8'>
          {features.map((feature, i) => (
            <li key={i} className='flex items-start gap-3'>
              <CheckCircle
                size={16}
                className='text-[#D4AF37] flex-shrink-0 mt-0.5'
              />
              <span className='text-sm text-gray-300'>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={handleGetStarted}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 ${
            popular
              ? 'bg-[#D4AF37] text-black hover:shadow-lg hover:shadow-[#D4AF37]/40'
              : 'border border-gray-700 text-white hover:border-[#D4AF37]/30 hover:bg-gray-900'
          }`}
        >
          Get Started
        </button>
      </div>
    </div>
  )

  return (
    <div className='min-h-screen bg-black text-white'>
      {/* Navigation */}
      <nav className='fixed top-0 left-0 right-0 z-50 border-b border-gray-900 bg-black/95 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center'>
              <Crown size={18} className='text-black' />
            </div>
            <span className='font-semibold text-lg'>Ascnd Labs</span>
          </div>

          <div className='hidden md:flex items-center gap-8'>
            {['Features', 'Pricing', 'Community'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className='text-sm text-gray-400 hover:text-[#D4AF37] transition-colors duration-300'
              >
                {item}
              </a>
            ))}
            <button
              onClick={handleGetStarted}
              className='flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-medium text-sm hover:shadow-lg hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-105'
            >
              Get Started <ArrowRight size={16} />
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='md:hidden text-gray-400 hover:text-white transition-colors'
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className='md:hidden border-t border-gray-900 bg-gray-950/50 backdrop-blur-sm'>
            <div className='max-w-7xl mx-auto px-6 py-4 space-y-4'>
              {['Features', 'Pricing', 'Community'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className='block text-gray-400 hover:text-[#D4AF37] transition-colors py-2'
                >
                  {item}
                </a>
              ))}
              <button
                onClick={handleGetStarted}
                className='w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-black font-medium text-sm hover:shadow-lg hover:shadow-[#D4AF37]/40 transition-all duration-300'
              >
                Get Started <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className='relative pt-40 pb-24 px-6'>
        <div className='max-w-4xl mx-auto text-center space-y-8'>
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-800 bg-gray-950/50 hover:border-[#D4AF37]/30 transition-all duration-300'>
            <div className='w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse' />
            <span className='text-xs font-medium text-gray-400'>
              Trusted by 12,500+ Empire Builders
            </span>
          </div>

          <h1 className='text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight'>
            <span className='block text-white mb-2'>Build Your</span>
            <span className='block bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] bg-clip-text text-transparent'>
              Digital Empire
            </span>
          </h1>

          <p className='text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed'>
            Transform from creator to mogul with our AI-powered platform. Build
            digital products, scale automatically, and earn through intelligent
            systems. Join thousands of successful empire builders.
          </p>

          <div className='flex flex-col sm:flex-row gap-3 justify-center pt-4'>
            <button
              onClick={handleGetStarted}
              className='group flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-[#D4AF37] text-black font-semibold hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-105'
            >
              <Rocket size={20} /> Start Building{' '}
              <ArrowRight
                size={20}
                className='group-hover:translate-x-1 transition-transform duration-300'
              />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 px-6 bg-gray-950/50 border-y border-gray-900'>
        <div className='max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8'>
          {[
            { number: counts.builders, label: 'Active Builders', suffix: '+' },
            { number: counts.products, label: 'Products Launched', suffix: '' },
            { number: '99.9%', label: 'Uptime', suffix: '' },
            {
              number: counts.revenue,
              label: 'Revenue Generated',
              suffix: 'M+',
            },
          ].map((stat, i) => (
            <div key={i} className='text-center'>
              <p className='text-3xl md:text-4xl font-bold text-[#D4AF37] mb-2'>
                {typeof stat.number === 'number'
                  ? stat.number.toLocaleString()
                  : stat.number}
                {stat.suffix}
              </p>
              <p className='text-xs md:text-sm text-gray-400'>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className='relative py-24 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold mb-4'>
              AI Tools for <span className='text-[#D4AF37]'>Every Stage</span>
            </h2>
            <p className='text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed'>
              From ideation to scaling, our comprehensive AI-powered platform
              provides everything you need to build, launch, and scale your
              digital business. No coding required.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <FeatureCard
              icon={Bot}
              title='AI Product Builder'
              description='Create digital products with our advanced AI assistant. From SaaS tools to mobile apps, build anything without coding expertise. Get started in minutes.'
              index={0}
            />
            <FeatureCard
              icon={Target}
              title='Smart Launchpad'
              description='Launch your products with AI-optimized strategies. Automated marketing, pricing optimization, competitor analysis, and customer acquisition tools included.'
              index={1}
            />
            <FeatureCard
              icon={Users}
              title='Affiliate Empire'
              description='Build and manage your affiliate network with intelligent recruitment tools and automated commission systems. Scale your revenue 10x faster.'
              index={2}
            />
            <FeatureCard
              icon={Zap}
              title='Automation Suite'
              description='Automate repetitive tasks with AI workflows. Save 20+ hours per week with intelligent automation that learns from your business patterns.'
              index={3}
            />
            <FeatureCard
              icon={BarChart3}
              title='Analytics & Insights'
              description='Real-time dashboards show every metric that matters. Track revenue, customer behavior, market trends, and optimize based on data.'
              index={4}
            />
            <FeatureCard
              icon={Shield}
              title='Enterprise Security'
              description='Bank-level encryption, SOC 2 certified, GDPR compliant. Your data is protected with military-grade security standards.'
              index={5}
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className='py-24 px-6 bg-gray-950/30 border-y border-gray-900'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold mb-4'>
              Loved by <span className='text-[#D4AF37]'>Empire Builders</span>
            </h2>
            <p className='text-gray-400 max-w-2xl mx-auto text-lg'>
              See what successful creators are saying about their journey with
              Ascnd Labs
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <TestimonialCard
              name='Alex Chen'
              role='SaaS Founder'
              avatar='A'
              content="Ascnd Labs helped me launch my first product in 2 weeks. The AI tools are incredible. I've already made $50K in revenue."
            />
            <TestimonialCard
              name='Maya Patel'
              role='Digital Creator'
              avatar='M'
              content='The automation suite saved me 15 hours every week. I can now focus on strategy instead of getting bogged down in execution.'
            />
            <TestimonialCard
              name='Jordan Lee'
              role='E-commerce Entrepreneur'
              avatar='J'
              content='Best investment I made this year. The affiliate system alone has generated passive income streams for my entire team.'
            />
            <TestimonialCard
              name='Sarah Williams'
              role='Product Manager'
              avatar='S'
              content='The analytics dashboard is a game changer. I can see exactly where my revenue is coming from and optimize accordingly.'
            />
            <TestimonialCard
              name='David Martinez'
              role='Agency Owner'
              avatar='D'
              content='Scaled from $10K to $100K MRR in 6 months using Ascnd Labs. The tools are professional-grade but easy to use.'
            />
            <TestimonialCard
              name='Emma Thompson'
              role='Startup Founder'
              avatar='E'
              content='The customer support is outstanding. They helped me customize workflows for my specific use case. Highly recommended!'
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id='pricing' className='relative py-24 px-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold mb-4'>
              Simple <span className='text-[#D4AF37]'>Transparent Pricing</span>
            </h2>
            <p className='text-gray-400 max-w-2xl mx-auto text-lg'>
              Lock in founder pricing and build your empire with our AI-powered
              tools. No hidden fees, cancel anytime.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <PricingCard
              plan='Starter'
              price='5'
              description='Perfect for beginners starting their digital journey and validating ideas.'
              features={[
                'AI Product Generator',
                'Basic Content Creation',
                'Starter Templates',
                'Community Access',
                'Email Support',
                'Basic Analytics',
              ]}
              icon={Rocket}
            />
            <PricingCard
              plan='Pro'
              price='12'
              description='For serious creators ready to scale and monetize their audience and products.'
              features={[
                'Everything in Starter',
                'AI Product Generator Pro',
                'Viral Hook Factory',
                'Pro AI Strategist',
                'Advanced Templates',
                'Priority Support',
                'Advanced Analytics',
                'Affiliate Tools',
              ]}
              icon={Crown}
              popular={true}
            />
            <PricingCard
              plan='Empire'
              price='25'
              description='For ambitious builders who want total domination and unlimited potential.'
              features={[
                'Everything in Pro',
                'Empire AI Life OS',
                'Full Automation Suite',
                'Empire Architect AI',
                'Direct Mentor Access',
                'White-label Rights',
                '1-on-1 Strategy Calls',
                'Custom Integrations',
              ]}
              icon={TrendingUp}
            />
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id='community' className='relative py-24 px-6'>
        <div className='max-w-3xl mx-auto'>
          <div className='rounded-lg border border-gray-800 bg-gray-950/40 backdrop-blur-sm p-8 md:p-16 text-center hover:border-[#D4AF37]/30 transition-all duration-300'>
            <div className='w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mx-auto mb-8'>
              <MessageCircle size={32} className='text-black' />
            </div>
            <h3 className='text-3xl md:text-4xl font-bold mb-4'>
              Join Our Community
            </h3>
            <p className='text-gray-400 text-lg mb-4 leading-relaxed'>
              Connect with 12,500+ empire builders, share strategies, get
              feedback, and access exclusive resources and opportunities.
            </p>
            <p className='text-gray-400 text-lg mb-8 leading-relaxed'>
              Our Discord community is where the real magic happens. Daily wins
              are shared, strategies discussed, and collaborations are born.
            </p>
            <a
              href='https://discord.gg/t7r94BZUXv'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[#D4AF37] text-black font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-105'
            >
              Join Discord Community <ExternalLink size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative py-12 px-6 border-t border-gray-900 bg-gray-950/50'>
        <div className='max-w-6xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 pb-8 border-b border-gray-900'>
            <div>
              <div className='flex items-center gap-2 mb-4'>
                <div className='w-8 h-8 rounded-lg bg-[#D4AF37] flex items-center justify-center'>
                  <Crown size={16} className='text-black' />
                </div>
                <span className='font-semibold'>Ascnd Labs</span>
              </div>
              <p className='text-gray-400 text-sm'>
                Building empires with AI-powered tools.
              </p>
            </div>
            <div>
              <h4 className='font-semibold mb-4 text-white'>Product</h4>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li>
                  <a
                    href='#'
                    className='hover:text-[#D4AF37] transition-colors'
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='hover:text-[#D4AF37] transition-colors'
                  >
                    Pricing
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='hover:text-[#D4AF37] transition-colors'
                  >
                    Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className='font-semibold mb-4 text-white'>Company</h4>
              <ul className='space-y-2 text-sm text-gray-400'>
                <li>
                  <a
                    href='#'
                    className='hover:text-[#D4AF37] transition-colors'
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='hover:text-[#D4AF37] transition-colors'
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href='#'
                    className='hover:text-[#D4AF37] transition-colors'
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <p className='text-gray-400 text-sm'>
              © 2025 Ascnd Labs. All rights reserved.
            </p>
            <a
              href='mailto:hello@ascndlabs.com'
              className='flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors text-sm'
            >
              <Mail size={16} /> hello@ascndlabs.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
