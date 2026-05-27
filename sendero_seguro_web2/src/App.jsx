import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import AppLayout from './components/Layout/AppLayout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Feed from './pages/Feed'
import Estadisticas from './pages/Estadisticas'
import Perfil from './pages/Perfil'
import RedactarReporte from './components/redactarReporte/redactarReporte'

const STORAGE_KEY = 'sendero_user'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return !!saved
  })

  const handleLoginSuccess = (usuario) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario))
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setIsAuthenticated(false)
  }

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }
    return children
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLoginSuccess={handleLoginSuccess} />
          )
        }
      />
      <Route
        element={(
          <ProtectedRoute>
            <AppLayout onLogout={handleLogout} />
          </ProtectedRoute>
        )}
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/redactar-reporte" element={<RedactarReporte />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
