// File: client/src/pages/Auth/AuthPage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Eye,
    EyeOff,
    Gift,
    Globe,
    Lock,
    Mail,
    Shield,
    TrendingUp,
    User,
    X,
    XCircle,
    Zap
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
    useCurrentUser,
    useForgotPassword,
    useResetPassword,
    useSendExistingUserVerificationOTP,
    useSendSignupOTP,
    useSignin,
    useValidateReferralCode,
    useVerifyExistingUserEmail,
    useVerifyOTP,
    useVerifySignupOTP,
} from '../../hooks/useAuth.js'
import { selectIsLoading } from '../../redux/userSlice.js'

const PRIMARY_GOLD = '#D4AF37'

// Reusable Components
const GlassCard = ({ children, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: -20 }}
    className={`relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl ${className}`}
  >
    {children}
  </motion.div>
)

const Input = ({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  success,
  autoFocus,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputType = type === 'password' && showPassword ? 'text' : type
  const isFloating = isFocused || (value && value.toString().length > 0)

  return (
    <div className='group space-y-1 w-full'>
      <div className='relative'>
        <div className={`absolute left-4 transition-all duration-300 z-20 pointer-events-none ${isFloating ? 'top-4 text-gold' : 'top-1/2 -translate-y-1/2 text-gray-500'} ${isFocused ? 'text-gold' : ''}`}>
          <Icon size={18} />
        </div>
        
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full h-14 pl-12 pr-12 bg-black/40 border rounded-2xl text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gold/5 ${
            isFloating ? 'pt-5 pb-1' : 'pt-0'
          } ${
            error
              ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
              : success
              ? 'border-green-500/50'
              : isFocused ? 'border-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]' : 'border-white/10'
          } hover:border-white/20`}
          autoFocus={autoFocus}
          {...props}
        />

        <label 
          className={`absolute left-12 pointer-events-none transition-all duration-300 z-20
            ${isFloating 
                ? 'top-2 text-gold text-[9px] font-black uppercase tracking-[0.2em]' 
                : 'top-1/2 -translate-y-1/2 text-gray-500 text-sm'}`}
        >
          {placeholder}
        </label>

        {type === 'password' && (
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors z-20 ${showPassword ? 'text-gold' : 'text-gray-500 hover:text-white'}`}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, x: -10 }} 
          animate={{ opacity: 1, x: 0 }} 
          className='text-red-500 text-[10px] font-bold uppercase tracking-wider ml-4'
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

const Button = ({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}) => {
  const baseClasses =
    'relative h-12 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group'

  const variants = {
    primary:
      'bg-gold text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-[1.02] active:scale-[0.98]',
    secondary:
      'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20',
    ghost: 'text-gold hover:bg-gold/10',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
      ) : (
        <>
          {children}
        </>
      )}
    </motion.button>
  )
}

const OTPInput = ({ value, onChange, length = 6, error }) => {
  const inputRefs = useRef([])

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return 
    const newValue = value.split('')
    newValue[index] = val
    const otpValue = newValue.join('')
    onChange(otpValue)
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-center gap-2 sm:gap-4'>
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type='text'
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white/5 border rounded-xl text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gold/10 ${
              error ? 'border-red-500/50' : 'border-white/10'
            } focus:border-gold`}
            autoComplete='off'
          />
        ))}
      </div>
      {error && <p className='text-red-400 text-sm text-center'>{error}</p>}
    </div>
  )
}

// Icon component
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

export default function AuthPage() {
  const [authFlow, setAuthFlow] = useState('signin')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    referralCode: '',
    otp: '',
    resetToken: '',
  })
  const [errors, setErrors] = useState({})
  const [referralValidation, setReferralValidation] = useState(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const currentUser = useCurrentUser()
  const isLoading = useSelector(selectIsLoading)
  const authError = useSelector((state) => state.user.error)

  const signinMutation = useSignin()
  const sendSignupOTPMutation = useSendSignupOTP()
  const verifySignupOTPMutation = useVerifySignupOTP()
  const forgotPasswordMutation = useForgotPassword()
  const verifyOTPMutation = useVerifyOTP()
  const resetPasswordMutation = useResetPassword()
  const sendExistingUserOTPMutation = useSendExistingUserVerificationOTP()
  const verifyExistingUserOTPMutation = useVerifyExistingUserEmail()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    if (refCode && refCode.trim()) {
      setFormData((prev) => ({
        ...prev,
        referralCode: refCode.trim().toUpperCase(),
      }))
      setAuthFlow('signup')
    }
  }, [])

  const {
    data: referralValidationData,
    isLoading: isValidatingReferral,
  } = useValidateReferralCode(
    formData.referralCode.trim(),
    authFlow === 'signup' && formData.referralCode.trim().length >= 3
  )

  useEffect(() => {
    if (currentUser) {
      window.location.href = '/dashboard'
    }
  }, [currentUser])

  useEffect(() => {
    if (referralValidationData) {
      setReferralValidation(referralValidationData.data)
    }
  }, [referralValidationData])

  useEffect(() => {
    if (authError && typeof authError === 'string') {
      setErrors((prev) => ({ ...prev, general: authError }))
    }
  }, [authError])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
    if (field === 'referralCode') setReferralValidation(null)
    if (errors.general) setErrors((prev) => ({ ...prev, general: '' }))
  }

  const validateForm = () => {
    const newErrors = {}
    if (authFlow === 'signin') {
      if (!formData.email) newErrors.email = 'Email required'
      if (!formData.password) newErrors.password = 'Password required'
    } else if (authFlow === 'signup') {
      if (!formData.name) newErrors.name = 'Name required'
      if (!formData.email) newErrors.email = 'Email required'
      if (!formData.password) newErrors.password = 'Password required'
      else if (formData.password.length < 8) newErrors.password = 'Min 8 characters'
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords mismatch'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (authFlow === 'signup' && !agreedToTerms) {
      setErrors((prev) => ({ ...prev, general: 'Please agree to the Terms & Policy' }))
      return
    }
    if (!validateForm()) return
    setErrors({})

    try {
      if (authFlow === 'signin') {
        try {
          const result = await signinMutation.mutateAsync({
            email: formData.email.trim(),
            password: formData.password,
          })
          if (result.status === 'success') window.location.href = '/dashboard'
        } catch (error) {
          if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
            setFormData(p => ({ ...p, ...error.response.data.data, otp: '' }))
            setAuthFlow('verify-email')
            return
          }
          throw error
        }
      } else if (authFlow === 'verify-email') {
        const r = await sendExistingUserOTPMutation.mutateAsync({ email: formData.email.trim() })
        if (r.status === 'success') setAuthFlow('verify-email-otp')
      } else if (authFlow === 'verify-email-otp') {
        const r = await verifyExistingUserOTPMutation.mutateAsync({ email: formData.email.trim(), otp: formData.otp })
        if (r.status === 'success') window.location.href = '/dashboard'
      } else if (authFlow === 'signup') {
        const signupData = { name: formData.name.trim(), email: formData.email.trim(), password: formData.password }
        if (formData.referralCode.trim() && referralValidation?.isValid) signupData.referralCode = formData.referralCode.trim()
        const result = await sendSignupOTPMutation.mutateAsync(signupData)
        if (result.status === 'success') setAuthFlow('signup-otp')
      } else if (authFlow === 'signup-otp') {
        const r = await verifySignupOTPMutation.mutateAsync({ email: formData.email.trim(), otp: formData.otp })
        if (r.status === 'success') window.location.href = '/dashboard'
      } else if (authFlow === 'forgot') {
        const r = await forgotPasswordMutation.mutateAsync(formData.email.trim())
        if (r.status === 'success') setAuthFlow('otp')
      } else if (authFlow === 'otp') {
        const r = await verifyOTPMutation.mutateAsync({ email: formData.email.trim(), otp: formData.otp })
        if (r.status === 'success') {
          setFormData(p => ({ ...p, resetToken: r.data.resetToken }))
          setAuthFlow('reset')
        }
      } else if (authFlow === 'reset') {
        const r = await resetPasswordMutation.mutateAsync({ resetToken: formData.resetToken, password: formData.password, confirmPassword: formData.confirmPassword })
        if (r.status === 'success') window.location.href = '/dashboard'
      }
    } catch (error) {
      setErrors(p => ({ ...p, general: error.response?.data?.message || 'An unexpected error occurred' }))
    }
  }

  const goBack = () => {
    if (['signup-otp', 'verify-email-otp'].includes(authFlow)) setAuthFlow(authFlow === 'signup-otp' ? 'signup' : 'verify-email')
    else if (authFlow === 'verify-email') setAuthFlow('signin')
    else if (['otp', 'reset'].includes(authFlow)) setAuthFlow('forgot')
    else if (authFlow === 'forgot') setAuthFlow('signin')
    setErrors({})
  }

  const switchMode = (mode) => {
    setAuthFlow(mode)
    setErrors({})
  }

  return (
    <div className='min-h-screen bg-black flex selection:bg-gold/30 selection:text-gold'>
      {/* Background elements */}
      <div className='fixed inset-0 pointer-events-none'>
        <div className='absolute top-[-20%] left-[-10%] h-[50%] w-[50%] rounded-full bg-gold/10 blur-[150px]' />
        <div className='absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-blue-500/5 blur-[120px]' />
      </div>

      {/* Main Content Area */}
      <div className='relative z-10 w-full flex flex-col lg:flex-row min-h-screen'>
        {/* Left Side: Branding (Hidden on mobile) */}
        <div className='hidden lg:flex lg:w-1/2 flex-col justify-between p-12'>
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className='flex items-center gap-2'
          >
            <div className='text-gold bg-gold/10 p-2.5 rounded-2xl'>
              <CrownLogo size={28} />
            </div>
            <span className='text-3xl font-extrabold tracking-tighter text-white'>Ascnd<span className='text-gold'>Labs</span></span>
          </motion.div>

          <div className='max-w-md'>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className='text-5xl font-bold text-white mb-6'
            >
              Master the<br />
              <span className='text-gold'>Digital Economy</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className='text-gray-400 text-lg leading-relaxed'
            >
              Empower your vision with the world's most advanced AI infrastructure. Build, scale, and thrive in the new era of intelligent systems.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className='flex gap-12'
          >
            <div>
              <div className='flex items-center gap-2 text-gold mb-1'>
                <Shield size={20} />
                <span className='text-xl font-bold text-white'>Secure</span>
              </div>
              <div className='text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold'>Infrastructure</div>
            </div>
            <div>
              <div className='flex items-center gap-2 text-gold mb-1'>
                <Zap size={20} />
                <span className='text-xl font-bold text-white'>Fast</span>
              </div>
              <div className='text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold'>Deployment</div>
            </div>
            <div>
              <div className='flex items-center gap-2 text-gold mb-1'>
                <Globe size={20} />
                <span className='text-xl font-bold text-white'>Global</span>
              </div>
              <div className='text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold'>Availability</div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Auth Form */}
        <div className='w-full lg:w-1/2 flex items-center justify-center p-6'>
          <div className='w-full max-w-md relative'>
            
            {/* Logo for Mobile */}
            <div className='flex lg:hidden justify-center mb-8'>
              <div className='flex items-center gap-2'>
                <div className='text-gold bg-gold/10 p-2 rounded-xl'>
                   <CrownLogo size={20} />
                </div>
                <span className='text-xl font-bold text-white'>Ascnd<span className='text-gold'>Labs</span></span>
              </div>
            </div>

            <AnimatePresence mode='wait'>
              <GlassCard key={authFlow}>
                {/* Back Button */}
                {['signup-otp', 'verify-email', 'verify-email-otp', 'forgot', 'otp', 'reset'].includes(authFlow) && (
                  <button onClick={goBack} className='absolute top-8 left-8 text-gray-500 hover:text-white transition-colors'>
                    <ArrowLeft size={20} />
                  </button>
                )}

                <div className='text-center mb-8 mt-2'>
                  <h1 className='text-3xl font-bold text-white mb-2'>
                    {authFlow === 'signin' && 'Welcome back'}
                    {authFlow === 'signup' && 'Create account'}
                    {authFlow === 'signup-otp' && 'Check your email'}
                    {authFlow === 'forgot' && 'Reset password'}
                    {authFlow === 'reset' && 'New password'}
                  </h1>
                  <p className='text-gray-500 text-sm'>
                    {authFlow === 'signin' && 'Sign in to continue your journey'}
                    {authFlow === 'signup' && 'Start building your empire today'}
                    {authFlow === 'signup-otp' && `We sent a code to ${formData.email}`}
                    {authFlow === 'forgot' && 'Enter your email to receive an OTP'}
                  </p>
                </div>

                {errors.general && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className='mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3'>
                    <AlertTriangle size={18} className='shrink-0' />
                    {errors.general}
                  </motion.div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSubmit() }} className='space-y-4'>
                  {authFlow === 'signin' && (
                    <>
                      <Input icon={Mail} type='email' placeholder='Email address' value={formData.email} onChange={e => handleInputChange('email', e.target.value)} error={errors.email} autoFocus />
                      <Input icon={Lock} type='password' placeholder='Password' value={formData.password} onChange={e => handleInputChange('password', e.target.value)} error={errors.password} />
                      <div className='flex justify-end'>
                        <button type='button' onClick={() => switchMode('forgot')} className='text-sm font-medium text-gold hover:text-gold/80'>Forgot password?</button>
                      </div>
                    </>
                  )}

                  {authFlow === 'signup' && (
                    <>
                      <Input icon={User} placeholder='Full name' value={formData.name} onChange={e => handleInputChange('name', e.target.value)} error={errors.name} autoFocus />
                      <Input icon={Mail} type='email' placeholder='Email address' value={formData.email} onChange={e => handleInputChange('email', e.target.value)} error={errors.email} />
                      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <Input icon={Lock} type='password' placeholder='Password' value={formData.password} onChange={e => handleInputChange('password', e.target.value)} error={errors.password} />
                        <Input icon={Lock} type='password' placeholder='Confirm' value={formData.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} error={errors.confirmPassword} />
                      </div>
                      <Input icon={Gift} placeholder='Referral code (optional)' value={formData.referralCode} onChange={e => handleInputChange('referralCode', e.target.value.toUpperCase())} error={errors.referralCode} />
                      
                      <div className='flex items-start gap-3 p-2'>
                        <input type='checkbox' id='terms' checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className='mt-1 accent-gold' />
                        <label htmlFor='terms' className='text-xs text-gray-500'>
                          I agree to the <a href='/terms' className='text-gold border-b border-gold/30 hover:border-gold'>Terms</a> and <a href='/privacy' className='text-gold border-b border-gold/30 hover:border-gold'>Privacy Policy</a>
                        </label>
                      </div>
                    </>
                  )}

                  {(authFlow === 'signup-otp' || authFlow === 'verify-email-otp' || authFlow === 'otp') && (
                    <OTPInput value={formData.otp} onChange={otp => handleInputChange('otp', otp)} error={errors.otp} />
                  )}

                  {authFlow === 'forgot' && (
                    <Input icon={Mail} type='email' placeholder='Email address' value={formData.email} onChange={e => handleInputChange('email', e.target.value)} error={errors.email} autoFocus />
                  )}

                  {authFlow === 'reset' && (
                    <>
                      <Input icon={Lock} type='password' placeholder='New password' value={formData.password} onChange={e => handleInputChange('password', e.target.value)} error={errors.password} />
                      <Input icon={Lock} type='password' placeholder='Confirm new password' value={formData.confirmPassword} onChange={e => handleInputChange('confirmPassword', e.target.value)} error={errors.confirmPassword} />
                    </>
                  )}

                  <Button type='submit' loading={isLoading} className='w-full group'>
                    {authFlow === 'signin' && 'Sign In'}
                    {authFlow === 'signup' && 'Create Account'}
                    {authFlow === 'signup-otp' && 'Verify Email'}
                    {authFlow === 'forgot' && 'Send Reset Link'}
                    {authFlow === 'reset' && 'Update Password'}
                    <ArrowRight size={18} className='group-hover:translate-x-1 transition-transform' />
                  </Button>
                </form>

                {['signin', 'signup'].includes(authFlow) && (
                  <div className='mt-8 pt-8 border-t border-white/5 text-center'>
                     <p className='text-gray-500 text-sm'>
                       {authFlow === 'signin' ? "New to Ascnd Labs?" : "Already have an account?"}
                       <button onClick={() => switchMode(authFlow === 'signin' ? 'signup' : 'signin')} className='ml-2 text-gold font-bold hover:underline underline-offset-4'>
                          {authFlow === 'signin' ? "Create account" : "Sign in"}
                       </button>
                     </p>
                  </div>
                )}
              </GlassCard>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
