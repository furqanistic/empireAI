// File: client/src/pages/AIBuilder/NicheLaunchpad.jsx - WITH BUSINESS PLAN HISTORY
import { selectCurrentUser, selectIsAuthenticated } from '@/redux/userSlice'
import {
  AlertCircle,
  BarChart3,
  Book,
  Briefcase,
  Calendar,
  CheckCircle,
  ChefHat,
  DollarSign,
  Download,
  Dumbbell,
  GamepadIcon,
  Home,
  Laptop,
  Palette,
  PawPrint,
  Plane,
  RefreshCw,
  Rocket,
  Shirt,
  Target,
  TrendingUp,
  Users,
  Wand2,
  Zap,
} from 'lucide-react'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
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
import Layout from '../Layout/Layout'
// Import business plan hooks and history component
import BusinessCharts from '@/components/AIBuilder/BusinessCharts'
import BusinessPlanHistory from '@/components/AIBuilder/BusinessPlanHistory' // NEW IMPORT
import PlanGate from '@/components/Layout/PlanGate'
import {
  useBusinessPlanStats,
  useDownloadBusinessPlan,
  useGenerateBusinessPlan,
} from '@/hooks/useBusinessPlans'

const NicheLaunchpad = () => {
  const [selectedNiche, setSelectedNiche] = useState('')
  const [selectedBusinessModel, setSelectedBusinessModel] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('')
  const [customContext, setCustomContext] = useState('')
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [currentPlanId, setCurrentPlanId] = useState(null) // NEW STATE
  const [error, setError] = useState(null)

  // Business plan hooks
  const generateBusinessPlanMutation = useGenerateBusinessPlan()
  const { downloadPlan, isLoading: isDownloading } = useDownloadBusinessPlan()
  const { data: userStats } = useBusinessPlanStats()

  // All your existing data arrays (niches, businessModels, markets) remain the same...
  const niches = [
    {
      id: 'fitness',
      name: 'Fitness & Health',
      icon: Dumbbell,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'tech',
      name: 'Technology & SaaS',
      icon: Laptop,
      color: 'from-blue-500 to-cyan-600',
    },
    {
      id: 'finance',
      name: 'Finance & Investment',
      icon: DollarSign,
      color: 'from-yellow-500 to-orange-600',
    },
    {
      id: 'education',
      name: 'Education & Courses',
      icon: Book,
      color: 'from-purple-500 to-violet-600',
    },
    {
      id: 'ecommerce',
      name: 'E-commerce & Retail',
      icon: Briefcase,
      color: 'from-pink-500 to-rose-600',
    },
    {
      id: 'food',
      name: 'Food & Beverage',
      icon: ChefHat,
      color: 'from-orange-500 to-red-600',
    },
    {
      id: 'travel',
      name: 'Travel & Hospitality',
      icon: Plane,
      color: 'from-teal-500 to-blue-600',
    },
    {
      id: 'fashion',
      name: 'Fashion & Beauty',
      icon: Shirt,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'pets',
      name: 'Pet Care & Services',
      icon: PawPrint,
      color: 'from-amber-500 to-yellow-600',
    },
    {
      id: 'home',
      name: 'Home & Garden',
      icon: Home,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'entertainment',
      name: 'Entertainment & Gaming',
      icon: GamepadIcon,
      color: 'from-violet-500 to-pink-600',
    },
    {
      id: 'creative',
      name: 'Creative & Art',
      icon: Palette,
      color: 'from-rose-500 to-pink-600',
    },
  ]

  const businessModels = [
    {
      id: 'saas',
      name: 'SaaS Platform',
      description: 'Software as a Service solution',
      icon: Rocket,
    },
    {
      id: 'ecommerce',
      name: 'E-commerce Store',
      description: 'Online retail business',
      icon: Briefcase,
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      description: 'Connect buyers and sellers',
      icon: Users,
    },
    {
      id: 'coaching',
      name: 'Coaching/Consulting',
      description: 'Expert services and guidance',
      icon: Target,
    },
    {
      id: 'subscription',
      name: 'Subscription Service',
      description: 'Recurring revenue model',
      icon: TrendingUp,
    },
    {
      id: 'content',
      name: 'Content/Media',
      description: 'Information and entertainment',
      icon: Book,
    },
  ]

  const markets = [
    {
      id: 'b2c',
      name: 'B2C (Consumers)',
      description: 'Direct to consumers',
      icon: Users,
    },
    {
      id: 'b2b',
      name: 'B2B (Businesses)',
      description: 'Business to business',
      icon: Briefcase,
    },
    {
      id: 'b2b2c',
      name: 'B2B2C (Hybrid)',
      description: 'Business through business to consumer',
      icon: Zap,
    },
  ]

  // NEW: Handle loading previous business plan
  const handleLoadPlan = (historyItem) => {
    setGeneratedPlan(historyItem.plan)
    setCurrentPlanId(historyItem.id)
    setSelectedNiche(historyItem.metadata.niche)
    setSelectedBusinessModel(historyItem.metadata.businessModel)
    setSelectedMarket(historyItem.metadata.targetMarket)
    setCustomContext(historyItem.metadata.customContext || '')
    setError(null)
  }

  const generateBusinessPlan = async () => {
    if (!selectedNiche || !selectedBusinessModel || !selectedMarket) return

    setError(null)
    setCurrentPlanId(null) // Clear current plan when generating new

    try {
      const result = await generateBusinessPlanMutation.mutateAsync({
        niche: selectedNiche,
        businessModel: selectedBusinessModel,
        targetMarket: selectedMarket,
        customContext: customContext || '',
      })

      setGeneratedPlan(result.data.plan)
      setCurrentPlanId(result.data.id) // Set new plan as current
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate business plan. Please try again.'
      setError(errorMessage)
      console.error('Business plan generation error:', error)
    }
  }

  const handleDownloadPlan = async () => {
    if (!generatedPlan) return

    try {
      const result = await downloadPlan(generatedPlan, 'pdf') // Use PDF format
      if (!result.success) {
        setError(result.error || 'Failed to download business plan')
      }
    } catch (error) {
      setError('Failed to download business plan')
      console.error('Download error:', error)
    }
  }

  const canGenerate = selectedNiche && selectedBusinessModel && selectedMarket
  const isGenerating = generateBusinessPlanMutation.isPending

  return (
    <Layout>
      <PlanGate requiredFeature='niche-launchpad'>
        <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6'>
          {/* Header - same as before */}
          <div className='text-center space-y-4'>
            <div className='inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-2 text-[#D4AF37] text-sm font-medium'>
              <Rocket size={14} />
              Niche Launchpad
            </div>

            <h1 className='text-3xl sm:text-4xl font-bold text-[#EDEDED] mb-2'>
              AI Business Plan Generator
            </h1>
            <p className='text-gray-400 max-w-2xl mx-auto'>
              Select a niche and let AI build the entire business plan. Complete
              with market analysis, 12-month roadmap, revenue projections, and
              interactive charts.
            </p>

            {userStats?.data?.stats && (
              <div className='inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 text-blue-400 text-sm'>
                <BarChart3 size={14} />
                Plans Generated: {userStats.data.stats.totalGenerations} |
                Downloads: {userStats.data.stats.totalDownloads}
              </div>
            )}
          </div>

          {/* NEW: Business Plan History Component */}
          <BusinessPlanHistory
            onLoadPlan={handleLoadPlan}
            currentPlanId={currentPlanId}
          />

          {/* Error Display - same as before */}
          {error && (
            <div className='max-w-2xl mx-auto'>
              <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3'>
                <AlertCircle size={20} className='text-red-400 flex-shrink-0' />
                <div>
                  <p className='text-red-400 font-medium'>Generation Failed</p>
                  <p className='text-red-300 text-sm'>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Steps - same as before */}
          <div className='space-y-6'>
            {/* Step 1: Niche - same implementation */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    selectedNiche
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  1
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Choose Your Niche
                </h2>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ml-8'>
                {niches.map((niche) => {
                  const IconComponent = niche.icon
                  return (
                    <button
                      key={niche.id}
                      onClick={() => setSelectedNiche(niche.id)}
                      disabled={isGenerating}
                      className={`p-3 rounded-lg border transition-all duration-200 text-left disabled:opacity-50 group ${
                        selectedNiche === niche.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className='flex items-center gap-2 mb-1'>
                        <div
                          className={`p-1.5 rounded-md bg-gradient-to-br ${niche.color} text-white`}
                        >
                          <IconComponent size={14} />
                        </div>
                        <div
                          className={`font-medium text-sm ${
                            selectedNiche === niche.id
                              ? 'text-[#D4AF37]'
                              : 'text-[#EDEDED] group-hover:text-[#D4AF37]'
                          }`}
                        >
                          {niche.name}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Business Model - same implementation */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    selectedBusinessModel
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  2
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Select Business Model
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-8'>
                {businessModels.map((model) => {
                  const IconComponent = model.icon
                  return (
                    <button
                      key={model.id}
                      onClick={() => setSelectedBusinessModel(model.id)}
                      disabled={isGenerating}
                      className={`p-4 rounded-lg border transition-all duration-200 text-left disabled:opacity-50 ${
                        selectedBusinessModel === model.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className='flex items-center gap-3 mb-2'>
                        <IconComponent
                          size={18}
                          className={
                            selectedBusinessModel === model.id
                              ? 'text-[#D4AF37]'
                              : 'text-gray-400'
                          }
                        />
                        <div
                          className={`font-medium text-sm ${
                            selectedBusinessModel === model.id
                              ? 'text-[#D4AF37]'
                              : 'text-[#EDEDED]'
                          }`}
                        >
                          {model.name}
                        </div>
                      </div>
                      <div className='text-xs text-gray-400'>
                        {model.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Target Market - same implementation */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    selectedMarket
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  3
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Define Target Market
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 ml-8'>
                {markets.map((market) => {
                  const IconComponent = market.icon
                  return (
                    <button
                      key={market.id}
                      onClick={() => setSelectedMarket(market.id)}
                      disabled={isGenerating}
                      className={`p-4 rounded-lg border transition-all duration-200 text-center disabled:opacity-50 ${
                        selectedMarket === market.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <IconComponent
                          size={24}
                          className={
                            selectedMarket === market.id
                              ? 'text-[#D4AF37]'
                              : 'text-gray-400'
                          }
                        />
                        <div
                          className={`font-medium text-sm ${
                            selectedMarket === market.id
                              ? 'text-[#D4AF37]'
                              : 'text-[#EDEDED]'
                          }`}
                        >
                          {market.name}
                        </div>
                        <div className='text-xs text-gray-400'>
                          {market.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 4: Additional Context - same implementation */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full border-2 border-gray-600 text-gray-400 flex items-center justify-center text-xs font-bold'>
                  4
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Additional Context (Optional)
                </h2>
              </div>

              <div className='ml-8'>
                <textarea
                  value={customContext}
                  onChange={(e) => setCustomContext(e.target.value)}
                  disabled={isGenerating}
                  placeholder='Add specific details about your vision, target audience, unique value proposition, or any constraints...'
                  className='w-full max-w-2xl bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-lg px-4 py-3 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 h-24 resize-none text-sm disabled:opacity-50'
                  maxLength={1000}
                />
                <p className='text-xs text-gray-500 mt-1'>
                  {customContext.length}/1000 characters
                </p>
              </div>
            </div>
          </div>

          {/* Generate Button - same as before */}
          <div className='text-center space-y-4'>
            <button
              onClick={generateBusinessPlan}
              disabled={!canGenerate || isGenerating}
              className={`h-12 px-8 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 mx-auto text-lg ${
                canGenerate && !isGenerating
                  ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className='animate-spin' />
                  Generating Business Plan...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Generate Complete Business Plan
                </>
              )}
            </button>

            {!canGenerate && (
              <p className='text-gray-400 text-sm'>
                Complete steps 1-3 to generate your business plan
              </p>
            )}
          </div>

          {/* Results with Charts - same as before but with updated download button */}
          {generatedPlan && (
            <div className='space-y-8'>
              {/* Success Header */}
              <div className='text-center space-y-4'>
                <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-4 py-2 text-[#D4AF37] text-sm font-medium'>
                  <CheckCircle size={14} />
                  Business Plan Ready
                </div>
                <h2 className='text-2xl font-bold text-[#EDEDED]'>
                  {generatedPlan.title}
                </h2>
                <p className='text-gray-400'>
                  Complete business plan for{' '}
                  {niches.find((n) => n.id === selectedNiche)?.name} •{' '}
                  {
                    businessModels.find((m) => m.id === selectedBusinessModel)
                      ?.name
                  }{' '}
                  • {markets.find((m) => m.id === selectedMarket)?.name}
                </p>
              </div>

              {/* Plan Content with Charts - same as before */}
              <div className='max-w-7xl mx-auto space-y-8'>
                {/* Comprehensive Business Charts Section */}
                <BusinessCharts
                  generatedPlan={generatedPlan}
                  niche={selectedNiche}
                  businessModel={selectedBusinessModel}
                />
              </div>

              {/* Action Buttons with PDF download */}
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto'>
                  <button
                    onClick={handleDownloadPlan}
                    disabled={isDownloading}
                    className='flex-1 bg-[#D4AF37] text-black h-12 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50'
                  >
                    {isDownloading ? (
                      <>
                        <RefreshCw size={16} className='animate-spin' />
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Download PDF Report
                      </>
                    )}
                  </button>
                  <button
                    onClick={generateBusinessPlan}
                    disabled={isGenerating || !canGenerate}
                    className='flex-1 bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#D4AF37] text-[#D4AF37] h-12 rounded-xl font-semibold hover:bg-[#D4AF37]/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50'
                  >
                    <RefreshCw size={16} />
                    Generate New Plan
                  </button>
                </div>

                <div className='text-center'>
                  <p className='text-gray-400 text-sm mb-3'>
                    Want to explore a different niche?
                  </p>
                  <button
                    onClick={() => {
                      setGeneratedPlan(null)
                      setCurrentPlanId(null)
                      setError(null)
                    }}
                    className='text-[#D4AF37] hover:underline text-sm'
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State - same as before */}
          {!generatedPlan && !isGenerating && (
            <div className='text-center space-y-4 py-8'>
              <div className='bg-[#D4AF37]/10 rounded-full p-4 w-fit mx-auto'>
                <Rocket size={24} className='text-[#D4AF37]' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold text-[#EDEDED]'>
                  Ready to Launch Your Business?
                </h3>
                <p className='text-gray-400 text-sm max-w-md mx-auto'>
                  Follow the steps above to generate a comprehensive business
                  plan with AI and interactive charts.
                </p>
              </div>

              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-lg p-6 max-w-2xl mx-auto'>
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 text-center'>
                  <div>
                    <div className='text-[#D4AF37] text-lg font-bold'>📊</div>
                    <div className='text-xs text-gray-400 mt-1'>
                      Market Analysis
                    </div>
                  </div>
                  <div>
                    <div className='text-[#D4AF37] text-lg font-bold'>📈</div>
                    <div className='text-xs text-gray-400 mt-1'>
                      Revenue Charts
                    </div>
                  </div>
                  <div>
                    <div className='text-[#D4AF37] text-lg font-bold'>📅</div>
                    <div className='text-xs text-gray-400 mt-1'>
                      Timeline Roadmap
                    </div>
                  </div>
                  <div>
                    <div className='text-[#D4AF37] text-lg font-bold'>🚀</div>
                    <div className='text-xs text-gray-400 mt-1'>
                      Product Insights
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PlanGate>
    </Layout>
  )
}

export default NicheLaunchpad
