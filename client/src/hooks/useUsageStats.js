// File: client/src/hooks/useUsageStats.js - CORRECTED to match server routes
import axiosInstance from '@/config/config'
import { useQuery, useQueryClient } from '@tanstack/react-query'

// Hook to get usage stats - CORRECTED: matches server route /usage
export const useUsageStats = () => {
  return useQuery({
    queryKey: ['usage', 'stats'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get('/usage/stats') // CORRECTED: added  prefix
        return response.data
      } catch (error) {
        console.error('❌ Error fetching usage stats:', error)
        throw error
      }
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    refetchOnWindowFocus: true,
    retry: 3,
  })
}

// Hook to invalidate usage stats cache
export const useInvalidateUsageStats = () => {
  const queryClient = useQueryClient()

  return {
    invalidateUsageStats: () => {
      queryClient.invalidateQueries({ queryKey: ['usage'] })
    },

    // Optimistically update usage stats
    updateUsageStatsOptimistically: (featureType) => {
      queryClient.setQueryData(['usage', 'stats'], (old) => {
        if (!old?.data?.usage) return old

        const newUsage = { ...old.data.usage }

        // Increment the specific feature count
        switch (featureType) {
          case 'viral-hooks':
            newUsage.viralHooks = (newUsage.viralHooks || 0) + 1
            break
          case 'product-generator':
            newUsage.productGenerator = (newUsage.productGenerator || 0) + 1
            break
          case 'niche-launchpad':
            newUsage.nicheLaunchpad = (newUsage.nicheLaunchpad || 0) + 1
            break
        }

        // Update total
        newUsage.total = (newUsage.total || 0) + 1

        return {
          ...old,
          data: {
            ...old.data,
            usage: newUsage,
            limits: {
              ...old.data.limits,
              used: newUsage.total,
              remaining: old.data.limits.unlimited
                ? -1
                : Math.max(0, (old.data.limits.limit || 0) - newUsage.total),
              allowed: old.data.limits.unlimited
                ? true
                : newUsage.total < (old.data.limits.limit || 0),
            },
            status: {
              ...old.data.status,
              canGenerate: old.data.limits.unlimited
                ? true
                : newUsage.total < (old.data.limits.limit || 0),
              remaining: old.data.limits.unlimited
                ? -1
                : Math.max(0, (old.data.limits.limit || 0) - newUsage.total),
            },
          },
        }
      })

      // Invalidate after a short delay to get fresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['usage', 'stats'] })
      }, 1000)
    },
  }
}

// Hook for usage history - CORRECTED
export const useUsageHistory = (months = 6) => {
  return useQuery({
    queryKey: ['usage', 'history', months],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/usage/history?months=${months}`
      ) // CORRECTED: added  prefix
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  })
}

// Hook to check feature access - CORRECTED
export const useFeatureAccess = (feature) => {
  return useQuery({
    queryKey: ['usage', 'check', feature],
    queryFn: async () => {
      const response = await axiosInstance.get(`/usage/check/${feature}`) // CORRECTED: added  prefix
      return response.data
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!feature,
    retry: 2,
  })
}
