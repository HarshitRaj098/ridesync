import { useQuery } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppHeader, BottomNavigation, Button, EmptyState, ErrorState, Loader, showToast } from '../components/ui.tsx'
import { fetchRiderStats, fetchTripHistory } from '../services/api.ts'
import { logout } from '../store/store.ts'
import type { RootState } from '../store/store.ts'

export default function Profile() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: stats, isLoading, isError, refetch } = useQuery({ queryKey: ['rider-stats'], queryFn: fetchRiderStats })
  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useQuery({ queryKey: ['trip-history'], queryFn: fetchTripHistory })

  return (
    <div className="page">
      <AppHeader title="Profile" showBack />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 8px', gap: 10 }}>
        <div className="avatar lg">{user?.initials ?? 'HR'}</div>
        <h2 style={{ margin: 0, fontSize: 20 }}>{user?.name ?? 'Rider'}</h2>
        <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 13 }}>{user?.email ?? ''}</p>
        <p style={{ margin: 0, color: 'var(--cyan)', fontSize: 12, fontWeight: 600 }}>🏍️ Rider</p>
      </div>

      {isLoading ? (
        <Loader label="Loading your profile…" />
      ) : isError ? (
        <ErrorState title="Profile could not load" detail="Your stats are stored on this device — try again." onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card"><b>{stats?.totalRides ?? 0}</b><span>Total Rides</span></div>
            <div className="stat-card"><b>{(stats?.kmLogged ?? 0).toLocaleString('en-IN')}</b><span>KM Logged</span></div>
            <div className="stat-card"><b>{stats?.safetyScore === null || stats?.safetyScore === undefined ? '—' : `${stats.safetyScore}%`}</b><span>Safety Score</span></div>
          </div>
          {(stats?.totalRides ?? 0) === 0 ? (
            <p style={{ color: 'var(--text-faint)', fontSize: 11, padding: '8px 20px 0', margin: 0 }}>No rides yet — complete a trip to see your stats and safety score here.</p>
          ) : null}
        </>
      )}

      <div className="section-label"><h3>Ride History</h3></div>
      <div className="list-wrap">
        {historyLoading ? (
          <Loader label="Loading ride history…" />
        ) : historyError ? (
          <ErrorState title="Ride history could not load" detail="Try again — history is stored on this device." onRetry={() => void refetchHistory()} />
        ) : (history ?? []).length === 0 ? (
          <EmptyState icon="🏍️" title="No rides yet" detail="Your completed trips will show up here." />
        ) : (
          (history ?? []).map((t) => (
            <div className="list-card" key={t.id}>
              <div className="notif-row">
                <div className="notif-ic">🗺️</div>
                <div style={{ flex: 1 }}>
                  <b>{t.name}</b>
                  <span>{t.route} · {t.distanceKm} km</span>
                  <time>{t.date}</time>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="form-wrap">
        <Button variant="ghost" onClick={() => navigate('/settings')}>⚙️ Settings</Button>
        <Button variant="ghost" onClick={() => { dispatch(logout()); showToast('Signed out'); navigate('/login') }}>Logout</Button>
      </div>
      <BottomNavigation />
    </div>
  )
}
