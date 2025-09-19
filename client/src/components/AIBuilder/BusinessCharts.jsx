// File: client/src/components/SimpleBusinessCharts.jsx - CLEAN & AI-GENERATED DATA
import { BarChart3, Target, TrendingUp } from 'lucide-react'
import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const SimpleBusinessCharts = ({ generatedPlan }) => {
  const chartColors = ['#D4AF37', '#8B7355', '#A67C00', '#FFD700', '#B8860B']

  // Process revenue data for charts (existing)
  const getRevenueChartData = () => {
    if (!generatedPlan?.revenueProjections) return []

    return generatedPlan.revenueProjections.map((item) => ({
      period: item.period,
      revenue: parseInt(item.revenue.replace(/[$,]/g, '')),
      growth: parseInt(item.growth.replace(/[+%]/g, '')),
      revenueFormatted: item.revenue,
    }))
  }

  // Process market segments data (AI-generated)
  const getMarketSegmentsData = () => {
    if (!generatedPlan?.marketSegments) return []

    return generatedPlan.marketSegments.map((segment, index) => ({
      name: segment.name,
      percentage: segment.percentage,
      description: segment.description,
      color: chartColors[index % chartColors.length],
    }))
  }

  // Process competitive analysis data (AI-generated)
  const getCompetitiveData = () => {
    if (!generatedPlan?.competitiveAnalysis) return []

    return generatedPlan.competitiveAnalysis.map((company) => ({
      company:
        company.company.length > 15
          ? company.company.substring(0, 15) + '...'
          : company.company,
      marketShare: company.marketShare,
      satisfaction: company.satisfaction,
      innovation: company.innovation,
    }))
  }

  // Don't render if no plan data
  if (!generatedPlan) return null

  return (
    <div className='space-y-8'>
      {/* Revenue Projections Chart */}
      <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6'>
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-2 bg-[#D4AF37]/10 rounded-lg'>
            <TrendingUp size={20} className='text-[#D4AF37]' />
          </div>
          <h3 className='text-xl font-semibold text-[#EDEDED]'>
            Revenue Growth Projections
          </h3>
          <span className='text-sm text-gray-400 ml-auto'>AI Generated</span>
        </div>

        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart data={getRevenueChartData()}>
              <CartesianGrid strokeDasharray='3 3' stroke='#1E1E21' />
              <XAxis dataKey='period' stroke='#EDEDED' fontSize={12} />
              <YAxis
                stroke='#EDEDED'
                fontSize={12}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A0A0C',
                  border: '1px solid #D4AF37',
                  borderRadius: '8px',
                  color: '#EDEDED',
                }}
                formatter={(value, name) => [
                  `$${value.toLocaleString()}`,
                  'Revenue',
                ]}
              />
              <Line
                type='monotone'
                dataKey='revenue'
                stroke='#D4AF37'
                strokeWidth={3}
                dot={{ fill: '#D4AF37', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#D4AF37' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Market Segments Chart */}
      {generatedPlan?.marketSegments && (
        <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-[#D4AF37]/10 rounded-lg'>
              <Target size={20} className='text-[#D4AF37]' />
            </div>
            <h3 className='text-xl font-semibold text-[#EDEDED]'>
              Market Segmentation
            </h3>
            <span className='text-sm text-gray-400 ml-auto'>AI Generated</span>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Pie Chart */}
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={getMarketSegmentsData()}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='percentage'
                  >
                    {getMarketSegmentsData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0A0C',
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      color: '#EDEDED',
                    }}
                    labelStyle={{
                      color: '#EDEDED',
                    }}
                    itemStyle={{
                      color: '#EDEDED',
                    }}
                    formatter={(value) => [`${value}%`, 'Market Share']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Segment Details */}
            <div className='space-y-3'>
              <h4 className='text-[#D4AF37] font-medium mb-4'>
                Segment Breakdown
              </h4>
              {getMarketSegmentsData().map((segment, index) => (
                <div key={index} className='bg-[#0A0A0C]/50 rounded-lg p-3'>
                  <div className='flex items-center gap-3 mb-2'>
                    <div
                      className='w-4 h-4 rounded-full'
                      style={{ backgroundColor: segment.color }}
                    ></div>
                    <span className='text-[#EDEDED] font-medium'>
                      {segment.name}
                    </span>
                    <span className='text-[#D4AF37] ml-auto'>
                      {segment.percentage}%
                    </span>
                  </div>
                  <p className='text-gray-300 text-sm'>{segment.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Competitive Analysis Chart */}
      {generatedPlan?.competitiveAnalysis && (
        <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-2 bg-[#D4AF37]/10 rounded-lg'>
              <BarChart3 size={20} className='text-[#D4AF37]' />
            </div>
            <h3 className='text-xl font-semibold text-[#EDEDED]'>
              Competitive Landscape
            </h3>
            <span className='text-sm text-gray-400 ml-auto'>AI Generated</span>
          </div>

          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={getCompetitiveData()}>
                <CartesianGrid strokeDasharray='3 3' stroke='#1E1E21' />
                <XAxis
                  dataKey='company'
                  stroke='#EDEDED'
                  fontSize={11}
                  angle={-45}
                  textAnchor='end'
                  height={80}
                />
                <YAxis stroke='#EDEDED' fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0A0C',
                    border: '1px solid #D4AF37',
                    borderRadius: '8px',
                    color: '#EDEDED',
                  }}
                />
                <Bar
                  dataKey='marketShare'
                  fill='#D4AF37'
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey='satisfaction'
                  fill='#8B7355'
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey='innovation'
                  fill='#A67C00'
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className='flex justify-center gap-6 mt-4'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-[#D4AF37] rounded'></div>
              <span className='text-sm text-gray-300'>Market Share %</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-[#8B7355] rounded'></div>
              <span className='text-sm text-gray-300'>Satisfaction Score</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-[#A67C00] rounded'></div>
              <span className='text-sm text-gray-300'>Innovation Index</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SimpleBusinessCharts
