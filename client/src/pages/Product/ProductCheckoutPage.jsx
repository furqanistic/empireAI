// File: client/src/pages/Product/ProductCheckoutPage.jsx - WITH DEBUG LOGGING

import { Lock, Package, ShieldCheck } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'

import { useDigitalProducts } from '@/hooks/useDigitalProduct'

const ProductCheckoutPage = () => {
  const navigate = useNavigate()
  const { id } = useParams() // This is the MongoDB ID from the URL
  const [loading, setLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState(null)

  const {
    publicProduct,
    publicProductLoading,
    fetchPublicProduct,
    redirectToCheckout,
    checkoutLoading,
  } = useDigitalProducts()

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
    },
    mode: 'onChange',
  })

  // Fetch product data
  useEffect(() => {
    console.log('=== CHECKOUT PAGE DEBUG ===')
    console.log('URL params:', { id })
    console.log('Current URL:', window.location.href)

    if (id) {
      console.log('Fetching product with ID:', id)
      console.log('ID type:', typeof id)
      console.log('ID length:', id.length)
      console.log('Is valid MongoDB ID format:', /^[0-9a-fA-F]{24}$/.test(id))
      fetchPublicProduct(id)
    } else {
      console.error('No ID found in URL params')
      setCheckoutError('No product ID provided in URL')
    }
  }, [id, fetchPublicProduct])

  const onSubmit = async (data) => {
    try {
      setLoading(true)
      setCheckoutError(null)

      console.log('=== CHECKOUT SUBMISSION DEBUG ===')
      console.log('Product ID for checkout:', id)
      console.log('Customer data:', data)

      await redirectToCheckout(id, {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
      })
    } catch (error) {
      console.error('=== CHECKOUT ERROR DEBUG ===')
      console.error('Full error object:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)

      let errorMessage = 'Failed to process checkout. Please try again.'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      setCheckoutError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Debug: Log product loading state
  useEffect(() => {
    console.log('=== PRODUCT LOADING DEBUG ===')
    console.log('publicProductLoading:', publicProductLoading)
    console.log('publicProduct:', publicProduct)
  }, [publicProductLoading, publicProduct])

  // Loading state
  if (publicProductLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-[#0A0A0C] to-[#121214] flex items-center justify-center'>
        <div className='text-center'>
          <div className='w-16 h-16 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4'></div>
          <p className='text-gray-400'>Loading product...</p>
          <p className='text-gray-500 text-sm mt-2'>ID: {id}</p>
        </div>
      </div>
    )
  }

  // Product not found
  if (!publicProductLoading && !publicProduct) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-[#0A0A0C] to-[#121214] flex items-center justify-center'>
        <div className='text-center'>
          <Package size={64} className='mx-auto text-gray-400 mb-4' />
          <h1 className='text-2xl font-bold text-[#EDEDED] mb-2'>
            Product Not Found
          </h1>
          <p className='text-gray-400 mb-6'>
            This product is not available or has been removed.
          </p>
          <div className='bg-gray-800 rounded p-4 mb-4 text-left'>
            <p className='text-gray-300 text-sm'>Debug Info:</p>
            <p className='text-gray-400 text-xs'>ID from URL: {id}</p>
            <p className='text-gray-400 text-xs'>
              Loading: {publicProductLoading.toString()}
            </p>
            <p className='text-gray-400 text-xs'>
              Product: {publicProduct ? 'Found' : 'Not found'}
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className='bg-[#D4AF37] text-black px-6 py-2 rounded-xl font-medium hover:bg-[#D4AF37]/90 transition-all duration-300'
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0A0A0C] to-[#121214]'>
      <div className='max-w-4xl mx-auto px-4 py-8 sm:py-12'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl sm:text-4xl font-bold text-[#EDEDED] mb-3'>
            Complete Your Purchase
          </h1>
          <p className='text-gray-400'>
            Enter your information to access your digital product
          </p>
        </div>

        {/* Error Display */}
        {checkoutError && (
          <div className='mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4'>
            <p className='text-red-400 text-sm'>{checkoutError}</p>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
          {/* Product Summary */}
          <div className='order-2 lg:order-1'>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
              <h2 className='text-xl font-semibold text-[#EDEDED] mb-4'>
                Order Summary
              </h2>

              <div className='space-y-4'>
                <div className='flex items-start gap-4'>
                  <div className='w-12 h-12 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center flex-shrink-0'>
                    <Package size={24} className='text-[#D4AF37]' />
                  </div>
                  <div className='flex-1'>
                    <h3 className='text-lg font-medium text-[#EDEDED] mb-1'>
                      {publicProduct?.name}
                    </h3>
                    <p className='text-gray-400 text-sm mb-2 line-clamp-2'>
                      {publicProduct?.description}
                    </p>
                    <div className='flex items-center gap-4 text-sm'>
                      <span className='text-gray-400'>
                        Category:{' '}
                        <span className='text-[#EDEDED]'>
                          {publicProduct?.category}
                        </span>
                      </span>
                      {publicProduct?.files && (
                        <span className='text-gray-400'>
                          Files:{' '}
                          <span className='text-[#EDEDED]'>
                            {publicProduct.files.length}
                          </span>
                        </span>
                      )}
                    </div>
                    {/* Debug info - remove in production */}
                    <div className='text-xs text-gray-500 mt-2 space-y-1'>
                      <div>Product ID: {publicProduct?._id}</div>
                      <div>URL ID: {id}</div>
                      <div>
                        Match: {publicProduct?._id === id ? 'Yes' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className='border-t border-[#1E1E21] pt-4'>
                  <div className='flex items-center justify-between mb-4'>
                    <span className='text-lg text-gray-400'>Total:</span>
                    <span className='text-2xl font-bold text-[#D4AF37]'>
                      ${publicProduct?.price}
                    </span>
                  </div>

                  {/* Trust badges */}
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm text-gray-400'>
                      <ShieldCheck size={16} className='text-green-500' />
                      <span>Secure checkout powered by Stripe</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-400'>
                      <Lock size={16} className='text-green-500' />
                      <span>Your payment information is safe</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What you'll get */}
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 mt-4'>
              <h3 className='text-lg font-semibold text-[#EDEDED] mb-3'>
                What You'll Get
              </h3>
              <ul className='space-y-2'>
                <li className='flex items-start gap-2 text-gray-300'>
                  <span className='text-[#D4AF37] mt-1'>✓</span>
                  <span>Instant access to all product files after payment</span>
                </li>
                <li className='flex items-start gap-2 text-gray-300'>
                  <span className='text-[#D4AF37] mt-1'>✓</span>
                  <span>Download links sent to your email</span>
                </li>
                <li className='flex items-start gap-2 text-gray-300'>
                  <span className='text-[#D4AF37] mt-1'>✓</span>
                  <span>Lifetime access to your purchased content</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Form */}
          <div className='order-1 lg:order-2'>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6'>
              <h2 className='text-xl font-semibold text-[#EDEDED] mb-4'>
                Customer Information
              </h2>

              <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      First Name *
                    </label>
                    <input
                      type='text'
                      {...register('firstName', {
                        required: 'First name is required',
                        minLength: {
                          value: 2,
                          message: 'First name must be at least 2 characters',
                        },
                      })}
                      className={`w-full bg-[#1A1A1C] border rounded-xl px-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                        errors.firstName
                          ? 'border-red-500'
                          : 'border-[#1E1E21] focus:border-[#D4AF37]/40'
                      }`}
                      placeholder='John'
                    />
                    {errors.firstName && (
                      <p className='text-red-400 text-xs mt-1'>
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-300 mb-2'>
                      Last Name *
                    </label>
                    <input
                      type='text'
                      {...register('lastName', {
                        required: 'Last name is required',
                        minLength: {
                          value: 2,
                          message: 'Last name must be at least 2 characters',
                        },
                      })}
                      className={`w-full bg-[#1A1A1C] border rounded-xl px-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                        errors.lastName
                          ? 'border-red-500'
                          : 'border-[#1E1E21] focus:border-[#D4AF37]/40'
                      }`}
                      placeholder='Doe'
                    />
                    {errors.lastName && (
                      <p className='text-red-400 text-xs mt-1'>
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-300 mb-2'>
                    Email Address *
                  </label>
                  <input
                    type='email'
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    className={`w-full bg-[#1A1A1C] border rounded-xl px-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none transition-all duration-300 ${
                      errors.email
                        ? 'border-red-500'
                        : 'border-[#1E1E21] focus:border-[#D4AF37]/40'
                    }`}
                    placeholder='john@example.com'
                  />
                  {errors.email && (
                    <p className='text-red-400 text-xs mt-1'>
                      {errors.email.message}
                    </p>
                  )}
                  <p className='text-gray-500 text-xs mt-2'>
                    We'll send your download links to this email
                  </p>
                </div>

                <div className='pt-4'>
                  <button
                    type='submit'
                    disabled={loading || checkoutLoading || !isValid}
                    className='w-full bg-[#D4AF37] text-black h-12 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2'
                  >
                    {loading || checkoutLoading ? (
                      <>
                        <div className='w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin'></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        Pay ${publicProduct?.price}
                      </>
                    )}
                  </button>

                  <p className='text-center text-gray-500 text-xs mt-3'>
                    By completing your purchase, you agree to our terms of
                    service
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductCheckoutPage
