// File: client/src/hooks/useAdmin.js - FIXED WITH AGGRESSIVE CACHE INVALIDATION
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService.js'

// Get all users with pagination and filters
export const useGetAllUsers = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getAllUsers(params),
    enabled,
    staleTime: 30 * 1000, // Reduced from 60s to 30s for faster updates
    cacheTime: 2 * 60 * 1000, // Reduced from 5m to 2m
  })
}

// Get admin statistics
export const useGetAdminStats = (enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getAdminStats,
    enabled,
    staleTime: 30 * 1000, // Reduced from 2m to 30s
    cacheTime: 5 * 60 * 1000,
  })
}

// Update user (admin)
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, userData }) =>
      adminService.updateUser(userId, userData),
    onSuccess: (data, variables) => {
      console.log('User update successful, invalidating caches...')

      // Invalidate and refetch relevant queries immediately
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })

      // Force immediate refetch of users to show updated data
      queryClient.refetchQueries({ queryKey: ['admin', 'users'] })

      // Update the specific user in cache if we have the data
      if (data?.data?.user) {
        queryClient.setQueryData(['admin', 'user', variables.userId], data)
      }

      console.log('✅ Cache invalidated and refetched after user update')
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to update user'
      console.error('Update user error:', error)
      throw new Error(errorMessage)
    },
  })
}

// ENHANCED: Update user subscription with aggressive cache invalidation
export const useUpdateUserSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, subscriptionData }) =>
      adminService.updateUserSubscription(userId, subscriptionData),
    onSuccess: (data, variables) => {
      console.log(
        'Subscription update successful, aggressive cache invalidation...'
      )

      // Invalidate ALL related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })

      // Force immediate refetch of users list to show updated subscription status
      queryClient.refetchQueries({
        queryKey: ['admin', 'users'],
        type: 'active', // Only refetch active queries
      })

      // Also refetch stats to update counts
      queryClient.refetchQueries({
        queryKey: ['admin', 'stats'],
        type: 'active',
      })

      console.log(
        '✅ Aggressive cache invalidation completed for subscription update'
      )
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to update subscription'
      console.error('Update subscription error:', error)
      throw new Error(errorMessage)
    },
  })
}

// ENHANCED: Cancel user subscription with aggressive cache invalidation
export const useCancelUserSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, immediate }) =>
      adminService.cancelUserSubscription(userId, immediate),
    onSuccess: (data, variables) => {
      console.log(
        'Subscription cancellation successful, invalidating all caches...'
      )

      // Invalidate ALL subscription and user related queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['stripe', 'subscription'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'subscriptions'] })

      // Force immediate refetch to show cancelled subscription
      queryClient.refetchQueries({
        queryKey: ['admin', 'users'],
        type: 'active',
      })

      queryClient.refetchQueries({
        queryKey: ['admin', 'stats'],
        type: 'active',
      })

      console.log(
        '✅ All caches invalidated and refetched after subscription cancellation'
      )
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to cancel subscription'
      console.error('Cancel subscription error:', error)
      throw new Error(errorMessage)
    },
  })
}

// ENHANCED: Reactivate user subscription with cache invalidation
export const useReactivateUserSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId) => adminService.reactivateUserSubscription(userId),
    onSuccess: (data, userId) => {
      console.log(
        'Subscription reactivation successful, invalidating caches...'
      )

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })

      queryClient.refetchQueries({ queryKey: ['admin', 'users'] })
      queryClient.refetchQueries({ queryKey: ['admin', 'stats'] })

      console.log('✅ Caches invalidated after subscription reactivation')
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to reactivate subscription'
      console.error('Reactivate subscription error:', error)
      throw new Error(errorMessage)
    },
  })
}

// Delete user (admin)
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.refetchQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to delete user'
      console.error('Delete user error:', error)
      alert(errorMessage)
    },
  })
}

// Create user (admin)
export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.refetchQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to create user'
      console.error('Create user error:', error)
      alert(errorMessage)
    },
  })
}

// Get payouts
export const useGetPayouts = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'payouts', params],
    queryFn: () => adminService.getPayouts(params),
    enabled,
    staleTime: 30 * 1000, // Reduced for faster updates
    cacheTime: 2 * 60 * 1000,
  })
}

// Approve payout
export const useApprovePayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.approvePayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.refetchQueries({ queryKey: ['admin', 'payouts'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to approve payout'
      console.error('Approve payout error:', error)
      alert(errorMessage)
    },
  })
}

// Reject payout
export const useRejectPayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ payoutId, reason }) =>
      adminService.rejectPayout(payoutId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.refetchQueries({ queryKey: ['admin', 'payouts'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to reject payout'
      console.error('Reject payout error:', error)
      alert(errorMessage)
    },
  })
}

// Complete payout
export const useCompletePayout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.completePayout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.refetchQueries({ queryKey: ['admin', 'payouts'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to complete payout'
      console.error('Complete payout error:', error)
      alert(errorMessage)
    },
  })
}
