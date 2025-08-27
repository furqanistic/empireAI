// File: client/src/pages/Auth/AuthPage.jsx
import {
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Gift,
  Lock,
  Mail,
  User,
  XCircle,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  useAuthLoading,
  useCurrentUser,
  useSignin,
  useSignup,
  useValidateReferralCode,
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
    'h-8 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 active:scale-[0.98]',
    secondary:
      'bg-[#121214] border border-[#1E1E21] text-[#EDEDED] hover:border-[#D4AF37]/30 hover:bg-[#1E1E21]/30',
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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    referralCode: '',
  })
  const [errors, setErrors] = useState({})
  const [referralValidation, setReferralValidation] = useState(null)

  // Redux state
  const currentUser = useCurrentUser()
  const isLoading = useSelector(selectIsLoading)
  const authError = useSelector((state) => state.user.error)

  // React Query hooks
  const signupMutation = useSignup()
  const signinMutation = useSignin()

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
      setIsLogin(false)
    }
  }, [])

  // Referral code validation
  const {
    data: referralValidationData,
    isLoading: isValidatingReferral,
    error: referralValidationError,
  } = useValidateReferralCode(
    formData.referralCode.trim(),
    !isLogin && formData.referralCode.trim().length >= 3
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
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid'

    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters'

    if (!isLogin) {
      if (!formData.name) newErrors.name = 'Name is required'
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    // Clear any previous errors
    setErrors({})

    try {
      if (isLogin) {
        const result = await signinMutation.mutateAsync({
          email: formData.email.trim(),
          password: formData.password,
        })

        if (result.status === 'success') {
          window.location.href = '/dashboard'
        }
      } else {
        const signupData = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }

        // Only include referral code if valid
        if (formData.referralCode.trim() && referralValidation?.isValid) {
          signupData.referralCode = formData.referralCode.trim()
        }

        const result = await signupMutation.mutateAsync(signupData)

        if (result.status === 'success') {
          window.location.href = '/dashboard'
        }
      }
    } catch (error) {
      console.error('Auth error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
      })

      let errorMessage = ''

      // ✅ Handle error response from backend
      if (error.response) {
        const { status, data } = error.response

        // Use backend's message if available
        if (data?.message) {
          errorMessage = data.message
        } else {
          // Fallback based on status
          switch (status) {
            case 400:
              errorMessage = 'Please check your input and try again.'
              break
            case 401:
              errorMessage = 'Incorrect email or password'
              break
            case 409:
              errorMessage = 'An account with this email already exists.'
              break
            case 500:
              errorMessage = 'Server error. Please try again later.'
              break
            default:
              errorMessage = 'An unexpected error occurred.'
          }
        }
      } else if (error.request) {
        // Network error (no response)
        errorMessage = 'Network error. Please check your connection.'
      } else {
        // Something else happened
        errorMessage = 'An error occurred. Please try again.'
      }

      // Show user-friendly error
      setErrors((prev) => ({ ...prev, general: errorMessage }))
    }
  }

  const toggleMode = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')

    setIsLogin(!isLogin)

    if (!isLogin) {
      // Switching to login mode
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        referralCode: refCode ? refCode.trim().toUpperCase() : '',
      })
    } else {
      // Switching to signup mode
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        referralCode: refCode ? refCode.trim().toUpperCase() : '',
      })
    }

    setErrors({})
    setReferralValidation(null)
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

  return (
    <div className='min-h-screen bg-[#0B0B0C] flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='mb-4'>
            <span className='text-xl font-bold text-[#EDEDED]'>Ascend AI</span>
          </div>
          <h1 className='text-2xl font-bold text-[#EDEDED] mb-2'>
            {isLogin ? 'Welcome back' : 'Start your journey'}
          </h1>
          <p className='text-gray-400'>
            {isLogin
              ? 'Sign in to your account'
              : 'Create your Ascend AI account'}
          </p>
        </div>

        <div className='bg-[#121214] rounded-xl border border-[#1E1E21] p-6'>
          <div className='flex bg-[#0B0B0C] rounded-lg p-1 mb-6'>
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 h-8 rounded-md text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-gray-400 hover:text-[#EDEDED]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 h-8 rounded-md text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-[#D4AF37] text-black'
                  : 'text-gray-400 hover:text-[#EDEDED]'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* General error message */}
          {errors.general && (
            <div className='mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg'>
              <p className='text-red-400 text-sm'>{errors.general}</p>
            </div>
          )}

          {/* 🔥 Form now supports Enter key submission */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSubmit()
            }}
            className='space-y-4'
          >
            {!isLogin && (
              <Input
                icon={User}
                placeholder='Full name'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                autoFocus
              />
            )}

            <Input
              icon={Mail}
              type='email'
              placeholder='Email address'
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              autoFocus={isLogin && !formData.email}
            />

            <Input
              icon={Lock}
              type='password'
              placeholder='Password'
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
            />

            {!isLogin && (
              <>
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

                    {/* Referral validation indicator */}
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

                  {/* Referral validation message */}
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

            {isLogin && (
              <div className='flex justify-end'>
                <button
                  type='button'
                  className='text-sm text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors'
                >
                  Forgot password?
                </button>
              </div>
            )}

            <Button
              type='submit' // ✅ Critical for form submission
              onClick={handleSubmit}
              loading={isLoading}
              className='w-full'
              disabled={
                isLoading ||
                (formData.referralCode.trim().length >= 3 &&
                  isValidatingReferral)
              }
            >
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </Button>
          </form>

          <div className='mt-6 text-center'>
            <span className='text-gray-400 text-sm'>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
            </span>
            <button
              onClick={toggleMode}
              className='text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm font-medium transition-colors'
              disabled={isLoading}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <div className='text-center mt-6 text-xs text-gray-500'>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  )
}
