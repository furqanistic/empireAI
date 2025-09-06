// File: client/src/pages/Product/ProductSuccessPage.jsx - FIXED SUCCESS PAGE

import { Check, Download, FileText, Mail, Package } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useDigitalProducts } from '@/hooks/useDigitalProduct'
import Layout from '../Layout/Layout'

const ProductSuccessPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const productSlug = searchParams.get('product')

  const [purchaseData, setPurchaseData] = useState(null)
  const [verificationComplete, setVerificationComplete] = useState(false)

  const {
    verifyPayment,
    verifying,
    error,
    downloadPurchasedFile,
    downloading,
  } = useDigitalProducts()

  useEffect(() => {
    console.log('=== SUCCESS PAGE DEBUG ===')
    console.log('Session ID:', sessionId)
    console.log('Product Slug:', productSlug)
    console.log('Full URL:', window.location.href)

    if (sessionId && !verificationComplete) {
      handlePaymentVerification()
    } else if (!sessionId) {
      console.error('No session ID found in URL')
    }
  }, [sessionId, verificationComplete])

  const handlePaymentVerification = async () => {
    try {
      console.log('Starting payment verification for session:', sessionId)

      const result = await verifyPayment(sessionId)

      console.log('Payment verification result:', result)

      setPurchaseData(result)
      setVerificationComplete(true)
    } catch (error) {
      console.error('Error verifying payment:', error)
      console.error('Error details:', error.response?.data)
    }
  }

  const handleFileDownload = async (fileId, filename) => {
    try {
      console.log('Downloading file:', { fileId, filename })

      // Use the product ID from purchaseData or fallback to productSlug
      const productIdentifier = purchaseData?.product?._id || productSlug

      await downloadPurchasedFile(
        productIdentifier,
        fileId,
        filename,
        purchaseData?.downloadToken,
        purchaseData?.purchase?.email
      )
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Failed to download file. Please try again or contact support.')
    }
  }

  const FileIcon = ({ type }) => {
    switch (type) {
      case 'pdf':
        return <FileText size={16} className='text-red-400' />
      case 'zip':
        return <Package size={16} className='text-purple-400' />
      case 'docx':
      case 'doc':
        return <FileText size={16} className='text-blue-400' />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileText size={16} className='text-green-400' />
      case 'mp3':
      case 'wav':
        return <FileText size={16} className='text-pink-400' />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileText size={16} className='text-orange-400' />
      default:
        return <FileText size={16} className='text-gray-400' />
    }
  }

  // Loading state
  if (verifying || !verificationComplete) {
    return (
      <Layout>
        <div className='max-w-2xl mx-auto p-4 sm:p-6'>
          <div className='text-center space-y-6'>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-2xl p-8'>
              <div className='w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6'>
                <div className='w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin'></div>
              </div>
              <h1 className='text-2xl font-bold text-[#EDEDED] mb-3'>
                Verifying Payment...
              </h1>
              <p className='text-gray-400'>
                Please wait while we confirm your purchase.
              </p>
              {/* Debug info */}
              <div className='mt-4 text-xs text-gray-500'>
                <div>Session ID: {sessionId}</div>
                <div>Product: {productSlug}</div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Error state
  if (error || !purchaseData) {
    return (
      <Layout>
        <div className='max-w-2xl mx-auto p-4 sm:p-6'>
          <div className='text-center space-y-6'>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-2xl p-8'>
              <div className='w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6'>
                <span className='text-red-400 text-2xl'>⚠️</span>
              </div>
              <h1 className='text-2xl font-bold text-[#EDEDED] mb-3'>
                Payment Verification Failed
              </h1>
              <p className='text-gray-400 mb-6'>
                {error ||
                  'Unable to verify your payment. Please contact support.'}
              </p>
              {/* Debug info */}
              <div className='bg-gray-800 rounded p-4 mb-6 text-left'>
                <p className='text-gray-300 text-sm mb-2'>Debug Information:</p>
                <div className='text-gray-400 text-xs space-y-1'>
                  <div>Session ID: {sessionId}</div>
                  <div>Product: {productSlug}</div>
                  <div>
                    Verification Complete: {verificationComplete.toString()}
                  </div>
                  <div>Has Purchase Data: {purchaseData ? 'Yes' : 'No'}</div>
                  <div>Error: {error || 'No specific error'}</div>
                </div>
              </div>
              <div className='flex gap-4 justify-center'>
                <button
                  onClick={() => navigate('/products')}
                  className='bg-[#1A1A1C] border border-[#1E1E21] text-[#EDEDED] px-6 py-2 rounded-lg font-medium hover:border-[#D4AF37]/40 transition-all duration-300'
                >
                  Browse Products
                </button>
                <button
                  onClick={() =>
                    (window.location.href = 'mailto:support@yourcompany.com')
                  }
                  className='bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300'
                >
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Success state
  return (
    <Layout>
      <div className='max-w-2xl mx-auto p-4 sm:p-6'>
        <div className='text-center space-y-6'>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-2xl p-6 sm:p-8'>
            <div className='w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6'>
              <Check size={32} className='text-black' />
            </div>

            <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-3'>
              Payment Successful!
            </h1>
            <p className='text-gray-400 mb-8'>
              Thank you for your purchase of "
              {purchaseData.product?.name || 'Digital Product'}". You now have
              instant access to all files.
            </p>

            {/* Purchase Details */}
            <div className='bg-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4 sm:p-6 text-left mb-6'>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-semibold text-[#EDEDED]'>
                  Purchase Details
                </h3>
                <span className='text-[#D4AF37] font-bold'>
                  ${purchaseData.purchase?.amount || 'N/A'}
                </span>
              </div>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Customer:</span>
                  <span className='text-[#EDEDED]'>
                    {purchaseData.purchase?.name || 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Email:</span>
                  <span className='text-[#EDEDED]'>
                    {purchaseData.purchase?.email || 'N/A'}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-400'>Purchase Date:</span>
                  <span className='text-[#EDEDED]'>
                    {purchaseData.purchase?.purchasedAt
                      ? new Date(
                          purchaseData.purchase.purchasedAt
                        ).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Download Files */}
            <div className='bg-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4 sm:p-6 text-left'>
              <h3 className='text-lg font-semibold text-[#EDEDED] mb-4'>
                Download Your Files
              </h3>

              {purchaseData.product?.files &&
              purchaseData.product.files.length > 0 ? (
                <div className='space-y-3'>
                  {purchaseData.product.files.map((file, index) => (
                    <div
                      key={file._id || index}
                      className='flex items-center justify-between bg-[#121214] border border-[#1E1E21] rounded-lg p-3'
                    >
                      <div className='flex items-center gap-3'>
                        <FileIcon type={file.type} />
                        <div className='min-w-0'>
                          <div className='text-[#EDEDED] text-sm font-medium truncate'>
                            {file.originalName || file.name}
                          </div>
                          <div className='text-gray-400 text-xs'>
                            {file.size}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handleFileDownload(
                            file._id,
                            file.originalName || file.name
                          )
                        }
                        disabled={downloading}
                        className='bg-[#D4AF37] text-black px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center gap-2 flex-shrink-0 disabled:opacity-50'
                      >
                        <Download size={14} />
                        <span className='hidden sm:inline'>
                          {downloading ? 'Downloading...' : 'Download'}
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-gray-400 text-sm text-center py-4'>
                  No files available for download
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ProductSuccessPage
