// File: client/src/pages/AIBuilder/AIBuilderPage.jsx
import {
  ArrowRight,
  Bot,
  MessageCircle,
  Package,
  Search,
  Target,
} from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Layout from '../Layout/Layout'

const AIBuilderPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  // AI Tools Data - Only 3 tools
  const aiTools = [
    {
      id: 'viral-hooks-factory',
      name: 'Viral Hook Factory',
      description:
        'Generate unlimited high-converting hooks for any niche. Perfect for social media posts, emails, and content that stops the scroll.',
      icon: <MessageCircle size={20} />,
      features: [
        '5-10 hooks per generation',
        'Platform-specific formats',
        'Niche customization',
        'Engagement optimization',
      ],
    },
    {
      id: 'product-generator',
      name: 'AI Product Generator',
      description:
        'Instantly create complete digital products, from hooks to content. Get course outlines, pricing strategies, and marketing plans.',
      icon: <Package size={20} />,
      features: [
        'Complete product blueprint',
        'Pricing strategy',
        'Marketing angles',
        'Bonus ideas',
      ],
    },
    {
      id: 'niche-launchpad',
      name: 'Niche Launchpad',
      description:
        'Select a niche and let AI build the entire business plan. Market analysis, product roadmap, and 12-month strategy included.',
      icon: <Target size={20} />,
      features: [
        'Market analysis',
        '12-month roadmap',
        'Revenue projections',
        'Product lineup',
      ],
    },
  ]

  // Filter tools based on search
  const filteredTools = aiTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const AIToolCard = ({ tool }) => (
    <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6 hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/10 transition-all duration-300 group flex flex-col h-full'>
      {/* Icon and Title */}
      <div className='flex items-start gap-4 mb-4'>
        <div className='bg-[#1A1A1C] border border-[#1E1E21] p-3 rounded-xl text-[#D4AF37] flex-shrink-0'>
          {tool.icon}
        </div>

        <div className='flex-1 min-w-0'>
          <h3 className='text-lg font-semibold text-[#EDEDED] mb-2'>
            {tool.name}
          </h3>
          <p className='text-gray-400 text-sm leading-relaxed'>
            {tool.description}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className='flex-1 mb-6'>
        <div className='space-y-2'>
          {tool.features.map((feature, index) => (
            <div
              key={index}
              className='flex items-center gap-2 text-sm text-gray-300'
            >
              <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full flex-shrink-0'></div>
              {feature}
            </div>
          ))}
        </div>
      </div>

      {/* Try Button - Sticks to bottom */}
      <button
        onClick={() => navigate(`/build/${tool.id}`)}
        className='w-full bg-[#D4AF37] text-black h-8 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-300 flex items-center justify-center gap-2'
      >
        Try {tool.name}
        <ArrowRight size={14} />
      </button>
    </div>
  )

  return (
    <Layout>
      <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-8'>
        {/* Header */}
        <div className='text-center'>
          <div className='inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-2 text-[#D4AF37] text-sm font-medium mb-6'>
            <Bot size={14} />
            AI-Powered Tools
          </div>

          <h1 className='text-3xl sm:text-4xl font-bold text-[#EDEDED] mb-4'>
            AI Asset Builder
          </h1>
          <p className='text-gray-400 text-lg max-w-2xl mx-auto'>
            Choose from our specialized AI tools to create professional content,
            products, and business strategies in seconds.
          </p>
        </div>

        {/* Search Bar */}
        <div className='max-w-md mx-auto'>
          <div className='relative'>
            <Search
              size={16}
              className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400'
            />
            <input
              type='text'
              placeholder='Search AI tools...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full bg-[#121214] border border-[#1E1E21] rounded-xl pl-12 pr-4 h-10 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40'
            />
          </div>
        </div>

        {/* AI Tools Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
          {filteredTools.map((tool) => (
            <AIToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* Empty State */}
        {filteredTools.length === 0 && (
          <div className='text-center py-12'>
            <div className='bg-[#1A1A1C] border border-[#1E1E21] rounded-full p-8 w-fit mx-auto mb-4'>
              <Search size={32} className='text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-[#EDEDED] mb-2'>
              No AI tools found
            </h3>
            <p className='text-gray-400 mb-4'>Try a different search term</p>
            <button
              onClick={() => setSearchTerm('')}
              className='text-[#D4AF37] hover:underline text-sm'
            >
              Clear search
            </button>
          </div>
        )}

        {/* Stats Section */}
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto'>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 text-center'>
            <div className='text-2xl font-bold text-[#EDEDED] mb-1'>10K+</div>
            <div className='text-gray-400 text-sm'>Assets Generated</div>
          </div>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 text-center'>
            <div className='text-2xl font-bold text-[#EDEDED] mb-1'>
              &lt; 30s
            </div>
            <div className='text-gray-400 text-sm'>Average Generation</div>
          </div>
          <div className='bg-[#121214] border border-[#1E1E21] rounded-xl p-4 text-center'>
            <div className='text-2xl font-bold text-[#EDEDED] mb-1'>97%</div>
            <div className='text-gray-400 text-sm'>User Satisfaction</div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AIBuilderPage
