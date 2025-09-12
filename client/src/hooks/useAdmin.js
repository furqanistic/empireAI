// File: client/src/hooks/useAdmin.js - FIXED WITH PROPER ERROR HANDLING
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService.js'

// Get all users with pagination and filters
export const useGetAllUsers = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getAllUsers(params),
    enabled,
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000,
  })
}

// Get admin statistics
export const useGetAdminStats = (enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getAdminStats,
    enabled,
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  })
}

// Update user (admin)
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, userData }) =>
      adminService.updateUser(userId, userData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })

      // Update the specific user in cache
      queryClient.setQueryData(['admin', 'user', variables.userId], data)
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to update user'
      console.error('Update user error:', error)
      // Return error for component to handle
      throw new Error(errorMessage)
    },
  })
}

// Update user subscription (admin only)
export const useUpdateUserSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, subscriptionData }) =>
      adminService.updateUserSubscription(userId, subscriptionData),
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })

      // Force refetch to get updated data
      queryClient.refetchQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to update subscription'
      console.error('Update subscription error:', error)
      throw new Error(errorMessage)
    },
  })
}

// Cancel user subscription (admin only)
export const useCancelUserSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, immediate }) =>
      adminService.cancelUserSubscription(userId, immediate),
    onSuccess: (data, variables) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] })

      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ['admin', 'users'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to cancel subscription'
      console.error('Cancel subscription error:', error)
      throw new Error(errorMessage)
    },
  })
}

// Reactivate user subscription (admin only)
export const useReactivateUserSubscription = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId) => adminService.reactivateUserSubscription(userId),
    onSuccess: (data, userId) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user', userId] })

      queryClient.refetchQueries({ queryKey: ['admin', 'users'] })
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
    staleTime: 60 * 1000,
    cacheTime: 5 * 60 * 1000,
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
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to complete payout'
      console.error('Complete payout error:', error)
      alert(errorMessage)
    },
  })
}
