// File: client/src/redux/userSlice.js
// client/src/redux/userSlice.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentUser: null,
  token: null,
  loading: false,
  error: false,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true
      state.error = false
    },
    loginSuccess: (state, action) => {
      state.loading = false
      state.error = false

      // Handle different payload structures with defensive checks
      if (action.payload?.data?.user) {
        state.currentUser = action.payload.data.user
        state.token = action.payload.token || action.payload.data.token
      } else if (action.payload?.user) {
        state.currentUser = action.payload.user
        state.token = action.payload.token
      } else if (action.payload?.data) {
        state.currentUser = action.payload.data
        state.token = action.payload.token
      } else {
        state.currentUser = action.payload
        state.token = action.payload?.token || null
      }
    },
    loginFailure: (state, action) => {
      state.loading = false
      state.error = action.payload?.message || action.payload || true
      state.currentUser = null
      state.token = null
    },
    updateProfile: (state, action) => {
      // Update the current user with new profile data
      if (state.currentUser) {
        state.currentUser = {
          ...state.currentUser,
          ...action.payload,
        }
      }
    },
    logout: (state) => {
      localStorage.removeItem('token')
      return initialState
    },
  },
})

// Export actions
export const { loginStart, loginSuccess, loginFailure, updateProfile, logout } =
  userSlice.actions

// Selectors for easy access to state
export const selectUserPlan = (state) => {
  const user = state.user.currentUser
  return user?.subscription?.isActive ? user.subscription.plan : 'free'
}

export const selectSubscriptionStatus = (state) => {
  const user = state.user.currentUser
  return {
    plan: user?.subscription?.plan || 'free',
    isActive: user?.subscription?.isActive || false,
    status: user?.subscription?.status || 'inactive',
    trialActive: user?.subscription?.isTrialActive || false,
    daysRemaining: user?.subscription?.daysRemaining || 0,
  }
}

export const selectHasActiveSubscription = (state) => {
  return state.user.currentUser?.subscription?.isActive || false
}
export const selectCurrentUser = (state) => state.user.currentUser
export const selectIsAdmin = (state) => state.user.currentUser?.role === 'admin'
export const selectIsAuthenticated = (state) => !!state.user.currentUser
export const selectToken = (state) => state.user.token
export const selectIsLoading = (state) => state.user.loading

export default userSlice.reducer
