import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import HomePage       from './pages/HomePage'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import DashboardPage  from './pages/DashboardPage'

function Protected({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function PublicOnly({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <Navigate to="/dashboard" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<HomePage />} />
      <Route path="/login"     element={<PublicOnly><LoginPage /></PublicOnly>} />
      <Route path="/register"  element={<PublicOnly><RegisterPage /></PublicOnly>} />
      <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </LangProvider>
    </AuthProvider>
  )
}