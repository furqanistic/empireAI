// File: client/src/App.jsx
import { useSelector } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AffiliatePage from './pages/Affiliate/AffiliatePage'
import AIBuilderPage from './pages/AIBuilder/AIBuilderPage'
import NicheLaunchpad from './pages/AIBuilder/NicheLaunchpad'
import ProductGenerator from './pages/AIBuilder/ProductGenerator'
import ViralHookFactory from './pages/AIBuilder/ViralHookFactory'
import AuthPage from './pages/Auth/AuthPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import EarningsPage from './pages/Earnings/EarningsPage'
import PricingPage from './pages/Pricing/PricingPage'
import SubscriptionSuccess from './pages/Pricing/SubscriptionSuccess'
import ProductPage from './pages/Product/ProductPage'
import ProfilePage from './pages/Profile/ProfilePage'
import { selectCurrentUser } from './redux/userSlice.js'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser)

  if (!currentUser) {
    return <Navigate to='/auth' replace />
  }

  return children
}

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser)

  if (currentUser) {
    return <Navigate to='/dashboard' replace />
  }

  return children
}

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path='/'
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path='/auth'
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path='/dashboard'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/build'
          element={
            <ProtectedRoute>
              <AIBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/build/viral-hooks-factory'
          element={
            <ProtectedRoute>
              <ViralHookFactory />
            </ProtectedRoute>
          }
        />
        <Route
          path='/build/product-generator'
          element={
            <ProtectedRoute>
              <ProductGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path='/build/niche-launchpad'
          element={
            <ProtectedRoute>
              <NicheLaunchpad />
            </ProtectedRoute>
          }
        />
        <Route
          path='/earn'
          element={
            <ProtectedRoute>
              <EarningsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/invite'
          element={
            <ProtectedRoute>
              <AffiliatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/product'
          element={
            <ProtectedRoute>
              <ProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/pricing'
          element={
            <ProtectedRoute>
              <PricingPage />
            </ProtectedRoute>
          }
        />
        <Route path='/pricing/success' element={<SubscriptionSuccess />} />

        {/* Catch all route - redirect to auth */}
        <Route path='*' element={<Navigate to='/auth' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
