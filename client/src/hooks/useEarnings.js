// File: client/src/hooks/useEarnings.js - UPDATED WITH BETTER SYNCING
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { earningsService } from '../services/earningsServices.js'

// Get user's earnings with filtering and pagination
export const useGetUserEarnings = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'user', params],
    queryFn: () => earningsService.getUserEarnings(params),
    enabled,
    staleTime: 30 * 1000, // REDUCED: 30 seconds instead of 60
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // ADDED: Refetch when user returns to tab
    refetchInterval: 60 * 1000, // ADDED: Auto-refetch every minute
  })
}

// Get specific earning details
export const useGetEarningDetails = (earningId, enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'details', earningId],
    queryFn: () => earningsService.getEarningDetails(earningId),
    enabled: enabled && !!earningId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get earnings analytics
export const useGetEarningsAnalytics = (period = '30', enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'analytics', period],
    queryFn: () => earningsService.getEarningsAnalytics(period),
    enabled,
    staleTime: 30 * 1000, // REDUCED: 30 seconds
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // ADDED: Refetch when user returns to tab
  })
}

// Get earnings summary/stats
export const useGetEarningsSummary = (enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: earningsService.getEarningsSummary,
    enabled,
    staleTime: 30 * 1000, // REDUCED: 30 seconds instead of 60
    cacheTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true, // ADDED: Refetch when user returns to tab
    refetchInterval: 60 * 1000, // ADDED: Auto-refetch every minute
  })
}

// Export earnings data
export const useExportEarnings = () => {
  return useMutation({
    mutationFn: earningsService.exportEarnings,
    onSuccess: (response) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url

      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition']
      let filename = 'earnings-export.csv'
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/)
        if (fileNameMatch) {
          filename = fileNameMatch[1]
        }
      }

      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Earnings data exported successfully!')
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to export earnings data'
      toast.error(errorMessage)
      console.error('Export earnings error:', error)
    },
  })
}

// =============================================================================
// ADMIN HOOKS
// =============================================================================

// Get all earnings (admin only)
export const useGetAllEarnings = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'admin', 'all', params],
    queryFn: () => earningsService.admin.getAllEarnings(params),
    enabled,
    staleTime: 30 * 1000, // REDUCED: 30 seconds
    refetchOnWindowFocus: true,
  })
}

// Approve earning (admin only)
export const useApproveEarning = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: earningsService.admin.approveEarning,
    onSuccess: (data) => {
      toast.success('Earning approved successfully!')
      // Invalidate ALL earnings queries
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to approve earning'
      toast.error(errorMessage)
      console.error('Approve earning error:', error)
    },
  })
}

// Bulk approve earnings (admin only)
export const useBulkApproveEarnings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: earningsService.admin.bulkApproveEarnings,
    onSuccess: (data) => {
      const count = data.data?.approvedCount || 0
      toast.success(`${count} earnings approved successfully!`)
      // Invalidate ALL earnings queries
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to approve earnings'
      toast.error(errorMessage)
      console.error('Bulk approve earnings error:', error)
    },
  })
}

// Dispute earning (admin only)
export const useDisputeEarning = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ earningId, reason }) =>
      earningsService.admin.disputeEarning(earningId, reason),
    onSuccess: () => {
      toast.success('Earning disputed successfully!')
      // Invalidate ALL earnings queries
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to dispute earning'
      toast.error(errorMessage)
      console.error('Dispute earning error:', error)
    },
  })
}

// Cancel earning (admin only)
export const useCancelEarning = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ earningId, reason }) =>
      earningsService.admin.cancelEarning(earningId, reason),
    onSuccess: () => {
      toast.success('Earning cancelled successfully!')
      // Invalidate ALL earnings queries
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to cancel earning'
      toast.error(errorMessage)
      console.error('Cancel earning error:', error)
    },
  })
}

// =============================================================================
// CUSTOM HOOKS FOR COMMON PATTERNS
// =============================================================================

// Combined hook for earnings dashboard data
export const useEarningsDashboard = (period = '30') => {
  const {
    data: summaryData,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useGetEarningsSummary()

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useGetEarningsAnalytics(period)

  const {
    data: earningsData,
    isLoading: earningsLoading,
    error: earningsError,
    refetch: refetchEarnings,
  } = useGetUserEarnings({ limit: 10, page: 1 })

  // ADDED: Manual refetch all function
  const refetchAll = () => {
    refetchSummary()
    refetchAnalytics()
    refetchEarnings()
  }

  return {
    summary: summaryData?.data,
    analytics: analyticsData?.data,
    recentEarnings: earningsData?.data?.earnings || [],
    isLoading: summaryLoading || analyticsLoading || earningsLoading,
    error: summaryError || analyticsError || earningsError,
    refetchAll, // ADDED: Expose manual refetch
  }
}

// Hook for paginated earnings with filters
export const usePaginatedEarnings = (initialParams = {}) => {
  const [params, setParams] = useState({
    page: 1,
    limit: 20,
    ...initialParams,
  })

  const query = useGetUserEarnings(params)

  const updateParams = (newParams) => {
    setParams((prev) => ({ ...prev, ...newParams }))
  }

  const resetParams = () => {
    setParams({ page: 1, limit: 20, ...initialParams })
  }

  return {
    ...query,
    params,
    updateParams,
    resetParams,
    hasNextPage: query.data ? params.page < query.data.totalPages : false,
    hasPrevPage: params.page > 1,
  }
}
