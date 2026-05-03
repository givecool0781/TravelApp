import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ExchangePage from './pages/ExchangePage'
import HomePage from './pages/HomePage'
import TripPage from './pages/TripPage'
import MapPage from './pages/MapPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      載入中...
    </div>
  )
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/trip/:id" element={<RequireAuth><TripPage /></RequireAuth>} />
        <Route path="/trip/:id/map" element={<RequireAuth><MapPage /></RequireAuth>} />
        <Route path="/exchange" element={<RequireAuth><ExchangePage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}
