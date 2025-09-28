// File: client/src/pages/Pricing/SubscriptionSuccess.jsx - ENHANCED WITH DEBUGGING
import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../Layout/Layout'

const SubscriptionSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [debugInfo, setDebugInfo] = useState({})
  const hasVerified = useRef(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')

    console.log('=== FRONTEND SUBSCRIPTION SUCCESS DEBUG ===')
    console.log('Current URL:', window.location.href)
    console.log('Session ID:', sessionId)
    console.log('Has already verified:', hasVerified.current)
    console.log('Environment:', process.env.NODE_ENV)
    console.log(
      'API Base URL:',
      process.env.REACT_APP_API_URL || 'http://localhost:8800'
    )

    if (!sessionId) {
      console.error('❌ No session ID found in URL')
      setStatus('error')
      setMessage(
        'No session ID found in URL. Please try the payment process again.'
      )
      setDebugInfo({ error: 'Missing session ID', url: window.location.href })
      return
    }

    if (hasVerified.current) {
      console.log('Already verified, skipping...')
      return
    }

    hasVerified.current = true

    const verifySession = async () => {
      const startTime = Date.now()

      try {
        console.log('🚀 Starting payment verification...')
        console.log('Request timestamp:', new Date().toISOString())

        // Determine API URL based on environment
        const apiUrl =
          process.env.REACT_APP_API_URL ||
          (window.location.hostname === 'ascndlabs.com'
            ? 'https://api.ascndlabs.com'
            : 'http://localhost:8800')

        console.log('API URL:', apiUrl)

        const requestBody = { sessionId }
        console.log('Request body:', requestBody)

        const response = await fetch(
          `${apiUrl}/api/stripe/verify-checkout-session`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(requestBody),
          }
        )

        const responseTime = Date.now() - startTime
        console.log(`⏱️ API Response time: ${responseTime}ms`)
        console.log('Response status:', response.status)
        console.log(
          'Response headers:',
          Object.fromEntries(response.headers.entries())
        )

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ HTTP Error Response:', errorText)

          let errorData
          try {
            errorData = JSON.parse(errorText)
          } catch {
            errorData = { message: errorText }
          }

          throw new Error(
            `HTTP ${response.status}: ${
              errorData.message || 'Payment verification failed'
            }`
          )
        }

        const data = await response.json()
        console.log('✅ API Response data:', data)

        const debugInfo = {
          sessionId,
          responseTime: `${responseTime}ms`,
          status: response.status,
          timestamp: new Date().toISOString(),
          apiUrl,
        }

        if (data.status === 'success') {
          console.log('🎉 Payment verification successful!')

          setStatus('success')
          setMessage('Subscription verified successfully!')
          setDebugInfo({
            ...debugInfo,
            subscription: data.data?.subscription,
            user: data.data?.subscription?.user,
          })

          // Redirect after delay
          console.log('⏰ Setting redirect timer...')
          setTimeout(() => {
            console.log('🔄 Redirecting to dashboard...')
            navigate('/dashboard')
          }, 3000)
        } else {
          console.error('❌ Verification failed - unexpected response status')
          setStatus('error')
          setMessage(data.message || 'Payment verification failed')
          setDebugInfo({ ...debugInfo, response: data })
        }
      } catch (error) {
        const responseTime = Date.now() - startTime
        console.error('❌ Payment verification error:', error)
        console.error('Error name:', error.name)
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)

        setStatus('error')

        let errorMessage = 'Payment verification failed'
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          errorMessage =
            'Network error - please check your connection and try again'
        } else if (error.message.includes('404')) {
          errorMessage =
            'Verification endpoint not found - please contact support'
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication failed - please sign in and try again'
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error - please try again or contact support'
        } else {
          errorMessage = error.message
        }

        setMessage(errorMessage)
        setDebugInfo({
          sessionId,
          error: error.message,
          errorType: error.name,
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        })
      }
    }

    verifySession()
  }, [searchParams, navigate])

  // Function to copy debug info for support
  const copyDebugInfo = () => {
    const debugText = JSON.stringify(debugInfo, null, 2)
    navigator.clipboard
      .writeText(debugText)
      .then(() => {
        alert('Debug information copied to clipboard')
      })
      .catch(() => {
        console.log('Debug info:', debugInfo)
        alert('Debug information logged to console')
      })
  }

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
                  Verifying Your Payment
                </h1>
                <p className='text-gray-400 text-lg mb-4'>
                  Please wait while we confirm your subscription...
                </p>
                <div className='text-xs text-gray-500'>
                  Session ID: {searchParams.get('session_id')?.substring(0, 20)}
                  ...
                </div>
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
                  Payment Verified Successfully! 🎉
                </h1>
                <p className='text-gray-400 text-lg mb-8'>{message}</p>

                <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 mb-8 max-w-md mx-auto'>
                  <h3 className='text-[#D4AF37] font-semibold mb-4'>
                    Your Subscription is Active!
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
                        Access to all AI tools and templates
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
                  Payment Verification Issue
                </h1>
                <p className='text-red-400 text-lg mb-6'>{message}</p>

                {/* Enhanced error information */}
                <div className='bg-red-900/20 border border-red-500/30 rounded-xl p-6 mb-6 text-left'>
                  <h3 className='text-red-400 font-semibold mb-3 text-center'>
                    Don't worry - Your payment was successful!
                  </h3>
                  <div className='text-sm text-gray-300 space-y-2'>
                    <p>• Your payment has been processed by Stripe</p>
                    <p>
                      • We're experiencing a technical issue with verification
                    </p>
                    <p>
                      • Our team will activate your account manually within 1
                      hour
                    </p>
                    <p>• You'll receive an email confirmation once activated</p>
                  </div>
                </div>

                <div className='flex flex-col sm:flex-row gap-4 justify-center mb-6'>
                  <button
                    onClick={() => window.location.reload()}
                    className='bg-[#D4AF37] text-black px-6 py-3 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300'
                  >
                    Try Verification Again
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className='bg-[#1E1E21] text-[#EDEDED] px-6 py-3 rounded-xl font-semibold hover:bg-[#2A2A2D] transition-all duration-300 border border-[#1E1E21]'
                  >
                    Go to Dashboard
                  </button>
                </div>

                {/* Debug information for support */}
                <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 text-left'>
                  <div className='flex items-center justify-between mb-3'>
                    <h4 className='text-gray-400 text-sm font-medium'>
                      Debug Information (for support)
                    </h4>
                    <button
                      onClick={copyDebugInfo}
                      className='text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded'
                    >
                      Copy
                    </button>
                  </div>
                  <div className='text-xs text-gray-500 font-mono overflow-x-auto'>
                    <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                </div>

                <p className='text-gray-500 text-sm mt-4'>
                  If the issue persists, please contact our support team with
                  the debug information above.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default SubscriptionSuccess
