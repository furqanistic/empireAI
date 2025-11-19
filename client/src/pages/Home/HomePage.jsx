// File: client/src/pages/Home/HomePage.jsx
import React, { useState } from 'react'

// Icon component matching Layout style
const CrownLogo = ({ size = 18 }) => (
  <svg
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 256 256'
    width={size}
    height={size}
    fill='currentColor'
  >
    <path d='M248 80a28 28 0 1 0-51.12 15.77l-26.79 33L146 73.4a28 28 0 1 0-36.06 0l-24.03 55.34l-26.79-33a28 28 0 1 0-26.6 12L47 194.63A16 16 0 0 0 62.78 208h130.44A16 16 0 0 0 209 194.63l14.47-86.85A28 28 0 0 0 248 80M128 40a12 12 0 1 1-12 12a12 12 0 0 1 12-12M24 80a12 12 0 1 1 12 12a12 12 0 0 1-12-12m196 12a12 12 0 1 1 12-12a12 12 0 0 1-12 12' />
  </svg>
)

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)

  const handleGetStarted = () => {
    window.location.href = '/auth'
  }

  // Video Modal Component
  const VideoModal = () => (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4'
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsVideoOpen(false)
      }}
    >
      <div className='relative w-full max-w-4xl'>
        {/* Close Button */}
        <button
          onClick={() => setIsVideoOpen(false)}
          className='absolute -top-12 right-0 text-white hover:text-[#D4AF37] transition-colors duration-300 text-2xl font-bold'
        >
          ✕
        </button>

        {/* Video Container */}
        <div className='rounded-lg overflow-hidden border border-[#D4AF37]/30 shadow-2xl shadow-[#D4AF37]/20'>
          <div className='bg-black aspect-video'>
            <video className='w-full h-full' controls controlsList='nodownload'>
              <source src='/demo.mp4' type='video/mp4' />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>

        {/* Video Info */}
        <div className='mt-4 text-center'>
          <p className='text-gray-300 text-sm'>
            Watch how to build your digital empire in minutes
          </p>
        </div>
      </div>
    </div>
  )

  const FeatureCard = ({ icon, title, description }) => (
    <div className='group relative p-6 rounded-lg border border-gray-800 bg-gray-950/40 backdrop-blur-sm hover:border-[#D4AF37]/50 hover:bg-gray-900/60 transition-all duration-300 cursor-pointer overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 to-[#D4AF37]/0 group-hover:from-[#D4AF37]/5 group-hover:to-[#D4AF37]/10 transition-all duration-300' />
      <div className='relative z-10'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='w-12 h-12 rounded-lg bg-[#D4AF37] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#D4AF37]/20 text-lg'>
            {icon}
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
    emoji,
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
            className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
              popular ? 'bg-[#D4AF37]' : 'bg-gray-800'
            }`}
          >
            {emoji}
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
              <span className='text-[#D4AF37] flex-shrink-0 mt-0.5'>✓</span>
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
      {/* Video Modal */}
      {isVideoOpen && <VideoModal />}

      {/* Navigation */}
      <nav className='fixed top-0 left-0 right-0 z-50 border-b border-gray-900 bg-black/95 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto px-6 py-4 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <div className='text-[#D4AF37] p-2 rounded-lg bg-[#D4AF37]/10'>
              <CrownLogo size={18} />
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
              Get Started →
            </button>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='md:hidden text-gray-400 hover:text-white transition-colors'
          >
            {isMobileMenuOpen ? '✕' : '☰'}
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
                Get Started →
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
              Now accepting early access members
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
            systems. Join the next generation of empire builders.
          </p>

          <div className='flex flex-col sm:flex-row gap-3 justify-center pt-4'>
            <button
              onClick={handleGetStarted}
              className='group flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-[#D4AF37] text-black font-semibold hover:shadow-xl hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-105'
            >
              Start Building
              <span className='group-hover:translate-x-1 transition-transform duration-300'>
                →
              </span>
            </button>
            <button
              onClick={() => setIsVideoOpen(true)}
              className='group flex items-center justify-center gap-2 px-8 py-4 rounded-lg border border-[#D4AF37]/50 text-white font-semibold hover:bg-[#D4AF37]/10 hover:border-[#D4AF37] transition-all duration-300 hover:scale-105'
            >
              <span className='text-lg'>▶</span>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className='py-16 px-6 bg-gray-950/50 border-y border-gray-900'>
        <div className='max-w-6xl mx-auto'>
          <h3 className='text-center text-2xl md:text-3xl font-bold mb-12 text-white'>
            Why Builders Choose{' '}
            <span className='text-[#D4AF37]'>Ascnd Labs</span>
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-14 h-14 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl'>
                ⚡
              </div>
              <h4 className='text-white font-semibold mb-2 text-lg'>
                Fast Setup
              </h4>
              <p className='text-gray-400 text-sm'>
                Get up and running in minutes with our intuitive interface and
                pre-built templates.
              </p>
            </div>
            <div className='text-center'>
              <div className='w-14 h-14 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl'>
                🤖
              </div>
              <h4 className='text-white font-semibold mb-2 text-lg'>
                AI Powered
              </h4>
              <p className='text-gray-400 text-sm'>
                Leverage advanced AI tools to automate tasks and make smarter
                business decisions.
              </p>
            </div>
            <div className='text-center'>
              <div className='w-14 h-14 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center mx-auto mb-4 text-2xl'>
                👥
              </div>
              <h4 className='text-white font-semibold mb-2 text-lg'>
                Community
              </h4>
              <p className='text-gray-400 text-sm'>
                Connect with fellow creators, share wins, and grow together in
                our active community.
              </p>
            </div>
          </div>
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
              icon='🤖'
              title='AI Product Builder'
              description='Create digital products with our advanced AI assistant. From SaaS tools to mobile apps, build anything without coding expertise.'
            />
            <FeatureCard
              icon='🎯'
              title='Smart Launchpad'
              description='Launch your products with AI-optimized strategies. Automated marketing, pricing optimization, and customer acquisition tools included.'
            />
            <FeatureCard
              icon='👥'
              title='Affiliate Empire'
              description='Build and manage your affiliate network with intelligent recruitment tools and automated commission systems.'
            />
            <FeatureCard
              icon='⚡'
              title='Automation Suite'
              description='Automate repetitive tasks with AI workflows. Save time on manual work with intelligent automation that learns from your patterns.'
            />
            <FeatureCard
              icon='📊'
              title='Analytics & Insights'
              description='Real-time dashboards show every metric that matters. Track revenue, customer behavior, and market trends.'
            />
            <FeatureCard
              icon='🛡️'
              title='Enterprise Security'
              description='Bank-level encryption, SOC 2 certified, GDPR compliant. Your data is protected with military-grade standards.'
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className='py-24 px-6 bg-gray-950/30 border-y border-gray-900'>
        <div className='max-w-6xl mx-auto'>
          <div className='text-center mb-16'>
            <h2 className='text-4xl md:text-5xl font-bold mb-4'>
              Loved by{' '}
              <span className='text-[#D4AF37]'>Creators & Entrepreneurs</span>
            </h2>
            <p className='text-gray-400 max-w-2xl mx-auto text-lg'>
              See what early adopters are saying about building with Ascnd Labs
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <TestimonialCard
              name='Alex Chen'
              role='SaaS Founder'
              avatar='A'
              content='The speed to market is incredible. I went from idea to launch in less than a month. This is game-changing.'
            />
            <TestimonialCard
              name='Maya Patel'
              role='Digital Creator'
              avatar='M'
              content='The automation tools have freed up so much of my time. I can focus on what I do best instead of admin work.'
            />
            <TestimonialCard
              name='Jordan Lee'
              role='E-commerce Entrepreneur'
              avatar='J'
              content='The affiliate system is elegant and easy to manage. Great for scaling revenue without hiring a team.'
            />
            <TestimonialCard
              name='Sarah Williams'
              role='Product Manager'
              avatar='S'
              content='The analytics dashboard gives me clarity on my business. The insights are actionable and help with strategy.'
            />
            <TestimonialCard
              name='David Martinez'
              role='Agency Owner'
              avatar='D'
              content='Professional-grade tools at an accessible price point. This is exactly what I was looking for.'
            />
            <TestimonialCard
              name='Emma Thompson'
              role='Startup Founder'
              avatar='E'
              content='Great support from the team. They took time to understand my use case and helped me set up everything smoothly.'
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
              description='Perfect for beginners starting their digital journey.'
              features={[
                'Viral Hook Factory',
                'AI Product Generator',
                'Niche Launchpad',
                '10 Generations per Month',
                'Email Support',
              ]}
              emoji='🚀'
              affiliateEarnings={{ l1: '2.00', l2: '0.50' }}
            />
            <PricingCard
              plan='Pro'
              price='12'
              description='For serious creators ready to scale and monetize.'
              features={[
                'Viral Hook Factory',
                'AI Product Generator',
                'Niche Launchpad',
                '50 Generations per Month',
                'Priority Support',
              ]}
              emoji='👑'
              popular={true}
              affiliateEarnings={{ l1: '4.80', l2: '1.20' }}
            />
            <PricingCard
              plan='Empire'
              price='25'
              description='For empire builders who want total domination.'
              features={[
                'Viral Hook Factory',
                'AI Product Generator',
                'Niche Launchpad',
                'Unlimited Generations',
                'Priority Support',
                'Direct Mentor Access',
              ]}
              emoji='📈'
              affiliateEarnings={{ l1: '10.00', l2: '2.50' }}
            />
          </div>

          {/* Affiliate Program Section */}
          <div className='mt-16 bg-gray-950/50 border border-gray-800 rounded-lg p-8'>
            <div className='text-center mb-10'>
              <h3 className='text-2xl md:text-3xl font-bold text-white mb-3'>
                💰 2-Tier Affiliate Program
              </h3>
              <p className='text-gray-400 text-lg'>
                Earn recurring commissions by referring others to Ascnd Labs
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-gray-900/40 border border-gray-800 rounded p-5 text-center'>
                <div className='text-3xl font-bold text-[#D4AF37] mb-2'>
                  40%
                </div>
                <div className='text-sm text-white font-semibold mb-1'>
                  Level 1 Commission
                </div>
                <p className='text-xs text-gray-400'>
                  Earn 40% recurring on every direct referral you bring
                </p>
              </div>
              <div className='bg-gray-900/40 border border-gray-800 rounded p-5 text-center'>
                <div className='text-3xl font-bold text-[#D4AF37] mb-2'>
                  10%
                </div>
                <div className='text-sm text-white font-semibold mb-1'>
                  Level 2 Override
                </div>
                <p className='text-xs text-gray-400'>
                  Earn 10% on referrals your L1 members bring in
                </p>
              </div>
              <div className='bg-gray-900/40 border border-gray-800 rounded p-5 text-center'>
                <div className='text-3xl font-bold text-[#D4AF37] mb-2'>∞</div>
                <div className='text-sm text-white font-semibold mb-1'>
                  Recurring
                </div>
                <p className='text-xs text-gray-400'>
                  Commissions continue as long as they stay subscribed
                </p>
              </div>
            </div>

            <div className='mt-8 p-4 bg-gray-900/60 border border-[#D4AF37]/20 rounded text-center'>
              <p className='text-sm text-gray-300'>
                Want to start earning? Join hundreds of affiliates turning Ascnd
                Labs into a passive income stream.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id='community' className='relative py-24 px-6'>
        <div className='max-w-3xl mx-auto'>
          <div className='rounded-lg border border-gray-800 bg-gray-950/40 backdrop-blur-sm p-8 md:p-16 text-center hover:border-[#D4AF37]/30 transition-all duration-300'>
            <div className='w-16 h-16 bg-[#D4AF37] rounded-lg flex items-center justify-center mx-auto mb-8 text-3xl'>
              💬
            </div>
            <h3 className='text-3xl md:text-4xl font-bold mb-4'>
              Join Our Community
            </h3>
            <p className='text-gray-400 text-lg mb-4 leading-relaxed'>
              Connect with fellow empire builders, share strategies, get
              feedback, and access exclusive resources and opportunities.
            </p>
            <p className='text-gray-400 text-lg mb-8 leading-relaxed'>
              Our Discord community is where builders gather to discuss ideas,
              celebrate wins, and collaborate on projects.
            </p>
            <a
              href='https://discord.gg/t7r94BZUXv'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-[#D4AF37] text-black font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/40 transition-all duration-300 hover:scale-105'
            >
              Join Discord Community →
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
                <div className='text-[#D4AF37] p-2 rounded-lg bg-[#D4AF37]/10'>
                  <CrownLogo size={16} />
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
              📧 hello@ascndlabs.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
