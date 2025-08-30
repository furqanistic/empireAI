// File: client/src/pages/Pricing/SubscriptionSuccess.jsx - FIXED VERSION
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../Layout/Layout'

const SubscriptionSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const hasVerified = useRef(false) // Prevent duplicate API calls

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    console.log('=== SUBSCRIPTION SUCCESS DEBUG ===')
    console.log('Current URL:', window.location.href)
    console.log('Session ID:', sessionId)
    console.log('Has already verified:', hasVerified.current)

    if (!sessionId) {
      setStatus('error')
      setMessage('No session ID found in URL')
      return
    }

    // Prevent duplicate API calls
    if (hasVerified.current) {
      console.log('Already verified, skipping...')
      return
    }

    hasVerified.current = true

    // Manual API call for verification
    const verifySession = async () => {
      try {
        console.log('Making API call to verify session...')

        const response = await fetch(
          'http://localhost:8800/api/stripe/verify-checkout-session',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ sessionId }),
          }
        )

        console.log('API Response status:', response.status)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('API Response data:', data)

        if (data.status === 'success') {
          setStatus('success')
          setMessage('Subscription verified successfully!')
          console.log('Redirecting to dashboard in 3 seconds...')
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            console.log('Navigating to dashboard...')
            navigate('/dashboard')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Verification failed')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage(`Verification failed: ${error.message}`)
      }
    }

    verifySession()
  }, [searchParams, navigate]) // Removed hasVerified from dependencies

  return (
    <Layout>
      <div className='max-w-4xl mx-auto p-6'>
        <div className='min-h-[60vh] flex items-center justify-center'>
          <div className='w-full max-w-2xl text-center'>
            {status === 'loading' && (
              <div>
                <div className='mb-6'>
                  <div className='mx-auto h-16 w-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin'></div>
                </div>
                <h1 className='text-3xl font-bold text-[#EDEDED] mb-4'>
                  Verifying Your Subscription
                </h1>
                <p className='text-gray-400 text-lg'>
                  Please wait while we confirm your payment...
                </p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <div className='mb-6'>
                  <div className='mx-auto h-16 w-16 bg-emerald-500 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-8 h-8 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                </div>
                <h1 className='text-3xl font-bold text-[#EDEDED] mb-4'>
                  Welcome to Your Empire! 🎉
                </h1>
                <p className='text-gray-400 text-lg mb-8'>{message}</p>

                {/* Success details */}
                <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 mb-8 max-w-md mx-auto'>
                  <h3 className='text-[#D4AF37] font-semibold mb-4'>
                    Your 14-Day Trial Started!
                  </h3>
                  <div className='space-y-3 text-left'>
                    <div className='flex items-center gap-3'>
                      <div className='w-2 h-2 bg-emerald-500 rounded-full'></div>
                      <span className='text-[#EDEDED] text-sm'>
                        Full access to all premium features
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='w-2 h-2 bg-emerald-500 rounded-full'></div>
                      <span className='text-[#EDEDED] text-sm'>
                        Start building your affiliate empire
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='w-2 h-2 bg-emerald-500 rounded-full'></div>
                      <span className='text-[#EDEDED] text-sm'>
                        No charges for 14 days
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dashboard')}
                  className='bg-[#D4AF37] text-black px-8 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 mb-4'
                >
                  Enter Your Dashboard
                </button>
                <p className='text-gray-500 text-sm'>
                  Redirecting automatically in a few seconds...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div>
                <div className='mb-6'>
                  <div className='mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-8 h-8 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M6 18L18 6M6 6l12 12'
                      />
                    </svg>
                  </div>
                </div>
                <h1 className='text-3xl font-bold text-[#EDEDED] mb-4'>
                  Verification Failed
                </h1>
                <p className='text-gray-400 text-lg mb-8'>{message}</p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <button
                    onClick={() => window.location.reload()}
                    className='bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300'
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/pricing')}
                    className='bg-[#1E1E21] text-[#EDEDED] px-6 py-3 rounded-xl font-semibold hover:bg-[#2A2A2D] transition-all duration-300 border border-[#1E1E21]'
                  >
                    Back to Pricing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SubscriptionSuccess
