import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import React, { useState } from 'react'

const Input = ({
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
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
            error ? 'border-red-500' : 'border-[#1E1E21]'
          } hover:border-[#D4AF37]/30`}
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
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: 'test@test.com',
    password: 'testing123',
    confirmPassword: '',
    name: '',
  })
  const [errors, setErrors] = useState({})

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
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
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (isLogin) {
        window.location.href = '/'
      }
    }, 1000)
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    if (!isLogin) {
      // Switching to login mode
      setFormData({
        email: 'test@test.com',
        password: 'testing123',
        confirmPassword: '',
        name: '',
      })
    } else {
      // Switching to signup mode
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
      })
    }
    setErrors({})
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

          <div className='space-y-4'>
            {!isLogin && (
              <Input
                icon={User}
                placeholder='Full name'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
              />
            )}

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
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
            />

            {!isLogin && (
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

            <Button onClick={handleSubmit} loading={loading} className='w-full'>
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight size={18} />
            </Button>
          </div>

          <div className='mt-6 text-center'>
            <span className='text-gray-400 text-sm'>
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
            </span>
            <button
              onClick={toggleMode}
              className='text-[#D4AF37] hover:text-[#D4AF37]/80 text-sm font-medium transition-colors'
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
