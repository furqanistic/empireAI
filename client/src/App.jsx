// File: client/src/App.jsx

import { BrowserRouter, Route, Routes } from 'react-router-dom'

import DashboardPage from './pages/Dashboard/DashboardPage'
import HomePage from './pages/Home/HomePage'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/dashboard' element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
