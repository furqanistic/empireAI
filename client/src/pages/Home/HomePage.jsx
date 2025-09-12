import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle,
  ChevronDown,
  Code,
  Crown,
  DollarSign,
  ExternalLink,
  Gift,
  Globe,
  Mail,
  Menu,
  MessageCircle,
  Play,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

const HomePage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleGetStarted = () => {
    // In a real app, this would navigate to auth page
    window.location.href = '/auth'
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    const handleScroll = () => setScrollY(window.scrollY)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
    const [count, setCount] = useState(0)

    useEffect(() => {
      let startTime = null
      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / duration, 1)
        setCount(Math.floor(progress * end))
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }, [end, duration])

    return (
      <span>
        {count.toLocaleString()}
        {suffix}
      </span>
    )
  }

  const FeatureCard = ({ icon, title, description, gradient, delay = 0 }) => (
    <div
      className={`group bg-[#121214] border border-[#1E1E21] rounded-2xl p-6 hover:border-[#D4AF37]/40 hover:bg-[#1A1A1C]/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#D4AF37]/10`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        {React.cloneElement(icon, { size: 24, className: 'text-black' })}
      </div>
      <h3 className='text-[#EDEDED] font-bold text-lg mb-2'>{title}</h3>
      <p className='text-gray-400 leading-relaxed'>{description}</p>
    </div>
  )

  const StatCard = ({ number, suffix, label, icon, color }) => (
    <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 text-center group hover:border-[#D4AF37]/40 transition-all duration-300'>
      <div
        className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}
      >
        {React.cloneElement(icon, { size: 20, className: 'text-black' })}
      </div>
      <div className='text-2xl font-bold text-[#D4AF37] mb-1'>
        <AnimatedCounter end={number} suffix={suffix} />
      </div>
      <div className='text-gray-400 text-sm'>{label}</div>
    </div>
  )

  const PricingCard = ({
    plan,
    monthlyPrice,
    yearlyPrice,
    description,
    features,
    popular = false,
    icon,
    affiliateEarnings,
  }) => (
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
            ${monthlyPrice}
          </span>
          <span className='text-gray-400 text-sm'>/month</span>
        </div>
        <div className='text-emerald-400 text-sm font-medium mb-2'>
          Save ${monthlyPrice * 12 - yearlyPrice} with yearly billing
        </div>
        <div className='inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg text-xs font-medium'>
          🚀 Founder Pricing - Limited Time
        </div>
      </div>

      <div className='space-y-3 mb-6 flex-grow'>
        {features.map((feature, index) => (
          <div key={index} className='flex items-center gap-3'>
            <CheckCircle size={16} className='text-[#D4AF37] flex-shrink-0' />
            <span className='text-[#EDEDED] text-sm'>{feature}</span>
          </div>
        ))}
      </div>

      <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-3 mb-4'>
        <div className='text-center'>
          <div className='text-xs text-gray-400 mb-1'>Affiliate Earnings</div>
          <div className='text-sm font-semibold text-[#D4AF37]'>
            L1: ${affiliateEarnings.l1}/mo • L2: ${affiliateEarnings.l2}/mo
          </div>
        </div>
      </div>

      <button
        onClick={handleGetStarted}
        className={`w-full h-10 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 mt-auto ${
          popular
            ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 shadow-lg hover:shadow-[#D4AF37]/20'
            : 'bg-[#1E1E21] text-[#EDEDED] hover:bg-[#2A2A2D] border border-[#1E1E21]'
        }`}
      >
        Get Started
        <ArrowRight size={16} />
      </button>
    </div>
  )

  return (
    <div className='min-h-screen bg-[#0A0A0A] text-white overflow-hidden'>
      {/* Header */}
      <header className='relative z-50 w-full'>
        <nav className='flex items-center justify-between px-6 lg:px-8 py-6'>
          {/* Logo */}
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80 rounded-lg flex items-center justify-center'>
              <Crown size={16} className='text-black' />
            </div>
            <span className='text-lg font-bold text-[#EDEDED]'>Ascnd Labs</span>
          </div>

          {/* Desktop Navigation */}
          <div className='hidden md:flex items-center gap-8'>
            <a
              href='#features'
              className='text-gray-300 hover:text-[#D4AF37] transition-colors'
            >
              Features
            </a>
            <a
              href='#pricing'
              className='text-gray-300 hover:text-[#D4AF37] transition-colors'
            >
              Pricing
            </a>
            <a
              href='#community'
              className='text-gray-300 hover:text-[#D4AF37] transition-colors'
            >
              Community
            </a>
            <button
              onClick={handleGetStarted}
              className='bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-6 py-2 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all duration-300 hover:scale-105 flex items-center gap-2'
            >
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className='md:hidden text-[#EDEDED] hover:text-[#D4AF37] transition-colors'
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className='md:hidden absolute top-full left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#1E1E21] px-6 py-6 space-y-4'>
            <a
              href='#features'
              className='block text-gray-300 hover:text-[#D4AF37] transition-colors py-2'
            >
              Features
            </a>
            <a
              href='#pricing'
              className='block text-gray-300 hover:text-[#D4AF37] transition-colors py-2'
            >
              Pricing
            </a>
            <a
              href='#community'
              className='block text-gray-300 hover:text-[#D4AF37] transition-colors py-2'
            >
              Community
            </a>
            <button
              onClick={handleGetStarted}
              className='w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all duration-300 flex items-center justify-center gap-2 mt-4'
            >
              Get Started
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </header>

      {/* Dynamic Background */}
      <div className='fixed inset-0 opacity-40'>
        <div className='absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-blue-500/10' />
        <div
          className='absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#D4AF37]/5 to-transparent'
          style={{
            transform: `translateX(${mousePosition.x * 0.01}px) translateY(${
              mousePosition.y * 0.01
            }px)`,
          }}
        />
        <div className='absolute -top-40 -left-40 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse' />
        <div
          className='absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse'
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* Revolutionary Hero Section */}
      <section className='relative z-10 min-h-screen flex items-center justify-center px-4 lg:px-6 pt-20'>
        <div className='max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center'>
          {/* Left Side - Content */}
          <div className='space-y-6 lg:space-y-8 text-center lg:text-left'>
            <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-transparent border border-[#D4AF37]/30 rounded-full px-4 py-2 backdrop-blur-sm'>
              <div className='w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse' />
              <span className='text-[#D4AF37] font-medium text-xs sm:text-sm'>
                AI Empire Builder Platform
              </span>
            </div>

            <div className='space-y-4'>
              <h1 className='text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-none'>
                <span className='block text-[#EDEDED]'>BUILD</span>
                <span className='block text-transparent bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] bg-clip-text animate-pulse'>
                  EMPIRE
                </span>
                <span className='block text-[#EDEDED]'>WITH AI</span>
              </h1>
            </div>

            <p className='text-lg lg:text-xl text-gray-300 leading-relaxed max-w-xl mx-auto lg:mx-0'>
              Transform from creator to mogul with our AI-powered platform.
              Build digital products, scale automatically, and earn through
              intelligent systems.
            </p>

            <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
              <button
                onClick={handleGetStarted}
                className='group bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-bold text-base lg:text-lg hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 transform hover:scale-105 flex items-center justify-center gap-3'
              >
                <Rocket size={20} className='group-hover:animate-bounce' />
                Start Building Empire
                <ArrowRight
                  size={18}
                  className='group-hover:translate-x-1 transition-transform duration-300'
                />
              </button>
            </div>
          </div>

          {/* Right Side - 3D Visual */}
          <div className='relative h-80 lg:h-[600px] flex items-center justify-center overflow-hidden'>
            {/* Central Hub */}
            <div className='relative'>
              {/* Main Empire Core */}
              <div
                className='w-32 lg:w-40 h-32 lg:h-40 bg-gradient-to-br from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#D4AF37]/30 animate-pulse'
                style={{
                  transform: `perspective(1000px) rotateX(${
                    scrollY * 0.05
                  }deg) rotateY(${mousePosition.x * 0.02}deg)`,
                  animation: 'float 6s ease-in-out infinite',
                }}
              >
                <Crown size={40} className='text-black lg:w-12 lg:h-12' />
              </div>

              {/* Floating AI Modules - Hidden on small screens to prevent overlap */}
              <div
                className='hidden sm:flex absolute -top-12 lg:-top-16 -left-12 lg:-left-16 w-16 lg:w-20 h-16 lg:h-20 bg-blue-500 rounded-2xl items-center justify-center shadow-lg shadow-blue-500/30'
                style={{
                  transform: `translate(${Math.sin(scrollY * 0.01) * 15}px, ${
                    Math.cos(scrollY * 0.01) * 8
                  }px) rotate(${scrollY * 0.1}deg)`,
                  animation: 'float 4s ease-in-out infinite',
                }}
              >
                <Bot size={20} className='text-white lg:w-6 lg:h-6' />
              </div>

              <div
                className='hidden sm:flex absolute -bottom-12 lg:-bottom-16 -right-12 lg:-right-16 w-16 lg:w-20 h-16 lg:h-20 bg-emerald-500 rounded-2xl items-center justify-center shadow-lg shadow-emerald-500/30'
                style={{
                  transform: `translate(${
                    Math.sin(scrollY * 0.008 + Math.PI) * 12
                  }px, ${Math.cos(scrollY * 0.008 + Math.PI) * 10}px) rotate(${
                    -scrollY * 0.08
                  }deg)`,
                  animation: 'float 5s ease-in-out infinite 1s',
                }}
              >
                <TrendingUp size={20} className='text-white lg:w-6 lg:h-6' />
              </div>

              <div
                className='hidden md:flex absolute -top-6 lg:-top-8 -right-16 lg:-right-20 w-12 lg:w-16 h-12 lg:h-16 bg-purple-500 rounded-xl items-center justify-center shadow-lg shadow-purple-500/30'
                style={{
                  transform: `translate(${
                    Math.sin(scrollY * 0.012 + Math.PI / 2) * 14
                  }px, ${
                    Math.cos(scrollY * 0.012 + Math.PI / 2) * 6
                  }px) rotate(${scrollY * 0.06}deg)`,
                  animation: 'float 3.5s ease-in-out infinite 0.5s',
                }}
              >
                <Users size={16} className='text-white lg:w-5 lg:h-5' />
              </div>

              <div
                className='hidden md:flex absolute -bottom-6 lg:-bottom-8 -left-16 lg:-left-20 w-12 lg:w-16 h-12 lg:h-16 bg-orange-500 rounded-xl items-center justify-center shadow-lg shadow-orange-500/30'
                style={{
                  transform: `translate(${
                    Math.sin(scrollY * 0.009 + Math.PI * 1.5) * 18
                  }px, ${
                    Math.cos(scrollY * 0.009 + Math.PI * 1.5) * 12
                  }px) rotate(${-scrollY * 0.07}deg)`,
                  animation: 'float 4.5s ease-in-out infinite 2s',
                }}
              >
                <Target size={16} className='text-white lg:w-5 lg:h-5' />
              </div>

              {/* Connecting Lines */}
              <div className='absolute inset-0 pointer-events-none'>
                <svg className='w-full h-full' viewBox='0 0 400 400'>
                  <defs>
                    <linearGradient
                      id='lineGradient'
                      x1='0%'
                      y1='0%'
                      x2='100%'
                      y2='100%'
                    >
                      <stop offset='0%' stopColor='#D4AF37' stopOpacity='0.6' />
                      <stop
                        offset='100%'
                        stopColor='#D4AF37'
                        stopOpacity='0.1'
                      />
                    </linearGradient>
                  </defs>
                  <path
                    d='M 200 200 Q 100 100 50 50'
                    stroke='url(#lineGradient)'
                    strokeWidth='2'
                    fill='none'
                    className='animate-pulse'
                  />
                  <path
                    d='M 200 200 Q 300 300 350 350'
                    stroke='url(#lineGradient)'
                    strokeWidth='2'
                    fill='none'
                    className='animate-pulse'
                    style={{ animationDelay: '1s' }}
                  />
                </svg>
              </div>
            </div>

            {/* Background Particles */}
            <div className='absolute inset-0 overflow-hidden pointer-events-none'>
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className='absolute w-1 h-1 bg-[#D4AF37] rounded-full opacity-40 animate-ping'
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce'>
          <ChevronDown size={24} className='text-[#D4AF37]' />
        </div>
      </section>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }
      `}</style>

      {/* Features Section */}
      <section
        id='features'
        className='relative z-10 py-16 lg:py-20 px-4 lg:px-6'
      >
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-12 lg:mb-16'>
            <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[#EDEDED]'>
              AI Tools for <span className='text-[#D4AF37]'>Every Stage</span>
            </h2>
            <p className='text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto'>
              From idea to empire - our AI-powered platform provides everything
              you need to build, launch, and scale your digital business.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
            <FeatureCard
              icon={<Bot />}
              title='AI Product Builder'
              description='Create digital products with our advanced AI assistant. From SaaS tools to mobile apps, build anything without coding expertise.'
              gradient='bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80'
              delay={0}
            />
            <FeatureCard
              icon={<Target />}
              title='Smart Launchpad'
              description='Launch your products with AI-optimized strategies. Automated marketing, pricing optimization, and customer acquisition.'
              gradient='bg-gradient-to-br from-blue-500 to-blue-600'
              delay={150}
            />
            <FeatureCard
              icon={<Users />}
              title='Affiliate Empire'
              description='Build and manage your affiliate network with intelligent recruitment tools and automated commission systems.'
              gradient='bg-gradient-to-br from-emerald-500 to-emerald-600'
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id='pricing'
        className='relative z-10 py-16 lg:py-20 px-4 lg:px-6 bg-[#121214]/30'
      >
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-12 lg:mb-16'>
            <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[#EDEDED]'>
              Simple <span className='text-[#D4AF37]'>Pricing</span>
            </h2>
            <p className='text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto'>
              Lock in founder pricing and build your empire with our AI-powered
              tools.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
            <PricingCard
              plan='Starter'
              monthlyPrice={5}
              yearlyPrice={50}
              description='Perfect for beginners starting their digital journey.'
              features={[
                'AI Product Generator',
                'Basic Content Creation',
                'Starter Templates',
                'Community Access',
                'Email Support',
              ]}
              icon={<Rocket />}
              affiliateEarnings={{ l1: '2.00', l2: '0.50' }}
            />

            <PricingCard
              plan='Pro'
              monthlyPrice={12}
              yearlyPrice={120}
              description='For serious creators ready to scale and monetize.'
              features={[
                'Everything in Starter',
                'AI Product Generator Pro',
                'Viral Hook Factory',
                'Pro AI Strategist',
                'Advanced Templates',
                'Priority Support',
              ]}
              icon={<Crown />}
              popular={true}
              affiliateEarnings={{ l1: '4.80', l2: '1.20' }}
            />

            <PricingCard
              plan='Empire'
              monthlyPrice={25}
              yearlyPrice={250}
              description='For empire builders who want total domination.'
              features={[
                'Everything in Pro',
                'Empire AI Life OS',
                'Full Automation Suite',
                'Empire Architect AI',
                'Direct Mentor Access',
                'White-label Rights',
                '1-on-1 Strategy Calls',
              ]}
              icon={<Star />}
              affiliateEarnings={{ l1: '10.00', l2: '2.50' }}
            />
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section
        id='community'
        className='relative z-10 py-16 lg:py-20 px-4 lg:px-6'
      >
        <div className='max-w-7xl mx-auto'>
          <div className='text-center mb-12 lg:mb-16'>
            <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[#EDEDED]'>
              Join the <span className='text-[#D4AF37]'>Community</span>
            </h2>
            <p className='text-lg lg:text-xl text-gray-400 max-w-3xl mx-auto'>
              Connect with fellow empire builders, share strategies, and get
              exclusive insights from successful entrepreneurs.
            </p>
          </div>

          <div className='bg-gradient-to-r from-[#5865F2]/10 to-[#5865F2]/5 border border-[#5865F2]/20 rounded-2xl p-6 lg:p-12 text-center'>
            <div className='w-16 h-16 bg-[#5865F2] rounded-2xl flex items-center justify-center mx-auto mb-6'>
              <MessageCircle size={32} className='text-white' />
            </div>

            <h3 className='text-2xl md:text-3xl font-bold text-[#EDEDED] mb-4'>
              Discord Community
            </h3>

            <p className='text-gray-400 text-base lg:text-lg mb-8 max-w-2xl mx-auto'>
              Join 2,847+ entrepreneurs sharing strategies, getting feedback,
              and building together. Get access to exclusive resources and
              weekly live sessions.
            </p>

            <div className='grid grid-cols-3 gap-4 lg:gap-6 max-w-md mx-auto mb-8'>
              <div className='text-center'>
                <div className='text-xl lg:text-2xl font-bold text-[#D4AF37]'>
                  2.8K+
                </div>
                <div className='text-gray-400 text-xs lg:text-sm'>Members</div>
              </div>
              <div className='text-center'>
                <div className='text-xl lg:text-2xl font-bold text-emerald-400'>
                  24/7
                </div>
                <div className='text-gray-400 text-xs lg:text-sm'>Active</div>
              </div>
              <div className='text-center'>
                <div className='text-xl lg:text-2xl font-bold text-blue-400'>
                  150+
                </div>
                <div className='text-gray-400 text-xs lg:text-sm'>Daily</div>
              </div>
            </div>

            <a
              href='https://discord.gg/eP48PSyU'
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-3 bg-[#5865F2] text-white px-6 lg:px-8 py-3 lg:py-4 rounded-xl font-bold text-base lg:text-lg hover:bg-[#5865F2]/90 transition-all duration-300 hover:scale-105'
            >
              <MessageCircle size={20} />
              Join Discord Community
              <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='relative z-10 py-6 lg:py-8 px-4 lg:px-6 border-t border-[#1E1E21]'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
            <div className='flex items-center gap-3'>
              <div className='w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#D4AF37]/80 rounded-lg flex items-center justify-center'>
                <Crown size={16} className='text-black' />
              </div>
              <span className='text-lg font-bold text-[#EDEDED]'>
                Ascnd Labs
              </span>
            </div>

            <div className='flex flex-col sm:flex-row items-center gap-4 lg:gap-6 text-sm'>
              <a
                href='mailto:hello@ascndlabs.com'
                className='flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] transition-colors'
              >
                <Mail size={14} />
                hello@ascndlabs.com
              </a>
              <div className='text-gray-400'>© 2025 Ascnd Labs</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
