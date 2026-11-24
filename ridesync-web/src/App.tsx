import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from './store/store.ts'
import { ToastHost } from './components/ui.tsx'
import Splash from './pages/Splash.tsx'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import Home from './pages/Home.tsx'
import CreateTrip from './pages/CreateTrip.tsx'
import JoinTrip from './pages/JoinTrip.tsx'
import TripLobby from './pages/TripLobby.tsx'
import ConvoyDashboard from './pages/ConvoyDashboard.tsx'
import LeaderDashboard from './pages/LeaderDashboard.tsx'
import Notifications from './pages/Notifications.tsx'
import Profile from './pages/Profile.tsx'
import Settings from './pages/Settings.tsx'

function Protected({ children }: { children: ReactNode }) {
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const location = useLocation()
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Protected><Home /></Protected>} />
        <Route path="/trips/create" element={<Protected><CreateTrip /></Protected>} />
        <Route path="/trips/join" element={<Protected><JoinTrip /></Protected>} />
        <Route path="/trips/:id/lobby" element={<Protected><TripLobby /></Protected>} />
        <Route path="/trips/:id/convoy" element={<Protected><ConvoyDashboard /></Protected>} />
        <Route path="/trips/:id/leader" element={<Protected><LeaderDashboard /></Protected>} />
        <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastHost />
    </div>
  )
}
