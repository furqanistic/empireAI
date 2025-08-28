// File: src/hooks/useAuth.js
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

// FIXED: Allow the query to run even without userId since the service handles that case
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
