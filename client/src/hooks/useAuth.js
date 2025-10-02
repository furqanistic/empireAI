// File: src/hooks/useAuth.js - COMPLETE WITH ALL FEATURES INCLUDING OTP
import axiosInstance from '@/config/config.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import {
  loginFailure,
  loginStart,
  loginSuccess,
  logout,
  selectCurrentUser,
  selectIsLoading,
  selectToken,
  updateProfile,
} from '../redux/userSlice.js'
import {
  analyticsService,
  authService,
  earningsService,
  notificationService,
  pointsService,
  productService,
  referralService,
  stripeService,
  supportService,
} from '../services/authServices.js'

// =============================================================================
// BASIC AUTH HOOKS
// =============================================================================

// NEW: Send OTP for signup verification
export const useSendSignupOTP = () => {
  return useMutation({
    mutationFn: authService.sendSignupOTP,
    onError: (error) => {
      console.error('Send signup OTP error:', error)
    },
  })
}

// NEW: Verify OTP and complete signup
export const useVerifySignupOTP = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, otp }) => authService.verifySignupOTP(email, otp),
    onMutate: () => {
      dispatch(loginStart())
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data))
      // Invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Signup verification failed'
      dispatch(loginFailure(errorMessage))
      console.error('Signup OTP verification error:', error)
    },
  })
}

// LEGACY: Keep original signup for backward compatibility
export const useSignup = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.signup,
    onMutate: () => {
      dispatch(loginStart())
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data))
      // Invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Signup failed'
      dispatch(loginFailure(errorMessage))
      console.error('Signup error:', error)
    },
  })
}

export const useSignin = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.signin,
    onMutate: () => {
      dispatch(loginStart())
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data))
      // Invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'Signin failed'
      dispatch(loginFailure(errorMessage))
      console.error('Signin error:', error)
    },
  })
}

export const useLogout = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      dispatch(logout())
      // Clear all queries
      queryClient.clear()
    },
    onError: (error) => {
      // Even if the API call fails, clear Redux state
      dispatch(logout())
      queryClient.clear()
      console.error('Logout error:', error)
    },
  })
}

// =============================================================================
// PASSWORD RESET HOOKS (NEW OTP FLOW)
// =============================================================================

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authService.forgotPassword,
    onError: (error) => {
      console.error('Forgot password error:', error)
    },
  })
}

export const useVerifyOTP = () => {
  return useMutation({
    mutationFn: ({ email, otp }) => authService.verifyOTP(email, otp),
    onError: (error) => {
      console.error('OTP verification error:', error)
    },
  })
}

export const useResetPassword = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ resetToken, password, confirmPassword }) =>
      authService.resetPassword(resetToken, password, confirmPassword),
    onSuccess: (data) => {
      // User is automatically logged in after password reset
      dispatch(loginSuccess(data))
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('Password reset error:', error)
    },
  })
}

// =============================================================================
// USER PROFILE HOOKS
// =============================================================================

export const useUserProfile = (userId, enabled = true) => {
  return useQuery({
    queryKey: ['user', 'profile', userId],
    queryFn: () => authService.getUserProfile(userId),
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useUpdateProfile = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: (data) => {
      // Update Redux state
      dispatch(updateProfile(data.data?.user || data))
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      console.error('Profile update error:', error)
    },
  })
}

export const useChangePassword = () => {
  const dispatch = useDispatch()

  return useMutation({
    mutationFn: authService.changePassword,
    onSuccess: (data) => {
      // Update Redux state with new token if returned
      dispatch(loginSuccess(data))
    },
    onError: (error) => {
      console.error('Password change error:', error)
    },
  })
}

export const useGetAllUsers = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['users', 'all', params],
    queryFn: () => authService.getAllUsers(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (error) => {
      console.error('Delete user error:', error)
    },
  })
}

// =============================================================================
// REFERRAL HOOKS
// =============================================================================

export const useValidateReferralCode = (code, enabled = true) => {
  return useQuery({
    queryKey: ['referral', 'validate', code],
    queryFn: () => referralService.validateReferralCode(code),
    enabled: enabled && !!code && code.length >= 3,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

export const useReferralStats = (userId) => {
  const currentUser = useSelector(selectCurrentUser)

  return useQuery({
    queryKey: ['referral', 'stats', userId],
    queryFn: () => referralService.getReferralStats(userId),
    // Enable the query if:
    // 1. A specific userId is provided, OR
    // 2. No userId is provided but we have a current user (for my-stats)
    enabled: !!userId || !!currentUser,
    staleTime: 60 * 1000, // 1 minute
  })
}

export const useReferralLeaderboard = (params = {}) => {
  return useQuery({
    queryKey: ['referral', 'leaderboard', params],
    queryFn: () => referralService.getReferralLeaderboard(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useGenerateReferralCode = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: referralService.generateNewReferralCode,
    onSuccess: () => {
      // Invalidate referral stats
      queryClient.invalidateQueries({ queryKey: ['referral', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      console.error('Generate referral code error:', error)
    },
  })
}

// =============================================================================
// NOTIFICATION HOOKS
// =============================================================================

export const useNotifications = (params = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationService.getUnreadCount,
    refetchInterval: 60 * 1000, // Refresh every minute
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: notificationService.getNotificationStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMarkAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('Mark as read error:', error)
    },
  })
}

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('Mark all as read error:', error)
    },
  })
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('Delete notification error:', error)
    },
  })
}

export const useClearReadNotifications = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationService.clearReadNotifications,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      console.error('Clear read notifications error:', error)
    },
  })
}

// =============================================================================
// POINTS SYSTEM HOOKS
// =============================================================================

export const useClaimDailyPoints = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: pointsService.claimDailyPoints,
    onSuccess: (data) => {
      // Invalidate points and user queries
      queryClient.invalidateQueries({ queryKey: ['points'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to claim daily points'
      console.error('Daily points claim error:', error)
    },
  })
}

export const usePointsStatus = () => {
  return useQuery({
    queryKey: ['points', 'status'],
    queryFn: pointsService.getPointsStatus,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refresh every minute to update claim status
  })
}

export const usePointsLeaderboard = (params = {}) => {
  return useQuery({
    queryKey: ['points', 'leaderboard', params],
    queryFn: () => pointsService.getPointsLeaderboard(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export const useSpendPoints = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ amount, description }) =>
      pointsService.spendPoints(amount, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      console.error('Spend points error:', error)
    },
  })
}

export const usePointsHistory = (params = {}) => {
  return useQuery({
    queryKey: ['points', 'history', params],
    queryFn: () => pointsService.getPointsHistory(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =============================================================================
// STRIPE HOOKS
// =============================================================================

export const useGetPlans = () => {
  return useQuery({
    queryKey: ['stripe', 'plans'],
    queryFn: stripeService.getPlans,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}

export const useGetSubscription = (enabled = true) => {
  return useQuery({
    queryKey: ['stripe', 'subscription'],
    queryFn: stripeService.getCurrentSubscription,
    enabled,
    staleTime: 0, // CHANGED: Was 2 * 60 * 1000, now 0 for immediate updates
    cacheTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchInterval: 30 * 1000, // NEW: Refetch every 30 seconds when page is visible
    refetchIntervalInBackground: false, // Don't refetch when page is hidden
    refetchOnWindowFocus: true, // Refetch when user returns to the page
    refetchOnMount: 'always', // NEW: Always refetch when component mounts
    retry: 2,
  })
}

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: stripeService.createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        console.error('No checkout URL returned')
        alert('Failed to create checkout session')
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to create checkout session'
      console.error('Checkout session error:', error)
      alert(errorMessage)
    },
  })
}

export const useVerifyCheckoutSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.verifyCheckoutSession,
    onSuccess: (data) => {
      // AGGRESSIVE CACHE INVALIDATION
      // Invalidate all subscription-related queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
      queryClient.invalidateQueries({ queryKey: ['stripe'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })

      // FORCE IMMEDIATE REFETCH (don't wait for automatic refetch)
      queryClient.refetchQueries({
        queryKey: ['stripe', 'subscription'],
        type: 'active', // Only refetch active queries
      })

      // Also refetch user data to get updated subscription info
      queryClient.refetchQueries({
        queryKey: ['user'],
        type: 'active',
      })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Payment verification failed'
      console.error('Payment verification error:', error)
    },
  })
}

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.updateSubscription,
    onSuccess: (data) => {
      const planName = data.data?.subscription?.plan || 'plan'
      console.log(`Successfully upgraded to ${planName} plan!`)
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to update subscription'
      console.error('Subscription update error:', error)
      alert(errorMessage)
    },
  })
}

export const useCancelSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.cancelSubscription,
    onSuccess: (data) => {
      const immediate = data.data?.subscription?.status === 'canceled'
      if (immediate) {
        console.log('Subscription canceled immediately')
      } else {
        console.log(
          'Subscription will be canceled at the end of the current period'
        )
      }
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to cancel subscription'
      console.error('Subscription cancellation error:', error)
      alert(errorMessage)
    },
  })
}

export const useReactivateSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.reactivateSubscription,
    onSuccess: () => {
      console.log('Subscription reactivated successfully!')
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to reactivate subscription'
      console.error('Subscription reactivation error:', error)
      alert(errorMessage)
    },
  })
}

export const useCreateBillingPortalSession = () => {
  return useMutation({
    mutationFn: stripeService.createBillingPortalSession,
    onSuccess: (data) => {
      // Redirect to Stripe billing portal
      if (data.data?.url) {
        window.open(data.data.url, '_blank')
      } else {
        console.error('No billing portal URL returned')
        alert('Failed to open billing portal')
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to open billing portal'
      console.error('Billing portal error:', error)
      alert(errorMessage)
    },
  })
}

export const useSyncWithStripe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.syncWithStripe,
    onSuccess: () => {
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to sync with Stripe'
      console.error('Stripe sync error:', error)
      alert(errorMessage)
    },
  })
}

export const useSubscriptionStatus = () => {
  // CHANGED: Remove enabled condition, always fetch
  const {
    data: subscriptionData,
    isLoading,
    refetch,
  } = useGetSubscription(true)

  const subscription = subscriptionData?.data?.subscription

  // Calculate days remaining in real-time (don't rely on cached value)
  const calculateDaysRemaining = () => {
    if (!subscription?.currentPeriodEnd && !subscription?.trialEnd) return 0

    const now = new Date()
    const endDate = subscription.trialEnd
      ? new Date(subscription.trialEnd)
      : new Date(subscription.currentPeriodEnd)

    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    )

    return daysRemaining
  }

  const subscriptionStatus = {
    hasSubscription: !!subscription,
    isActive: subscription?.isActive || false,
    plan: subscription?.plan || null,
    status: subscription?.status || 'none',
    trialActive: subscription?.isTrialActive || false,
    daysRemaining: calculateDaysRemaining(), // CHANGED: Calculate in real-time
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    currentPeriodEnd: subscription?.currentPeriodEnd || null,
    amount: subscription?.amount || 0,
    currency: subscription?.currency || 'usd',
    billingCycle: subscription?.billingCycle || 'monthly',
  }

  return {
    subscription,
    subscriptionStatus,
    isLoading,
    refetch, // Expose refetch function for manual refresh
  }
}

export const useGetAllSubscriptions = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['stripe', 'admin', 'subscriptions', params],
    queryFn: () => stripeService.getAllSubscriptions(params),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// =============================================================================
// EARNINGS HOOKS
// =============================================================================

export const useGetUserEarnings = (params = {}) => {
  return useQuery({
    queryKey: ['earnings', 'user', params],
    queryFn: () => earningsService.getUserEarnings(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useGetEarningDetails = (earningId, enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'details', earningId],
    queryFn: () => earningsService.getEarningDetails(earningId),
    enabled: enabled && !!earningId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useGetEarningsAnalytics = (period = '30') => {
  return useQuery({
    queryKey: ['earnings', 'analytics', period],
    queryFn: () => earningsService.getEarningsAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useGetEarningsSummary = () => {
  return useQuery({
    queryKey: ['earnings', 'summary'],
    queryFn: earningsService.getEarningsSummary,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  })
}

export const useRequestPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: earningsService.requestPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      console.error('Payout request error:', error)
    },
  })
}

export const useGetPayoutHistory = (params = {}) => {
  return useQuery({
    queryKey: ['earnings', 'payouts', params],
    queryFn: () => earningsService.getPayoutHistory(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useExportEarnings = () => {
  return useMutation({
    mutationFn: earningsService.exportEarnings,
    onSuccess: (response) => {
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'earnings-export.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    },
    onError: (error) => {
      console.error('Export earnings error:', error)
    },
  })
}

// Admin earnings hooks
export const useGetAllEarnings = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'admin', 'all', params],
    queryFn: () => earningsService.admin.getAllEarnings(params),
    enabled,
    staleTime: 60 * 1000, // 1 minute
  })
}

export const useApproveEarning = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: earningsService.admin.approveEarning,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      console.error('Approve earning error:', error)
    },
  })
}

export const useBulkApproveEarnings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: earningsService.admin.bulkApproveEarnings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      console.error('Bulk approve earnings error:', error)
    },
  })
}

export const useDisputeEarning = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ earningId, reason }) =>
      earningsService.admin.disputeEarning(earningId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      console.error('Dispute earning error:', error)
    },
  })
}

export const useCancelEarning = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ earningId, reason }) =>
      earningsService.admin.cancelEarning(earningId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      console.error('Cancel earning error:', error)
    },
  })
}

export const useProcessPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: earningsService.admin.processPayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['earnings'] })
    },
    onError: (error) => {
      console.error('Process payout error:', error)
    },
  })
}

export const useGetPayoutRequests = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['earnings', 'admin', 'payouts', params],
    queryFn: () => earningsService.admin.getPayoutRequests(params),
    enabled,
    staleTime: 60 * 1000, // 1 minute
  })
}

// =============================================================================
// ANALYTICS HOOKS
// =============================================================================

export const useGetDashboardAnalytics = (period = '30') => {
  return useQuery({
    queryKey: ['analytics', 'dashboard', period],
    queryFn: () => analyticsService.getDashboardAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useGetUserActivity = (params = {}) => {
  return useQuery({
    queryKey: ['analytics', 'activity', params],
    queryFn: () => analyticsService.getUserActivity(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useGetConversionMetrics = (period = '30') => {
  return useQuery({
    queryKey: ['analytics', 'conversions', period],
    queryFn: () => analyticsService.getConversionMetrics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Admin analytics hooks
export const useGetPlatformOverview = (period = '30', enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'admin', 'overview', period],
    queryFn: () => analyticsService.admin.getPlatformOverview(period),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useGetUserMetrics = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'admin', 'users', params],
    queryFn: () => analyticsService.admin.getUserMetrics(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useGetRevenueMetrics = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['analytics', 'admin', 'revenue', params],
    queryFn: () => analyticsService.admin.getRevenueMetrics(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// =============================================================================
// PRODUCT HOOKS
// =============================================================================

export const useGetProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => productService.getProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useGetProduct = (productId, enabled = true) => {
  return useQuery({
    queryKey: ['products', productId],
    queryFn: () => productService.getProduct(productId),
    enabled: enabled && !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      console.error('Create product error:', error)
    },
  })
}

export const useUpdateProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, productData }) =>
      productService.updateProduct(productId, productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      console.error('Update product error:', error)
    },
  })
}

export const useDeleteProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: productService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => {
      console.error('Delete product error:', error)
    },
  })
}

export const useGetUserProducts = (params = {}) => {
  return useQuery({
    queryKey: ['products', 'user', params],
    queryFn: () => productService.getUserProducts(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// =============================================================================
// SUPPORT HOOKS
// =============================================================================

export const useCreateSupportTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: supportService.createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support'] })
    },
    onError: (error) => {
      console.error('Create support ticket error:', error)
    },
  })
}

export const useGetUserTickets = (params = {}) => {
  return useQuery({
    queryKey: ['support', 'tickets', params],
    queryFn: () => supportService.getUserTickets(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useGetSupportTicket = (ticketId, enabled = true) => {
  return useQuery({
    queryKey: ['support', 'tickets', ticketId],
    queryFn: () => supportService.getTicket(ticketId),
    enabled: enabled && !!ticketId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

export const useReplyToTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ ticketId, message }) =>
      supportService.replyToTicket(ticketId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support'] })
    },
    onError: (error) => {
      console.error('Reply to ticket error:', error)
    },
  })
}

export const useCloseSupportTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: supportService.closeTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support'] })
    },
    onError: (error) => {
      console.error('Close support ticket error:', error)
    },
  })
}

export const useSendExistingUserVerificationOTP = () => {
  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post(
        '/auth/verify-email/send-otp',
        data
      )
      return response.data
    },
    onError: (error) => {
      console.error('Send existing user verification OTP error:', error)
    },
  })
}

// NEW: Verify existing user's email with OTP
export const useVerifyExistingUserEmail = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post(
        '/auth/verify-email/verify-otp',
        data
      )
      return response.data
    },
    onMutate: () => {
      dispatch(loginStart())
    },
    onSuccess: (data) => {
      dispatch(loginSuccess(data))
      // Invalidate and refetch any user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Email verification failed'
      dispatch(loginFailure(errorMessage))
      console.error('Existing user email verification error:', error)
    },
  })
}

// =============================================================================
// REDUX SELECTORS AS CUSTOM HOOKS
// =============================================================================

export const useCurrentUser = () => {
  return useSelector(selectCurrentUser)
}

export const useAuthToken = () => {
  return useSelector(selectToken)
}

export const useAuthLoading = () => {
  return useSelector(selectIsLoading)
}
