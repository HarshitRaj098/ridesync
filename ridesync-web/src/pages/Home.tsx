import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useQuery } from '@tanstack/react-query'
import { AppHeader, BottomNavigation, EmptyState, ErrorState, Loader, TripCard } from '../components/ui.tsx'
import { fetchRiderStats } from '../services/api.ts'
import type { RootState } from '../store/store.ts'

export default function Home() {
  const navigate = useNavigate()
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const trips = useSelector((s: RootState) => s.trip.trips)
  const pastTrips = trips.filter((t) => t.id !== trip.id)
  const { data: stats, isLoading, isError, refetch } = useQuery({ queryKey: ['rider-stats'], queryFn: fetchRiderStats })

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
        <button className="qa-item" onClick={() => navigate('/trips/create')} aria-label="Create trip">
          <div className="qa-icon">＋</div><span>Create Trip</span>
        </button>
        <button className="qa-item" onClick={() => navigate('/trips/join')} aria-label="Join trip">
          <div className="qa-icon">👥</div><span>Join Trip</span>
        </button>
        <button className="qa-item" onClick={() => navigate(`/trips/${trip.id}/convoy`)} aria-label="Open my trips">
          <div className="qa-icon">🗺️</div><span>My Trips</span>
        </button>
        <button className="qa-item" onClick={() => navigate('/trips/join')} aria-label="Find nearby groups">
          <div className="qa-icon">📍</div><span>Nearby</span>
        </button>
      </div>

      <div className="section-label" style={{ marginTop: 24 }}>
        <h3>Upcoming Trip</h3>
        <Link className="link" to={`/trips/${trip.id}/lobby`}>View lobby</Link>
      </div>
      <TripCard trip={trip} />

      {isLoading ? (
        <Loader label="Loading your rider stats…" />
      ) : isError ? (
        <ErrorState title="Stats could not load" detail="Your ride stats are mock data served locally — try again." onRetry={() => void refetch()} />
      ) : (
        <div className="stats-grid">
          <div className="stat-card"><b>{stats?.totalRides ?? 47}</b><span>Total Rides</span></div>
          <div className="stat-card"><b>{(stats?.kmLogged ?? 3140).toLocaleString('en-IN')}</b><span>KM Logged</span></div>
          <div className="stat-card"><b>{stats?.safetyScore ?? 98}%</b><span>Safety Score</span></div>
        </div>
      )}

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

      <div className="section-label"><h3>Your Trips</h3></div>
      {trips.length === 0 ? (
        <EmptyState
          icon="🏍️"
          title="No trips yet"
          detail="Create your first trip or join one with an invite code."
          action={<button className="nt-join" onClick={() => navigate('/trips/create')}>Create a trip</button>}
        />
      ) : (
        <div className="list-wrap">
          {pastTrips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
          {pastTrips.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 12, padding: '0 4px' }}>No past trips yet — completed trips will show up here.</p>
          ) : null}
        </div>
      )}
      <BottomNavigation />
    </div>
  )
}
