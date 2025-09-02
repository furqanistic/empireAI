// File: client/src/components/AIBuilder/ProductGenerationProgress.jsx
import { Brain, CheckCircle, Rocket, Sparkles, Target, Zap } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const ProductGenerationProgress = ({ isGenerating }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  const steps = [
    {
      id: 1,
      title: 'Analyzing',
      description: 'Processing specifications...',
      icon: Brain,
      duration: 2000,
    },
    {
      id: 2,
      title: 'Research',
      description: 'Market & audience analysis...',
      icon: Target,
      duration: 3000,
    },
    {
      id: 3,
      title: 'Creating',
      description: 'Building product blueprint...',
      icon: Sparkles,
      duration: 8000,
    },
    {
      id: 4,
      title: 'Strategy',
      description: 'Pricing & marketing plans...',
      icon: Zap,
      duration: 4000,
    },
    {
      id: 5,
      title: 'Finalizing',
      description: 'Polishing your blueprint...',
      icon: Rocket,
      duration: 2000,
    },
  ]

  useEffect(() => {
    if (!isGenerating) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    let stepIndex = 0
    let progressInterval
    let stepTimeout

    const runStep = () => {
      if (stepIndex >= steps.length) return

      const step = steps[stepIndex]
      setCurrentStep(stepIndex + 1)

      // Animate progress bar
      let progressValue = 0
      const progressIncrement = 100 / (step.duration / 50)

      progressInterval = setInterval(() => {
        progressValue += progressIncrement
        if (progressValue >= 100) {
          progressValue = 100
          clearInterval(progressInterval)
        }
        setProgress((stepIndex * 100 + progressValue) / steps.length)
      }, 50)

      stepTimeout = setTimeout(() => {
        clearInterval(progressInterval)
        stepIndex++
        runStep()
      }, step.duration)
    }

    runStep()

    return () => {
      clearInterval(progressInterval)
      clearTimeout(stepTimeout)
    }
  }, [isGenerating])

  if (!isGenerating) return null

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
      <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-2xl p-4 sm:p-6 w-full max-w-lg shadow-2xl'>
        {/* Header */}
        <div className='text-center mb-4'>
          <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#D4AF37]/20 to-purple-500/20 border border-[#D4AF37]/30 rounded-full px-3 py-1 text-[#D4AF37] text-xs font-medium mb-3'>
            <Sparkles size={12} className='animate-pulse' />
            AI Generator
          </div>
          <h2 className='text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#EDEDED] via-[#D4AF37] to-[#EDEDED] bg-clip-text text-transparent mb-1'>
            Building Your Product
          </h2>
          <p className='text-gray-400 text-sm'>
            Creating complete blueprint...
          </p>
        </div>

        {/* Progress Bar */}
        <div className='mb-4'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-xs font-medium text-[#EDEDED]'>Progress</span>
            <span className='text-xs font-medium text-[#D4AF37]'>
              {Math.round(progress)}%
            </span>
          </div>
          <div className='w-full bg-[#1E1E21] rounded-full h-2 overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-[#D4AF37] to-[#DAB543] rounded-full transition-all duration-300 ease-out relative'
              style={{ width: `${progress}%` }}
            >
              <div className='absolute inset-0 bg-white/20 animate-pulse'></div>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className='space-y-2'>
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === index + 1
            const isCompleted = currentStep > index + 1
            const isUpcoming = currentStep < index + 1

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 h-8 ${
                  isActive
                    ? 'bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 border border-[#D4AF37]/20'
                    : isCompleted
                    ? 'bg-[#1E1E21]/50'
                    : 'bg-[#0A0A0C]/50'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                      ? 'bg-[#D4AF37] text-black animate-pulse'
                      : 'bg-[#1E1E21] text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle size={14} /> : <Icon size={14} />}
                </div>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center justify-between'>
                    <h3
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isActive
                          ? 'text-[#D4AF37]'
                          : isCompleted
                          ? 'text-green-400'
                          : isUpcoming
                          ? 'text-gray-400'
                          : 'text-[#EDEDED]'
                      }`}
                    >
                      {step.title}
                    </h3>
                    {isActive && (
                      <div className='w-2 h-2 bg-[#D4AF37] rounded-full animate-ping'></div>
                    )}
                  </div>
                  <p
                    className={`text-xs transition-colors duration-300 truncate ${
                      isActive
                        ? 'text-gray-300'
                        : isCompleted
                        ? 'text-green-300'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className='text-center mt-4 pt-3 border-t border-[#1E1E21]'>
          <p className='text-gray-400 text-xs mb-2'>
            Typically takes 15-30 seconds...
          </p>
          <div className='flex items-center justify-center gap-1'>
            <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:-0.3s]'></div>
            <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce [animation-delay:-0.15s]'></div>
            <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-bounce'></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductGenerationProgress
