// File: src/hooks/useStripe.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { stripeService } from '../services/stripeServices.js'

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
        toast.error('Failed to create checkout session')
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to create checkout session'
      toast.error(errorMessage)
      console.error('Checkout session error:', error)
    },
  })
}

// Verify checkout session
export const useVerifyCheckoutSession = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.verifyCheckoutSession,
    onSuccess: (data) => {
      toast.success('Subscription activated successfully!')
      // Invalidate subscription and user queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Payment verification failed'
      toast.error(errorMessage)
      console.error('Payment verification error:', error)
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
      toast.success(`Successfully upgraded to ${planName} plan!`)
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to update subscription'
      toast.error(errorMessage)
      console.error('Subscription update error:', error)
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
        toast.success('Subscription canceled immediately')
      } else {
        toast.success(
          'Subscription will be canceled at the end of the current period'
        )
      }
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to cancel subscription'
      toast.error(errorMessage)
      console.error('Subscription cancellation error:', error)
    },
  })
}

// Reactivate subscription
export const useReactivateSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.reactivateSubscription,
    onSuccess: () => {
      toast.success('Subscription reactivated successfully!')
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to reactivate subscription'
      toast.error(errorMessage)
      console.error('Subscription reactivation error:', error)
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
        toast.error('Failed to open billing portal')
      }
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to open billing portal'
      toast.error(errorMessage)
      console.error('Billing portal error:', error)
    },
  })
}

// Sync with Stripe
export const useSyncWithStripe = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: stripeService.syncWithStripe,
    onSuccess: () => {
      toast.success('Subscription synced with Stripe')
      // Invalidate subscription queries
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to sync with Stripe'
      toast.error(errorMessage)
      console.error('Stripe sync error:', error)
    },
  })
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
