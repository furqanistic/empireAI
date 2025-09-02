// File: client/src/hooks/useProducts.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productService } from '../services/productServices.js'

// Generate complete digital product
export const useGenerateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productService.generateProduct,
    onSuccess: (data) => {
      // Invalidate and refetch product-related queries
      queryClient.invalidateQueries({ queryKey: ['products', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate product'
      console.error('Product generation error:', error)
      // You can add toast notification here if you have one
    },
  })
}

// Get user's product generation history
export const useProductHistory = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['products', 'history', params],
    queryFn: () => productService.getProductHistory(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get user's product generation statistics
export const useProductStats = (enabled = true) => {
  return useQuery({
    queryKey: ['products', 'stats'],
    queryFn: productService.getUserStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get specific product generation by ID
export const useProductGeneration = (id, enabled = true) => {
  return useQuery({
    queryKey: ['products', 'generation', id],
    queryFn: () => productService.getProductGeneration(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Mark content as copied
export const useMarkContentCopied = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, section }) =>
      productService.markContentCopied(id, section),
    onSuccess: (data, variables) => {
      console.log('Content marked as copied')
      // Invalidate the specific generation and stats
      queryClient.invalidateQueries({
        queryKey: ['products', 'generation', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to mark content as copied:', error)
    },
  })
}

// Mark product as downloaded
export const useMarkProductDownloaded = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productService.markProductDownloaded,
    onSuccess: (data, generationId) => {
      console.log('Product marked as downloaded')
      // Invalidate the specific generation and stats
      queryClient.invalidateQueries({
        queryKey: ['products', 'generation', generationId],
      })
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to mark product as downloaded:', error)
    },
  })
}

// Add feedback to product generation
export const useAddProductFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rating, feedback }) =>
      productService.addFeedback(id, { rating, feedback }),
    onSuccess: (data, variables) => {
      console.log('Feedback added successfully')
      // Invalidate the specific generation and history
      queryClient.invalidateQueries({
        queryKey: ['products', 'generation', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['products', 'history'] })
    },
    onError: (error) => {
      console.error('Failed to add feedback:', error)
    },
  })
}

// Delete product generation
export const useDeleteProductGeneration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productService.deleteProductGeneration,
    onSuccess: (data, deletedId) => {
      console.log('Product generation deleted')
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({
        queryKey: ['products', 'generation', deletedId],
      })
      queryClient.invalidateQueries({ queryKey: ['products', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to delete product generation:', error)
    },
  })
}

// Test AI service connection (admin only)
export const useTestAIConnection = () => {
  return useMutation({
    mutationFn: productService.testAIConnection,
    onSuccess: (data) => {
      console.log('AI service connection test successful:', data)
    },
    onError: (error) => {
      console.error('AI service connection test failed:', error)
    },
  })
}

// Get product analytics (admin only)
export const useProductAnalytics = (enabled = true) => {
  return useQuery({
    queryKey: ['products', 'admin', 'analytics'],
    queryFn: productService.getProductAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get all product generations (admin only)
export const useAllProductGenerations = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['products', 'admin', 'all', params],
    queryFn: () => productService.getAllProductGenerations(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Custom hook for handling copy to clipboard with tracking
export const useCopyContent = () => {
  const markContentCopied = useMarkContentCopied()

  const copyContentToClipboard = async (content, generationId, section) => {
    try {
      await navigator.clipboard.writeText(content)

      // Track the copy action
      if (generationId && section) {
        markContentCopied.mutate({ id: generationId, section })
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to copy content:', error)

      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = content
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)

        // Track the copy action
        if (generationId && section) {
          markContentCopied.mutate({ id: generationId, section })
        }

        return { success: true }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
        return { success: false, error: 'Failed to copy to clipboard' }
      }
    }
  }

  return {
    copyContent: copyContentToClipboard,
    isLoading: markContentCopied.isPending,
  }
}

// Custom hook for handling product download with tracking
export const useDownloadProduct = () => {
  const markProductDownloaded = useMarkProductDownloaded()

  const downloadProductReport = async (productData, generationId) => {
    try {
      if (!productData) {
        throw new Error('No product data available')
      }

      // Create comprehensive text version
      const report = `
${productData.title}
${'='.repeat(productData.title.length)}

PRODUCT OVERVIEW
${productData.overview}

PRODUCT OUTLINE
${productData.outline.modules
  .map(
    (module, i) =>
      `Module ${i + 1}: ${module.title}\n${module.description}\n${module.lessons
        .map((lesson) => `• ${lesson}`)
        .join('\n')}`
  )
  .join('\n\n')}

PRICING STRATEGY
${productData.pricing.strategy}
Main Price: ${productData.pricing.mainPrice}
Payment Plans:
${productData.pricing.paymentPlans.map((plan) => `• ${plan}`).join('\n')}

MARKETING ANGLES
${productData.marketing.angles
  .map((angle, i) => `${i + 1}. ${angle}`)
  .join('\n')}

BONUS IDEAS
${productData.bonuses
  .map((bonus, i) => `${i + 1}. ${bonus.title}\n   ${bonus.description}`)
  .join('\n\n')}

LAUNCH SEQUENCE
${productData.launch.sequence
  .map((step, i) => `Day ${step.day}: ${step.title}\n${step.description}`)
  .join('\n\n')}

SALES COPY
Headline: ${productData.sales.headline}
Subheadline: ${productData.sales.subheadline}

Key Benefits:
${productData.sales.bulletPoints.map((point) => `• ${point}`).join('\n')}

TECHNICAL REQUIREMENTS
${productData.technical.requirements.map((req) => `• ${req}`).join('\n')}

REVENUE PROJECTIONS
${Object.entries(productData.revenue)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n')}

Generated on: ${new Date().toLocaleDateString()}
      `

      const blob = new Blob([report], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${productData.title.replace(
        /[^a-z0-9]/gi,
        '_'
      )}_Product_Blueprint.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Track the download action
      if (generationId) {
        markProductDownloaded.mutate(generationId)
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to download product:', error)
      return { success: false, error: 'Failed to download product report' }
    }
  }

  return {
    downloadProduct: downloadProductReport,
    isLoading: markProductDownloaded.isPending,
  }
}
