// File: src/config/config.js
import axios from 'axios'

// Create axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8800/api',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Store reference to get state (will be set when store is created)
let store

export const injectStore = (_store) => {
  store = _store
}

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from Redux store if available
    if (store) {
      const state = store.getState()
      const token = state.user?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401 && store) {
      // Import logout action dynamically to avoid circular dependency
      import('../redux/userSlice.js').then(({ logout }) => {
        store.dispatch(logout())
        // Redirect to login if not already there
        if (window.location.pathname !== '/auth') {
          window.location.href = '/auth'
        }
      })
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
