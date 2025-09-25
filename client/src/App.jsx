// File: client/src/App.jsx
import { useSelector } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/Admin/AdminPage'
import PayoutDashboard from './pages/Admin/PayoutDashboard'
import AffiliatePage from './pages/Affiliate/AffiliatePage'
import AIBuilderPage from './pages/AIBuilder/AIBuilderPage'
import NicheLaunchpad from './pages/AIBuilder/NicheLaunchpad'
import ProductGenerator from './pages/AIBuilder/ProductGenerator'
import ViralHookFactory from './pages/AIBuilder/ViralHookFactory'
import AuthPage from './pages/Auth/AuthPage'
import ChatPage from './pages/Chat/ChatPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import EarningsPage from './pages/Earnings/EarningsPage'
import HomePage from './pages/Home/HomePage'
import PrivacyPolicyPage from './pages/Layout/PrivacyPolicyPage'
import TermsOfServicePage from './pages/Layout/TermsOfServicePage'
import PricingPage from './pages/Pricing/PricingPage'
import SubscriptionSuccess from './pages/Pricing/SubscriptionSuccess'
import ProductCheckoutPage from './pages/Product/ProductCheckoutPage'
import ProductPage from './pages/Product/ProductPage'
import ProductSuccessPage from './pages/Product/ProductSuccessPage'
import PurchasesPage from './pages/Product/PurchasesPage'
import ProfilePage from './pages/Profile/ProfilePage'
import { selectCurrentUser, selectIsAdmin } from './redux/userSlice.js'

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
          path='/chat'
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route path='/product/checkout/:id' element={<ProductCheckoutPage />} />
        <Route path='/product/success' element={<ProductSuccessPage />} />
        <Route path='/purchases' element={<PurchasesPage />} />
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
        <Route path='/privacy' element={<PrivacyPolicyPage />} />
        <Route path='/terms' element={<TermsOfServicePage />} />

        {/* Catch all route - redirect to homepage */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
