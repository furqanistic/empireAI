// File: client/src/pages/Product/ProductPage.jsx
import {
  ChevronDown,
  Edit,
  Eye,
  Image,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import React, { useState } from 'react'

import Layout from '../Layout/Layout'

const ProductPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  // Sample products data
  const productsData = [
    {
      id: 1,
      name: 'Social Media Mastery Course',
      description:
        'Complete guide to social media marketing and growth strategies',
      category: 'Course',
      price: 297.0,
      type: 'digital',
      status: 'active',
      sales: 142,
      revenue: 42174.0,
      created: '2024-12-15',
      image: 'course-social.jpg',
    },
    {
      id: 2,
      name: 'E-commerce Automation Tools',
      description: 'Suite of tools for automating your e-commerce business',
      category: 'Software',
      price: 97.0,
      type: 'saas',
      status: 'active',
      sales: 89,
      revenue: 8633.0,
      created: '2024-11-28',
      image: 'tools-ecom.jpg',
    },
    {
      id: 3,
      name: 'Digital Marketing Templates Pack',
      description: 'Professional templates for all your marketing needs',
      category: 'Templates',
      price: 47.0,
      type: 'digital',
      status: 'active',
      sales: 267,
      revenue: 12549.0,
      created: '2024-11-10',
      image: 'templates-pack.jpg',
    },
    {
      id: 4,
      name: 'Affiliate Marketing Blueprint',
      description:
        'Step-by-step guide to building a profitable affiliate business',
      category: 'Course',
      price: 197.0,
      type: 'digital',
      status: 'draft',
      sales: 0,
      revenue: 0.0,
      created: '2025-01-08',
      image: 'course-affiliate.jpg',
    },
    {
      id: 5,
      name: 'Content Creation Masterclass',
      description: 'Learn to create engaging content that converts',
      category: 'Course',
      price: 247.0,
      type: 'digital',
      status: 'paused',
      sales: 78,
      revenue: 19266.0,
      created: '2024-10-22',
      image: 'course-content.jpg',
    },
  ]

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Products',
      value: '5',
      icon: <Package size={18} />,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Revenue',
      value: '$82,622',
      icon: <Package size={18} />,
      color: 'bg-emerald-500',
    },
    {
      title: 'Active Products',
      value: '3',
      icon: <Package size={18} />,
      color: 'bg-[#D4AF37]',
    },
    {
      title: 'Total Sales',
      value: '576',
      icon: <Package size={18} />,
      color: 'bg-purple-500',
    },
  ]

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

  const StatusBadge = ({ status }) => {
    const statusConfig = {
      active: { color: 'bg-emerald-500/10 text-emerald-400', label: 'Active' },
      draft: { color: 'bg-gray-500/10 text-gray-400', label: 'Draft' },
      paused: { color: 'bg-yellow-500/10 text-yellow-400', label: 'Paused' },
    }

    const config = statusConfig[status] || statusConfig.active

    return (
      <span
        className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    )
  }

  const CategoryBadge = ({ category }) => {
    const categoryConfig = {
      Course: { color: 'bg-[#D4AF37]/10 text-[#D4AF37]' },
      Software: { color: 'bg-blue-500/10 text-blue-400' },
      Templates: { color: 'bg-purple-500/10 text-purple-400' },
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

  const formatDate = (dateString) => {
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
  }

  const AddProductModal = () =>
    showAddModal && (
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto'>
          <div className='flex items-center justify-between mb-6'>
            <h3 className='text-xl font-semibold text-[#EDEDED]'>
              Add New Product
            </h3>
            <button
              onClick={() => setShowAddModal(false)}
              className='text-gray-400 hover:text-[#EDEDED] transition-colors duration-200'
            >
              ×
            </button>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Product Name
              </label>
              <input
                type='text'
                className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-xl px-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40'
                placeholder='Enter product name'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Description
              </label>
              <textarea
                rows={3}
                className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-xl px-4 py-3 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 resize-none'
                placeholder='Describe your product'
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Category
                </label>
                <DropdownButton
                  value='course'
                  options={[
                    { value: 'course', label: 'Course' },
                    { value: 'software', label: 'Software' },
                    { value: 'templates', label: 'Templates' },
                    { value: 'ebook', label: 'E-book' },
                  ]}
                  onChange={() => {}}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-300 mb-2'>
                  Price ($)
                </label>
                <input
                  type='number'
                  className='w-full bg-[#1A1A1C] border border-[#1E1E21] rounded-xl px-4 h-8 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40'
                  placeholder='0.00'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Product Image
              </label>
              <div className='border-2 border-dashed border-[#1E1E21] rounded-xl p-6 text-center hover:border-[#D4AF37]/40 transition-colors duration-300 cursor-pointer'>
                <Upload size={24} className='mx-auto text-gray-400 mb-2' />
                <p className='text-gray-400 text-sm'>
                  Click to upload or drag and drop
                </p>
                <p className='text-gray-500 text-xs mt-1'>PNG, JPG up to 5MB</p>
              </div>
            </div>

            <div className='flex items-center gap-3 pt-4'>
              <button
                onClick={() => setShowAddModal(false)}
                className='flex-1 bg-[#1A1A1C] border border-[#1E1E21] text-[#EDEDED] h-10 rounded-xl font-medium hover:border-[#D4AF37]/40 transition-all duration-300'
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className='flex-1 bg-[#D4AF37] text-black h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300'
              >
                Create Product
              </button>
            </div>
          </div>
        </div>
      </div>
    )

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold text-[#EDEDED] mb-2'>
              Products
            </h1>
            <p className='text-gray-400'>
              Manage all your digital products and assets
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className='bg-[#D4AF37] text-black px-6 h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap'
          >
            <Plus size={16} />
            Add Product
          </button>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'>
          {statsCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Products Table */}
        <div className='bg-[#121214] border border-[#1E1E21] rounded-xl overflow-hidden'>
          {/* Table Header */}
          <div className='p-4 sm:p-6 border-b border-[#1E1E21]'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
              <h2 className='text-xl font-semibold text-[#EDEDED]'>
                All Products
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl pl-9 pr-4 h-8 text-sm text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 w-full sm:w-48'
                  />
                </div>

                <div className='grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3 sm:grid-cols-none'>
                  {/* Filters */}
                  <DropdownButton
                    value={statusFilter}
                    options={[
                      { value: 'all', label: 'All Status' },
                      { value: 'active', label: 'Active' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'paused', label: 'Paused' },
                    ]}
                    onChange={setStatusFilter}
                  />

                  <DropdownButton
                    value={categoryFilter}
                    options={[
                      { value: 'all', label: 'All Categories' },
                      { value: 'course', label: 'Course' },
                      { value: 'software', label: 'Software' },
                      { value: 'templates', label: 'Templates' },
                    ]}
                    onChange={setCategoryFilter}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
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
                    Sales
                  </th>
                  <th className='text-left text-gray-400 text-xs font-medium uppercase tracking-wider px-6 py-4'>
                    Revenue
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
                {productsData.map((product) => (
                  <tr
                    key={product.id}
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
                    <td className='px-6 py-4 text-[#EDEDED]'>
                      {product.sales}
                    </td>
                    <td className='px-6 py-4 text-[#D4AF37] font-semibold'>
                      ${product.revenue.toLocaleString()}
                    </td>
                    <td className='px-6 py-4'>
                      <StatusBadge status={product.status} />
                    </td>
                    <td className='px-6 py-4 text-gray-400 text-sm'>
                      {formatDate(product.created)}
                    </td>
                    <td className='px-6 py-4'>
                      <div className='flex items-center justify-end gap-2'>
                        <button className='text-gray-400 hover:text-[#D4AF37] transition-colors duration-200 p-1'>
                          <Eye size={14} />
                        </button>
                        <button className='text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1'>
                          <Edit size={14} />
                        </button>
                        <button className='text-gray-400 hover:text-red-400 transition-colors duration-200 p-1'>
                          <Trash2 size={14} />
                        </button>
                        <button className='text-gray-400 hover:text-[#EDEDED] transition-colors duration-200 p-1'>
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className='px-4 sm:px-6 py-4 border-t border-[#1E1E21] flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
            <div className='text-gray-400 text-sm text-center sm:text-left'>
              Showing 5 of 5 products
            </div>
            <div className='flex items-center justify-center gap-2'>
              <button className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'>
                Previous
              </button>
              <button className='px-3 h-8 bg-[#D4AF37] text-black rounded-lg text-sm font-medium'>
                1
              </button>
              <button className='px-3 h-8 bg-[#1A1A1C] border border-[#1E1E21] rounded-lg text-sm text-[#EDEDED] hover:border-[#D4AF37]/40 transition-all duration-300'>
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Add Product Modal */}
        <AddProductModal />
      </div>
    </Layout>
  )
}

export default ProductPage
