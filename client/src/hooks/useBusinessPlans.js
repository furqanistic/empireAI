// File: client/src/hooks/useBusinessPlans.js - SIMPLIFIED with server-side export
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { businessPlanService } from '../services/businessPlanServices.js'
import { useInvalidateUsageStats } from './useUsageStats.js'

// Generate business plan with cache invalidation
export const useGenerateBusinessPlan = () => {
  const queryClient = useQueryClient()
  const { invalidateUsageStats, updateUsageStatsOptimistically } =
    useInvalidateUsageStats()

  return useMutation({
    mutationFn: businessPlanService.generateBusinessPlan,
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

// SIMPLIFIED: Server-side export hook (replaces complex client-side PDF generation)
export const useDownloadBusinessPlan = () => {
  const markAsDownloaded = useMarkAsDownloaded()

  return useMutation({
    mutationFn: async ({ businessPlanId, format = 'pdf' }) => {
      return await businessPlanService.exportBusinessPlan(
        businessPlanId,
        format
      )
    },
    onSuccess: (result, variables) => {
      // Mark as downloaded for analytics
      if (variables.businessPlanId) {
        markAsDownloaded.mutate({ id: variables.businessPlanId })
      }
    },
    onError: (error, variables) => {
      console.error('❌ Download failed:', error)
    },
  })
}

// Get business plan history
export const useBusinessPlanHistory = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'history', params],
    queryFn: () => businessPlanService.getBusinessPlanHistory(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get user's business plan statistics
export const useBusinessPlanStats = (enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'stats'],
    queryFn: businessPlanService.getUserStats,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

// Get specific business plan by ID
export const useBusinessPlan = (id, enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'plan', id],
    queryFn: () => businessPlanService.getBusinessPlan(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Mark business plan as downloaded
export const useMarkAsDownloaded = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id }) => businessPlanService.markAsDownloaded(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['businessPlans', 'plan', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to mark business plan as downloaded:', error)
    },
  })
}

// Add feedback to business plan
export const useAddBusinessPlanFeedback = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, rating, feedback }) =>
      businessPlanService.addFeedback(id, { rating, feedback }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['businessPlans', 'plan', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'history'] })
    },
    onError: (error) => {
      console.error('Failed to add feedback:', error)
    },
  })
}

// Delete business plan
export const useDeleteBusinessPlan = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: businessPlanService.deleteBusinessPlan,
    onSuccess: (data, deletedId) => {
      queryClient.removeQueries({
        queryKey: ['businessPlans', 'plan', deletedId],
      })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'history'] })
      queryClient.invalidateQueries({ queryKey: ['businessPlans', 'stats'] })
    },
    onError: (error) => {
      console.error('Failed to delete business plan:', error)
    },
  })
}

// Admin hooks
export const useNicheAnalytics = (enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'admin', 'analytics'],
    queryFn: businessPlanService.getNicheAnalytics,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
  })
}

export const useAllBusinessPlans = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['businessPlans', 'admin', 'all', params],
    queryFn: () => businessPlanService.getAllBusinessPlans(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
