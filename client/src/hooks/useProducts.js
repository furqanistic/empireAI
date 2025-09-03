// File: client/src/hooks/useProducts.js - FIXED export functionality
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

// FIXED: Export product hook - now works with backend API
export const useDownloadProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ generationId, format }) => {
      console.log(`Starting export: ${format} for generation: ${generationId}`)

      // Call the backend export service
      const result = await productService.exportProduct(generationId, format)

      console.log(`Export completed: ${result.filename}`)
      return result
    },
    onSuccess: (result, variables) => {
      console.log('Export successful:', result)

      // Optionally mark as downloaded in backend for analytics
      if (variables.generationId) {
        // Fire and forget - don't wait for this
        productService
          .markProductDownloaded(variables.generationId)
          .catch((err) => console.warn('Failed to mark as downloaded:', err))
      }

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['products', 'generation', variables.generationId],
      })
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] })
    },
    onError: (error, variables) => {
      console.error('Export failed:', error)
      console.error('Variables:', variables)
    },
  })
}
