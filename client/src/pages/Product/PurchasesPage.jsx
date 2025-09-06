// File: client/src/pages/Product/PurchasesPage.jsx - FIXED IMPORTS
import { Download, Eye, FileText, Mail, Package, Search } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Layout from '../Layout/Layout'
// FIXED: Import from the consolidated hook
import { useDigitalProducts } from '@/hooks/useDigitalProduct'

const PurchasesPage = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')

  // FIXED: Use the consolidated hook
  const {
    purchases,
    purchasesLoading,
    error,
    fetchPurchases,
    downloadPurchasedFile,
    downloading,
  } = useDigitalProducts()

  // Fetch purchases on component mount
  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  const handleFileDownload = async (purchase, file) => {
    try {
      await downloadPurchasedFile(
        purchase.product.slug,
        file._id,
        file.originalName || file.name,
        null, // token - you might want to implement this
        purchase.email // Get email from purchase
      )
    } catch (error) {
      console.error('Error downloading file:', error)
    }
  }

  const FileIcon = ({ type }) => {
    switch (type) {
      case 'pdf':
        return <FileText size={16} className='text-red-400' />
      case 'docx':
      case 'doc':
        return <FileText size={16} className='text-blue-400' />
      case 'zip':
      case 'rar':
        return <Package size={16} className='text-purple-400' />
      case 'mp4':
      case 'avi':
      case 'mov':
        return <Eye size={16} className='text-green-400' />
      case 'mp3':
      case 'wav':
        return <Eye size={16} className='text-pink-400' />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Eye size={16} className='text-orange-400' />
      default:
        return <FileText size={16} className='text-gray-400' />
    }
  }

  const CategoryBadge = ({ category }) => {
    const categoryConfig = {
      Course: { color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
      Software: { color: 'bg-blue-500/10 text-blue-400' },
      Templates: { color: 'bg-purple-500/10 text-purple-400' },
      'E-book': { color: 'bg-green-500/10 text-green-400' },
      Audio: { color: 'bg-pink-500/10 text-pink-400' },
      Video: { color: 'bg-red-500/10 text-red-400' },
    }

    const config = categoryConfig[category] || categoryConfig.Course

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
      >
        {category}
      </span>
    )
  }

  // Filter purchases based on search term
  const filteredPurchases = purchases.filter(
    (purchase) =>
      purchase.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.product.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  )

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
              My Purchases
            </h1>
            <p className='text-gray-400'>
              Access and download your purchased digital products
            </p>
          </div>
        </div>

        {/* Stats */}
        {purchases.length > 0 && (
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
              <div className='text-2xl font-bold text-[#EDEDED] mb-1'>
                {purchases.length}
              </div>
              <div className='text-sm text-gray-400'>Total Purchases</div>
            </div>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
              <div className='text-2xl font-bold text-[#D4AF37] mb-1'>
                ${purchases.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
              </div>
              <div className='text-sm text-gray-400'>Total Spent</div>
            </div>
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
              <div className='text-2xl font-bold text-[#EDEDED] mb-1'>
                {purchases.reduce(
                  (sum, p) => sum + (p.product.files?.length || 0),
                  0
                )}
              </div>
              <div className='text-sm text-gray-400'>Available Downloads</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4'>
            <p className='text-red-400 text-sm'>{error}</p>
          </div>
        )}

        {/* Search and Filters */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4'>
          <div className='flex flex-col sm:flex-row gap-4'>
            <div className='relative flex-1'>
              <Search
                size={16}
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
              />
              <input
                type='text'
                placeholder='Search your purchases...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-xl pl-10 pr-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40'
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {purchasesLoading && (
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-8 text-center'>
            <div className='text-gray-400'>Loading your purchases...</div>
          </div>
        )}

        {/* Empty State */}
        {!purchasesLoading && purchases.length === 0 && (
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-8 text-center'>
            <Package size={48} className='mx-auto text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-[#EDEDED] mb-2'>
              No purchases yet
            </h3>
            <p className='text-gray-400 mb-4'>
              Start browsing our digital products to make your first purchase
            </p>
            <button
              onClick={() => navigate('/products')}
              className='bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#D4AF37]/90 transition-all duration-300'
            >
              Browse Products
            </button>
          </div>
        )}

        {/* Purchases List */}
        {!purchasesLoading && filteredPurchases.length > 0 && (
          <div className='space-y-4'>
            {filteredPurchases.map((purchase) => (
              <div
                key={purchase._id}
                className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 sm:p-6 hover:border-[#D4AF37]/20 transition-all duration-300'
              >
                <div className='flex flex-col lg:flex-row gap-4'>
                  {/* Product Info */}
                  <div className='flex-1'>
                    <div className='flex items-start gap-4'>
                      <div className='w-16 h-16 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-xl flex items-center justify-center border border-[#D4AF37]/20 flex-shrink-0'>
                        <Package size={24} className='text-[#D4AF37]' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-2'>
                          <CategoryBadge category={purchase.product.category} />
                          <span className='text-xs text-gray-400'>
                            Purchased{' '}
                            {new Date(
                              purchase.purchasedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className='text-lg font-semibold text-[#EDEDED] mb-2'>
                          {purchase.product.name}
                        </h3>
                        <p className='text-gray-400 text-sm mb-3 line-clamp-2'>
                          {purchase.product.description}
                        </p>
                        <div className='flex items-center gap-4'>
                          <span className='text-[#D4AF37] font-bold'>
                            ${purchase.amount}
                          </span>
                          <span className='text-gray-400 text-sm'>
                            {purchase.product.files?.length || 0} files
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Download Section */}
                  <div className='lg:w-80 border-t lg:border-t-0 lg:border-l border-[#1E1E21] pt-4 lg:pt-0 lg:pl-4'>
                    <h4 className='text-sm font-medium text-[#EDEDED] mb-3'>
                      Download Files
                    </h4>
                    {purchase.product.files &&
                    purchase.product.files.length > 0 ? (
                      <div className='space-y-2 max-h-32 overflow-y-auto'>
                        {purchase.product.files.map((file, index) => (
                          <div
                            key={index}
                            className='flex items-center justify-between bg-[#1A1A1C] border border-[#1E1E21] rounded-lg p-2'
                          >
                            <div className='flex items-center gap-2 min-w-0'>
                              <FileIcon type={file.type} />
                              <div className='min-w-0'>
                                <div className='text-sm text-[#EDEDED] truncate'>
                                  {file.originalName || file.name}
                                </div>
                                <div className='text-xs text-gray-400'>
                                  {file.size}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleFileDownload(purchase, file)}
                              disabled={downloading}
                              className='text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors duration-200 flex-shrink-0 disabled:opacity-50'
                              title='Download file'
                            >
                              <Download size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-gray-400 text-sm'>
                        No files available
                      </div>
                    )}

                    {/* Email Support */}
                    <div className='mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg'>
                      <div className='flex items-center gap-2 text-blue-400 text-xs'>
                        <Mail size={12} />
                        <span>
                          Need help? Check your email for instructions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!purchasesLoading &&
          purchases.length > 0 &&
          filteredPurchases.length === 0 && (
            <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-8 text-center'>
              <Search size={48} className='mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-[#EDEDED] mb-2'>
                No purchases found
              </h3>
              <p className='text-gray-400'>Try adjusting your search terms</p>
            </div>
          )}
      </div>
    </Layout>
  )
}

export default PurchasesPage
