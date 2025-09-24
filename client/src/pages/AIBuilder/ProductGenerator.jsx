// File: client/src/pages/AIBuilder/ProductGenerator.jsx - Complete version with History
import {
  AlertCircle,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle,
  Copy,
  Crown,
  DollarSign,
  Download,
  Eye,
  FileText,
  Flame,
  Gamepad2,
  Globe,
  GraduationCap,
  Heart,
  HelpCircle,
  Image,
  Laptop,
  Lightbulb,
  MapPin,
  Music,
  Paintbrush,
  PieChart,
  Plane,
  RefreshCw,
  Rocket,
  Shirt,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Video,
  Wand2,
  Zap,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

import ExportOptions from '@/components/AIBuilder/ExportOptions'
import ProductGenerationProgress from '@/components/AIBuilder/ProductGenerationProgress'
import ProductHistory from '@/components/AIBuilder/ProductHistory'
import {
  useCopyContent,
  useDownloadProduct,
  useGenerateProduct,
  useProductStats,
} from '@/hooks/useProducts'

import PlanGate from '@/components/Layout/PlanGate'
import Layout from '../Layout/Layout'

const ProductGenerator = () => {
  const [selectedProductType, setSelectedProductType] = useState('')
  const [selectedNiche, setSelectedNiche] = useState('')
  const [selectedAudience, setSelectedAudience] = useState('')
  const [selectedPriceRange, setSelectedPriceRange] = useState('')
  const [selectedComplexity, setSelectedComplexity] = useState('')
  const [customContext, setCustomContext] = useState('')
  const [generatedProduct, setGeneratedProduct] = useState(null)
  const [generationId, setGenerationId] = useState(null)
  const [copyFeedback, setCopyFeedback] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [detailLevel, setDetailLevel] = useState('standard')

  // NEW: State for loaded products from history
  const [loadedProductData, setLoadedProductData] = useState(null)
  const [isFromHistory, setIsFromHistory] = useState(false)

  // Hooks
  const generateProductMutation = useGenerateProduct()
  const { copyContent, isLoading: isCopying } = useCopyContent()
  const downloadMutation = useDownloadProduct()
  const { data: userStats } = useProductStats()

  // NEW: Function to handle loading a product from history
  const handleLoadProduct = (productData) => {
    setLoadedProductData(productData)
    setGeneratedProduct(productData.product)
    setGenerationId(productData.id)
    setIsFromHistory(true)

    // Set form fields based on loaded product metadata
    if (productData.metadata) {
      setSelectedProductType(productData.metadata.productType || '')
      setSelectedNiche(productData.metadata.niche || '')
      setSelectedAudience(productData.metadata.audience || '')
      setSelectedPriceRange(productData.metadata.priceRange || '')
      setSelectedComplexity(productData.metadata.complexity || '')
      setCustomContext('')
    }

    setActiveTab('overview')
    setCopyFeedback({})
  }

  const hasTabContent = (tabId, product) => {
    if (!product) return false

    switch (tabId) {
      case 'overview':
        return !!(product.overview && product.overview.trim().length > 0)

      case 'outline':
        return !!(
          product.outline &&
          product.outline.modules &&
          Array.isArray(product.outline.modules) &&
          product.outline.modules.length > 0 &&
          product.outline.modules.some(
            (module) => module.title || module.lessons?.length > 0
          )
        )

      case 'pricing':
        return !!(
          product.pricing &&
          (product.pricing.mainPrice ||
            product.pricing.strategy ||
            (product.pricing.paymentPlans &&
              product.pricing.paymentPlans.length > 0))
        )

      case 'marketing':
        return !!(
          product.marketing &&
          product.marketing.angles &&
          Array.isArray(product.marketing.angles) &&
          product.marketing.angles.length > 0 &&
          product.marketing.angles.some(
            (angle) => angle && angle.trim().length > 0
          )
        )

      case 'bonuses':
        return !!(
          product.bonuses &&
          Array.isArray(product.bonuses) &&
          product.bonuses.length > 0 &&
          product.bonuses.some((bonus) => bonus.title || bonus.description)
        )

      case 'launch':
        return !!(
          product.launch &&
          product.launch.sequence &&
          Array.isArray(product.launch.sequence) &&
          product.launch.sequence.length > 0 &&
          product.launch.sequence.some((seq) => seq.title || seq.description)
        )

      case 'sales':
        return !!(
          product.sales &&
          (product.sales.headline ||
            product.sales.subheadline ||
            (product.sales.bulletPoints &&
              product.sales.bulletPoints.length > 0))
        )

      case 'technical':
        return !!(
          product.technical &&
          product.technical.requirements &&
          Array.isArray(product.technical.requirements) &&
          product.technical.requirements.length > 0 &&
          product.technical.requirements.some(
            (req) => req && req.trim().length > 0
          )
        )

      case 'revenue':
        return !!(
          product.revenue &&
          Object.keys(product.revenue).length > 0 &&
          Object.values(product.revenue).some(
            (value) => value && value.toString().trim().length > 0
          )
        )

      default:
        return false
    }
  }

  // Update your tabs definition to be dynamic
  const getAllTabs = () => [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'outline', name: 'Product Outline', icon: FileText },
    { id: 'pricing', name: 'Pricing Strategy', icon: DollarSign },
    { id: 'marketing', name: 'Marketing Plan', icon: TrendingUp },
    { id: 'bonuses', name: 'Bonus Ideas', icon: Star },
    { id: 'launch', name: 'Launch Sequence', icon: Rocket },
    { id: 'sales', name: 'Sales Copy', icon: Zap },
    { id: 'technical', name: 'Technical', icon: Laptop },
    { id: 'revenue', name: 'Revenue Model', icon: PieChart },
  ]

  // Create filtered tabs based on content
  const getAvailableTabs = (product) => {
    const allTabs = getAllTabs()
    return allTabs.filter((tab) => hasTabContent(tab.id, product))
  }

  // Get available tabs for current product
  const availableTabs = getAvailableTabs(generatedProduct)

  // Update active tab when product changes
  useEffect(() => {
    if (generatedProduct && availableTabs.length > 0) {
      // If current active tab is not available, switch to first available tab
      if (!availableTabs.find((tab) => tab.id === activeTab)) {
        setActiveTab(availableTabs[0].id)
      }
    }
  }, [generatedProduct, availableTabs, activeTab])

  const productTypes = [
    {
      id: 'course',
      name: 'Online Course',
      icon: GraduationCap,
      desc: 'Comprehensive learning experience',
    },
    {
      id: 'ebook',
      name: 'Digital Book',
      icon: BookOpen,
      desc: 'In-depth written guide',
    },
    {
      id: 'template',
      name: 'Templates Pack',
      icon: FileText,
      desc: 'Ready-to-use resources',
    },
    {
      id: 'coaching',
      name: 'Coaching Program',
      icon: Users,
      desc: '1-on-1 or group coaching',
    },
    {
      id: 'software',
      name: 'Software/Tool',
      icon: Laptop,
      desc: 'Digital application or tool',
    },
    {
      id: 'mastermind',
      name: 'Mastermind',
      icon: Crown,
      desc: 'Elite community program',
    },
    {
      id: 'workshop',
      name: 'Workshop Series',
      icon: Video,
      desc: 'Interactive training sessions',
    },
    {
      id: 'membership',
      name: 'Membership Site',
      icon: Star,
      desc: 'Recurring content community',
    },
  ]

  const niches = [
    { id: 'business', name: 'Business & Entrepreneurship', icon: Briefcase },
    { id: 'marketing', name: 'Digital Marketing', icon: TrendingUp },
    { id: 'fitness', name: 'Health & Fitness', icon: Heart },
    { id: 'finance', name: 'Personal Finance', icon: DollarSign },
    { id: 'development', name: 'Personal Development', icon: Rocket },
    { id: 'technology', name: 'Technology & AI', icon: Brain },
    { id: 'design', name: 'Design & Creativity', icon: Paintbrush },
    { id: 'relationships', name: 'Relationships & Dating', icon: Heart },
    { id: 'productivity', name: 'Productivity & Systems', icon: Target },
    { id: 'investing', name: 'Investing & Trading', icon: TrendingUp },
    { id: 'content', name: 'Content Creation', icon: Video },
    { id: 'spirituality', name: 'Spirituality & Mindset', icon: Sparkles },
  ]

  const audiences = [
    {
      id: 'beginners',
      name: 'Complete Beginners',
      icon: HelpCircle,
      desc: 'Just starting out',
    },
    {
      id: 'intermediate',
      name: 'Intermediate Learners',
      icon: TrendingUp,
      desc: 'Some experience',
    },
    {
      id: 'advanced',
      name: 'Advanced Practitioners',
      icon: Crown,
      desc: 'Experienced professionals',
    },
    {
      id: 'entrepreneurs',
      name: 'Entrepreneurs',
      icon: Rocket,
      desc: 'Business owners',
    },
    {
      id: 'professionals',
      name: 'Working Professionals',
      icon: Briefcase,
      desc: 'Career-focused',
    },
    {
      id: 'creators',
      name: 'Content Creators',
      icon: Video,
      desc: 'Influencers & creators',
    },
  ]

  const priceRanges = [
    {
      id: 'budget',
      name: 'Budget-Friendly',
      range: '$9-$49',
      icon: DollarSign,
      desc: 'Low-ticket offer',
    },
    {
      id: 'mid',
      name: 'Mid-Range',
      range: '$97-$497',
      icon: TrendingUp,
      desc: 'Core product pricing',
    },
    {
      id: 'premium',
      name: 'Premium',
      range: '$997-$2,997',
      icon: Star,
      desc: 'High-value offering',
    },
    {
      id: 'elite',
      name: 'Elite/Luxury',
      range: '$5,000+',
      icon: Crown,
      desc: 'Ultra-premium positioning',
    },
  ]

  const complexityLevels = [
    { id: 'simple', name: 'Quick Win', icon: Zap, desc: 'Fast implementation' },
    {
      id: 'moderate',
      name: 'Comprehensive',
      icon: Target,
      desc: 'Detailed system',
    },
    {
      id: 'advanced',
      name: 'Transformation',
      icon: Rocket,
      desc: 'Life-changing program',
    },
  ]

  const generateProduct = async () => {
    if (
      !selectedProductType ||
      !selectedNiche ||
      !selectedAudience ||
      !selectedPriceRange ||
      !selectedComplexity
    )
      return

    // Clear any loaded product data when generating new
    setLoadedProductData(null)
    setIsFromHistory(false)

    const productData = {
      productType: selectedProductType,
      niche: selectedNiche,
      audience: selectedAudience,
      priceRange: selectedPriceRange,
      complexity: selectedComplexity,
      customContext: customContext.trim() || undefined,
      detailLevel: detailLevel,
    }

    try {
      const result = await generateProductMutation.mutateAsync(productData)

      if (result.status === 'success' && result.data) {
        setGeneratedProduct(result.data.product)
        setGenerationId(result.data.id)
        setActiveTab('overview')

        // Clear any previous copy feedback
        setCopyFeedback({})
      }
    } catch (error) {
      console.error('Generation failed:', error)
      // Error handling is managed by the mutation
    }
  }

  const handleCopyContent = async (content, section) => {
    try {
      const result = await copyContent(content, generationId, section)

      if (result.success) {
        setCopyFeedback((prev) => ({
          ...prev,
          [section]: { type: 'success', message: 'Copied!' },
        }))

        setTimeout(() => {
          setCopyFeedback((prev) => ({
            ...prev,
            [section]: null,
          }))
        }, 2000)
      }
    } catch (error) {
      setCopyFeedback((prev) => ({
        ...prev,
        [section]: {
          type: 'error',
          message: error.message || 'Failed to copy',
        },
      }))

      setTimeout(() => {
        setCopyFeedback((prev) => ({
          ...prev,
          [section]: null,
        }))
      }, 3000)
    }
  }

  const canGenerate =
    selectedProductType &&
    selectedNiche &&
    selectedAudience &&
    selectedPriceRange &&
    selectedComplexity
  const isGenerating = generateProductMutation.isPending

  return (
    <Layout>
      <PlanGate requiredFeature='product-generator'>
        <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-8'>
          {/* NEW: Product History Component */}
          <ProductHistory
            onLoadProduct={handleLoadProduct}
            currentProductId={generationId}
          />

          {/* Progress Bar Component */}
          <ProductGenerationProgress isGenerating={isGenerating} />

          {/* Header */}
          <div className='text-center space-y-4'>
            <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-purple-500/20 border border-[#D4AF37]/30 rounded-full px-4 py-2 text-[#D4AF37] text-sm font-medium'>
              <Sparkles size={14} />
              AI Product Generator
            </div>

            <h1 className='text-4xl sm:text-5xl font-bold bg-gradient-to-r from-[#EDEDED] via-[#D4AF37] to-[#EDEDED] bg-clip-text text-transparent mb-2'>
              Build Your Digital Empire
            </h1>
            <p className='text-gray-400 max-w-3xl mx-auto text-lg'>
              Generate complete digital products with pricing strategies,
              marketing plans, and launch sequences. From concept to cash in
              minutes.
            </p>
          </div>

          {/* NEW: Show loaded product info */}
          {isFromHistory && loadedProductData && (
            <div className='max-w-2xl mx-auto'>
              <div className='bg-gradient-to-r from-[#D4AF37]/10 to-purple-500/10 border border-[#D4AF37]/20 rounded-xl p-4 flex items-center gap-3'>
                <CheckCircle
                  size={20}
                  className='text-[#D4AF37] flex-shrink-0'
                />
                <div className='flex-1'>
                  <p className='text-[#D4AF37] font-medium text-sm'>
                    Loaded from history
                  </p>
                  <p className='text-gray-300 text-sm'>
                    Created on{' '}
                    {new Date(
                      loadedProductData.metadata?.createdAt
                    ).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLoadedProductData(null)
                    setIsFromHistory(false)
                    setGeneratedProduct(null)
                    setGenerationId(null)
                  }}
                  className='text-gray-400 hover:text-[#EDEDED] text-sm'
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {generateProductMutation.isError && (
            <div className='max-w-2xl mx-auto'>
              <div className='bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3'>
                <AlertCircle size={20} className='text-red-400 flex-shrink-0' />
                <div>
                  <p className='text-red-400 font-medium'>Generation Failed</p>
                  <p className='text-red-300 text-sm'>
                    {generateProductMutation.error?.message ||
                      'Something went wrong. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Steps */}
          <div className='space-y-8'>
            {/* Step 1: Product Type */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    selectedProductType
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  1
                </div>
                <h2 className='text-xl font-semibold text-[#EDEDED]'>
                  Choose Your Product Type
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ml-11'>
                {productTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedProductType(type.id)}
                      disabled={isGenerating}
                      className={`p-4 rounded-xl border transition-all duration-300 text-left group hover:scale-105 ${
                        selectedProductType === type.id
                          ? 'border-[#D4AF37] bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 shadow-lg shadow-[#D4AF37]/20'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <IconComponent
                          size={20}
                          className={
                            selectedProductType === type.id
                              ? 'text-[#D4AF37]'
                              : 'text-gray-400'
                          }
                        />
                        <h3
                          className={`font-medium ${
                            selectedProductType === type.id
                              ? 'text-[#D4AF37]'
                              : 'text-[#EDEDED]'
                          }`}
                        >
                          {type.name}
                        </h3>
                      </div>
                      <p className='text-sm text-gray-400'>{type.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Niche */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    selectedNiche
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  2
                </div>
                <h2 className='text-xl font-semibold text-[#EDEDED]'>
                  Select Your Niche
                </h2>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ml-11'>
                {niches.map((niche) => {
                  const IconComponent = niche.icon
                  return (
                    <button
                      key={niche.id}
                      onClick={() => setSelectedNiche(niche.id)}
                      disabled={isGenerating}
                      className={`h-12 px-4 rounded-xl border transition-all duration-200 text-sm font-medium ${
                        selectedNiche === niche.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] text-gray-400 hover:border-[#D4AF37]/30 hover:text-[#EDEDED]'
                      }`}
                    >
                      <div className='flex items-center gap-2'>
                        <IconComponent size={16} />
                        <span>{niche.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Target Audience */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    selectedAudience
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  3
                </div>
                <h2 className='text-xl font-semibold text-[#EDEDED]'>
                  Define Your Target Audience
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ml-11'>
                {audiences.map((audience) => {
                  const IconComponent = audience.icon
                  return (
                    <button
                      key={audience.id}
                      onClick={() => setSelectedAudience(audience.id)}
                      disabled={isGenerating}
                      className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                        selectedAudience === audience.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <IconComponent
                          size={18}
                          className={
                            selectedAudience === audience.id
                              ? 'text-[#D4AF37]'
                              : 'text-gray-400'
                          }
                        />
                        <h3
                          className={`font-medium ${
                            selectedAudience === audience.id
                              ? 'text-[#D4AF37]'
                              : 'text-[#EDEDED]'
                          }`}
                        >
                          {audience.name}
                        </h3>
                      </div>
                      <p className='text-sm text-gray-400'>{audience.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 4: Price Range */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    selectedPriceRange
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  4
                </div>
                <h2 className='text-xl font-semibold text-[#EDEDED]'>
                  Set Your Price Range
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ml-11'>
                {priceRanges.map((range) => {
                  const IconComponent = range.icon
                  return (
                    <button
                      key={range.id}
                      onClick={() => setSelectedPriceRange(range.id)}
                      disabled={isGenerating}
                      className={`p-4 rounded-xl border transition-all duration-200 text-center ${
                        selectedPriceRange === range.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <IconComponent
                        size={20}
                        className={`mx-auto mb-2 ${
                          selectedPriceRange === range.id
                            ? 'text-[#D4AF37]'
                            : 'text-gray-400'
                        }`}
                      />
                      <h3
                        className={`font-medium mb-1 ${
                          selectedPriceRange === range.id
                            ? 'text-[#D4AF37]'
                            : 'text-[#EDEDED]'
                        }`}
                      >
                        {range.name}
                      </h3>
                      <p
                        className={`text-sm mb-1 ${
                          selectedPriceRange === range.id
                            ? 'text-[#D4AF37]'
                            : 'text-gray-300'
                        }`}
                      >
                        {range.range}
                      </p>
                      <p className='text-xs text-gray-400'>{range.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 5: Complexity */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                    selectedComplexity
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  5
                </div>
                <h2 className='text-xl font-semibold text-[#EDEDED]'>
                  Choose Complexity Level
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 ml-11'>
                {complexityLevels.map((level) => {
                  const IconComponent = level.icon
                  return (
                    <button
                      key={level.id}
                      onClick={() => setSelectedComplexity(level.id)}
                      disabled={isGenerating}
                      className={`p-4 rounded-xl border transition-all duration-200 text-center ${
                        selectedComplexity === level.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <IconComponent
                        size={24}
                        className={`mx-auto mb-2 ${
                          selectedComplexity === level.id
                            ? 'text-[#D4AF37]'
                            : 'text-gray-400'
                        }`}
                      />
                      <h3
                        className={`font-medium mb-1 ${
                          selectedComplexity === level.id
                            ? 'text-[#D4AF37]'
                            : 'text-[#EDEDED]'
                        }`}
                      >
                        {level.name}
                      </h3>
                      <p className='text-sm text-gray-400'>{level.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 6: Custom Context */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-full border-2 border-gray-600 text-gray-400 flex items-center justify-center text-sm font-bold'>
                  6
                </div>
                <h2 className='text-xl font-semibold text-[#EDEDED]'>
                  Additional Context (Optional)
                </h2>
              </div>

              <div className='ml-11'>
                <textarea
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  disabled={isGenerating}
                  placeholder='Add specific requirements, unique selling points, competitor insights, or any special considerations...'
                  className='w-full max-w-3xl bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl px-4 py-4 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 h-24 resize-none disabled:opacity-50'
                />
              </div>
            </div>

            {/* Step 7: Detail Level */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='w-8 h-8 rounded-full border-2 border-gray-600 text-gray-400 flex items-center justify-center text-sm font-bold'>
                  7
                </div>
                <h2 className='text-xl font-semibold text-[#EDEDED]'>
                  Choose Detail Level
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 ml-11'>
                <button
                  onClick={() => setDetailLevel('standard')}
                  disabled={isGenerating}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    detailLevel === 'standard'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                  }`}
                >
                  <div className='flex items-center gap-3 mb-2'>
                    <Zap
                      size={18}
                      className={
                        detailLevel === 'standard'
                          ? 'text-[#D4AF37]'
                          : 'text-gray-400'
                      }
                    />
                    <h3
                      className={`font-medium ${
                        detailLevel === 'standard'
                          ? 'text-[#D4AF37]'
                          : 'text-[#EDEDED]'
                      }`}
                    >
                      Standard Mode
                    </h3>
                  </div>
                  <p className='text-sm text-gray-400 mb-2'>
                    Quick & comprehensive blueprint
                  </p>
                  <div className='text-xs text-gray-500'>
                    • 8-12 modules • 3-5 lessons each • 15-30s generation • ~4K
                    tokens
                  </div>
                </button>

                <button
                  onClick={() => setDetailLevel('detailed')}
                  disabled={isGenerating}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    detailLevel === 'detailed'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                  }`}
                >
                  <div className='flex items-center gap-3 mb-2'>
                    <Crown
                      size={18}
                      className={
                        detailLevel === 'detailed'
                          ? 'text-[#D4AF37]'
                          : 'text-gray-400'
                      }
                    />
                    <h3
                      className={`font-medium ${
                        detailLevel === 'detailed'
                          ? 'text-[#D4AF37]'
                          : 'text-[#EDEDED]'
                      }`}
                    >
                      Detailed Mode
                    </h3>
                    <span className='px-2 py-1 bg-[#D4AF37] text-black text-xs rounded-full font-bold'>
                      PRO
                    </span>
                  </div>
                  <p className='text-sm text-gray-400 mb-2'>
                    Ultra-comprehensive blueprint
                  </p>
                  <div className='text-xs text-gray-500'>
                    • 12-20 modules • 5-8 lessons each • 30-60s generation • ~8K
                    tokens
                  </div>
                </button>
              </div>

              {detailLevel === 'detailed' && (
                <div className='ml-11 bg-gradient-to-r from-[#D4AF37]/10 to-purple-500/10 border border-[#D4AF37]/20 rounded-lg p-3'>
                  <div className='flex items-center gap-2 text-[#D4AF37] text-sm font-medium mb-1'>
                    <Sparkles size={14} />
                    Detailed Mode Features
                  </div>
                  <ul className='text-xs text-gray-300 space-y-1'>
                    <li>• 2-3x more comprehensive content</li>
                    <li>• Extended marketing strategies (8-10 angles)</li>
                    <li>• Detailed implementation roadmaps</li>
                    <li>• Multiple bonus offerings (5-6 bonuses)</li>
                    <li>• Comprehensive revenue projections</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <div className='text-center space-y-6'>
            <button
              onClick={generateProduct}
              disabled={!canGenerate || isGenerating}
              className={`h-14 px-12 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 mx-auto shadow-2xl ${
                canGenerate && !isGenerating
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#DAB543] text-black hover:shadow-[#D4AF37]/50 hover:scale-105'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={20} className='animate-spin' />
                  Generating Your Product Empire...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Complete Product Blueprint
                </>
              )}
            </button>

            {!canGenerate && (
              <p className='text-gray-400'>
                Complete all steps above to generate your product blueprint
              </p>
            )}
          </div>

          {/* Results */}
          {generatedProduct && (
            <div className='space-y-8'>
              {/* Success Header */}
              <div className='text-center space-y-4'>
                <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-green-500/20 border border-[#D4AF37]/30 rounded-full px-4 py-2 text-[#D4AF37] text-sm font-medium'>
                  <CheckCircle size={14} />
                  Product Blueprint {isFromHistory ? 'Loaded' : 'Generated'}
                </div>
                <h2 className='text-3xl font-bold text-[#EDEDED]'>
                  {generatedProduct.title}
                </h2>
                <p className='text-gray-400 max-w-2xl mx-auto'>
                  {isFromHistory
                    ? 'Loaded from your product history. All export and copy functions are available.'
                    : 'Your complete digital product blueprint is ready. Everything from pricing to launch strategy.'}
                </p>
              </div>

              {/* Tab Navigation - Only show tabs with content */}
              <div className='max-w-6xl mx-auto'>
                <div className='flex overflow-x-auto gap-2 pb-2'>
                  {availableTabs.map((tab) => {
                    const IconComponent = tab.icon || FileText
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-[#D4AF37] text-black'
                            : 'bg-[#1E1E21] text-gray-400 hover:text-[#EDEDED] hover:bg-[#2A2A2D]'
                        }`}
                      >
                        <IconComponent size={14} />
                        {tab.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tab Content - Only show content that exists */}
              <div className='max-w-6xl mx-auto'>
                <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6'>
                  {/* Overview Tab */}
                  {activeTab === 'overview' &&
                    hasTabContent('overview', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Product Overview
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                generatedProduct.overview,
                                'overview'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            {copyFeedback.overview?.type === 'success' ? (
                              <>
                                <CheckCircle size={14} />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className='text-gray-300 leading-relaxed'>
                          {generatedProduct.overview}
                        </p>
                      </div>
                    )}

                  {/* Product Outline Tab */}
                  {activeTab === 'outline' &&
                    hasTabContent('outline', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Product Structure
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                JSON.stringify(
                                  generatedProduct.outline,
                                  null,
                                  2
                                ),
                                'outline'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Outline
                          </button>
                        </div>
                        <div className='space-y-4'>
                          {generatedProduct.outline.modules.map(
                            (module, index) => (
                              <div
                                key={index}
                                className='bg-[#1E1E21] rounded-lg p-4'
                              >
                                <h4 className='font-medium text-[#EDEDED] mb-2'>
                                  Module {index + 1}: {module.title}
                                </h4>
                                <p className='text-gray-400 text-sm mb-3'>
                                  {module.description}
                                </p>
                                <div className='space-y-2'>
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <div
                                      key={lessonIndex}
                                      className='flex items-center gap-2 text-sm text-gray-300'
                                    >
                                      <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full'></div>
                                      {lesson}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Pricing Tab */}
                  {activeTab === 'pricing' &&
                    hasTabContent('pricing', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Pricing Strategy
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                JSON.stringify(
                                  generatedProduct.pricing,
                                  null,
                                  2
                                ),
                                'pricing'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Pricing
                          </button>
                        </div>

                        <div className='grid gap-6'>
                          <div className='bg-[#1E1E21] rounded-lg p-6 text-center'>
                            <div className='text-3xl font-bold text-[#D4AF37] mb-2'>
                              {generatedProduct.pricing.mainPrice}
                            </div>
                            <div className='text-[#EDEDED] mb-4'>
                              Main Offer Price
                            </div>
                            <div className='text-sm text-gray-400'>
                              {generatedProduct.pricing.strategy}
                            </div>
                          </div>

                          <div>
                            <h4 className='font-medium text-[#EDEDED] mb-3'>
                              Payment Options:
                            </h4>
                            <div className='grid gap-2'>
                              {generatedProduct.pricing.paymentPlans.map(
                                (plan, index) => (
                                  <div
                                    key={index}
                                    className='bg-[#1E1E21] rounded-lg p-3 flex items-center gap-3'
                                  >
                                    <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                                    <span className='text-gray-300'>
                                      {plan}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Marketing Tab */}
                  {activeTab === 'marketing' &&
                    hasTabContent('marketing', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Marketing Strategy
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                generatedProduct.marketing.angles.join('\n'),
                                'marketing'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Angles
                          </button>
                        </div>

                        <div className='space-y-4'>
                          <h4 className='font-medium text-[#EDEDED]'>
                            Marketing Angles:
                          </h4>
                          {generatedProduct.marketing.angles.map(
                            (angle, index) => (
                              <div
                                key={index}
                                className='bg-[#1E1E21] rounded-lg p-4'
                              >
                                <div className='flex items-start gap-3'>
                                  <div className='flex-shrink-0 w-6 h-6 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-xs font-bold'>
                                    {index + 1}
                                  </div>
                                  <p className='text-gray-300 leading-relaxed'>
                                    {angle}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Bonuses Tab */}
                  {activeTab === 'bonuses' &&
                    hasTabContent('bonuses', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Bonus Ideas
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                JSON.stringify(
                                  generatedProduct.bonuses,
                                  null,
                                  2
                                ),
                                'bonuses'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Bonuses
                          </button>
                        </div>

                        <div className='space-y-4'>
                          {generatedProduct.bonuses.map((bonus, index) => (
                            <div
                              key={index}
                              className='bg-[#1E1E21] rounded-lg p-4'
                            >
                              <div className='flex items-start gap-3'>
                                <div className='flex-shrink-0 w-8 h-8 bg-gradient-to-r from-[#D4AF37] to-[#DAB543] text-black rounded-lg flex items-center justify-center text-sm font-bold'>
                                  {index + 1}
                                </div>
                                <div className='flex-1'>
                                  <h4 className='font-medium text-[#EDEDED] mb-2'>
                                    {bonus.title}
                                  </h4>
                                  <p className='text-gray-300 text-sm leading-relaxed'>
                                    {bonus.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Launch Tab */}
                  {activeTab === 'launch' &&
                    hasTabContent('launch', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Launch Sequence
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                JSON.stringify(
                                  generatedProduct.launch,
                                  null,
                                  2
                                ),
                                'launch'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Launch
                          </button>
                        </div>

                        <div className='space-y-4'>
                          {generatedProduct.launch.sequence.map(
                            (step, index) => (
                              <div
                                key={index}
                                className='bg-[#1E1E21] rounded-lg p-4'
                              >
                                <div className='flex items-start gap-4'>
                                  <div className='flex-shrink-0 w-10 h-10 bg-gradient-to-r from-[#D4AF37] to-[#DAB543] text-black rounded-lg flex items-center justify-center font-bold'>
                                    {step.day}
                                  </div>
                                  <div className='flex-1'>
                                    <h4 className='font-medium text-[#EDEDED] mb-2'>
                                      Day {step.day}: {step.title}
                                    </h4>
                                    <p className='text-gray-300 text-sm leading-relaxed'>
                                      {step.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Sales Tab */}
                  {activeTab === 'sales' &&
                    hasTabContent('sales', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Sales Copy
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                `${generatedProduct.sales.headline}\n\n${
                                  generatedProduct.sales.subheadline
                                }\n\n${generatedProduct.sales.bulletPoints.join(
                                  '\n'
                                )}`,
                                'sales'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Sales Copy
                          </button>
                        </div>

                        <div className='space-y-6'>
                          <div className='bg-[#1E1E21] rounded-lg p-6'>
                            <h4 className='font-medium text-[#EDEDED] mb-3'>
                              Headline:
                            </h4>
                            <p className='text-2xl font-bold text-[#D4AF37] leading-tight'>
                              {generatedProduct.sales.headline}
                            </p>
                          </div>

                          <div className='bg-[#1E1E21] rounded-lg p-6'>
                            <h4 className='font-medium text-[#EDEDED] mb-3'>
                              Subheadline:
                            </h4>
                            <p className='text-lg text-gray-300 leading-relaxed'>
                              {generatedProduct.sales.subheadline}
                            </p>
                          </div>

                          <div className='bg-[#1E1E21] rounded-lg p-6'>
                            <h4 className='font-medium text-[#EDEDED] mb-3'>
                              Key Benefits:
                            </h4>
                            <div className='space-y-3'>
                              {generatedProduct.sales.bulletPoints.map(
                                (point, index) => (
                                  <div
                                    key={index}
                                    className='flex items-start gap-3'
                                  >
                                    <div className='w-2 h-2 bg-[#D4AF37] rounded-full mt-2 flex-shrink-0'></div>
                                    <p className='text-gray-300'>{point}</p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Technical Tab */}
                  {activeTab === 'technical' &&
                    hasTabContent('technical', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Technical Requirements
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                generatedProduct.technical.requirements.join(
                                  '\n'
                                ),
                                'technical'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Technical
                          </button>
                        </div>

                        <div className='bg-[#1E1E21] rounded-lg p-6'>
                          <div className='space-y-3'>
                            {generatedProduct.technical.requirements.map(
                              (requirement, index) => (
                                <div
                                  key={index}
                                  className='flex items-start gap-3'
                                >
                                  <div className='w-2 h-2 bg-[#D4AF37] rounded-full mt-2 flex-shrink-0'></div>
                                  <p className='text-gray-300'>{requirement}</p>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Revenue Tab */}
                  {activeTab === 'revenue' &&
                    hasTabContent('revenue', generatedProduct) && (
                      <div className='space-y-6'>
                        <div className='flex items-center justify-between'>
                          <h3 className='text-xl font-semibold text-[#EDEDED]'>
                            Revenue Model
                          </h3>
                          <button
                            onClick={() =>
                              handleCopyContent(
                                JSON.stringify(
                                  generatedProduct.revenue,
                                  null,
                                  2
                                ),
                                'revenue'
                              )
                            }
                            disabled={isCopying}
                            className='flex items-center gap-2 px-3 py-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50'
                          >
                            <Copy size={14} />
                            Copy Revenue
                          </button>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                          {Object.entries(generatedProduct.revenue).map(
                            ([key, value], index) => (
                              <div
                                key={index}
                                className='bg-[#1E1E21] rounded-lg p-4'
                              >
                                <h4 className='font-medium text-[#EDEDED] mb-2'>
                                  {key}
                                </h4>
                                <p className='text-2xl font-bold text-[#D4AF37]'>
                                  {value}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Professional Export Options */}
              <div className='text-center space-y-6'>
                <ExportOptions
                  generationId={generationId}
                  productTitle={generatedProduct.title}
                />

                <div className='flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto'>
                  <button
                    onClick={generateProduct}
                    disabled={isGenerating || !canGenerate}
                    className='flex-1 bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#D4AF37] text-[#D4AF37] h-12 rounded-xl font-semibold hover:bg-[#D4AF37]/10 transition-all duration-200 flex items-center justify-center gap-2'
                  >
                    <RefreshCw size={16} />
                    Generate New Product
                  </button>
                </div>

                <button
                  onClick={() => {
                    setGeneratedProduct(null)
                    setGenerationId(null)
                    setLoadedProductData(null)
                    setIsFromHistory(false)
                    setCopyFeedback({})
                  }}
                  className='text-[#D4AF37] hover:underline text-sm'
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {/* Stats */}
          {userStats?.data?.stats && (
            <div className='grid grid-cols-1 sm:grid-cols-4 gap-4 max-w-4xl mx-auto'>
              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4 text-center'>
                <div className='text-2xl font-bold text-[#D4AF37] mb-1'>
                  {userStats.data.stats.totalProducts}
                </div>
                <div className='text-gray-400 text-sm'>Products Generated</div>
              </div>
              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4 text-center'>
                <div className='text-2xl font-bold text-[#D4AF37] mb-1'>
                  {userStats.data.stats.averagePrice}
                </div>
                <div className='text-gray-400 text-sm'>Avg. Product Price</div>
              </div>
              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4 text-center'>
                <div className='text-2xl font-bold text-[#D4AF37] mb-1'>
                  {userStats.data.stats.totalRevenue}
                </div>
                <div className='text-gray-400 text-sm'>Revenue Potential</div>
              </div>
              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-4 text-center'>
                <div className='text-2xl font-bold text-[#D4AF37] mb-1'>
                  {userStats.data.stats.successRate}%
                </div>
                <div className='text-gray-400 text-sm'>Success Rate</div>
              </div>
            </div>
          )}
        </div>
      </PlanGate>
    </Layout>
  )
}

export default ProductGenerator
