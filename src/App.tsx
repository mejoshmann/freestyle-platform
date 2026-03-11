import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Metrics from './pages/Metrics'
import MetricsBuilder from './pages/MetricsBuilder'
import Roster from './pages/Roster'
import ImportAthletes from './pages/ImportAthletes'
import AddAthletes from './pages/AddAthletes'
import Evaluations from './pages/Evaluations'
import SliderPreview from './pages/SliderPreview'
import LoadingSpinner from './components/common/LoadingSpinner'
import './App.css'

function AppContent() {
  const { coach, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!coach) {
    return <Login />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/roster" element={<Roster />} />
        <Route path="/import" element={<ImportAthletes />} />
        <Route path="/add-athletes" element={<AddAthletes />} />
        <Route path="/evaluations/:athleteId" element={<Evaluations />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/metrics/build" element={<MetricsBuilder />} />
        <Route path="/slider-preview" element={<SliderPreview />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
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
