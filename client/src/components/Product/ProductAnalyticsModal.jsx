// File: client/src/components/Product/ProductAnalyticsModal.jsx
import {
  BarChart3,
  DollarSign,
  Eye,
  ShoppingCart,
  TrendingUp,
  X,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import digitalProductsService from '../../services/digitalProductsService'

const ProductAnalyticsModal = ({ show, onClose, productId, productName }) => {
  const [analytics, setAnalytics] = useState(null)
  const [chartData, setChartData] = useState(null)
  const [recentPurchases, setRecentPurchases] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAnalytics = async () => {
    if (!productId) return

    setLoading(true)
    setError(null)

    try {
      const response = await digitalProductsService.getProductAnalytics(
        productId
      )
      setAnalytics(response.data.analytics)
      setChartData(response.data.chartData)
      setRecentPurchases(response.data.recentPurchases || [])
    } catch (err) {
      setError(err.message)
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (show && productId) {
      fetchAnalytics()
    }
  }, [show, productId])

  if (!show) return null

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    color = 'bg-[#D4AF37]',
  }) => (
    <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl p-4'>
      <div className='flex items-center gap-3 mb-2'>
        <div className={`${color} p-2 rounded-lg text-black`}>{icon}</div>
        <div className='flex-1'>
          <div className='text-2xl font-bold text-[#EDEDED]'>{value}</div>
          <div className='text-sm text-gray-400'>{title}</div>
        </div>
      </div>
      {subtitle && <div className='text-xs text-gray-500'>{subtitle}</div>}
    </div>
  )

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h3 className='text-xl font-semibold text-[#EDEDED]'>Analytics</h3>
            <p className='text-gray-400 text-sm'>{productName}</p>
          </div>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-[#EDEDED] transition-colors duration-200'
          >
            <X size={24} />
          </button>
        </div>

        {loading && (
          <div className='text-center py-8'>
            <div className='text-gray-400'>Loading analytics...</div>
          </div>
        )}

        {error && (
          <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6'>
            <p className='text-red-400 text-sm'>{error}</p>
            <button
              onClick={fetchAnalytics}
              className='mt-2 text-sm text-red-300 hover:text-red-200 underline'
            >
              Try Again
            </button>
          </div>
        )}

        {analytics && (
          <div className='space-y-6'>
            {/* Key Metrics */}
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
              <StatCard
                icon={<ShoppingCart size={20} />}
                title='Total Sales'
                value={analytics.totalPurchases || 0}
                color='bg-green-500'
              />
              <StatCard
                icon={<DollarSign size={20} />}
                title='Revenue'
                value={`$${(analytics.totalRevenue || 0).toLocaleString()}`}
                color='bg-[#D4AF37]'
              />
              <StatCard
                icon={<Eye size={20} />}
                title='Views'
                value={analytics.totalViews || 0}
                color='bg-blue-500'
              />
              <StatCard
                icon={<TrendingUp size={20} />}
                title='Conversion Rate'
                value={`${(analytics.conversionRate || 0).toFixed(1)}%`}
                color='bg-purple-500'
              />
            </div>

            {/* Additional Metrics */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl p-4'>
                <h4 className='text-lg font-semibold text-[#EDEDED] mb-4'>
                  Performance
                </h4>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-400'>Average Order Value</span>
                    <span className='text-[#EDEDED] font-medium'>
                      ${(analytics.averageOrderValue || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-400'>Total Views</span>
                    <span className='text-[#EDEDED] font-medium'>
                      {analytics.totalViews || 0}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-gray-400'>Conversion Rate</span>
                    <span className='text-[#EDEDED] font-medium'>
                      {(analytics.conversionRate || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Purchases */}
              <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl p-4'>
                <h4 className='text-lg font-semibold text-[#EDEDED] mb-4'>
                  Recent Purchases
                </h4>
                {recentPurchases && recentPurchases.length > 0 ? (
                  <div className='space-y-3 max-h-48 overflow-y-auto'>
                    {recentPurchases.map((purchase, index) => (
                      <div
                        key={index}
                        className='flex justify-between items-center'
                      >
                        <div>
                          <div className='text-[#EDEDED] text-sm font-medium'>
                            {purchase.customerName || 'Anonymous'}
                          </div>
                          <div className='text-gray-400 text-xs'>
                            {new Date(
                              purchase.purchasedAt
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div className='text-[#D4AF37] font-medium'>
                          ${(purchase.amount || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-gray-400 text-sm'>No purchases yet</div>
                )}
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-xl p-4'>
              <h4 className='text-lg font-semibold text-[#EDEDED] mb-4 flex items-center gap-2'>
                <BarChart3 size={20} />
                Sales Over Time
              </h4>
              <div className='text-gray-400 text-sm text-center py-8'>
                {chartData ? (
                  <div>
                    <p>Chart data available</p>
                    <p className='text-xs mt-1'>
                      Integrate Chart.js, Recharts, or another charting library
                      here
                    </p>
                  </div>
                ) : (
                  <p>No chart data available</p>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <div className='flex justify-center'>
              <button
                onClick={fetchAnalytics}
                disabled={loading}
                className='bg-[#D4AF37] text-black px-6 py-2 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 disabled:opacity-50'
              >
                {loading ? 'Refreshing...' : 'Refresh Analytics'}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !analytics && (
          <div className='text-center py-8'>
            <BarChart3 size={48} className='mx-auto text-gray-400 mb-4' />
            <h3 className='text-lg font-medium text-[#EDEDED] mb-2'>
              No Analytics Data
            </h3>
            <p className='text-gray-400 mb-4'>
              Analytics will appear here once you have sales data
            </p>
            <button
              onClick={fetchAnalytics}
              className='bg-[#D4AF37] text-black px-6 py-2 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300'
            >
              Load Analytics
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductAnalyticsModal
