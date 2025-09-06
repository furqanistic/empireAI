// File: client/src/pages/Product/ProductPage.jsx - SIMPLIFIED ACTIONS
import {
  BarChart3,
  ChevronDown,
  Copy,
  Download,
  Edit,
  ExternalLink,
  Eye,
  File,
  FileText,
  Image,
  Link,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Import the separate components
import AddProductModal from '../../components/Product/AddProductModal'
import EditProductModal from '../../components/Product/EditProductModal'
import ProductAnalyticsModal from '../../components/Product/ProductAnalyticsModal'

import { useDigitalProducts } from '@/hooks/useDigitalProduct'
import digitalProductsService from '../../services/digitalProductsService'
import { categoryOptions } from '../../utils/validationRules'
import Layout from '../Layout/Layout'

const ProductPage = () => {
  const navigate = useNavigate()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [analyticsProductId, setAnalyticsProductId] = useState(null)
  const [analyticsProductName, setAnalyticsProductName] = useState('')

  // Main hook - everything in one place!
  const {
    products,
    stats,
    loading,
    error,
    pagination,
    filters,
    updateFilters,
    changePage,
    refreshProducts,
    saving,
    createProduct,
    updateProduct,
    deleteProduct,
    togglePublished,
    uploading,
    uploadProgress,
    deleting,
    uploadFiles,
    deleteFile,
    downloadFile,
    fetchAnalytics,
  } = useDigitalProducts()

  const StatCard = ({ title, value, icon, color }) => (
    <div className='relative bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-3 sm:p-5 hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-all duration-300 group overflow-hidden'>
      <div
        className={`absolute top-0 right-0 w-12 h-12 sm:w-20 sm:h-20 ${color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity duration-300`}
      ></div>
      <div className='relative'>
        <div className='flex items-start justify-between mb-2 sm:mb-3'>
          <div className='space-y-1 flex-1 min-w-0'>
            <h3 className='text-gray-400 text-xs sm:text-sm font-medium leading-tight truncate'>
              {title}
            </h3>
          </div>
          <div
            className={`${color} p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl text-black shadow-lg flex-shrink-0 ml-2`}
          >
            <div className='block sm:hidden'>
              {React.cloneElement(icon, { size: 14 })}
            </div>
            <div className='hidden sm:block'>{icon}</div>
          </div>
        </div>
        <div className='text-lg sm:text-2xl font-bold text-[#EDEDED] leading-none'>
          {value}
        </div>
      </div>
    </div>
  )

  const PublishToggle = ({ productId, published }) => {
    const handleToggle = useCallback(async () => {
      try {
        await togglePublished(productId)
        // Force refresh to ensure UI updates
        setTimeout(() => {
          refreshProducts()
        }, 100)
      } catch (error) {
        console.error('Error toggling publish status:', error)
      }
    }, [productId])

    return (
      <button
        onClick={handleToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          published ? 'bg-[#D4AF37]' : 'bg-gray-600'
        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            published ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    )
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

  const DropdownButton = ({ value, options, onChange, placeholder }) => (
    <div className='relative'>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='bg-[#121214] border border-[#1E1E21] rounded-xl px-4 h-8 text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 appearance-none pr-8 cursor-pointer w-full sm:min-w-[120px] sm:w-auto'
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className='absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none'
      />
    </div>
  )

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString)
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }, [])

  const copyToClipboard = useCallback((product) => {
    // FIXED: Use MongoDB ID instead of slug for professional URLs
    const checkoutLink = digitalProductsService.generateCheckoutLink(
      product._id // Changed from product.slug to product._id
    )
    navigator.clipboard.writeText(checkoutLink)
    console.log(`Copied checkout link: ${checkoutLink}`)

    // Optional: Show a toast notification
    // You can add a toast library here to show "Link copied!"
  }, [])

  const handleOpenCheckout = useCallback(
    (product) => {
      // FIXED: Use MongoDB ID instead of slug for consistency
      navigate(`/product/checkout/${product._id}`) // Already correct
    },
    [navigate]
  )

  const handleEdit = useCallback((product) => {
    setEditingProduct(product)
    setShowEditModal(true)
  }, [])

  const handleSaveEdit = useCallback(
    async (data) => {
      try {
        await updateProduct(editingProduct._id, {
          ...data,
          price: parseFloat(data.price),
        })
        setShowEditModal(false)
        setEditingProduct(null)
        // Refresh products to show updated data
        await refreshProducts()
      } catch (error) {
        console.error('Error updating product:', error)
      }
    },
    [editingProduct, updateProduct, refreshProducts]
  )

  const handleAddProduct = useCallback(
    async (data, files) => {
      try {
        // Create the product first
        const newProduct = await createProduct({
          ...data,
          price: parseFloat(data.price),
        })

        // If files were selected, upload them
        if (files && files.length > 0 && newProduct) {
          await uploadFiles(newProduct._id, files)
        }

        setShowAddModal(false)
        // Refresh products to show new product
        await refreshProducts()
      } catch (error) {
        console.error('Error creating product:', error)
        throw error // Re-throw to handle in modal
      }
    },
    [createProduct, uploadFiles, refreshProducts]
  )

  const handleDeleteProduct = useCallback(
    async (productId) => {
      if (window.confirm('Are you sure you want to delete this product?')) {
        try {
          await deleteProduct(productId)
          // Refresh products after deletion
          await refreshProducts()
        } catch (error) {
          console.error('Error deleting product:', error)
        }
      }
    },
    [deleteProduct, refreshProducts]
  )

  const handleFileUpload = useCallback(
    async (productId, files) => {
      try {
        await uploadFiles(productId, files)
        // Refresh products to show updated file count
        await refreshProducts()
      } catch (error) {
        console.error('Error uploading files:', error)
        throw error
      }
    },
    [uploadFiles, refreshProducts]
  )

  const handleFileDelete = useCallback(
    async (productId, fileId) => {
      if (window.confirm('Are you sure you want to delete this file?')) {
        try {
          await deleteFile(productId, fileId)
          // Refresh products to show updated file count
          await refreshProducts()
        } catch (error) {
          console.error('Error deleting file:', error)
        }
      }
    },
    [deleteFile, refreshProducts]
  )

  const handleFileDownload = useCallback(
    async (productId, fileId, filename) => {
      try {
        await downloadFile(productId, fileId, filename)
      } catch (error) {
        console.error('Error downloading file:', error)
      }
    },
    [downloadFile]
  )

  const openAnalytics = useCallback((product) => {
    setAnalyticsProductId(product._id)
    setAnalyticsProductName(product.name)
    setShowAnalyticsModal(true)
  }, [])

  // Ensure we show all products (both published and unpublished)
  const displayProducts = Array.isArray(products) ? products : []

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
              Digital Products
            </h1>
            <p className='text-gray-400'>
              Create and manage your digital products and content
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={loading}
            className='bg-[#D4AF37] text-black px-6 h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50'
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          <StatCard
            title='Total Products'
            value={(stats?.totalProducts || 0).toString()}
            icon={<Package size={18} />}
            color='bg-blue-500'
          />
          <StatCard
            title='Total Revenue'
            value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
            icon={<Package size={18} />}
            color='bg-emerald-500'
          />
          <StatCard
            title='Published Products'
            value={(stats?.publishedProducts || 0).toString()}
            icon={<Package size={18} />}
            color='bg-[#D4AF37]'
          />
          <StatCard
            title='Total Sales'
            value={(stats?.totalSales || 0).toString()}
            icon={<Package size={18} />}
            color='bg-purple-500'
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4'>
            <p className='text-red-400 text-sm'>{error}</p>
            <button
              onClick={() => refreshProducts()}
              className='mt-2 text-sm text-red-300 hover:text-red-200 underline'
            >
              Try Again
            </button>
          </div>
        )}

        {/* Products Table */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
          {/* Table Header with Filters */}
          <div className='p-4 sm:p-6 border-b border-[#1E1E21]'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <h2 className='text-xl font-semibold text-[#EDEDED]'>
                All Products ({displayProducts.length})
              </h2>

              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3'>
                {/* Search */}
                <div className='relative'>
                  <Search
                    size={14}
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  />
                  <input
                    type='text'
                    placeholder='Search products...'
                    value={filters?.search || ''}
                    onChange={(e) =>
                      updateFilters && updateFilters({ search: e.target.value })
                    }
                    className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl pl-9 pr-4 h-8 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 w-full sm:w-48'
                  />
                </div>

                {/* Category Filter */}
                <DropdownButton
                  value={filters?.category || 'all'}
                  options={categoryOptions}
                  onChange={(value) =>
                    updateFilters && updateFilters({ category: value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className='p-8 text-center'>
              <div className='text-gray-400'>Loading products...</div>
            </div>
          )}

          {/* Products Table */}
          {!loading && displayProducts.length > 0 && (
            <div className='overflow-x-auto'>
              <table className='w-full'>
                <thead>
                  <tr className='border-b border-[#1E1E21]'>
                    <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Product
                    </th>
                    <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Category
                    </th>
                    <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Price
                    </th>
                    <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Files
                    </th>
                    <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Sales
                    </th>
                    <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Status
                    </th>
                    <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Created
                    </th>
                    <th className='text-right text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-[#1E1E21]'>
                  {displayProducts.map((product) => (
                    <tr
                      key={product._id}
                      className='hover:bg-[#1A1A1C]/50 transition-all duration-200'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='min-w-0'>
                            <div className='text-[#EDEDED] font-medium text-sm truncate'>
                              {product.name}
                            </div>
                            <div className='text-gray-400 text-xs truncate max-w-[200px]'>
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <CategoryBadge category={product.category} />
                      </td>
                      <td className='px-6 py-4 text-[#EDEDED] font-medium'>
                        ${product.price}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-1'>
                          {product.files && product.files.length > 0 ? (
                            <div className='flex items-center gap-2'>
                              <span className='text-[#EDEDED] text-sm'>
                                {product.files.length}
                              </span>
                              <div className='flex items-center gap-1'>
                                {product.files
                                  .slice(0, 3)
                                  .map((file, index) => (
                                    <button
                                      key={`${product._id}-file-${index}`}
                                      onClick={() =>
                                        handleFileDownload(
                                          product._id,
                                          file._id,
                                          file.originalName
                                        )
                                      }
                                      className='text-gray-400 hover:text-[#D4AF37] transition-colors duration-200'
                                      title={`Download ${file.originalName}`}
                                    >
                                      <Download size={12} />
                                    </button>
                                  ))}
                                {product.files.length > 3 && (
                                  <span className='text-gray-400 text-xs'>
                                    +{product.files.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className='text-gray-400 text-sm'>
                              No files
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div>
                          <div className='text-[#EDEDED]'>
                            {product.sales || 0}
                          </div>
                          <div className='text-[#D4AF37] text-sm font-medium'>
                            ${(product.revenue || 0).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex flex-col gap-2'>
                          <PublishToggle
                            productId={product._id}
                            published={product.published}
                          />
                          {product.published && (
                            <button
                              onClick={() => copyToClipboard(product)}
                              className='text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors duration-200 p-1 flex items-center gap-1'
                              title='Copy checkout link'
                            >
                              <Copy size={12} />
                              <span className='text-xs'>Copy Link</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 text-gray-400 text-sm'>
                        {formatDate(product.createdAt)}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-end gap-2'>
                          <button
                            onClick={() => handleEdit(product)}
                            className='text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1'
                            title='Edit product'
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => openAnalytics(product)}
                            className='text-gray-400 hover:text-purple-400 transition-colors duration-200 p-1'
                            title='View analytics'
                          >
                            <BarChart3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className='text-gray-400 hover:text-red-400 transition-colors duration-200 p-1'
                            title='Delete product'
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {!loading && displayProducts.length === 0 && (
            <div className='p-8 text-center'>
              <Package size={48} className='mx-auto text-gray-400 mb-4' />
              <h3 className='text-lg font-medium text-[#EDEDED] mb-2'>
                No products found
              </h3>
              <p className='text-gray-400 mb-4'>
                Get started by creating your first digital product
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className='bg-[#D4AF37] text-black px-6 h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300'
              >
                Create Product
              </button>
            </div>
          )}

          {/* Pagination */}
          {!loading && displayProducts.length > 0 && pagination && (
            <div className='px-4 sm:px-6 py-4 border-t border-[#1E1E21] flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <div className='text-gray-400 text-sm text-center sm:text-left'>
                Showing {pagination.results || displayProducts.length} of{' '}
                {pagination.totalResults || displayProducts.length} products
              </div>
              <div className='flex items-center justify-center gap-2'>
                <button
                  onClick={() =>
                    changePage && changePage((pagination.currentPage || 1) - 1)
                  }
                  disabled={
                    !pagination.currentPage || pagination.currentPage <= 1
                  }
                  className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <span className='px-3 h-8 bg-[#D4AF37] text-black rounded-lg text-sm font-medium flex items-center'>
                  {pagination.currentPage || 1}
                </span>
                <button
                  onClick={() =>
                    changePage && changePage((pagination.currentPage || 1) + 1)
                  }
                  disabled={
                    !pagination.totalPages ||
                    (pagination.currentPage || 1) >= pagination.totalPages
                  }
                  className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        <AddProductModal
          show={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddProduct}
          saving={saving}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        <EditProductModal
          show={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingProduct(null)
          }}
          onSave={handleSaveEdit}
          saving={saving}
          product={editingProduct}
          onFileUpload={handleFileUpload}
          onFileDelete={handleFileDelete}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        <ProductAnalyticsModal
          show={showAnalyticsModal}
          onClose={() => {
            setShowAnalyticsModal(false)
            setAnalyticsProductId(null)
            setAnalyticsProductName('')
          }}
          productId={analyticsProductId}
          productName={analyticsProductName}
        />
      </div>
    </Layout>
  )
}

export default ProductPage
