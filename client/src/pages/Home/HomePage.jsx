// File: client/src/pages/Home/HomePage.jsx
import {
  AnimatePresence,
  motion as Motion,
  useScroll,
  useTransform,
} from 'framer-motion'
import {
    ArrowRight,
    BarChart3,
    CheckCircle2,
    Globe,
    Play,
    ShieldCheck,
    Target,
    TrendingUp,
    Trophy,
    Users,
    X,
    Zap
} from 'lucide-react'
import React, { useState } from 'react'

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
    <Motion.div
      variants={fadeIn}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md transition-colors ${hover ? 'hover:border-gold/30 hover:bg-white/10' : ''} ${className}`}
      style={{ '--gold': PRIMARY_GOLD }}
    >
      {children}
    </Motion.div>
  )

  const FeatureIcon = ({ icon: Icon, color = PRIMARY_GOLD }) => (
    <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 shadow-lg' style={{ color }}>
      {React.createElement(Icon, { size: 24 })}
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
      <Motion.nav
        style={{ backgroundColor: navBackground, borderBottomColor: navBorder }}
        className='fixed top-0 left-0 right-0 z-50 border-b border-white/0 backdrop-blur-sm transition-all duration-300'
      >
        <div className='mx-auto flex max-w-7xl items-center justify-between px-6 py-4'>
          <Motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='flex items-center gap-2'
          >
            <div className='text-gold bg-gold/10 p-2 rounded-xl'>
              <CrownLogo size={20} />
            </div>
            <span className='text-xl font-bold tracking-tight'>Ascnd<span className='text-gold'>Labs</span></span>
          </Motion.div>

          {/* Desktop Nav */}
          <div className='hidden items-center gap-8 md:flex'>
            <NavItem href='#features'>Features</NavItem>
            <NavItem href='#pricing'>Pricing</NavItem>
            <Motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGetStarted}
              className='rounded-full bg-white px-6 py-2 text-sm font-bold text-black transition-all hover:bg-gold hover:text-black cursor-pointer'
            >
              Start your affiliate program
            </Motion.button>
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
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='overflow-hidden bg-black/95 px-6 pb-6 md:hidden'
            >
              <div className='flex flex-col gap-4 pt-4'>
                <NavItem href='#features'>Features</NavItem>
                <NavItem href='#pricing'>Pricing</NavItem>
                <button
                  onClick={handleGetStarted}
                  className='w-full rounded-xl bg-gold py-3 font-bold text-black'
                >
                  Start your affiliate program
                </button>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </Motion.nav>

      <main className='relative z-10'>
        {/* Hero Section */}
        <section className='relative flex flex-col items-center px-6 pt-40 pb-20 text-center overflow-hidden'>
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className='max-w-4xl relative z-20'
          >
            <Motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className='mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm'
            >
              <span className='flex h-2 w-2 rounded-full bg-gold animate-pulse' />
              <span className='text-gray-300'>Now accepting early access members</span>
            </Motion.div>

            <h1 className='mb-6 text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl'>
              Run Your{' '}
              <span className='bg-gradient-to-r from-gold via-[#F0D58B] to-gold bg-clip-text text-transparent'>
                Affiliate Program
              </span>
            </h1>

            <p className='mx-auto mb-10 max-w-2xl text-lg text-gray-400 md:text-xl'>
              Invite affiliates, track commissions, and manage payouts from one focused workspace.
            </p>

            <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
              <Motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGetStarted}
                className='flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-lg font-bold text-black transition-all cursor-pointer'
              >
                Start your affiliate program <ArrowRight size={20} />
              </Motion.button>
              <Motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoOpen(true)}
                className='flex items-center gap-2 rounded-full border border-white/20 px-8 py-4 text-lg font-bold text-white transition-all cursor-pointer'
              >
                <Play size={20} fill='white' /> Watch Demo
              </Motion.button>
            </div>

            {/* Product scope */}
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className='mt-16 flex flex-wrap justify-center gap-12 text-gray-500'
            >
              <div className='text-center'>
                <div className='text-3xl font-bold text-white'>1</div>
                <div className='text-[10px] uppercase tracking-[0.2em]'>Program</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-white'>1</div>
                <div className='text-[10px] uppercase tracking-[0.2em]'>Invite Link</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-white'>4</div>
                <div className='text-[10px] uppercase tracking-[0.2em]'>Clear Money States</div>
              </div>
            </Motion.div>
          </Motion.div>

          {/* Hero Mockup */}
          <Motion.div
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
          </Motion.div>
        </section>

        {/* Features Bento Grid */}
        <section id='features' className='px-6 py-24'>
          <div className='mx-auto max-w-7xl'>
            <Motion.div
               variants={fadeIn}
               initial='initial'
               whileInView='whileInView'
               viewport={{ once: true }}
               className='mb-16 text-center'
            >
              <h2 className='mb-4 text-4xl font-bold md:text-5xl'>
                Everything for Your <span className='text-gold'>Affiliate Program</span>
              </h2>
              <p className='mx-auto max-w-2xl text-gray-400'>
                Keep affiliate invitations, commissions, earnings, and payouts clear for your business.
              </p>
            </Motion.div>

            <Motion.div
              variants={staggerContainer}
              initial='initial'
              whileInView='whileInView'
              viewport={{ once: true }}
              className='grid grid-cols-1 gap-6 md:grid-cols-3'
            >
              {/* Feature 1: Large */}
              <GlassCard className='p-8 md:col-span-2'>
                 <FeatureIcon icon={Users} />
                 <h3 className='mb-3 text-2xl font-bold'>Affiliate Management</h3>
                 <p className='text-gray-400 mb-6'>Invite affiliates, give them a clear referral link, and keep program activity organized in one place.</p>
                 <div className='flex items-center gap-4'>
                    <div className='h-32 w-full rounded-xl bg-black/40 border border-white/5 flex items-center justify-center'>
                        <span className='text-xs text-gray-600'>Affiliate activity overview</span>
                    </div>
                 </div>
              </GlassCard>

              {/* Feature 2: Square */}
              <GlassCard className='p-8'>
                <FeatureIcon icon={Target} />
                <h3 className='mb-3 text-xl font-bold'>Commission Setup</h3>
                <p className='text-gray-400 text-sm'>Keep commission terms and affiliate earnings easy to understand.</p>
              </GlassCard>

              {/* Feature 3: Small */}
              <GlassCard className='p-8'>
                <FeatureIcon icon={Users} color='#60A5FA' />
                <h3 className='mb-3 text-xl font-bold'>Affiliate List</h3>
                <p className='text-gray-400 text-sm'>Find the people promoting your business and review the referral details already available.</p>
              </GlassCard>

              {/* Feature 4: Large Horizontal */}
              <GlassCard className='p-8 md:col-span-2'>
                <div className='flex flex-col md:flex-row gap-8 items-center'>
                    <div className='flex-1'>
                        <FeatureIcon icon={BarChart3} color='#34D399' />
                        <h3 className='mb-3 text-2xl font-bold'>Earnings and Payout Status</h3>
                        <p className='text-gray-400'>See earnings and payout status without digging through unrelated tools.</p>
                    </div>
                    <div className='flex-1 w-full'>
                         <div className='h-40 rounded-xl bg-black/40 border border-white/5 p-4 flex flex-col gap-2'>
                            {[1,2,3].map(i => (
                                <div key={i} className='h-3 w-full bg-white/5 rounded-full overflow-hidden'>
                                    <Motion.div
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
            </Motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className='bg-white/5 py-24'>
           <div className='mx-auto max-w-7xl px-6'>
              <div className='grid grid-cols-1 gap-12 md:grid-cols-2 items-center'>
                 <Motion.div variants={fadeIn} initial='initial' whileInView='whileInView'>
                    <h2 className='mb-6 text-4xl font-bold md:text-5xl'>Why Businesses Choose <span className='text-gold'>AscndLabs</span></h2>
                    <p className='mb-8 text-gray-400'>A focused workflow for launching a program, inviting affiliates, and understanding commission status.</p>

                    <div className='space-y-6'>
                       {[
                         { title: 'Simple Program Setup', desc: 'Set your program name, commission rate, cookie duration, and active status.', icon: Trophy },
                         { title: 'Clear Affiliate Invites', desc: 'Copy one referral link and invitation message from the same screen.', icon: ShieldCheck },
                         { title: 'Understandable Payouts', desc: 'See commission that is pending, payable, requested, or paid.', icon: Globe }
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
                 </Motion.div>

                 <Motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    className='relative'
                 >
                    <div className='aspect-square rounded-3xl bg-gradient-to-br from-gold/20 to-transparent p-1 shadow-2xl shadow-gold/10'>
                       <div className='h-full w-full rounded-3xl bg-black flex items-center justify-center border border-white/5'>
                          <div className='text-center p-8'>
                             <TrendingUp size={48} className='text-gold mx-auto mb-4' />
                             <div className='text-5xl font-bold mb-2'>30 days</div>
                             <p className='text-gray-400'>Commission hold shown clearly before payout</p>
                          </div>
                       </div>
                    </div>
                 </Motion.div>
              </div>
           </div>
        </section>

        {/* Pricing */}
        <section id='pricing' className='bg-white/5 py-24'>
           <div className='mx-auto max-w-7xl px-6'>
              <div className='mb-16 text-center'>
                <h2 className='mb-4 text-4xl font-bold md:text-5xl'>Simple <span className='text-gold'>Transparent</span> Pricing</h2>
                <p className='text-gray-400'>Choose a simple plan for your affiliate program.</p>
              </div>

              <div className='grid grid-cols-1 gap-8 md:grid-cols-3'>
                 {[
                   {
                     name: 'Starter', price: '5', popular: false,
                     features: ['Affiliate invite link', 'Affiliate list', 'Commission tracking', 'Earnings dashboard', 'Payout status']
                   },
                   {
                     name: 'Pro', price: '12', popular: true,
                     features: ['Affiliate invite link', 'Affiliate list', 'Commission tracking', 'Earnings dashboard', 'Payout status']
                   },
                   {
                     name: 'Business', price: '25', popular: false,
                     features: ['Affiliate invite link', 'Affiliate list', 'Commission tracking', 'Earnings dashboard', 'Payout status']
                   }
                 ].map((plan, i) => (
                   <Motion.div
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
                       Start your affiliate program
                     </button>
                   </Motion.div>
                 ))}
              </div>
           </div>
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
                  <p className='text-sm text-gray-500'>A focused workspace for affiliates, commissions, and payouts.</p>
               </div>
               <div>
                  <h4 className='mb-6 font-bold uppercase tracking-widest text-white'>Product</h4>
                  <ul className='space-y-4 text-sm text-gray-400'>
                     <li><a href='#features' className='hover:text-gold'>Features</a></li>
                     <li><a href='#pricing' className='hover:text-gold'>Pricing</a></li>
                     <li><a href='/auth' className='hover:text-gold'>Start your affiliate program</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className='mb-6 font-bold uppercase tracking-widest text-white'>Legal</h4>
                  <ul className='space-y-4 text-sm text-gray-400'>
                     <li><a href='/privacy' className='hover:text-gold'>Privacy Policy</a></li>
                     <li><a href='/terms' className='hover:text-gold'>Terms of Service</a></li>
                  </ul>
               </div>
               <div>
                  <h4 className='mb-6 font-bold uppercase tracking-widest text-white'>Support</h4>
                  <ul className='space-y-4 text-sm text-gray-400'>
                     <li><a href='mailto:hello@ascndlabs.com' className='hover:text-gold'>hello@ascndlabs.com</a></li>
                     <li><a href='mailto:hello@ascndlabs.com' className='hover:text-gold'>Contact Us</a></li>
                  </ul>
               </div>
            </div>
            <div className='mt-20 border-t border-white/5 pt-10 text-center text-xs text-gray-600 uppercase tracking-tighter'>
               © {new Date().getFullYear()} AscndLabs. Affiliate Program Manager.
            </div>
         </div>
      </footer>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl'
            onClick={() => setIsVideoOpen(false)}
          >
            <Motion.div
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
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default HomePage
