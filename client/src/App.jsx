// File: client/src/App.jsx

import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AffiliatePage from './pages/Affiliate/AffiliatePage'
import AIBuilderPage from './pages/AIBuilder/AIBuilderPage'
import AuthPage from './pages/Auth/AuthPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import EarningsPage from './pages/Earnings/EarningsPage'
import PricingPage from './pages/Pricing/PricingPage'
import ProductPage from './pages/Product/ProductPage'
import ProfilePage from './pages/Profile/ProfilePage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<AuthPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/auth' element={<AuthPage />} />
        <Route path='/earn' element={<EarningsPage />} />
        <Route path='/invite' element={<AffiliatePage />} />
        <Route path='/pricing' element={<PricingPage />} />
        <Route path='/profile' element={<ProfilePage />} />
        <Route path='/product' element={<ProductPage />} />
        <Route path='/build' element={<AIBuilderPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
