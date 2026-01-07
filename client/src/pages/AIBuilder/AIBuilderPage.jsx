// File: client/src/pages/AIBuilder/AIBuilderPage.jsx
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Cpu,
  Layers,
  MessageCircle,
  Package,
  Search,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../Layout/Layout'

const AIBuilderPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()

  const aiTools = [
    {
      id: 'viral-hooks-factory',
      name: 'Viral Hooks',
      description:
        'Quickly create high-performing hooks that grab attention and stop the scroll.',
      icon: MessageCircle,
      gradient: 'from-blue-500/10 to-transparent',
      borderColor: 'group-hover:border-blue-500/30',
      features: [
        'Works for all platforms',
        'Proven structures',
        'Built-in engagement',
        'Instant creation',
      ],
    },
    {
      id: 'product-generator',
      name: 'Product Generator',
      description:
        'Turn your ideas into complete digital products including names and plans.',
      icon: Package,
      gradient: 'from-gold/20 to-transparent',
      borderColor: 'group-hover:border-gold/30',
      features: [
        'Full product plan',
        'Pricing ideas',
        'Marketing tips',
        'Growth steps',
      ],
    },
    {
      id: 'niche-launchpad',
      name: 'Niche Launchpad',
      description:
        'Find your perfect niche and get a clear 12-month plan to start your business.',
      icon: Target,
      gradient: 'from-emerald-500/10 to-transparent',
      borderColor: 'group-hover:border-emerald-500/30',
      features: [
        'Full market plan',
        '12-month roadmap',
        'Money goals',
        'Growth strategy',
      ],
    },
  ]

  const filteredTools = aiTools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const AIToolCard = ({ tool, index }) => {
    const Icon = tool.icon
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`group relative h-full flex flex-col p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 transition-all duration-300 ${tool.borderColor} hover:bg-white/[0.04] overflow-hidden`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        <div className='relative z-10'>
          <div className='flex items-center gap-3 mb-4'>
            <div className='p-2.5 rounded-xl bg-white/5 border border-white/10 text-gold group-hover:text-white transition-colors duration-300'>
              <Icon size={20} />
            </div>
            <h3 className='text-lg font-bold text-white tracking-tight group-hover:text-gold transition-colors'>{tool.name}</h3>
          </div>

          <p className='text-gray-400 text-sm leading-relaxed mb-6'>
            {tool.description}
          </p>

          <div className='space-y-2 mb-8'>
            {tool.features.map((feature, idx) => (
              <div key={idx} className='flex items-center gap-2 text-[13px] font-medium text-gray-300'>
                <div className='h-1 w-1 rounded-full bg-gold/40' />
                {feature}
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate(`/build/${tool.id}`)}
            className='w-full h-11 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 hover:bg-gold hover:text-black hover:border-gold transition-all duration-300'
          >
            Open Tool
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <Layout>
      <div className='relative min-h-full pb-10'>
        <div className='max-w-7xl mx-auto px-6 pt-8 relative z-10'>
          {/* Header Section - Shrinked */}
          <div className='flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12'>
            <div className='max-w-xl text-left'>
              <h1 className='text-3xl font-black text-white tracking-tight mb-2'>
                AI <span className='text-gold'>Builder</span>
              </h1>
              <p className='text-gray-400 text-sm leading-relaxed'>
                Choose a tool below to start creating products, content, and business plans instantly.
              </p>
            </div>

            {/* Search - Integrated into top bar area */}
            <div className='w-full md:w-80'>
              <div className='group relative'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-gold transition-colors' size={16} />
                <input
                  type='text'
                  placeholder='Search tools...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full h-11 pl-11 pr-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gold transition-all'
                />
              </div>
            </div>
          </div>

          {/* Tool Grid */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'>
            {filteredTools.map((tool, index) => (
              <AIToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>

          {/* Empty State */}
          <AnimatePresence>
            {filteredTools.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className='text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10'
              >
                <h3 className='text-lg font-bold text-white mb-2'>No match found</h3>
                <p className='text-gray-500 mb-6 text-sm'>Try searching for something else.</p>
                <button
                  onClick={() => setSearchTerm('')}
                  className='text-gold text-sm font-bold hover:underline'
                >
                  Clear search
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Simple Bottom Badges */}
          <div className='grid grid-cols-3 gap-4 pt-10 border-t border-white/5 opacity-60'>
            <div className='flex items-center gap-2 justify-center'>
               <Sparkles size={14} className='text-gold' />
               <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Fast</span>
            </div>
            <div className='flex items-center gap-2 justify-center'>
               <Zap size={14} className='text-gold' />
               <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Pro</span>
            </div>
            <div className='flex items-center gap-2 justify-center'>
               <Bot size={14} className='text-gold' />
               <span className='text-[10px] font-bold text-gray-400 uppercase tracking-widest'>Smart</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default AIBuilderPage
