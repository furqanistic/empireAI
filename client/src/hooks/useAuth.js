// File: src/hooks/useAuth.js - UPDATED WITH STRIPE HOOKS
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
  authService,
  notificationService,
  referralService,
  stripeService, // Add stripeService import
} from '../services/authServices.js'

// Auth hooks with Redux integration
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
  })
}

// Referral hooks
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
    },
  })
}

// Notification hooks
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
  })
}

// =============================================================================
// NEW: STRIPE HOOKS
// =============================================================================

// Get all available plans
export const useGetPlans = () => {
  return useQuery({
    queryKey: ['stripe', 'plans'],
    queryFn: stripeService.getPlans,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}

// Get current subscription
export const useGetSubscription = (enabled = true) => {
  return useQuery({
    queryKey: ['stripe', 'subscription'],
    queryFn: stripeService.getCurrentSubscription,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  })
}

// Create checkout session
export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: stripeService.createCheckoutSession,
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.data?.url) {
        window.location.href = data.data.url
      } else {
        console.error('No checkout URL returned')
        // You might want to show a toast notification here
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

// Verify checkout session
export const useVerifyCheckoutSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.verifyCheckoutSession,
    onSuccess: (data) => {
      console.log('Subscription activated successfully!', data)
      // Invalidate subscription and user queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Payment verification failed'
      console.error('Payment verification error:', error)
      alert(errorMessage)
    },
  })
}

// Update subscription (change plan)
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

// Cancel subscription
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

// Reactivate subscription
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

// Create billing portal session
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

// Sync with Stripe
export const useSyncWithStripe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.syncWithStripe,
    onSuccess: () => {
      console.log('Subscription synced with Stripe')
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

// Custom hook for subscription status
export const useSubscriptionStatus = () => {
  const { data: subscriptionData, isLoading } = useGetSubscription()

  const subscription = subscriptionData?.data?.subscription

  const subscriptionStatus = {
    hasSubscription: !!subscription,
    isActive: subscription?.isActive || false,
    plan: subscription?.plan || null,
    status: subscription?.status || 'none',
    trialActive: subscription?.isTrialActive || false,
    daysRemaining: subscription?.daysRemaining || 0,
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
  }
}

// Admin: Get all subscriptions
export const useGetAllSubscriptions = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['stripe', 'admin', 'subscriptions', params],
    queryFn: () => stripeService.getAllSubscriptions(params),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Redux selectors as custom hooks
export const useCurrentUser = () => {
  return useSelector(selectCurrentUser)
}

export const useAuthToken = () => {
  return useSelector(selectToken)
}

export const useAuthLoading = () => {
  return useSelector(selectIsLoading)
}
