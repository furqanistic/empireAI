// File: client/src/components/AIBuilder/ProductHistory.jsx
import { useProductHistory } from '@/hooks/useProducts'
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'

const ProductHistory = ({ onLoadProduct, currentProductId }) => {
  const [currentPage, setCurrentPage] = useState(1)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [loadingProductId, setLoadingProductId] = useState(null) // Track loading state per product
  const { token } = useSelector((state) => state.user)

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useProductHistory(
    { page: currentPage, limit: 8 },
    !!token // Only fetch if authenticated
  )

  if (!token) return null

  const generations = historyData?.data?.generations || []
  const totalPages = historyData?.totalPages || 1
  const hasHistory = generations.length > 0

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className='text-green-400' />
      case 'pending':
        return <Clock size={16} className='text-yellow-400' />
      case 'failed':
        return <XCircle size={16} className='text-red-400' />
      default:
        return <Clock size={16} className='text-gray-400' />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400'
      case 'pending':
        return 'text-yellow-400'
      case 'failed':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const handleLoadProduct = async (generation) => {
    if (generation.status !== 'completed' || !generation.generatedProduct)
      return

    setLoadingProductId(generation._id)
    try {
      // Simulate small delay for UX (optional, remove if instant)
      await new Promise((resolve) => setTimeout(resolve, 300))

      onLoadProduct({
        id: generation._id,
        product: generation.generatedProduct,
        metadata: {
          productType: generation.productType,
          niche: generation.niche,
          audience: generation.audience,
          priceRange: generation.priceRange,
          complexity: generation.complexity,
          createdAt: generation.createdAt,
        },
      })
    } finally {
      setLoadingProductId(null) // Always stop loading
    }
  }

  return (
    <div className='w-full max-w-7xl mx-auto mb-8'>
      <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6'>
        {/* Collapsible Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className='flex items-center justify-between w-full mb-4 text-left'
        >
          <div className='flex items-center gap-2'>
            <FileText size={20} className='text-[#D4AF37]' />
            <h3 className='text-lg font-semibold text-[#EDEDED]'>
              Previous History
            </h3>
            <span className='text-sm text-gray-400'>
              ({historyData?.totalResults || 0} total)
            </span>
          </div>

          {isCollapsed ? (
            <ChevronDown size={20} className='text-gray-400' />
          ) : (
            <ChevronUp size={20} className='text-gray-400' />
          )}
        </button>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className='flex items-center justify-center py-8'>
                <RefreshCw
                  size={20}
                  className='animate-spin text-[#D4AF37] mr-2'
                />
                <span className='text-gray-400'>
                  Loading your product history...
                </span>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className='flex items-center justify-center py-4'>
                <XCircle size={20} className='text-red-400 mr-2' />
                <span className='text-red-400 mr-2'>
                  Failed to load history
                </span>
                <button
                  onClick={() => refetch()}
                  className='text-[#D4AF37] hover:underline text-sm'
                >
                  Try again
                </button>
              </div>
            )}

            {/* No History */}
            {!isLoading && !error && !hasHistory && (
              <div className='text-center py-4'>
                <FileText size={24} className='text-gray-400 mx-auto mb-2' />
                <p className='text-gray-400'>
                  No product history yet. Generate your first product below!
                </p>
              </div>
            )}

            {/* History Grid */}
            {!isLoading && !error && hasHistory && (
              <>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                  {generations.map((generation) => {
                    const isCurrentProduct = currentProductId === generation._id
                    const canLoad =
                      generation.status === 'completed' &&
                      generation.generatedProduct
                    const isLoadingProduct = loadingProductId === generation._id

                    return (
                      <button
                        key={generation._id}
                        onClick={() => canLoad && handleLoadProduct(generation)}
                        disabled={!canLoad || isLoadingProduct}
                        className={`p-4 rounded-lg border transition-all duration-200 text-left group relative ${
                          isCurrentProduct
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                            : canLoad
                            ? 'border-[#1E1E21] bg-gradient-to-br from-[#1A1A1C] to-[#0F0F11] hover:border-[#D4AF37]/30 hover:scale-105'
                            : 'border-[#1E1E21] bg-gradient-to-br from-[#1A1A1C] to-[#0F0F11] opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {/* Current indicator */}
                        {isCurrentProduct && (
                          <div className='absolute -top-2 -right-2 bg-[#D4AF37] text-black text-xs px-2 py-1 rounded-full font-bold'>
                            Current
                          </div>
                        )}

                        {/* Loading Overlay */}
                        {isLoadingProduct && (
                          <div className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg z-10'>
                            <Loader2
                              size={20}
                              className='animate-spin text-[#D4AF37]'
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div
                          className={
                            isLoadingProduct ? 'opacity-50' : 'opacity-100'
                          }
                        >
                          <div className='space-y-3'>
                            {/* Title */}
                            <h4
                              className={`font-medium line-clamp-2 ${
                                isCurrentProduct
                                  ? 'text-[#D4AF37]'
                                  : 'text-[#EDEDED]'
                              }`}
                            >
                              {generation.generatedProduct?.title ||
                                'Untitled Product'}
                            </h4>

                            {/* Metadata */}
                            <div className='space-y-2'>
                              {/* Product Type & Niche */}
                              <div className='flex items-center gap-2 text-xs'>
                                <span className='px-2 py-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full'>
                                  {generation.productType}
                                </span>
                                <span className='text-gray-400 truncate'>
                                  {generation.niche}
                                </span>
                              </div>

                              {/* Date & Status */}
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-1 text-xs text-gray-400'>
                                  <Calendar size={12} />
                                  {formatDate(generation.createdAt)}
                                </div>

                                <div
                                  className={`flex items-center gap-1 text-xs ${getStatusColor(
                                    generation.status
                                  )}`}
                                >
                                  {getStatusIcon(generation.status)}
                                  {generation.status}
                                </div>
                              </div>
                            </div>

                            {/* Action hint */}
                            {canLoad &&
                              !isCurrentProduct &&
                              !isLoadingProduct && (
                                <div className='text-xs text-gray-400 group-hover:text-[#D4AF37] transition-colors'>
                                  Click to load
                                </div>
                              )}

                            {!canLoad && generation.status === 'pending' && (
                              <div className='text-xs text-yellow-400'>
                                Still generating...
                              </div>
                            )}

                            {!canLoad && generation.status === 'failed' && (
                              <div className='text-xs text-red-400'>
                                Generation failed
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className='flex items-center justify-between mt-6'>
                    <p className='text-xs text-gray-400'>
                      Showing {generations.length} of{' '}
                      {historyData?.totalResults} products
                    </p>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className='p-2 rounded-lg border border-[#1E1E21] text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className='text-sm text-gray-400'>
                        {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
                        className='p-2 rounded-lg border border-[#1E1E21] text-gray-400 hover:text-[#EDEDED] hover:border-[#D4AF37]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ProductHistory
