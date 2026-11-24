import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { AppHeader, BottomNavigation, Button, EmptyState, MemberCard, Modal, showToast } from '../components/ui.tsx'
import { formatRideTime } from '../data/mockData.ts'
import { getConvoySummary, isTripLeader } from '../services/convoySummary.ts'
import { browserNotify } from '../services/notify.ts'
import { addChat, addNotification, ensureSelfMember, recordCompletedTrip, regroup, startConvoyForTrip } from '../store/store.ts'
import type { AppDispatch, RootState } from '../store/store.ts'

export default function LeaderDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  const { id } = useParams()
  const trips = useSelector((s: RootState) => s.trip.trips)
  const currentTrip = useSelector((s: RootState) => s.trip.currentTrip)
  const trip = (id ? trips.find((t) => t.id === id) : undefined) ?? currentTrip
  const { members, alerts, speedKmh, speedSamples, rideSeconds, distanceCoveredKm } = useSelector((s: RootState) => s.convoy)
  const pendingRequests = useSelector((s: RootState) =>
    trip ? s.joinRequests.items.filter((r) => r.tripId === trip.id && r.status === 'pending') : [],
  )
  const user = useSelector((s: RootState) => s.auth.user)
  const [broadcast, setBroadcast] = useState('')
  const [broadcastError, setBroadcastError] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  // This screen belongs to one trip, like the Convoy Dashboard: opening
  // it starts that trip's convoy state and adds the signed-in rider as
  // its only known member. Nobody else is in the convoy until they
  // join for real.
  useEffect(() => {
    if (!trip) return
    dispatch(startConvoyForTrip(trip.id))
    if (user) {
      dispatch(ensureSelfMember({
        id: 'self',
        name: user.name,
        initials: user.initials,
        role: isTripLeader(user, trip, []) ? 'Leader' : undefined,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, trip?.id])

  if (!trip) {
    return (
      <div className="page">
        <AppHeader title="Leader Dashboard" showBack />
        <div style={{ padding: '24px 20px' }}>
          <EmptyState
            icon="👑"
            title="No trip to lead"
            detail="Create a trip or join one with an invite code — then its Leader Dashboard will show here."
            action={<button className="nt-join" onClick={() => navigate('/trips/create')}>Create a trip</button>}
          />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  // ONE source of truth: every count, the health score and the average
  // speed on this page come from the same summary the Convoy Dashboard
  // reads — no second hard-coded count anywhere.
  const summary = getConvoySummary({ members, trip, alerts, speedSamples, speedKmh })
  const { online, stopped, offline, separatedCount: separated, healthScore, healthText, avgSpeed } = summary
  // A health percentage means nothing before a ride exists: only show
  // it once the convoy has been open with riders in it.
  const rideStarted = rideSeconds > 0 && members.length > 0
  const isLeader = isTripLeader(user, trip, members)
  const maxSample = speedSamples.length > 0 ? Math.max(...speedSamples) : 0

  const sendBroadcast = () => {
    const text = broadcast.trim()
    if (!text) { setBroadcastError('Type a broadcast message first.'); return }
    if (text.length > 200) { setBroadcastError('Keep broadcasts under 200 characters.'); return }
    const author = user ? `${user.name} (Leader)` : 'Leader'
    dispatch(addChat({ text, author, initials: user?.initials ?? '?' }))
    dispatch(addNotification({ title: 'Broadcast sent', detail: `“${text}”`, kind: 'info', source: 'broadcast' }))
    browserNotify('Broadcast sent', text)
    showToast(members.length <= 1 ? 'Broadcast posted to convoy chat — no other riders in this convoy yet' : 'Broadcast posted to convoy chat')
    setBroadcast('')
    setBroadcastError('')
  }

  const doRegroup = () => {
    if (members.length <= 1) {
      showToast('No other riders in this convoy to regroup.')
      return
    }
    dispatch(regroup())
    dispatch(addNotification({ title: 'Regroup requested', detail: 'Leader asked all riders to regroup at the next stop.', kind: 'info', source: 'regroup' }))
    browserNotify('Regroup requested', 'Leader asked all riders to regroup at the next stop.')
    showToast('Regroup request posted')
  }

  const finishTrip = () => {
    // Ending a ride records a real completed trip (this device only):
    // +1 ride, the distance actually covered, and a history entry.
    dispatch(recordCompletedTrip({
      km: Math.round(distanceCoveredKm),
      trip: {
        id: trip.id,
        name: trip.name,
        route: `${trip.from} → ${trip.to}`,
        distanceKm: Math.round(distanceCoveredKm),
        date: trip.date,
      },
    }))
    void queryClient.invalidateQueries({ queryKey: ['rider-stats'] })
    void queryClient.invalidateQueries({ queryKey: ['trip-history'] })
    setShowSummary(false)
    navigate('/home')
  }

  return (
    <div className="page">
      <AppHeader title="Leader Dashboard" showBack />
      <div className="section-label"><h3>{trip.name}</h3><span className="link" onClick={() => navigate(`/trips/${trip.id}/convoy`)}>Open map →</span></div>

      <div className="list-wrap">
        <div className="list-card">
          <div className="health-ring">
            <svg width="96" height="96" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="9" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="#22C55E" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 - 264 * ((rideStarted ? healthScore : 0) / 100)} />
            </svg>
            <div>
              <b>{rideStarted ? `${healthScore}%` : '—'}</b>
              <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Ride health score</div>
              <div style={{ color: rideStarted ? healthText.color : 'var(--text-dim)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                {rideStarted ? healthText.label : 'No ride in progress yet'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="leader-grid">
        <div className="stat-card"><b>{online} / {summary.namedCount}</b><span>Online · riders here</span></div>
        <div className="stat-card"><b>{separated}</b><span>Separated</span></div>
        <div className="stat-card"><b>{stopped}</b><span>Stopped</span></div>
        <div className="stat-card"><b>{offline}</b><span>Offline</span></div>
        <div className="stat-card"><b>{speedSamples.length > 0 ? `${avgSpeed} km/h` : '—'}</b><span>Avg Speed (this ride)</span></div>
        <div className="stat-card"><b>{summary.totalRiders}</b><span>Rider limit</span></div>
      </div>

      <div className="section-label"><h3>Riders</h3></div>
      <div className="list-wrap">
        {members.length === 0 ? (
          <EmptyState icon="👥" title="No riders in this convoy yet" detail="You are the only rider so far. Share the invite code from the Trip Lobby to add riders." />
        ) : (
          <div className="list-card">
            {members.map((m) => (
              <MemberCard key={m.id} member={m} members={members} />
            ))}
          </div>
        )}
      </div>

      {isLeader ? (
        <>
          <div className="section-label"><h3>Join Requests · {pendingRequests.length}</h3></div>
          <div className="list-wrap">
            {pendingRequests.length === 0 ? (
              <EmptyState icon="✉️" title="No pending join requests" detail="When a rider requests to join this trip, their name shows up here so you can see who is waiting." />
            ) : (
              <div className="list-card">
                {pendingRequests.map((r) => (
                  <div className="request-row" key={r.id}>
                    <div className="m-avatar">{r.requesterInitials}</div>
                    <div className="nt-info">
                      <b>{r.requesterName}</b>
                      <span>
                        Asked to join {r.tripName} · {new Date(r.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="nt-pending">Pending</span>
                  </div>
                ))}
                <p style={{ color: 'var(--text-faint)', fontSize: 12, margin: '10px 0 0' }}>
                  Approving a request needs the real backend (after Deploy) — for now requests are
                  stored locally and shown here, and the requester can cancel theirs from Join Trip.
                </p>
              </div>
            )}
          </div>

          <div className="section-label"><h3>Leader Actions</h3></div>
          <div className="form-wrap" style={{ paddingTop: 0 }}>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 12px' }}>
              Signed in as {user?.name ?? 'the leader'} — you lead this trip, so these controls are yours.
            </p>
            <Button onClick={doRegroup}>🔄 Regroup Convoy</Button>
            <div className="field" style={{ marginTop: 14 }}>
              <label htmlFor="broadcast">Broadcast message</label>
              <input
                id="broadcast"
                type="text"
                placeholder="Message all riders…"
                maxLength={200}
                value={broadcast}
                onChange={(e) => { setBroadcast(e.target.value); if (broadcastError) setBroadcastError('') }}
                aria-invalid={Boolean(broadcastError)}
              />
              {broadcastError ? <span className="error" role="alert">{broadcastError}</span> : null}
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>Broadcasts also appear in Convoy chat and Notifications.</span>
            </div>
            <Button variant="ghost" onClick={sendBroadcast}>📣 Send Broadcast</Button>
            <Button variant="danger" onClick={() => setShowSummary(true)}>End Trip</Button>
          </div>
        </>
      ) : (
        <>
          <div className="section-label"><h3>Leader Actions</h3></div>
          <div className="list-wrap">
            <div className="list-card read-only-note">
              <b>👁️ Viewing as a rider — read-only</b>
              <p>
                Only {summary.leaderName} — the leader of this trip — can broadcast, ask the convoy to
                regroup, end the trip, or see join requests. You are signed in as {user?.name ?? 'a rider'},
                so those controls are hidden for you.
              </p>
              <p style={{ marginBottom: 0 }}>
                You still see the same live stats, riders and alerts as the leader — only the
                controls are leader-only.
              </p>
            </div>
          </div>
        </>
      )}

      <div className="section-label"><h3>Analytics — Speed (km/h)</h3></div>
      <div className="list-wrap">
        {speedSamples.length === 0 ? (
          <EmptyState icon="📊" title="No speed data yet" detail="Speed is recorded while you ride with location on. Open the convoy map and ride to see it here." />
        ) : (
          <div className="list-card">
            {speedSamples.slice(-12).map((v, i) => (
              <div className="bar-row" key={i}>
                <span>{`#${i + 1}`}</span>
                <div className="bar-track"><div className="bar-fill" style={{ width: `${maxSample > 0 ? (v / maxSample) * 100 : 0}%` }} /></div>
                <b style={{ width: 34, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{v}</b>
              </div>
            ))}
            <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '10px 0 0' }}>Alerts this ride: {summary.alertsCount} · Ride health {rideStarted ? `${healthScore}%` : '—'} · Speeds recorded from this ride's GPS on this device.</p>
          </div>
        )}
      </div>

      {showSummary ? (
        <Modal
          title="Trip summary"
          icon="🏁"
          onClose={() => setShowSummary(false)}
          actions={<button className="btn-confirm" onClick={finishTrip}>Done — back home</button>}
        >
          <p>{trip.name} · {trip.from} → {trip.to}</p>
          <div className="summary-grid">
            <div className="stat-card"><b>{Math.round(distanceCoveredKm)} km</b><span>Distance ridden</span></div>
            <div className="stat-card"><b>{formatRideTime(rideSeconds)}</b><span>Ride time</span></div>
            <div className="stat-card"><b>{members.length}</b><span>Riders</span></div>
            <div className="stat-card"><b>{rideStarted ? `${healthScore}%` : '—'}</b><span>Ride health (this ride)</span></div>
          </div>
          <p style={{ marginBottom: 0 }}>Recorded on this device — distance and time are from this ride only.</p>
        </Modal>
      ) : null}
      <BottomNavigation />
    </div>
  )
}
