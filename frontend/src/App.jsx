import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader from './components/PageLoader'
import { authService } from './services/authService'

const Login      = lazy(() => import('./pages/Login'))
const Register   = lazy(() => import('./pages/Register'))
const Home       = lazy(() => import('./pages/Home'))
const Dashboard  = lazy(() => import('./pages/Dashboard'))
const Reminders  = lazy(() => import('./pages/Reminders'))
const Calendar   = lazy(() => import('./pages/Calendar'))
const Premium    = lazy(() => import('./pages/Premium'))
const Upload     = lazy(() => import('./pages/Upload'))
const Chat       = lazy(() => import('./pages/Chat'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Report     = lazy(() => import('./pages/Report'))
const NotFound   = lazy(() => import('./pages/NotFound'))

// Wraps authenticated routes — redirects to onboarding if not completed
function Protected({ children }) {
  const location = useLocation()
  const user = authService.getUser()

  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  if (user && user.onboarding_completed === false && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/register"   element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/home"       element={<Protected><Home /></Protected>} />
          <Route path="/dashboard"  element={<Protected><Dashboard /></Protected>} />
          <Route path="/reminders"  element={<Protected><Reminders /></Protected>} />
          <Route path="/calendar"   element={<Protected><Calendar /></Protected>} />
          <Route path="/premium"    element={<Protected><Premium /></Protected>} />
          <Route path="/upload"     element={<Protected><Upload /></Protected>} />
          <Route path="/chat"       element={<Protected><Chat /></Protected>} />
          <Route path="/report"     element={<Protected><Report /></Protected>} />
          <Route path="/"           element={<Navigate to="/home" replace />} />
          <Route path="*"           element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
