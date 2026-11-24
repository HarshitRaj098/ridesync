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
        <button className="qa-item" onClick={() => navigate(trip ? `/trips/${trip.id}/convoy` : '/trips/create')} aria-label="Open my trips">
          <div className="qa-icon">🗺️</div><span>My Trips</span>
        </button>
        <button className="qa-item" onClick={() => navigate('/trips/join')} aria-label="Find nearby groups">
          <div className="qa-icon">📍</div><span>Nearby</span>
        </button>
      </div>

      {trip ? (
        <>
          <div className="section-label" style={{ marginTop: 24 }}>
            <h3>Upcoming Trip</h3>
            <Link className="link" to={`/trips/${trip.id}/lobby`}>View lobby</Link>
          </div>
          <TripCard trip={trip} />
        </>
      ) : (
        <div style={{ marginTop: 24 }}>
          <EmptyState
            icon="🏍️"
            title="No trips yet"
            detail="Create your first trip or join one with an invite code."
            action={<button className="nt-join" onClick={() => navigate('/trips/create')}>Create a trip</button>}
          />
        </div>
      )}

      {isLoading ? (
        <Loader label="Loading your rider stats…" />
      ) : isError ? (
        <ErrorState title="Stats could not load" detail="Your ride stats are stored on this device — try again." onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><b>{stats?.totalRides ?? 0}</b><span>Total Rides</span></div>
            <div className="stat-card"><b>{(stats?.kmLogged ?? 0).toLocaleString('en-IN')}</b><span>KM Logged</span></div>
            <div className="stat-card"><b>{stats?.safetyScore === null || stats?.safetyScore === undefined ? '—' : `${stats.safetyScore}%`}</b><span>Safety Score</span></div>
          </div>
          {(stats?.totalRides ?? 0) === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: 11, padding: '8px 20px 0', margin: 0 }}>No rides yet — complete a trip to see your stats here.</p>
          ) : null}
        </>
      )}

      <div className="section-label"><h3>Your Trips</h3></div>
      {trips.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="No trips yet"
          detail="Trips you create or join will show up here."
          action={<button className="nt-join" onClick={() => navigate('/trips/join')}>Join a trip</button>}
        />
      ) : (
        <div className="list-wrap">
          {trips.map((t) => (
            <TripCard key={t.id} trip={t} />
          ))}
        </div>
      )}
      <BottomNavigation />
    </div>
  )
}
