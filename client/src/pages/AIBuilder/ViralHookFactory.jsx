// File: client/src/pages/AIBuilder/ViralHookFactory.jsx
import {
  AlertCircle,
  Book,
  BookOpen,
  Brain,
  Briefcase,
  CheckCircle,
  ChefHat,
  Copy,
  Crown,
  DollarSign,
  Dumbbell,
  Flame,
  Heart,
  HelpCircle,
  Instagram,
  Laptop,
  Leaf,
  Linkedin,
  Mail,
  MessageCircle,
  Music,
  Plane,
  RefreshCw,
  Rocket,
  Shirt,
  Target,
  TrendingUp,
  Twitter,
  Wand2,
  Youtube,
  Zap,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { useSelector } from 'react-redux'
import Layout from '../Layout/Layout'

import PlanGate from '@/components/Layout/PlanGate'
import { useCopyHook, useGenerateHooks, useHookStats } from '@/hooks/useHooks'
import { selectCurrentUser, selectIsAuthenticated } from '@/redux/userSlice'

const ViralHookFactory = () => {
  const [selectedNiche, setSelectedNiche] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedTone, setSelectedTone] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [generatedHooks, setGeneratedHooks] = useState([])
  const [generationId, setGenerationId] = useState(null)
  const [copyFeedback, setCopyFeedback] = useState({})

  // Hooks
  const generateHooksMutation = useGenerateHooks()
  const { copyHook, isLoading: isCopying } = useCopyHook()
  const { data: userStats } = useHookStats()

  // Redux selectors
  const currentUser = useSelector(selectCurrentUser)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'tiktok', name: 'TikTok', icon: Music },
    { id: 'twitter', name: 'Twitter', icon: Twitter },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'youtube', name: 'YouTube', icon: Youtube },
  ]

  const niches = [
    { id: 'entrepreneurship', name: 'Entrepreneurship', icon: Briefcase },
    { id: 'fitness', name: 'Fitness', icon: Dumbbell },
    { id: 'relationships', name: 'Relationships', icon: Heart },
    { id: 'finance', name: 'Personal Finance', icon: DollarSign },
    { id: 'self-improvement', name: 'Self-Improvement', icon: Rocket },
    { id: 'technology', name: 'Technology', icon: Laptop },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp },
    { id: 'health', name: 'Health & Wellness', icon: Leaf },
    { id: 'travel', name: 'Travel', icon: Plane },
    { id: 'education', name: 'Education', icon: BookOpen },
    { id: 'fashion', name: 'Fashion', icon: Shirt },
    { id: 'food', name: 'Food & Cooking', icon: ChefHat },
  ]

  const tones = [
    {
      id: 'urgent',
      name: 'Urgent',
      description: 'Creates FOMO and immediate action',
      icon: Zap,
    },
    {
      id: 'controversial',
      name: 'Controversial',
      description: 'Sparks debate and engagement',
      icon: Flame,
    },
    {
      id: 'curiosity',
      name: 'Curiosity Gap',
      description: 'Makes people want to know more',
      icon: HelpCircle,
    },
    {
      id: 'emotional',
      name: 'Emotional',
      description: 'Triggers emotional responses',
      icon: Brain,
    },
    {
      id: 'authority',
      name: 'Authority',
      description: 'Positions you as the expert',
      icon: Crown,
    },
    {
      id: 'storytelling',
      name: 'Story-driven',
      description: 'Hooks through narrative',
      icon: Book,
    },
  ]

  const generateHooks = async () => {
    if (!selectedPlatform || !selectedNiche || !selectedTone) return

    const hookData = {
      platform: selectedPlatform,
      niche: selectedNiche,
      tone: selectedTone,
      customPrompt: customPrompt.trim() || undefined,
    }

    try {
      const result = await generateHooksMutation.mutateAsync(hookData)

      if (result.status === 'success' && result.data) {
        setGeneratedHooks(result.data.hooks || [])
        setGenerationId(result.data.id)
      }
    } catch (error) {
      console.error('Generation failed:', error)
      // Error is handled by the mutation's onError
    }
  }

  const handleCopyHook = async (hookContent, hookIndex) => {
    try {
      const result = await copyHook(hookContent, generationId, hookIndex)

      if (result.success) {
        // Show success feedback
        setCopyFeedback((prev) => ({
          ...prev,
          [hookIndex]: { type: 'success', message: 'Copied!' },
        }))

        // Clear feedback after 2 seconds
        setTimeout(() => {
          setCopyFeedback((prev) => ({
            ...prev,
            [hookIndex]: null,
          }))
        }, 2000)
      }
    } catch (error) {
      setCopyFeedback((prev) => ({
        ...prev,
        [hookIndex]: { type: 'error', message: 'Failed to copy' },
      }))

      setTimeout(() => {
        setCopyFeedback((prev) => ({
          ...prev,
          [hookIndex]: null,
        }))
      }, 2000)
    }
  }

  const copyAllHooks = async () => {
    const allHooksText = generatedHooks.join('\n\n')
    try {
      await navigator.clipboard.writeText(allHooksText)
      setCopyFeedback({
        all: { type: 'success', message: 'All hooks copied!' },
      })
      setTimeout(() => setCopyFeedback({}), 2000)
    } catch (error) {
      setCopyFeedback({ all: { type: 'error', message: 'Failed to copy all' } })
      setTimeout(() => setCopyFeedback({}), 2000)
    }
  }

  const canGenerate = selectedPlatform && selectedNiche && selectedTone
  const isGenerating = generateHooksMutation.isPending

  return (
    <Layout>
      <PlanGate requiredFeature='viral-hooks'>
        <div className='max-w-7xl mx-auto p-4 sm:p-6 space-y-6'>
          {/* Header */}
          <div className='text-center space-y-4'>
            <div className='inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full px-4 py-2 text-[#D4AF37] text-sm font-medium'>
              <MessageCircle size={14} />
              Viral Hook Factory
            </div>

            <h1 className='text-3xl sm:text-4xl font-bold text-[#EDEDED] mb-2'>
              Generate Viral Hooks
            </h1>
            <p className='text-gray-400 max-w-2xl mx-auto'>
              Create scroll-stopping hooks that grab attention and drive
              engagement. Get 5 professional hooks tailored to your niche and
              platform.
            </p>
          </div>

          {/* Error Display */}
          {generateHooksMutation.isError && (
            <div className='max-w-2xl mx-auto'>
              <div className='bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3'>
                <AlertCircle size={20} className='text-red-400 flex-shrink-0' />
                <div>
                  <p className='text-red-400 font-medium'>Generation Failed</p>
                  <p className='text-red-300 text-sm'>
                    {generateHooksMutation.error?.response?.data?.message ||
                      generateHooksMutation.error?.message ||
                      'Something went wrong. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Configuration Steps */}
          <div className='space-y-6'>
            {/* Step 1: Platform */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    selectedPlatform
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  1
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Choose Platform
                </h2>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 ml-8'>
                {platforms.map((platform) => {
                  const IconComponent = platform.icon
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(platform.id)}
                      disabled={isGenerating}
                      className={`h-10 px-3 rounded-lg border transition-all duration-200 text-sm font-medium disabled:opacity-50 ${
                        selectedPlatform === platform.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] text-gray-400 hover:border-[#D4AF37]/30 hover:text-[#EDEDED]'
                      }`}
                    >
                      <div className='flex items-center gap-1.5'>
                        <IconComponent size={14} />
                        <span className='hidden sm:inline'>
                          {platform.name}
                        </span>
                        <span className='sm:hidden'>
                          {platform.name.slice(0, 4)}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Niche */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    selectedNiche
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  2
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Select Niche
                </h2>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 ml-8'>
                {niches.map((niche) => {
                  const IconComponent = niche.icon
                  return (
                    <button
                      key={niche.id}
                      onClick={() => setSelectedNiche(niche.id)}
                      disabled={isGenerating}
                      className={`h-10 px-3 rounded-lg border transition-all duration-200 text-sm font-medium disabled:opacity-50 ${
                        selectedNiche === niche.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] text-gray-400 hover:border-[#D4AF37]/30 hover:text-[#EDEDED]'
                      }`}
                    >
                      <div className='flex items-center gap-1.5'>
                        <IconComponent size={14} />
                        <span className='truncate'>{niche.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 3: Hook Style */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    selectedTone
                      ? 'border-[#D4AF37] bg-[#D4AF37] text-black'
                      : 'border-gray-600 text-gray-400'
                  }`}
                >
                  3
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Hook Style
                </h2>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-8'>
                {tones.map((tone) => {
                  const IconComponent = tone.icon
                  return (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      disabled={isGenerating}
                      className={`p-3 rounded-lg border transition-all duration-200 text-left disabled:opacity-50 ${
                        selectedTone === tone.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                          : 'border-[#1E1E21] bg-gradient-to-br from-[#121214] to-[#0A0A0C] hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className='flex items-center gap-2 mb-1'>
                        <IconComponent size={16} />
                        <div
                          className={`font-medium text-sm ${
                            selectedTone === tone.id
                              ? 'text-[#D4AF37]'
                              : 'text-[#EDEDED]'
                          }`}
                        >
                          {tone.name}
                        </div>
                      </div>
                      <div className='text-xs text-gray-400'>
                        {tone.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 4: Context */}
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full border-2 border-gray-600 text-gray-400 flex items-center justify-center text-xs font-bold'>
                  4
                </div>
                <h2 className='text-lg font-semibold text-[#EDEDED]'>
                  Context (Optional)
                </h2>
              </div>

              <div className='ml-8'>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  disabled={isGenerating}
                  placeholder='Add specific details about your content or target audience...'
                  className='w-full max-w-2xl bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-lg px-4 py-3 text-[#EDEDED] placeholder-gray-400 focus:outline-none focus:border-[#D4AF37]/40 h-20 resize-none text-sm disabled:opacity-50'
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className='text-center space-y-4'>
            <button
              onClick={generateHooks}
              disabled={!canGenerate || isGenerating}
              className={`h-10 px-8 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 mx-auto ${
                canGenerate && !isGenerating
                  ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={16} className='animate-spin' />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Generate 5 Hooks
                </>
              )}
            </button>

            {!canGenerate && (
              <p className='text-gray-400 text-sm'>
                Complete steps 1-3 to generate hooks
              </p>
            )}
          </div>

          {/* Results */}
          {generatedHooks.length > 0 && (
            <div className='space-y-8'>
              {/* Success Header */}
              <div className='text-center space-y-4'>
                <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-4 py-2 text-[#D4AF37] text-sm font-medium'>
                  <Target size={14} />
                  Generation Complete
                </div>
                <h2 className='text-2xl font-bold text-[#EDEDED]'>
                  Your Viral Hooks Are Ready!
                </h2>
                <p className='text-gray-400'>
                  5 scroll-stopping hooks tailored for {selectedPlatform} •{' '}
                  {niches.find((n) => n.id === selectedNiche)?.name} •{' '}
                  {tones.find((t) => t.id === selectedTone)?.name} style
                </p>
              </div>

              {/* Hooks Grid */}
              <div className='max-w-5xl mx-auto'>
                <div className='grid gap-4'>
                  {generatedHooks.map((hook, index) => (
                    <div key={index} className='relative group'>
                      <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6 hover:border-[#D4AF37]/40 hover:shadow-lg hover:shadow-[#D4AF37]/5 transition-all duration-300'>
                        <div className='flex items-start gap-4'>
                          <div className='flex-shrink-0'>
                            <div className='w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#DAB543] text-black rounded-lg flex items-center justify-center font-bold'>
                              {index + 1}
                            </div>
                          </div>

                          <div className='flex-1 min-w-0'>
                            <div className='mb-4'>
                              <p className='text-[#EDEDED] leading-relaxed text-lg'>
                                {hook}
                              </p>
                            </div>

                            <div className='flex items-center gap-4 text-xs'>
                              <div className='flex items-center gap-1 text-gray-400'>
                                <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                                <span>High Impact</span>
                              </div>
                              <div className='flex items-center gap-1 text-gray-400'>
                                <div className='w-2 h-2 bg-blue-400 rounded-full'></div>
                                <span>Engaging</span>
                              </div>
                              <div className='flex items-center gap-1 text-gray-400'>
                                <div className='w-2 h-2 bg-purple-400 rounded-full'></div>
                                <span>Shareable</span>
                              </div>
                            </div>
                          </div>

                          <div className='flex-shrink-0'>
                            <button
                              onClick={() => handleCopyHook(hook, index)}
                              disabled={isCopying}
                              className='opacity-0 group-hover:opacity-100 transition-all duration-200 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] h-8 px-3 rounded-lg flex items-center gap-2 text-sm font-medium disabled:opacity-50'
                            >
                              {copyFeedback[index]?.type === 'success' ? (
                                <>
                                  <CheckCircle size={14} />
                                  {copyFeedback[index].message}
                                </>
                              ) : (
                                <>
                                  <Copy size={14} />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='space-y-4'>
                <div className='flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto'>
                  <button
                    onClick={copyAllHooks}
                    className='flex-1 bg-[#D4AF37] text-black h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/90 transition-all duration-200 flex items-center justify-center gap-2'
                  >
                    {copyFeedback.all?.type === 'success' ? (
                      <>
                        <CheckCircle size={16} />
                        {copyFeedback.all.message}
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy All Hooks
                      </>
                    )}
                  </button>
                  <button
                    onClick={generateHooks}
                    disabled={isGenerating || !canGenerate}
                    className='flex-1 bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#D4AF37] text-[#D4AF37] h-10 rounded-xl font-semibold hover:bg-[#D4AF37]/10 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50'
                  >
                    <RefreshCw size={16} />
                    Generate New Set
                  </button>
                </div>

                <div className='text-center'>
                  <p className='text-gray-400 text-sm mb-3'>
                    Want to try different settings?
                  </p>
                  <button
                    onClick={() => setGeneratedHooks([])}
                    className='text-[#D4AF37] hover:underline text-sm'
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {generatedHooks.length === 0 && !isGenerating && (
            <div className='text-center space-y-4 py-8'>
              <div className='bg-[#D4AF37]/10 rounded-full p-4 w-fit mx-auto'>
                <Target size={24} className='text-[#D4AF37]' />
              </div>
              <div className='space-y-2'>
                <h3 className='text-lg font-semibold text-[#EDEDED]'>
                  Ready to Go Viral?
                </h3>
                <p className='text-gray-400 text-sm max-w-md mx-auto'>
                  Follow the steps above to generate hooks that will stop the
                  scroll.
                </p>
              </div>

              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-lg p-4 max-w-md mx-auto'>
                <div className='text-xs text-[#D4AF37] mb-2 text-left'>
                  Example:
                </div>
                <div className='text-[#EDEDED] text-left text-sm'>
                  "Stop scrolling if you've ever felt like giving up on your
                  dreams..."
                </div>
              </div>
            </div>
          )}

          {/* User Stats */}
          {userStats?.data?.stats && (
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto'>
              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-lg p-4 text-center'>
                <div className='text-xl font-bold text-[#D4AF37] mb-1'>
                  {userStats.data.stats.totalGenerations || 0}
                </div>
                <div className='text-gray-400 text-sm'>Generations</div>
              </div>
              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-lg p-4 text-center'>
                <div className='text-xl font-bold text-[#D4AF37] mb-1'>
                  {userStats.data.stats.totalHooks || 0}
                </div>
                <div className='text-gray-400 text-sm'>Total Hooks</div>
              </div>
              <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-lg p-4 text-center'>
                <div className='text-xl font-bold text-[#D4AF37] mb-1'>
                  {userStats.data.stats.copyRate || 0}%
                </div>
                <div className='text-gray-400 text-sm'>Copy Rate</div>
              </div>
            </div>
          )}
        </div>
      </PlanGate>
    </Layout>
  )
}

export default ViralHookFactory
