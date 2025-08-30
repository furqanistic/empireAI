// File: client/src/hooks/useHooks.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hookService } from '../services/hookServices.js'

// Generate viral hooks
export const useGenerateHooks = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hookService.generateHooks,
    onSuccess: (data) => {
      // Invalidate and refetch hook-related queries
      queryClient.invalidateQueries({ queryKey: ['hooks', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['hooks', 'stats'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate hooks'
      console.error('Hook generation error:', error)
      // You can add toast notification here if you have one
    },
  })
}

// Get user's hook generation history
export const useHookHistory = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['hooks', 'history', params],
    queryFn: () => hookService.getHookHistory(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get user's hook generation statistics
export const useHookStats = (enabled = true) => {
  return useQuery({
    queryKey: ['hooks', 'stats'],
    queryFn: hookService.getUserStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get specific hook generation by ID
export const useHookGeneration = (id, enabled = true) => {
  return useQuery({
    queryKey: ['hooks', 'generation', id],
    queryFn: () => hookService.getHookGeneration(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Mark a hook as copied
export const useMarkHookCopied = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, hookIndex }) =>
      hookService.markHookCopied(id, hookIndex),
    onSuccess: (data, variables) => {
      console.log('Hook marked as copied')
      // Invalidate the specific generation and stats
      queryClient.invalidateQueries({
        queryKey: ['hooks', 'generation', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['hooks', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to mark hook as copied:', error)
    },
  })
}

// Add feedback to hook generation
export const useAddHookFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rating, feedback }) =>
      hookService.addFeedback(id, { rating, feedback }),
    onSuccess: (data, variables) => {
      console.log('Feedback added successfully')
      // Invalidate the specific generation and history
      queryClient.invalidateQueries({
        queryKey: ['hooks', 'generation', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['hooks', 'history'] })
    },
    onError: (error) => {
      console.error('Failed to add feedback:', error)
    },
  })
}

// Delete hook generation
export const useDeleteHookGeneration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: hookService.deleteHookGeneration,
    onSuccess: (data, deletedId) => {
      console.log('Hook generation deleted')
      // Remove from cache and invalidate related queries
      queryClient.removeQueries({
        queryKey: ['hooks', 'generation', deletedId],
      })
      queryClient.invalidateQueries({ queryKey: ['hooks', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['hooks', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to delete hook generation:', error)
    },
  })
}

// Test GROQ connection (admin only)
export const useTestGroqConnection = () => {
  return useMutation({
    mutationFn: hookService.testGroqConnection,
    onSuccess: (data) => {
      console.log('GROQ connection test successful:', data)
    },
    onError: (error) => {
      console.error('GROQ connection test failed:', error)
    },
  })
}

// Get platform analytics (admin only)
export const usePlatformAnalytics = (enabled = true) => {
  return useQuery({
    queryKey: ['hooks', 'admin', 'analytics'],
    queryFn: hookService.getPlatformAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get all hook generations (admin only)
export const useAllHookGenerations = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['hooks', 'admin', 'all', params],
    queryFn: () => hookService.getAllHookGenerations(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Custom hook for handling copy to clipboard with tracking
export const useCopyHook = () => {
  const markHookCopied = useMarkHookCopied()

  const copyHookToClipboard = async (hookContent, generationId, hookIndex) => {
    try {
      await navigator.clipboard.writeText(hookContent)

      // Track the copy action
      if (generationId !== undefined && hookIndex !== undefined) {
        markHookCopied.mutate({ id: generationId, hookIndex })
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to copy hook:', error)

      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = hookContent
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)

        // Track the copy action
        if (generationId !== undefined && hookIndex !== undefined) {
          markHookCopied.mutate({ id: generationId, hookIndex })
        }

        return { success: true }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError)
        return { success: false, error: 'Failed to copy to clipboard' }
      }
    }
  }

  return {
    copyHook: copyHookToClipboard,
    isLoading: markHookCopied.isPending,
  }
}
