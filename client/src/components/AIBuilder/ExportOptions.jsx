// File: client/src/components/AIBuilder/ExportOptions.jsx - With Progress Bar
import { useDownloadProduct } from '@/hooks/useProducts'
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  ChevronDown,
  Download,
  File,
  FileText,
  RefreshCw,
  Share2,
} from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

const ExportOptions = ({
  generationId,
  productTitle = 'Product Blueprint',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState({})
  const [progress, setProgress] = useState({})

  // Get authentication state from Redux
  const { token, currentUser } = useSelector((state) => state.user)

  const downloadMutation = useDownloadProduct()

  // Streamlined to only the most useful formats
  const exportFormats = [
    {
      id: 'pdf',
      name: 'PDF',
      icon: FileText,
      description: 'Professional business blueprint - ready to share',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      primary: true,
    },
    {
      id: 'xlsx',
      name: 'Spreadsheet',
      icon: BarChart3,
      description: 'Financial models & data for analysis',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      id: 'docx',
      name: 'Word Document',
      icon: File,
      description: 'Editable format for collaboration',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
  ]

  // Simulate progress for better UX
  const simulateProgress = (formatId) => {
    setProgress((prev) => ({ ...prev, [formatId]: 0 }))

    const progressSteps = [
      { percent: 15, message: 'Preparing document...' },
      { percent: 35, message: 'Processing content...' },
      { percent: 60, message: 'Formatting sections...' },
      { percent: 85, message: 'Finalizing export...' },
      { percent: 100, message: 'Complete!' },
    ]

    let stepIndex = 0
    const progressInterval = setInterval(() => {
      if (stepIndex < progressSteps.length) {
        const step = progressSteps[stepIndex]
        setProgress((prev) => ({ ...prev, [formatId]: step.percent }))
        setExportStatus((prev) => ({
          ...prev,
          [formatId]: { type: 'loading', message: step.message },
        }))
        stepIndex++
      } else {
        clearInterval(progressInterval)
      }
    }, 800) // Update every 800ms

    return progressInterval
  }

  const handleExport = async (format) => {
    if (!generationId) {
      setExportStatus((prev) => ({
        ...prev,
        [format.id]: { type: 'error', message: 'Generation ID missing' },
      }))
      return
    }

    if (!token) {
      setExportStatus((prev) => ({
        ...prev,
        [format.id]: { type: 'error', message: 'Please log in to export' },
      }))
      return
    }

    let progressInterval

    try {
      setExportStatus((prev) => ({
        ...prev,
        [format.id]: { type: 'loading', message: 'Starting export...' },
      }))

      // Start progress simulation
      progressInterval = simulateProgress(format.id)

      const result = await downloadMutation.mutateAsync({
        generationId,
        format: format.id,
      })

      // Clear progress simulation
      clearInterval(progressInterval)

      setExportStatus((prev) => ({
        ...prev,
        [format.id]: {
          type: 'success',
          message: `Downloaded! (${Math.round(result.size / 1024)}KB)`,
        },
      }))

      setProgress((prev) => ({ ...prev, [format.id]: 100 }))

      setTimeout(() => {
        setExportStatus((prev) => ({
          ...prev,
          [format.id]: null,
        }))
        setProgress((prev) => ({ ...prev, [format.id]: 0 }))
      }, 3000)
    } catch (error) {
      // Clear progress simulation on error
      if (progressInterval) clearInterval(progressInterval)

      console.error(`Export failed for ${format.id}:`, error)

      let errorMessage = error.message || 'Export failed'
      if (error.message?.includes('log in')) {
        errorMessage = 'Please log in again to export'
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Product generation not found'
      } else if (error.message?.includes('Network')) {
        errorMessage = 'Network error - please try again'
      } else if (error.message?.includes('Server error')) {
        errorMessage = 'Server error - try again later'
      }

      setExportStatus((prev) => ({
        ...prev,
        [format.id]: {
          type: 'error',
          message: errorMessage,
        },
      }))

      setProgress((prev) => ({ ...prev, [format.id]: 0 }))

      setTimeout(() => {
        setExportStatus((prev) => ({
          ...prev,
          [format.id]: null,
        }))
      }, 5000)
    }
  }

  const quickExportPDF = async () => {
    const pdfFormat = exportFormats.find((f) => f.id === 'pdf')
    await handleExport(pdfFormat)
  }

  // Check if user is authenticated
  const isAuthenticated = !!token && !!currentUser

  if (!generationId) {
    return (
      <div className='text-center py-4'>
        <div className='inline-flex items-center gap-2 text-gray-400 text-sm'>
          <AlertCircle size={16} />
          Generate a product first to enable exports
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className='text-center py-4'>
        <div className='inline-flex items-center gap-2 text-orange-400 text-sm'>
          <AlertCircle size={16} />
          Please log in to export your blueprint
        </div>
        <button
          onClick={() => (window.location.href = '/auth')}
          className='mt-2 px-4 py-2 bg-[#D4AF37] text-black rounded-lg font-semibold hover:bg-[#DAB543] transition-colors'
        >
          Log In
        </button>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {/* Primary Export Button */}
      <div className='flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto'>
        <button
          onClick={quickExportPDF}
          disabled={
            downloadMutation.isPending || exportStatus.pdf?.type === 'loading'
          }
          className='flex-1 bg-gradient-to-r from-[#D4AF37] to-[#DAB543] text-black h-12 rounded-xl font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden'
        >
          {/* Progress Bar Background */}
          {exportStatus.pdf?.type === 'loading' && (
            <div
              className='absolute left-0 top-0 h-full bg-black/10 transition-all duration-300 ease-out'
              style={{ width: `${progress.pdf || 0}%` }}
            />
          )}

          <div className='relative z-10 flex items-center gap-2'>
            {exportStatus.pdf?.type === 'success' ? (
              <>
                <CheckCircle size={16} />
                PDF Downloaded!
              </>
            ) : exportStatus.pdf?.type === 'loading' ? (
              <>
                <RefreshCw size={16} className='animate-spin' />
                Creating PDF...
              </>
            ) : exportStatus.pdf?.type === 'error' ? (
              <>
                <AlertCircle size={16} />
                Try Again
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF Blueprint
              </>
            )}
          </div>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className='h-12 px-4 bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#D4AF37] text-[#D4AF37] rounded-xl font-semibold hover:bg-[#D4AF37]/10 transition-all duration-200 flex items-center justify-center gap-2'
        >
          Other Formats
          <ChevronDown
            size={16}
            className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Progress indicator for PDF */}
      {exportStatus.pdf?.type === 'loading' && (
        <div className='max-w-lg mx-auto'>
          <div className='bg-[#1E1E21] rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-[#D4AF37] text-sm font-medium'>
                {exportStatus.pdf.message}
              </span>
              <span className='text-gray-400 text-sm'>
                {progress.pdf || 0}%
              </span>
            </div>
            <div className='w-full bg-gray-700 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-[#D4AF37] to-[#DAB543] h-2 rounded-full transition-all duration-300 ease-out'
                style={{ width: `${progress.pdf || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Show error message for PDF if exists */}
      {exportStatus.pdf?.type === 'error' && (
        <div className='text-center'>
          <div className='inline-flex items-center gap-2 text-red-400 text-sm'>
            <AlertCircle size={14} />
            {exportStatus.pdf.message}
          </div>
        </div>
      )}

      {/* Additional Export Options */}
      {isOpen && (
        <div className='max-w-3xl mx-auto'>
          <div className='bg-gradient-to-br from-[#121214] to-[#0A0A0C] border border-[#1E1E21] rounded-xl p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <Share2 size={18} className='text-[#D4AF37]' />
              <h3 className='text-lg font-semibold text-[#EDEDED]'>
                Choose Export Format
              </h3>
            </div>

            {/* Fixed grid with consistent button heights */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              {exportFormats.map((format) => {
                const IconComponent = format.icon
                const status = exportStatus[format.id]
                const formatProgress = progress[format.id] || 0

                return (
                  <div key={format.id} className='relative'>
                    <button
                      onClick={() => handleExport(format)}
                      disabled={
                        downloadMutation.isPending || status?.type === 'loading'
                      }
                      className={`w-full h-32 p-4 rounded-lg border transition-all duration-200 text-left hover:scale-105 group ${format.bgColor} ${format.borderColor} disabled:opacity-50 disabled:hover:scale-100 relative overflow-hidden flex flex-col justify-between`}
                    >
                      {/* Progress Bar Background for individual formats */}
                      {status?.type === 'loading' && (
                        <div
                          className='absolute left-0 top-0 h-full bg-white/5 transition-all duration-300 ease-out'
                          style={{ width: `${formatProgress}%` }}
                        />
                      )}

                      <div className='flex items-start gap-3 relative z-10 flex-1'>
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-lg ${format.bgColor} flex items-center justify-center`}
                        >
                          {status?.type === 'loading' ? (
                            <RefreshCw
                              size={20}
                              className={`${format.color} animate-spin`}
                            />
                          ) : (
                            <IconComponent size={20} className={format.color} />
                          )}
                        </div>

                        <div className='flex-1 flex flex-col justify-between h-full'>
                          <div>
                            <h4 className={`font-medium mb-1 ${format.color}`}>
                              {format.name}
                            </h4>
                            <p className='text-sm text-gray-400 mb-3 line-clamp-2'>
                              {format.description}
                            </p>
                          </div>

                          <div className='flex items-center gap-2 mt-auto'>
                            {status?.type === 'success' ? (
                              <div className='flex items-center gap-1 text-green-400 text-xs'>
                                <CheckCircle size={12} />
                                Downloaded!
                              </div>
                            ) : status?.type === 'loading' ? (
                              <div className='flex items-center gap-1 text-[#D4AF37] text-xs'>
                                <RefreshCw size={12} className='animate-spin' />
                                {status.message}
                              </div>
                            ) : status?.type === 'error' ? (
                              <div className='text-red-400 text-xs'>
                                Error - Try again
                              </div>
                            ) : (
                              <div
                                className={`text-xs ${format.color} group-hover:underline`}
                              >
                                Click to download
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Individual Progress Bar */}
                    {status?.type === 'loading' && (
                      <div className='mt-2 px-1'>
                        <div className='flex items-center justify-between mb-1'>
                          <span className={`text-xs ${format.color}`}>
                            {formatProgress}%
                          </span>
                        </div>
                        <div className='w-full bg-gray-700 rounded-full h-1'>
                          <div
                            className={`bg-gradient-to-r ${
                              format.id === 'pdf'
                                ? 'from-red-400 to-red-500'
                                : format.id === 'xlsx'
                                ? 'from-green-400 to-green-500'
                                : 'from-blue-400 to-blue-500'
                            } h-1 rounded-full transition-all duration-300 ease-out`}
                            style={{ width: `${formatProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* What's included */}
            <div className='mt-6 p-4 bg-[#1E1E21] rounded-lg'>
              <h4 className='text-[#EDEDED] font-medium mb-3'>
                Every export includes:
              </h4>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-400'>
                <div className='flex items-center gap-2'>
                  <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full'></div>
                  Complete product blueprint
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full'></div>
                  Marketing strategies
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full'></div>
                  Revenue projections
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-1.5 h-1.5 bg-[#D4AF37] rounded-full'></div>
                  Launch timeline
                </div>
              </div>
            </div>

            <div className='mt-4 text-center'>
              <button
                onClick={() => setIsOpen(false)}
                className='text-gray-400 hover:text-[#EDEDED] text-sm'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportOptions
