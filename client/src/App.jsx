// File: client/src/App.jsx

import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AffiliatePage from './pages/Affiliate/AffiliatePage'
import AuthPage from './pages/Auth/AuthPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import EarningsPage from './pages/Earnings/EarningsPage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<AuthPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/auth' element={<AuthPage />} />
        <Route path='/earn' element={<EarningsPage />} />
        <Route path='/invite' element={<AffiliatePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
