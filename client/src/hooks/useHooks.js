// File: client/src/hooks/useHooks.js - Updated with cache invalidation
import axiosInstance from '@/config/config'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useInvalidateUsageStats } from './useUsageStats'

// Generate hooks mutation with cache invalidation
export const useGenerateHooks = () => {
  const queryClient = useQueryClient()
  const { invalidateUsageStats, updateUsageStatsOptimistically } =
    useInvalidateUsageStats()

  return useMutation({
    mutationFn: async (hookData) => {
      const response = await axiosInstance.post('/hooks/generate', hookData)
      return response.data
    },
    onMutate: async (variables) => {
      // Optimistically update usage stats
      updateUsageStatsOptimistically('viral-hooks')
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['hooks'] })
      queryClient.invalidateQueries({ queryKey: ['hooks', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['hooks', 'stats'] })

      // Invalidate usage stats to get updated counts
      invalidateUsageStats()
    },
    onError: (error, variables) => {
      console.error('❌ Failed to generate hooks:', error)
      // Revert optimistic update by invalidating
      invalidateUsageStats()
    },
  })
}

// File: client/src/hooks/useProducts.js - Updated with cache invalidation
export const useGenerateProduct = () => {
  const queryClient = useQueryClient()
  const { invalidateUsageStats, updateUsageStatsOptimistically } =
    useInvalidateUsageStats()

  return useMutation({
    mutationFn: async (productData) => {
      const response = await axiosInstance.post(
        '/products/generate',
        productData
      )
      return response.data
    },
    onMutate: async (variables) => {
      // Optimistically update usage stats
      updateUsageStatsOptimistically('product-generator')
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['products', 'stats'] })

      // Invalidate usage stats to get updated counts
      invalidateUsageStats()
    },
    onError: (error, variables) => {
      console.error('❌ Failed to generate product:', error)
      // Revert optimistic update by invalidating
      invalidateUsageStats()
    },
  })
}

// File: client/src/hooks/useBusinessPlans.js - Updated with cache invalidation
export const useGenerateBusinessPlan = () => {
  const queryClient = useQueryClient()
  const { invalidateUsageStats, updateUsageStatsOptimistically } =
    useInvalidateUsageStats()

  return useMutation({
    mutationFn: async (planData) => {
      const response = await axiosInstance.post(
        '/businessPlans/generate',
        planData
      )
      return response.data
    },
    onMutate: async (variables) => {
      // Optimistically update usage stats
      updateUsageStatsOptimistically('niche-launchpad')
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['businessPlans'] })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'stats'] })

      // Invalidate usage stats to get updated counts
      invalidateUsageStats()
    },
    onError: (error, variables) => {
      console.error('❌ Failed to generate business plan:', error)
      // Revert optimistic update by invalidating
      invalidateUsageStats()
    },
  })
}

// Copy hook mutation (doesn't affect usage limits)
export const useCopyHook = () => {
  return useMutation({
    mutationFn: async (hookContent, generationId, hookIndex) => {
      try {
        await navigator.clipboard.writeText(hookContent)

        // Track the copy action with backend
        if (generationId && hookIndex !== undefined) {
          try {
            await axiosInstance.post(`/hooks/${generationId}/copy`, {
              hookIndex,
              hookContent: hookContent.substring(0, 100), // Truncate for tracking
            })
          } catch (error) {
            console.warn('Failed to track hook copy:', error)
            // Don't fail the copy operation if tracking fails
          }
        }

        return { success: true }
      } catch (error) {
        throw new Error('Failed to copy to clipboard')
      }
    },
  })
}

// Get hook generation stats
export const useHookStats = () => {
  return useQuery({
    queryKey: ['hooks', 'stats'],
    queryFn: async () => {
      const response = await axiosInstance.get('/hooks/stats/user')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  })
}

// Similar pattern for product hooks...
export const useCopyContent = () => {
  return useMutation({
    mutationFn: async (content, generationId, section) => {
      try {
        await navigator.clipboard.writeText(content)

        // Track the copy action with backend
        if (generationId && section) {
          try {
            await axiosInstance.post(`/products/${generationId}/copy`, {
              section,
              contentLength: content.length,
            })
          } catch (error) {
            console.warn('Failed to track content copy:', error)
          }
        }

        return { success: true }
      } catch (error) {
        throw new Error('Failed to copy to clipboard')
      }
    },
  })
}

// Get product generation stats
export const useProductStats = () => {
  return useQuery({
    queryKey: ['products', 'stats'],
    queryFn: async () => {
      const response = await axiosInstance.get('/products/stats/user')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  })
}

// Get business plan generation stats
export const useBusinessPlanStats = () => {
  return useQuery({
    queryKey: ['businessPlans', 'stats'],
    queryFn: async () => {
      const response = await axiosInstance.get('/businessPlans/stats/user')
      return response.data
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  })
}
