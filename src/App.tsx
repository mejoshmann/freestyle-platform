import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Roster from './pages/Roster'
import Evaluations from './pages/Evaluations'
import AdminPanel from './pages/AdminPanel'
import AddAthletes from './pages/AddAthletes'
import ImportAthletes from './pages/ImportAthletes'
import LoadingSpinner from './components/common/LoadingSpinner'
import './App.css'

function AppContent() {
  const { coach, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      {/* Public routes - accessible without authentication */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Protected routes */}
      {coach ? (
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/roster" element={<Roster />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/evaluations/:athleteId" element={<Evaluations />} />
              <Route path="/add-athletes" element={<AddAthletes />} />
              <Route path="/import-athletes" element={<ImportAthletes />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      ) : (
        <Route path="*" element={<Login />} />
      )}
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
