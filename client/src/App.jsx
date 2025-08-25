// File: client/src/App.jsx

import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AuthPage from './pages/Auth/AuthPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import HomePage from './pages/Home/HomePage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<DashboardPage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
        <Route path='/auth' element={<AuthPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
