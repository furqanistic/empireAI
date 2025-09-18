// File: src/hooks/usePayouts.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { payoutService } from '../services/payoutService.js'

// ============================================================================
// QUERY KEYS
// ============================================================================
export const PAYOUT_QUERY_KEYS = {
  connectStatus: 'payout-connect-status',
  earnings: 'payout-earnings',
  earningsSummary: 'payout-earnings-summary',
  earningDetails: (id) => `payout-earning-${id}`,
  earningsAnalytics: 'payout-earnings-analytics',
  payoutHistory: 'payout-history',
}

// ============================================================================
// CONNECT ACCOUNT HOOKS
// ============================================================================

// Get Connect account status
export const useConnectStatus = () => {
  return useQuery({
    queryKey: [PAYOUT_QUERY_KEYS.connectStatus],
    queryFn: payoutService.getConnectStatus,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Create Connect account
export const useCreateConnectAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payoutService.createConnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.connectStatus],
      })
    },
    onError: (error) => {
      console.error('Create Connect account error:', error)
    },
  })
}

// Get onboarding link
export const useGetOnboardingLink = () => {
  return useMutation({
    mutationFn: payoutService.getOnboardingLink,
    onSuccess: (data) => {
      if (data.data?.url) {
        window.open(data.data.url, '_blank')
      } else {
        throw new Error('No onboarding URL received')
      }
    },
    onError: (error) => {
      console.error('Get onboarding link error:', error)
    },
  })
}

// Get management link
export const useGetManagementLink = () => {
  return useMutation({
    mutationFn: payoutService.getManagementLink,
    onSuccess: (data) => {
      if (data.data?.url) {
        window.open(data.data.url, '_blank')
      } else {
        throw new Error('No management URL received')
      }
    },
    onError: (error) => {
      console.error('Get management link error:', error)
    },
  })
}

// Refresh account status
export const useRefreshStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payoutService.refreshStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.connectStatus],
      })
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.earningsSummary],
      })
    },
    onError: (error) => {
      console.error('Refresh status error:', error)
    },
  })
}

// Reset account (dev only)
export const useResetAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payoutService.resetAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.connectStatus],
      })
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.earningsSummary],
      })
    },
    onError: (error) => {
      console.error('Reset account error:', error)
    },
  })
}

// ============================================================================
// EARNINGS HOOKS
// ============================================================================

// Get earnings summary
export const useEarningsSummary = () => {
  return useQuery({
    queryKey: [PAYOUT_QUERY_KEYS.earningsSummary],
    queryFn: payoutService.getEarningsSummary,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

// Get earnings with pagination and filtering
export const useEarnings = (params = {}) => {
  return useQuery({
    queryKey: [PAYOUT_QUERY_KEYS.earnings, params],
    queryFn: () => payoutService.getEarnings(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    keepPreviousData: true, // For pagination
  })
}

// Get earning details
export const useEarningDetails = (earningId, enabled = true) => {
  return useQuery({
    queryKey: [PAYOUT_QUERY_KEYS.earningDetails(earningId)],
    queryFn: () => payoutService.getEarningDetails(earningId),
    enabled: enabled && !!earningId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

// Get earnings analytics
export const useEarningsAnalytics = (params = {}) => {
  return useQuery({
    queryKey: [PAYOUT_QUERY_KEYS.earningsAnalytics, params],
    queryFn: () => payoutService.getEarningsAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })
}

// ============================================================================
// PAYOUT HOOKS
// ============================================================================

// Request payout
export const useRequestPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payoutService.requestPayout,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.earningsSummary],
      })
      queryClient.invalidateQueries({ queryKey: [PAYOUT_QUERY_KEYS.earnings] })
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.payoutHistory],
      })
    },
    onError: (error) => {
      console.error('Request payout error:', error)
    },
  })
}

// Get payout history
export const usePayoutHistory = (params = {}) => {
  return useQuery({
    queryKey: [PAYOUT_QUERY_KEYS.payoutHistory, params],
    queryFn: () => payoutService.getPayoutHistory(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    keepPreviousData: true, // For pagination
  })
}

// Cancel payout
export const useCancelPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: payoutService.cancelPayout,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.earningsSummary],
      })
      queryClient.invalidateQueries({ queryKey: [PAYOUT_QUERY_KEYS.earnings] })
      queryClient.invalidateQueries({
        queryKey: [PAYOUT_QUERY_KEYS.payoutHistory],
      })
    },
    onError: (error) => {
      console.error('Cancel payout error:', error)
    },
  })
}

// ============================================================================
// COMBINED HOOKS FOR COMPLEX OPERATIONS
// ============================================================================

// Load all dashboard data
export const usePayoutDashboardData = () => {
  const connectStatus = useConnectStatus()
  const earningsSummary = useEarningsSummary()
  const payoutHistory = usePayoutHistory({ limit: 5 })

  const isLoading =
    connectStatus.isLoading ||
    earningsSummary.isLoading ||
    payoutHistory.isLoading
  const isError =
    connectStatus.isError || earningsSummary.isError || payoutHistory.isError
  const error =
    connectStatus.error || earningsSummary.error || payoutHistory.error

  return {
    connectStatus: connectStatus.data,
    earningsSummary: earningsSummary.data,
    payoutHistory: payoutHistory.data,
    isLoading,
    isError,
    error,
    refetch: () => {
      connectStatus.refetch()
      earningsSummary.refetch()
      payoutHistory.refetch()
    },
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

// Hook for handling payout actions based on account state
export const usePayoutActions = () => {
  const createAccount = useCreateConnectAccount()
  const getOnboarding = useGetOnboardingLink()
  const getManagement = useGetManagementLink()
  const refreshStatus = useRefreshStatus()
  const resetAccount = useResetAccount()
  const requestPayout = useRequestPayout()

  const handleAction = async (action, data = {}) => {
    try {
      switch (action) {
        case 'create':
          return await createAccount.mutateAsync(data)
        case 'onboarding':
          return await getOnboarding.mutateAsync()
        case 'management':
          return await getManagement.mutateAsync()
        case 'refresh':
          return await refreshStatus.mutateAsync()
        case 'reset':
          return await resetAccount.mutateAsync()
        case 'payout':
          return await requestPayout.mutateAsync(data)
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } catch (error) {
      console.error(`Error handling action ${action}:`, error)
      throw error
    }
  }

  const isLoading =
    createAccount.isLoading ||
    getOnboarding.isLoading ||
    getManagement.isLoading ||
    refreshStatus.isLoading ||
    resetAccount.isLoading ||
    requestPayout.isLoading

  return {
    handleAction,
    isLoading,
    createAccount,
    getOnboarding,
    getManagement,
    refreshStatus,
    resetAccount,
    requestPayout,
  }
}

// Hook for status-based UI logic
export const usePayoutStatusLogic = (connectStatus) => {
  if (!connectStatus?.data) {
    return {
      canCreateAccount: true,
      canRetryOnboarding: false,
      canManageAccount: false,
      canRequestPayout: false,
      needsSetup: true,
      isVerified: false,
    }
  }

  const { data } = connectStatus

  return {
    canCreateAccount: data.actions?.canCreateAccount || false,
    canRetryOnboarding: data.actions?.canRetryOnboarding || false,
    canManageAccount: data.actions?.canManageAccount || false,
    canRequestPayout: data.actions?.canRequestPayout || false,
    needsSetup: !data.connected || !data.isVerified,
    isVerified: data.isVerified || false,
    accountState: data.accountState || 'not_connected',
    requirements: data.requirements || [],
    messages: data.messages || {},
  }
}
