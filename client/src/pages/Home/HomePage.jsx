// File: client/src/pages/Home/HomePage.jsx
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion'
import {
    ArrowRight,
    BarChart3,
    Bot,
    CheckCircle2,
    Globe,
    MessageSquare,
    Play,
    ShieldCheck,
    Star,
    Target,
    TrendingUp,
    Trophy,
    Users,
    X,
    Zap
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

// Icon component matching Layout style
const CrownLogo = ({ size = 24 }) => (
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

const PRIMARY_GOLD = '#D4AF37'

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const { scrollY } = useScroll()
  const navBackground = useTransform(scrollY, [0, 50], ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'])
  const navBorder = useTransform(scrollY, [0, 50], ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)'])

  const handleGetStarted = () => {
    window.location.href = '/auth'
  }

  // Animation variants
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  }

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  // Components
  const GlassCard = ({ children, className = '', hover = true }) => (
    <motion.div
      variants={fadeIn}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors ${hover ? 'hover:border-gold/30 hover:bg-white/10' : ''} ${className}`}
      style={{ '--gold': PRIMARY_GOLD }}
    >
      {children}
    </motion.div>
  )

  const FeatureIcon = ({ icon: Icon, color = PRIMARY_GOLD }) => (
    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 shadow-lg' style={{ color }}>
      <Icon size={24} />
    </div>
  )

  const NavItem = ({ href, children }) => (
    <a 
      href={href} 
      className='text-sm font-medium text-gray-400 transition-colors hover:text-white'
    >
      {children}
    </a>
  )

  return (
    <div className='min-h-screen bg-black text-white selection:bg-gold/30 selection:text-gold'>
      {/* Background gradients */}
      <div className='fixed inset-0 z-0 pointer-events-none'>
        <div className='absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-gold/10 blur-[120px]' />
        <div className='absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px]' />
      </div>

      {/* Navigation */}
      <motion.nav 
        style={{ backgroundColor: navBackground, borderBottomColor: navBorder }}
        className='fixed top-0 left-0 right-0 z-50 border-b border-white/0 backdrop-blur-sm transition-all duration-300'
      >
        <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='flex items-center gap-2'
          >
            <div className='text-gold bg-gold/10 p-2 rounded-xl'>
              <CrownLogo size={20} />
            </div>
            <span className='text-xl font-bold tracking-tight'>Ascnd<span className='text-gold'>Labs</span></span>
          </motion.div>

          {/* Desktop Nav */}
          <div className='hidden items-center gap-8 md:flex'>
            <NavItem href='#features'>Features</NavItem>
            <NavItem href='#pricing'>Pricing</NavItem>
            <NavItem href='#community'>Community</NavItem>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className='rounded-full bg-white px-6 py-2 text-sm font-bold text-black transition-all hover:bg-gold hover:text-black cursor-pointer'
            >
              Get Started
            </motion.button>
          </div>

          {/* Mobile Toggle */}
          <button 
            className='md:hidden'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Zap className='text-gold' />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='overflow-hidden bg-black/95 px-6 pb-6 md:hidden'
            >
              <div className='flex flex-col gap-4 pt-4'>
                <NavItem href='#features'>Features</NavItem>
                <NavItem href='#pricing'>Pricing</NavItem>
                <NavItem href='#community'>Community</NavItem>
                <button
                  onClick={handleGetStarted}
                  className='w-full rounded-xl bg-gold py-3 font-bold text-black'
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      <main className='relative z-10'>
        {/* Hero Section */}
        <section className='relative flex flex-col items-center px-6 pt-40 pb-20 text-center overflow-hidden'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='max-w-4xl relative z-20'
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className='mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm'
            >
              <span className='flex h-2 w-2 rounded-full bg-gold animate-pulse' />
              <span className='text-gray-300'>Now accepting early access members</span>
            </motion.div>

            <h1 className='mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl'>
              Build Your{' '}
              <span className='bg-gradient-to-r from-gold via-[#F0D58B] to-gold bg-clip-text text-transparent'>
                Digital Empire
              </span>
            </h1>

            <p className='mx-auto mb-10 max-w-2xl text-lg text-gray-400 md:text-xl'>
              Transform from creator to mogul with our AI-powered platform. Build, scale, and automate your intelligent systems in minutes.
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className='flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-lg font-bold text-black transition-all cursor-pointer'
              >
                Start Building <ArrowRight size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoOpen(true)}
                className='flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-lg font-bold text-white transition-all cursor-pointer'
              >
                <Play size={20} fill='white' /> Watch Demo
              </motion.button>
            </div>

            {/* Trusted By / Stats */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className='mt-16 flex flex-wrap justify-center gap-12 text-gray-500'
            >
              <div className='text-center'>
                <div className='text-3xl font-bold text-white'>10k+</div>
                <div className='text-[10px] uppercase tracking-[0.2em]'>Builders</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-white'>$2M+</div>
                <div className='text-[10px] uppercase tracking-[0.2em]'>Generated</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-white'>99%</div>
                <div className='text-[10px] uppercase tracking-[0.2em]'>Uptime</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className='mt-16 relative w-full max-w-5xl rounded-t-3xl border-x border-t border-white/10 bg-gradient-to-b from-white/10 to-transparent p-4'
          >
             <div className='aspect-video w-full overflow-hidden rounded-t-2xl bg-[#050505] shadow-2xl relative'>
                 {/* Simulated UI Header */}
                 <div className='absolute top-0 left-0 right-0 h-12 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center px-4 gap-2'>
                    <div className='flex gap-1.5'>
                        <div className='w-2.5 h-2.5 rounded-full bg-red-500/50' />
                        <div className='w-2.5 h-2.5 rounded-full bg-yellow-500/50' />
                        <div className='w-2.5 h-2.5 rounded-full bg-green-500/50' />
                    </div>
                    <div className='mx-auto h-5 w-48 rounded-md bg-white/5 border border-white/10' />
                 </div>

                 {/* Simulated Dashboard Content */}
                 <div className='mt-12 p-6 h-full'>
                    <div className='grid grid-cols-12 gap-4 h-full'>
                        <div className='col-span-3 space-y-4'>
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className='h-8 rounded-lg bg-white/5 border border-white/5' />
                            ))}
                        </div>
                        <div className='col-span-9 space-y-4'>
                            <div className='h-32 rounded-xl bg-gradient-to-br from-gold/20 to-transparent border border-gold/10 p-4'>
                                <div className='flex items-center justify-between mb-4'>
                                    <div className='h-4 w-24 bg-gold/30 rounded' />
                                    <div className='h-8 w-8 rounded-full bg-gold/20 animate-pulse' />
                                </div>
                                <div className='space-y-2'>
                                    <div className='h-2 w-full bg-white/10 rounded' />
                                    <div className='h-2 w-3/4 bg-white/10 rounded' />
                                </div>
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='h-24 rounded-xl border border-white/5 bg-white/5' />
                                <div className='h-24 rounded-xl border border-white/5 bg-white/5' />
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Subtle brand overlay */}
                 <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                    <div className='p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 flex flex-col items-center gap-4 group-hover:scale-110 transition-transform duration-700'>
                        <CrownLogo size={60} className="text-gold" />
                        <div className='h-px w-12 bg-gold/50' />
                        <span className='text-sm font-medium tracking-[0.2em] uppercase text-gray-400'>System Active</span>
                    </div>
                 </div>
             </div>
          </motion.div>
        </section>

        {/* Features Bento Grid */}
        <section id='features' className='px-6 py-24'>
          <div className='mx-auto max-w-7xl'>
            <motion.div 
               variants={fadeIn}
               initial='initial'
               whileInView='whileInView'
               viewport={{ once: true }}
               className='mb-16 text-center'
            >
              <h2 className='mb-4 text-4xl font-bold md:text-5xl'>
                AI Tools for <span className='text-gold'>Every Stage</span>
              </h2>
              <p className='mx-auto max-w-2xl text-gray-400'>
                From ideation to scaling, our comprehensive AI-powered platform provides everything you need to build, launch, and scale your digital business.
              </p>
            </motion.div>

            <motion.div 
              variants={staggerContainer}
              initial='initial'
              whileInView='whileInView'
              viewport={{ once: true }}
              className='grid grid-cols-1 gap-6 md:grid-cols-3'
            >
              {/* Feature 1: Large */}
              <GlassCard className='p-8 md:col-span-2'>
                 <FeatureIcon icon={Bot} />
                 <h3 className='mb-3 text-2xl font-bold'>AI Product Builder</h3>
                 <p className='text-gray-400 mb-6'>Create digital products with our advanced AI assistant. From SaaS tools to mobile apps, build anything without coding expertise. Our engine handles the complexity while you focus on the vision.</p>
                 <div className='flex items-center gap-4'>
                    <div className='h-32 w-full rounded-xl bg-black/40 border border-white/5 flex items-center justify-center'>
                        <span className='text-xs text-gray-600'>Live Generation Preview</span>
                    </div>
                 </div>
              </GlassCard>

              {/* Feature 2: Square */}
              <GlassCard className='p-8'>
                <FeatureIcon icon={Target} />
                <h3 className='mb-3 text-xl font-bold'>Smart Launchpad</h3>
                <p className='text-gray-400 text-sm'>Launch products with AI-optimized strategies. Automated marketing, pricing, and acquisition tools.</p>
              </GlassCard>

              {/* Feature 3: Small */}
              <GlassCard className='p-8'>
                <FeatureIcon icon={Users} color='#60A5FA' />
                <h3 className='mb-3 text-xl font-bold'>Affiliate Empire</h3>
                <p className='text-gray-400 text-sm'>Build and manage your affiliate network with intelligent recruitment tools.</p>
              </GlassCard>

              {/* Feature 4: Large Horizontal */}
              <GlassCard className='p-8 md:col-span-2'>
                <div className='flex flex-col md:flex-row gap-8 items-center'>
                    <div className='flex-1'>
                        <FeatureIcon icon={BarChart3} color='#34D399' />
                        <h3 className='mb-3 text-2xl font-bold'>Advanced Analytics</h3>
                        <p className='text-gray-400'>Real-time dashboards show every metric that matters. Track revenue, customer behavior, and market trends with predictive AI insights.</p>
                    </div>
                    <div className='flex-1 w-full'>
                         <div className='h-40 rounded-xl bg-black/40 border border-white/5 p-4 flex flex-col gap-2'>
                            {[1,2,3].map(i => (
                                <div key={i} className='h-3 w-full bg-white/5 rounded-full overflow-hidden'>
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      whileInView={{ width: `${Math.random() * 60 + 20}%` }}
                                      className='h-full bg-gold/50'
                                    />
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className='bg-white/5 py-24'>
           <div className='mx-auto max-w-7xl px-6'>
              <div className='grid grid-cols-1 gap-12 md:grid-cols-2 items-center'>
                 <motion.div variants={fadeIn} initial='initial' whileInView='whileInView'>
                    <h2 className='mb-6 text-4xl font-bold md:text-5xl'>Why Builders Choose <span className='text-gold'>Ascnd Labs</span></h2>
                    <p className='mb-8 text-gray-400'>We provide more than just tools. We provide the infrastructure for the next generation of digital entrepreneurs.</p>
                    
                    <div className='space-y-6'>
                       {[
                         { title: 'Lightning Fast Deployment', desc: 'Go from idea to live in under 2 minutes.', icon: Trophy },
                         { title: 'Military Grade Security', desc: 'Your data and IP are protected by enterprise encryption.', icon: ShieldCheck },
                         { title: 'Global Infrastructure', desc: 'Scale to millions of users with zero friction.', icon: Globe }
                       ].map((item, i) => (
                         <div key={i} className='flex gap-4'>
                            <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold shadow-gold/5 shadow-lg'>
                               <item.icon size={24} />
                            </div>
                            <div>
                               <h4 className='font-bold text-white'>{item.title}</h4>
                               <p className='text-sm text-gray-400'>{item.desc}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </motion.div>

                 <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className='relative'
                 >
                    <div className='aspect-square rounded-3xl bg-gradient-to-br from-gold/20 to-transparent p-1 shadow-2xl shadow-gold/10'>
                       <div className='h-full w-full rounded-3xl bg-black flex items-center justify-center border border-white/5'>
                          <div className='text-center p-8'>
                             <TrendingUp size={48} className='text-gold mx-auto mb-4' />
                             <div className='text-5xl font-bold mb-2'>340%</div>
                             <p className='text-gray-400'>Average Revenue Growth</p>
                          </div>
                       </div>
                    </div>
                 </motion.div>
              </div>
           </div>
        </section>

        {/* Testimonials */}
        <section className='px-6 py-24'>
           <div className='mx-auto max-w-7xl text-center'>
              <motion.div variants={fadeIn} initial='initial' whileInView='whileInView' className='mb-16'>
                <h2 className='mb-4 text-4xl font-bold md:text-5xl'>Trusted by <span className='text-gold'>Visionaries</span></h2>
                <p className='text-gray-400'>Join thousands of entrepreneurs already building their empires.</p>
              </motion.div>

              <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
                 {[
                   { name: 'Alex Chen', role: 'SaaS Founder', text: 'The speed to market is incredible. I went from idea to launch in less than a month. This is game-changing.' },
                   { name: 'Maya Patel', role: 'Digital Creator', text: 'The automation tools have freed up so much of my time. I can focus on what I do best instead of admin work.' },
                   { name: 'Jordan Lee', role: 'E-commerce Entrepreneur', text: 'The affiliate system is elegant and easy to manage. Great for scaling revenue without hiring a team.' }
                 ].map((t, i) => (
                   <GlassCard key={i} className='p-8 text-left'>
                      <div className='mb-6 flex gap-1 text-gold'>
                        {[1,2,3,4,5].map(j => <Star key={j} size={16} fill='currentColor' />)}
                      </div>
                      <p className='mb-8 text-gray-300 italic'>"{t.text}"</p>
                      <div className='flex items-center gap-4'>
                         <div className='h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center font-bold text-gold'>
                            {t.name[0]}
                         </div>
                         <div>
                            <div className='font-bold'>{t.name}</div>
                            <div className='text-[10px] text-gray-500 uppercase tracking-widest'>{t.role}</div>
                         </div>
                      </div>
                   </GlassCard>
                 ))}
              </div>
           </div>
        </section>

        {/* Pricing */}
        <section id='pricing' className='bg-white/5 py-24'>
           <div className='mx-auto max-w-7xl px-6'>
              <div className='mb-16 text-center'>
                <h2 className='mb-4 text-4xl font-bold md:text-5xl'>Simple <span className='text-gold'>Transparent</span> Pricing</h2>
                <p className='text-gray-400'>Unlock the full potential of your digital empire.</p>
              </div>

              <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                 {[
                   { 
                     name: 'Starter', price: '5', popular: false,
                     features: ['Viral Hook Factory', 'AI Product Generator', 'Niche Launchpad', '10 Generations/Mo']
                   },
                   { 
                     name: 'Pro', price: '12', popular: true,
                     features: ['Viral Hook Factory', 'AI Product Generator', 'Niche Launchpad', '50 Generations/Mo', 'Priority Support']
                   },
                   { 
                     name: 'Empire', price: '25', popular: false,
                     features: ['Everything in Pro', 'Unlimited Generations', 'Whitelabel Options', 'Direct API Access']
                   }
                 ].map((plan, i) => (
                   <motion.div
                     key={i}
                     variants={fadeIn}
                     initial='initial'
                     whileInView='whileInView'
                     className={`relative flex flex-col rounded-3xl p-8 transition-all duration-500 ${plan.popular ? 'bg-white text-black scale-105 shadow-2xl shadow-gold/20' : 'bg-white/5 border border-white/10 hover:border-gold/30'}`}
                   >
                     {plan.popular && (
                       <div className='absolute -top-4 right-8 rounded-full bg-gold px-4 py-1 text-[10px] font-bold text-black uppercase tracking-widest'>
                          Most Popular
                       </div>
                     )}
                     <div className='mb-8'>
                        <h3 className={`text-xl font-bold ${plan.popular ? 'text-black' : 'text-white'}`}>{plan.name}</h3>
                        <div className='mt-4 flex items-baseline'>
                           <span className='text-5xl font-extrabold tracking-tight'>${plan.price}</span>
                           <span className={plan.popular ? 'text-black/60' : 'text-gray-400'}>/month</span>
                        </div>
                     </div>
                     <div className='mb-10 flex-1 space-y-4'>
                        {plan.features.map((f, j) => (
                          <div key={j} className='flex items-center gap-3'>
                             <CheckCircle2 size={18} className={plan.popular ? 'text-black' : 'text-gold'} />
                             <span className={`text-sm ${plan.popular ? 'text-black/80' : 'text-gray-400'}`}>{f}</span>
                          </div>
                        ))}
                     </div>
                     <button
                        onClick={handleGetStarted}
                        className={`w-full rounded-xl py-4 font-bold transition-all ${plan.popular ? 'bg-black text-white hover:bg-black/90' : 'bg-white/10 hover:bg-white/20'} cursor-pointer`}
                     >
                       Choose Plan
                     </button>
                   </motion.div>
                 ))}
              </div>
           </div>
        </section>

        {/* CTA / Community */}
        <section id='community' className='px-6 py-24'>
           <motion.div 
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             className='mx-auto max-w-5xl overflow-hidden rounded-[3rem] bg-gradient-to-br from-gold to-[#B8860B] p-1'
           >
              <div className='flex flex-col items-center justify-between gap-12 bg-black rounded-[2.9rem] p-12 md:flex-row md:p-20'>
                 <div className='max-w-xl text-center md:text-left'>
                    <h2 className='mb-6 text-4xl font-bold md:text-5xl'>Ready to <span className='text-gold'>Ascend</span>?</h2>
                    <p className='text-lg text-gray-400'>Join our Discord and connect with founders building the future. Get exclusive strategies, early access, and feedback on your products.</p>
                 </div>
                 <div className='flex flex-col gap-4 w-full md:w-auto'>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href='https://discord.gg/t7r94BZUXv'
                      target='_blank'
                      className='flex items-center justify-center gap-3 rounded-2xl bg-white px-10 py-5 text-xl font-bold text-black transition-all hover:bg-gold'
                    >
                       <MessageSquare /> Join Discord
                    </motion.a>
                    <p className='text-center text-xs text-gray-500 uppercase tracking-widest'>Zero Fee Community Access</p>
                 </div>
              </div>
           </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className='border-t border-white/5 bg-black px-6 py-20'>
         <div className='mx-auto max-w-7xl'>
            <div className='grid grid-cols-1 gap-12 md:grid-cols-4'>
               <div className='md:col-span-1'>
                  <div className='mb-6 flex items-center gap-2'>
                    <div className='text-gold'>
                      <CrownLogo size={24} />
                    </div>
                    <span className='text-2xl font-bold'>Ascnd</span>
                  </div>
                  <p className='text-sm text-gray-500'>Building the next generation of digital empires with artificial intelligence.</p>
               </div>
               <div>
                  <h4 className='mb-6 font-bold uppercase tracking-widest text-white'>Product</h4>
                  <ul className='space-y-4 text-sm text-gray-400'>
                     <li><a href='#features' className='hover:text-gold'>Features</a></li>
                     <li><a href='#pricing' className='hover:text-gold'>Pricing</a></li>
                     <li><a href='#' className='hover:text-gold'>Documentation</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className='mb-6 font-bold uppercase tracking-widest text-white'>Legal</h4>
                  <ul className='space-y-4 text-sm text-gray-400'>
                     <li><a href='#' className='hover:text-gold'>Privacy Policy</a></li>
                     <li><a href='#' className='hover:text-gold'>Terms of Service</a></li>
                     <li><a href='#' className='hover:text-gold'>Cookie Policy</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className='mb-6 font-bold uppercase tracking-widest text-white'>Support</h4>
                  <ul className='space-y-4 text-sm text-gray-400'>
                     <li><a href='mailto:hello@ascndlabs.com' className='hover:text-gold'>hello@ascndlabs.com</a></li>
                     <li><a href='#' className='hover:text-gold'>Help Center</a></li>
                     <li><a href='#' className='hover:text-gold'>Contact Us</a></li>
                  </ul>
               </div>
            </div>
            <div className='mt-20 border-t border-white/5 pt-10 text-center text-xs text-gray-600 uppercase tracking-tighter'>
               © 2025 Ascnd Labs. Build with intention.
            </div>
         </div>
      </footer>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl'
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className='relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gray-950 shadow-2xl'
              onClick={e => e.stopPropagation()}
            >
              <button 
                className='absolute top-6 right-6 text-white hover:text-gold transition-colors'
                onClick={() => setIsVideoOpen(false)}
              >
                <X size={32} />
              </button>
              <div className='aspect-video bg-black'>
                <video className='h-full w-full' controls autoPlay>
                  <source src='/demo.mp4' type='video/mp4' />
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
