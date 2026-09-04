// File: client/src/App.jsx
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminPage from './pages/Admin/AdminPage'
import PayoutDashboard from './pages/Admin/PayoutDashboard'
import AffiliatePage from './pages/Affiliate/AffiliatePage'
import AuthPage from './pages/Auth/AuthPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import EarningsPage from './pages/Earnings/EarningsPage'
import HomePage from './pages/Home/HomePage'
import PrivacyPolicyPage from './pages/Layout/PrivacyPolicyPage'
import TermsOfServicePage from './pages/Layout/TermsOfServicePage'
import PricingPage from './pages/Pricing/PricingPage'
import SubscriptionSuccess from './pages/Pricing/SubscriptionSuccess'
import ProgramSetupPage from './pages/Program/ProgramSetupPage'
import ProgramLauncherPage from './pages/Program/ProgramLauncherPage'
import SellableProductStudio from './pages/AIBuilder/SellableProductStudio'
import ProductCheckoutPage from './pages/Product/ProductCheckoutPage'
import ProductSuccessPage from './pages/Product/ProductSuccessPage'
import ProfilePage from './pages/Profile/ProfilePage'
import { selectCurrentUser, selectIsAdmin } from './redux/userSlice.js'

const routeTitles = {
  '/': 'AscndLabs | Affiliate Program Manager',
  '/auth': 'Sign In | AscndLabs',
  '/dashboard': 'Program Overview | AscndLabs',
  '/invite': 'Invite & Affiliates | AscndLabs',
  '/earn': 'Commission Earnings | AscndLabs',
  '/payout': 'Payout Center | AscndLabs',
  '/profile': 'My Profile | AscndLabs',
  '/pricing': 'Plans & Billing | AscndLabs',
  '/program/setup': 'Program Settings | AscndLabs',
  '/program/launcher': 'AI Program Launcher | AscndLabs',
  '/build/product': 'Product Studio | AscndLabs',
  '/admin': 'Admin | AscndLabs',
  '/privacy': 'Privacy Policy | AscndLabs',
  '/terms': 'Terms of Service | AscndLabs',
}

const RouteTitle = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = routeTitles[pathname] || 'AscndLabs | Affiliate Program Manager'
  }, [pathname])

  return null
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser)

  if (!currentUser) {
    return <Navigate to='/auth' replace />
  }

  return children
}

// Admin Route Component (checks for admin role)
const AdminRoute = ({ children }) => {
  const currentUser = useSelector(selectCurrentUser)
  const isAdmin = useSelector(selectIsAdmin)

  if (!currentUser) {
    return <Navigate to='/auth' replace />
  }

  // Check if user has admin role using existing selector
  if (!isAdmin) {
    return <Navigate to='/dashboard' replace />
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
      <RouteTitle />
      <Routes>
        {/* Public Homepage - Always accessible */}
        <Route path='/' element={<HomePage />} />

        {/* Auth Route - Only for non-authenticated users */}
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
          path='/program/setup'
          element={
            <ProtectedRoute>
              <ProgramSetupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/program/launcher'
          element={
            <ProtectedRoute>
              <ProgramLauncherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/build/product'
          element={
            <ProtectedRoute>
              <SellableProductStudio />
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

        {/* Admin Only Route */}
        <Route
          path='/admin'
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path='/payout'
          element={
            <ProtectedRoute>
              <PayoutDashboard />
            </ProtectedRoute>
          }
        />

        <Route path='/pricing/success' element={<SubscriptionSuccess />} />
        <Route path='/product/checkout/:id' element={<ProductCheckoutPage />} />
        <Route path='/product/success' element={<ProductSuccessPage />} />
        <Route path='/privacy' element={<PrivacyPolicyPage />} />
        <Route path='/terms' element={<TermsOfServicePage />} />

        {/* Catch all route - redirect to homepage */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
