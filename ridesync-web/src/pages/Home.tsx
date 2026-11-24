import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { AppHeader, BottomNavigation, TripCard, showToast } from '../components/ui.tsx'
import { fetchRiderStats } from '../services/api.ts'
import type { RootState } from '../store/store.ts'

export default function Home() {
  const navigate = useNavigate()
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const { data: stats } = useQuery({ queryKey: ['rider-stats'], queryFn: fetchRiderStats })

  return (
    <div className="page">
      <AppHeader />
      <div className="hero">
        <div className="hero-eyebrow">Convoy Mode</div>
        <h1>
          Ride Together.
          <br />
          Never Get Lost.
        </h1>
        <p>Live tracking, group voice and one-tap SOS for your whole crew.</p>
      </div>

      <div className="section-label"><h3>Quick Actions</h3></div>
      <div className="qa-grid">
        <button className="qa-item" onClick={() => navigate('/trips/create')}>
          <div className="qa-icon">＋</div><span>Create Trip</span>
        </button>
        <button className="qa-item" onClick={() => navigate('/trips/join')}>
          <div className="qa-icon">👥</div><span>Join Trip</span>
        </button>
        <button className="qa-item" onClick={() => navigate(`/trips/${trip.id}/convoy`)}>
          <div className="qa-icon">🗺️</div><span>My Trips</span>
        </button>
        <button className="qa-item" onClick={() => showToast('Finding nearby groups')}>
          <div className="qa-icon">📍</div><span>Nearby</span>
        </button>
      </div>

      <div className="section-label" style={{ marginTop: 24 }}>
        <h3>Upcoming Trip</h3>
        <Link className="link" to={`/trips/${trip.id}/lobby`}>View lobby</Link>
      </div>
      <TripCard trip={trip} />

      <div className="stats-grid">
        <div className="stat-card"><b>{stats?.totalRides ?? 47}</b><span>Total Rides</span></div>
        <div className="stat-card"><b>{(stats?.kmLogged ?? 3140).toLocaleString('en-IN')}</b><span>KM Logged</span></div>
        <div className="stat-card"><b>{stats?.safetyScore ?? 98}%</b><span>Safety Score</span></div>
      </div>

      <div className="section-label"><h3>Live Now</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          <div className="notif-row">
            <div className="notif-ic">🗺️</div>
            <div style={{ flex: 1 }}>
              <b>{trip.name} is live</b>
              <span>12 riders on the road · Bhopal → Manali · 612 km</span>
            </div>
            <button className="nt-join" onClick={() => navigate(`/trips/${trip.id}/convoy`)}>Open</button>
          </div>
        </div>
      </div>
      <BottomNavigation />
    </div>
  )
}
