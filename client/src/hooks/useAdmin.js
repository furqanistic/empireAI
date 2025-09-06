// File: client/src/hooks/useAdmin.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminService } from '../services/adminService.js'

// Get all users with pagination and filters
export const useGetAllUsers = (params = {}, enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.getAllUsers(params),
    enabled,
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get admin statistics
export const useGetAdminStats = (enabled = true) => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminService.getAdminStats,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Update user (admin)
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, userData }) =>
      adminService.updateUser(userId, userData),
    onSuccess: (data) => {
      // Invalidate users queries
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error) => {
      const errorMessage =
        error.response?.data?.message || 'Failed to update user'
      console.error('Update user error:', error)
      alert(errorMessage)
    },
  })
}

// Delete user (admin)
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      // Invalidate users queries
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
      // Invalidate users queries
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
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
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
