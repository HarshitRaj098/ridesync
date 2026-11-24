import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from './store/store.ts'
import { ErrorBoundary, Loader, ToastHost } from './components/ui.tsx'

/* Week 1: routes are lazy-loaded so each screen's code only downloads when opened. */
const Splash = lazy(() => import('./pages/Splash.tsx'))
const Login = lazy(() => import('./pages/Login.tsx'))
const Register = lazy(() => import('./pages/Register.tsx'))
const Home = lazy(() => import('./pages/Home.tsx'))
const CreateTrip = lazy(() => import('./pages/CreateTrip.tsx'))
const JoinTrip = lazy(() => import('./pages/JoinTrip.tsx'))
const TripLobby = lazy(() => import('./pages/TripLobby.tsx'))
const ConvoyDashboard = lazy(() => import('./pages/ConvoyDashboard.tsx'))
const LeaderDashboard = lazy(() => import('./pages/LeaderDashboard.tsx'))
const Notifications = lazy(() => import('./pages/Notifications.tsx'))
const Profile = lazy(() => import('./pages/Profile.tsx'))
const Settings = lazy(() => import('./pages/Settings.tsx'))

function Protected({ children }: { children: ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="app-shell">
      <ErrorBoundary>
        <Suspense fallback={<Loader label="Loading RideSync…" />}>
          <Routes>
            <Route path="/" element={<Splash />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/home" element={<Protected><Home /></Protected>} />
            <Route path="/trips/create" element={<Protected><CreateTrip /></Protected>} />
            <Route path="/trips/join" element={<Protected><JoinTrip /></Protected>} />
            {/* Invite links can also arrive as /trips/join/A1B2C9 — same screen, code pre-filled. */}
            <Route path="/trips/join/:code" element={<Protected><JoinTrip /></Protected>} />
            <Route path="/trips/:id/lobby" element={<Protected><TripLobby /></Protected>} />
            <Route path="/trips/:id/convoy" element={<Protected><ConvoyDashboard /></Protected>} />
            <Route path="/trips/:id/leader" element={<Protected><LeaderDashboard /></Protected>} />
            <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/settings" element={<Protected><Settings /></Protected>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <ToastHost />
    </div>
  )
}
