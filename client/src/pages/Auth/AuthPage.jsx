// File: client/src/pages/Auth/AuthPage.jsx - UPDATED WITH EMAIL VERIFICATION FLOW
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  Shield,
  Timer,
  User,
  XCircle,
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  useAuthLoading,
  useCurrentUser,
  useForgotPassword,
  useResetPassword,
  useSendExistingUserVerificationOTP,
  useSendSignupOTP, // NEW: For existing users
  useSignin,
  useValidateReferralCode,
  useVerifyExistingUserEmail,
  useVerifyOTP,
  useVerifySignupOTP,
} from '../../hooks/useAuth.js'
import { selectIsLoading } from '../../redux/userSlice.js'

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
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className='space-y-1'>
      <div className='relative'>
        <div className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
          <Icon size={18} />
        </div>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`w-full h-10 pl-11 pr-12 bg-[#121214] border rounded-lg text-[#EDEDED] placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] ${
            error
              ? 'border-red-500'
              : success
              ? 'border-green-500'
              : 'border-[#1E1E21]'
          } hover:border-[#D4AF37]/30`}
          autoFocus={autoFocus}
          {...props}
        />
        {type === 'password' && (
          <button
            type='button'
            onClick={() => setShowPassword(!showPassword)}
            className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#EDEDED] transition-colors'
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className='text-red-400 text-sm ml-1'>{error}</p>}
      {success && <p className='text-green-400 text-sm ml-1'>{success}</p>}
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
    'h-10 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 active:scale-[0.98]',
    secondary:
      'bg-[#121214] border border-[#1E1E21] text-[#EDEDED] hover:border-[#D4AF37]/30 hover:bg-[#1E1E21]/30',
    ghost: 'text-[#D4AF37] hover:text-[#D4AF37]/80 hover:bg-[#D4AF37]/10',
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
      ) : (
        children
      )}
    </button>
  )
}

// OTP Input Component
const OTPInput = ({ value, onChange, length = 6, error }) => {
  const inputRefs = useRef([])

  const handleChange = (index, val) => {
    if (!/^\d*$/.test(val)) return // Only allow digits

    const newValue = value.split('')
    newValue[index] = val
    const otpValue = newValue.join('')

    onChange(otpValue)

    // Auto-focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').slice(0, length)
    if (/^\d+$/.test(pasteData)) {
      onChange(pasteData.padEnd(length, ''))
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pasteData.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className='space-y-1'>
      <div className='flex justify-center gap-3'>
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type='text'
            maxLength={1}
            value={value[index] || ''}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-12 h-12 text-center text-xl font-mono bg-[#121214] border rounded-lg text-[#EDEDED] transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] ${
              error ? 'border-red-500' : 'border-[#1E1E21]'
            } hover:border-[#D4AF37]/30`}
            autoComplete='off'
          />
        ))}
      </div>
      {error && <p className='text-red-400 text-sm text-center'>{error}</p>}
    </div>
  )
}

export default function AuthPage() {
  // Auth flow states - UPDATED with email verification flows
  const [authFlow, setAuthFlow] = useState('signin') // 'signin', 'signup', 'signup-otp', 'forgot', 'otp', 'reset', 'verify-email', 'verify-email-otp'
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

  // Redux state
  const currentUser = useCurrentUser()
  const isLoading = useSelector(selectIsLoading)
  const authError = useSelector((state) => state.user.error)

  // React Query hooks
  const signinMutation = useSignin()
  const sendSignupOTPMutation = useSendSignupOTP()
  const verifySignupOTPMutation = useVerifySignupOTP()
  const forgotPasswordMutation = useForgotPassword()
  const verifyOTPMutation = useVerifyOTP()
  const resetPasswordMutation = useResetPassword()

  // NEW: Email verification hooks for existing users
  const sendExistingUserOTPMutation = useSendExistingUserVerificationOTP()
  const verifyExistingUserOTPMutation = useVerifyExistingUserEmail()

  // Check for referral code in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')

    if (refCode && refCode.trim()) {
      setFormData((prev) => ({
        ...prev,
        referralCode: refCode.trim().toUpperCase(),
      }))
      // Switch to signup mode if referral code is present
      setAuthFlow('signup')
    }
  }, [])

  // Referral code validation
  const {
    data: referralValidationData,
    isLoading: isValidatingReferral,
    error: referralValidationError,
  } = useValidateReferralCode(
    formData.referralCode.trim(),
    authFlow === 'signup' && formData.referralCode.trim().length >= 3
  )

  // Redirect if user is already authenticated
  useEffect(() => {
    if (currentUser) {
      window.location.href = '/dashboard'
    }
  }, [currentUser])

  // Update referral validation state when data changes
  useEffect(() => {
    if (referralValidationData) {
      setReferralValidation(referralValidationData.data)
    } else if (referralValidationError) {
      setReferralValidation({
        isValid: false,
        message: 'Error validating referral code',
      })
    } else {
      setReferralValidation(null)
    }
  }, [referralValidationData, referralValidationError])

  // Handle Redux auth errors
  useEffect(() => {
    if (authError && typeof authError === 'string') {
      setErrors((prev) => ({ ...prev, general: authError }))
    }
  }, [authError])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

    // Reset referral validation when user changes referral code
    if (field === 'referralCode') {
      setReferralValidation(null)
    }

    // Clear general error when user makes changes
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (authFlow === 'signin') {
      if (!formData.email) newErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = 'Email is invalid'

      if (!formData.password) newErrors.password = 'Password is required'
    } else if (authFlow === 'signup') {
      if (!formData.name) newErrors.name = 'Name is required'
      if (!formData.email) newErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = 'Email is invalid'

      if (!formData.password) newErrors.password = 'Password is required'
      else if (formData.password.length < 8)
        newErrors.password = 'Password must be at least 8 characters'

      if (!formData.confirmPassword)
        newErrors.confirmPassword = 'Please confirm your password'
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }

      // Validate referral code if provided
      if (formData.referralCode && formData.referralCode.trim().length > 0) {
        if (formData.referralCode.trim().length < 3) {
          newErrors.referralCode = 'Referral code must be at least 3 characters'
        } else if (referralValidation && !referralValidation.isValid) {
          newErrors.referralCode =
            referralValidation.message || 'Invalid referral code'
        }
      }
    } else if (['signup-otp', 'verify-email-otp', 'otp'].includes(authFlow)) {
      if (!formData.otp) newErrors.otp = 'OTP is required'
      else if (!/^\d{6}$/.test(formData.otp))
        newErrors.otp = 'OTP must be 6 digits'
    } else if (authFlow === 'forgot') {
      if (!formData.email) newErrors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = 'Email is invalid'
    } else if (authFlow === 'reset') {
      if (!formData.password) newErrors.password = 'Password is required'
      else if (formData.password.length < 8)
        newErrors.password = 'Password must be at least 8 characters'

      if (!formData.confirmPassword)
        newErrors.confirmPassword = 'Please confirm your password'
      else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setErrors({})

    try {
      if (authFlow === 'signin') {
        try {
          const result = await signinMutation.mutateAsync({
            email: formData.email.trim(),
            password: formData.password,
          })
          if (result.status === 'success') {
            window.location.href = '/dashboard'
          }
        } catch (error) {
          // NEW: Handle email not verified error
          if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
            // Update form data with user info from error response
            setFormData((prev) => ({
              ...prev,
              email: error.response.data.data.email,
              name: error.response.data.data.name,
              otp: '', // Clear any previous OTP
            }))
            // Switch to email verification flow
            setAuthFlow('verify-email')
            return // Don't throw the error
          }
          throw error // Re-throw other errors
        }
      } else if (authFlow === 'verify-email') {
        // NEW: Send verification OTP to existing user
        const result = await sendExistingUserOTPMutation.mutateAsync({
          email: formData.email.trim(),
        })
        if (result.status === 'success') {
          setAuthFlow('verify-email-otp')
        }
      } else if (authFlow === 'verify-email-otp') {
        // NEW: Verify existing user's email
        const result = await verifyExistingUserOTPMutation.mutateAsync({
          email: formData.email.trim(),
          otp: formData.otp,
        })
        if (result.status === 'success') {
          window.location.href = '/dashboard'
        }
      } else if (authFlow === 'signup') {
        const signupData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }

        // Include referral code if valid
        if (formData.referralCode.trim() && referralValidation?.isValid) {
          signupData.referralCode = formData.referralCode.trim()
        }

        const result = await sendSignupOTPMutation.mutateAsync(signupData)
        if (result.status === 'success') {
          setAuthFlow('signup-otp')
        }
      } else if (authFlow === 'signup-otp') {
        const result = await verifySignupOTPMutation.mutateAsync({
          email: formData.email.trim(),
          otp: formData.otp,
        })
        if (result.status === 'success') {
          window.location.href = '/dashboard'
        }
      } else if (authFlow === 'forgot') {
        const result = await forgotPasswordMutation.mutateAsync(
          formData.email.trim()
        )
        if (result.status === 'success') {
          setAuthFlow('otp')
        }
      } else if (authFlow === 'otp') {
        const result = await verifyOTPMutation.mutateAsync({
          email: formData.email.trim(),
          otp: formData.otp,
        })
        if (result.status === 'success') {
          setFormData((prev) => ({
            ...prev,
            resetToken: result.data.resetToken,
          }))
          setAuthFlow('reset')
        }
      } else if (authFlow === 'reset') {
        const result = await resetPasswordMutation.mutateAsync({
          resetToken: formData.resetToken,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        })
        if (result.status === 'success') {
          window.location.href = '/dashboard'
        }
      }
    } catch (error) {
      console.error('Auth error:', error)

      let errorMessage = ''

      if (error.response) {
        const { data } = error.response
        if (data?.message) {
          errorMessage = data.message
        } else {
          errorMessage = 'An unexpected error occurred. Please try again.'
        }
      } else if (error.request) {
        errorMessage = 'Network error. Please check your connection.'
      } else {
        errorMessage = 'An error occurred. Please try again.'
      }

      setErrors((prev) => ({ ...prev, general: errorMessage }))
    }
  }

  const goBack = () => {
    if (['signup-otp', 'verify-email-otp'].includes(authFlow)) {
      setAuthFlow(authFlow === 'signup-otp' ? 'signup' : 'verify-email')
    } else if (authFlow === 'verify-email') {
      setAuthFlow('signin')
    } else if (['otp', 'reset'].includes(authFlow)) {
      setAuthFlow('forgot')
    } else if (authFlow === 'forgot') {
      setAuthFlow('signin')
    }
    setErrors({})
  }

  const startForgotPassword = () => {
    setFormData((prev) => ({ ...prev, email: '', otp: '', resetToken: '' }))
    setAuthFlow('forgot')
    setErrors({})
  }

  // Show loading spinner if redirecting to dashboard
  if (currentUser) {
    return (
      <div className='min-h-screen bg-[#0B0B0C] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4' />
          <p className='text-[#EDEDED]'>Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  const getTitle = () => {
    switch (authFlow) {
      case 'signin':
        return 'Welcome back'
      case 'signup':
        return 'Start your journey'
      case 'signup-otp':
        return 'Verify your email'
      case 'verify-email':
        return 'Verify your account'
      case 'verify-email-otp':
        return 'Enter verification code'
      case 'forgot':
        return 'Reset your password'
      case 'otp':
        return 'Verify OTP'
      case 'reset':
        return 'Create new password'
      default:
        return 'Welcome'
    }
  }

  const getSubtitle = () => {
    switch (authFlow) {
      case 'signin':
        return 'Sign in to your account'
      case 'signup':
        return 'Create your Ascend AI account'
      case 'signup-otp':
        return `Enter the 6-digit code sent to ${formData.email}`
      case 'verify-email':
        return 'Your email needs to be verified before you can sign in'
      case 'verify-email-otp':
        return `Enter the 6-digit code sent to ${formData.email}`
      case 'forgot':
        return 'Enter your email to receive an OTP'
      case 'otp':
        return `Enter the 6-digit code sent to ${formData.email}`
      case 'reset':
        return 'Enter your new password'
      default:
        return ''
    }
  }

  return (
    <div className='min-h-screen bg-[#0B0B0C] flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='mb-4'>
            <span className='text-xl font-bold text-[#EDEDED]'>Ascend AI</span>
          </div>
          <h1 className='text-2xl font-bold text-[#EDEDED] mb-2'>
            {getTitle()}
          </h1>
          <p className='text-gray-400'>{getSubtitle()}</p>
        </div>

        <div className='bg-[#121214] rounded-xl border border-[#1E1E21] p-6'>
          {/* Back button for multi-step flows */}
          {[
            'signup-otp',
            'verify-email',
            'verify-email-otp',
            'forgot',
            'otp',
            'reset',
          ].includes(authFlow) && (
            <button
              onClick={goBack}
              className='flex items-center gap-2 text-gray-400 hover:text-[#EDEDED] transition-colors mb-4'
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}

          {/* Tab switcher for signin/signup */}
          {['signin', 'signup'].includes(authFlow) && (
            <div className='flex bg-[#0B0B0C] rounded-lg p-1 mb-6'>
              <button
                onClick={() => setAuthFlow('signin')}
                className={`flex-1 h-8 rounded-md text-sm font-medium transition-all duration-200 ${
                  authFlow === 'signin'
                    ? 'bg-[#D4AF37] text-black'
                    : 'text-gray-400 hover:text-[#EDEDED]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthFlow('signup')}
                className={`flex-1 h-8 rounded-md text-sm font-medium transition-all duration-200 ${
                  authFlow === 'signup'
                    ? 'bg-[#D4AF37] text-black'
                    : 'text-gray-400 hover:text-[#EDEDED]'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* General error message */}
          {errors.general && (
            <div className='mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
              <p className='text-red-400 text-sm'>{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className='space-y-4'
          >
            {/* Signin Form */}
            {authFlow === 'signin' && (
              <>
                <Input
                  icon={Mail}
                  type='email'
                  placeholder='Email address'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  autoFocus
                />
                <Input
                  icon={Lock}
                  type='password'
                  placeholder='Password'
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  error={errors.password}
                />
                <div className='flex justify-end'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={startForgotPassword}
                    className='text-sm'
                  >
                    Forgot password?
                  </Button>
                </div>
              </>
            )}

            {/* NEW: Email Verification Required */}
            {authFlow === 'verify-email' && (
              <>
                <div className='text-center space-y-4'>
                  <div className='w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto'>
                    <AlertTriangle className='w-8 h-8 text-orange-500' />
                  </div>
                  <p className='text-sm text-gray-400'>
                    Hi {formData.name}, your email address needs to be verified
                    before you can sign in to your account.
                  </p>
                  <div className='bg-[#0B0B0C] border border-[#1E1E21] rounded-lg p-3'>
                    <p className='text-[#EDEDED] text-sm font-medium'>
                      {formData.email}
                    </p>
                  </div>
                  <p className='text-xs text-gray-500'>
                    Click below to send a verification code to your email
                    address
                  </p>
                </div>
              </>
            )}

            {/* NEW: Email Verification OTP */}
            {authFlow === 'verify-email-otp' && (
              <>
                <div className='text-center space-y-4'>
                  <div className='w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto'>
                    <Shield className='w-8 h-8 text-[#D4AF37]' />
                  </div>
                  <p className='text-sm text-gray-400'>
                    We've sent a 6-digit verification code to your email address
                  </p>
                </div>
                <div className='space-y-4'>
                  <OTPInput
                    value={formData.otp}
                    onChange={(otp) => handleInputChange('otp', otp)}
                    error={errors.otp}
                  />
                  <div className='text-center'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, otp: '' }))
                        setAuthFlow('verify-email')
                      }}
                      className='text-sm'
                    >
                      Didn't receive the code? Try again
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Signup Form */}
            {authFlow === 'signup' && (
              <>
                <Input
                  icon={User}
                  placeholder='Full name'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  autoFocus
                />
                <Input
                  icon={Mail}
                  type='email'
                  placeholder='Email address'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                />
                <Input
                  icon={Lock}
                  type='password'
                  placeholder='Password'
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  error={errors.password}
                />
                <Input
                  icon={Lock}
                  type='password'
                  placeholder='Confirm password'
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  error={errors.confirmPassword}
                />
                <div className='space-y-1'>
                  <div className='relative'>
                    <Input
                      icon={Gift}
                      placeholder='Referral code (optional)'
                      value={formData.referralCode}
                      onChange={(e) =>
                        handleInputChange(
                          'referralCode',
                          e.target.value.toUpperCase()
                        )
                      }
                      error={errors.referralCode}
                    />
                    {formData.referralCode.trim().length >= 3 && (
                      <div className='absolute right-3 top-3 transform -translate-y-1/2'>
                        {isValidatingReferral ? (
                          <div className='w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                        ) : referralValidation?.isValid ? (
                          <CheckCircle size={16} className='text-green-500' />
                        ) : referralValidation?.isValid === false ? (
                          <XCircle size={16} className='text-red-500' />
                        ) : null}
                      </div>
                    )}
                  </div>
                  {referralValidation?.isValid &&
                    referralValidation.referrer && (
                      <div className='ml-1 mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs'>
                        <p className='text-green-400'>
                          You'll be referred by{' '}
                          <span className='font-medium'>
                            {referralValidation.referrer.name}
                          </span>
                        </p>
                      </div>
                    )}
                </div>
              </>
            )}

            {/* Signup OTP Verification Form */}
            {authFlow === 'signup-otp' && (
              <>
                <div className='text-center space-y-4'>
                  <div className='w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto'>
                    <Shield className='w-8 h-8 text-[#D4AF37]' />
                  </div>
                  <p className='text-sm text-gray-400'>
                    We've sent a 6-digit verification code to your email address
                    to complete your registration
                  </p>
                </div>
                <div className='space-y-4'>
                  <OTPInput
                    value={formData.otp}
                    onChange={(otp) => handleInputChange('otp', otp)}
                    error={errors.otp}
                  />
                  <div className='text-center'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={() => setAuthFlow('signup')}
                      className='text-sm'
                    >
                      Didn't receive the code? Try again
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Forgot Password Form */}
            {authFlow === 'forgot' && (
              <>
                <Input
                  icon={Mail}
                  type='email'
                  placeholder='Enter your email address'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  autoFocus
                />
                <div className='text-center text-sm text-gray-400'>
                  We'll send you a 6-digit code to reset your password
                </div>
              </>
            )}

            {/* Password Reset OTP Verification Form */}
            {authFlow === 'otp' && (
              <>
                <div className='text-center space-y-4'>
                  <div className='w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto'>
                    <Shield className='w-8 h-8 text-[#D4AF37]' />
                  </div>
                  <p className='text-sm text-gray-400'>
                    We've sent a 6-digit verification code to your email address
                  </p>
                </div>
                <div className='space-y-4'>
                  <OTPInput
                    value={formData.otp}
                    onChange={(otp) => handleInputChange('otp', otp)}
                    error={errors.otp}
                  />
                  <div className='text-center'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={() => setAuthFlow('forgot')}
                      className='text-sm'
                    >
                      Didn't receive the code? Try again
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Reset Password Form */}
            {authFlow === 'reset' && (
              <>
                <div className='text-center space-y-2 mb-4'>
                  <div className='w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto'>
                    <CheckCircle className='w-8 h-8 text-green-500' />
                  </div>
                  <p className='text-sm text-green-400'>
                    OTP verified successfully!
                  </p>
                </div>
                <Input
                  icon={Lock}
                  type='password'
                  placeholder='New password'
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange('password', e.target.value)
                  }
                  error={errors.password}
                  autoFocus
                />
                <Input
                  icon={Lock}
                  type='password'
                  placeholder='Confirm new password'
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  error={errors.confirmPassword}
                />
              </>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              loading={
                isLoading ||
                sendSignupOTPMutation.isPending ||
                verifySignupOTPMutation.isPending ||
                sendExistingUserOTPMutation.isPending ||
                verifyExistingUserOTPMutation.isPending ||
                forgotPasswordMutation.isPending ||
                verifyOTPMutation.isPending ||
                resetPasswordMutation.isPending
              }
              className='w-full'
              disabled={
                isLoading ||
                (authFlow === 'signup' &&
                  formData.referralCode.trim().length >= 3 &&
                  isValidatingReferral)
              }
            >
              {authFlow === 'signin' && 'Sign In'}
              {authFlow === 'signup' && 'Send Verification Code'}
              {authFlow === 'signup-otp' && 'Verify & Create Account'}
              {authFlow === 'verify-email' && 'Send Verification Code'}
              {authFlow === 'verify-email-otp' && 'Verify Email'}
              {authFlow === 'forgot' && 'Send OTP'}
              {authFlow === 'otp' && 'Verify OTP'}
              {authFlow === 'reset' && 'Reset Password'}
              <ArrowRight size={18} />
            </Button>
          </form>

          {/* Footer links */}
          {['signin', 'signup'].includes(authFlow) && (
            <div className='mt-6 text-center'>
              <span className='text-gray-400 text-sm'>
                {authFlow === 'signin'
                  ? "Don't have an account? "
                  : 'Already have an account? '}
              </span>
              <button
                onClick={() =>
                  setAuthFlow(authFlow === 'signin' ? 'signup' : 'signin')
                }
                className='text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm font-medium transition-colors'
                disabled={isLoading}
              >
                {authFlow === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          )}
        </div>

        <div className='text-center mt-6 text-xs text-gray-500'>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  )
}
