import axiosInstance from '../config/config.js'

export const authService = {
  // Sign up user
  signup: async (userData) => {
    const response = await axiosInstance.post('/auth/signup', userData)
    return response.data
  },

  // Sign in user
  signin: async (credentials) => {
    const response = await axiosInstance.post('/auth/signin', credentials)
    return response.data
  },

  // Logout user
  logout: async () => {
    const response = await axiosInstance.post('/auth/logout')
    return response.data
  },

  // Get user profile
  getUserProfile: async (userId) => {
    const response = await axiosInstance.get(`/auth/profile/${userId}`)
    return response.data
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await axiosInstance.put('/auth/profile', userData)
    return response.data
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await axiosInstance.put(
      '/auth/change-password',
      passwordData
    )
    return response.data
  },
  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/auth/admin/users/${userId}`)
    return response.data
  },
}

export const referralService = {
  // Validate referral code
  validateReferralCode: async (code) => {
    const response = await axiosInstance.get(`/referral/validate/${code}`)
    return response.data
  },

  // Get referral stats
  getReferralStats: async (userId) => {
    const endpoint = userId ? `/referral/stats/${userId}` : '/referral/my-stats'
    const response = await axiosInstance.get(endpoint)
    return response.data
  },

  // Get referral leaderboard
  getReferralLeaderboard: async (params = {}) => {
    const response = await axiosInstance.get('/referral/leaderboard', {
      params,
    })
    return response.data
  },

  // Generate new referral code
  generateNewReferralCode: async () => {
    const response = await axiosInstance.put('/referral/generate-new-code')
    return response.data
  },
}
