import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppHeader, BottomNavigation, Button, EmptyState, MemberCard, Modal, showToast } from '../components/ui.tsx'
import { SPEED_HISTORY, formatRideTime, separatedReason } from '../data/mockData.ts'
import { browserNotify } from '../services/notify.ts'
import { addChat, addNotification, regroup } from '../store/store.ts'
import type { RootState } from '../store/store.ts'

export default function LeaderDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const { members, alerts, speedKmh, rideSeconds, distanceCoveredKm } = useSelector((s: RootState) => s.convoy)
  const pendingRequests = useSelector((s: RootState) =>
    s.joinRequests.items.filter((r) => r.tripId === trip.id && r.status === 'pending'),
  )
  const user = useSelector((s: RootState) => s.auth.user)
  const [broadcast, setBroadcast] = useState('')
  const [broadcastError, setBroadcastError] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const online = members.filter((m) => m.status === 'online').length
  const stopped = members.filter((m) => m.status === 'stopped').length
  const offline = members.filter((m) => m.status === 'offline').length
  const separated = members.filter((m) => separatedReason(m, members)).length
  // Ride health: mock score derived from live member states (98% safety baseline).
  const healthScore = Math.max(60, 98 - separated * 3)
  const maxSpeed = Math.max(...SPEED_HISTORY.map((s) => s.value), speedKmh)

  const sendBroadcast = () => {
    const text = broadcast.trim()
    if (!text) { setBroadcastError('Type a broadcast message first.'); return }
    if (text.length > 200) { setBroadcastError('Keep broadcasts under 200 characters.'); return }
    const author = user ? `${user.name} (Leader)` : 'Rohit (Leader)'
    dispatch(addChat({ text, author, initials: user?.initials ?? 'RV' }))
    dispatch(addNotification({ title: 'Broadcast sent', detail: `“${text}”`, kind: 'info' }))
    browserNotify('Broadcast sent', text)
    showToast('Broadcast sent to all riders')
    setBroadcast('')
    setBroadcastError('')
  }

  const doRegroup = () => {
    dispatch(regroup())
    dispatch(addNotification({ title: 'Regroup requested', detail: 'Leader asked all riders to regroup at the next stop.', kind: 'info' }))
    browserNotify('Regroup requested', 'Leader asked all riders to regroup at the next stop.')
    showToast('Regroup request sent to all riders')
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
              <circle cx="50" cy="50" r="42" stroke="#22C55E" strokeWidth="9" fill="none" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={264 - 264 * (healthScore / 100)} />
            </svg>
            <div>
              <b>{healthScore}%</b>
              <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Ride health score</div>
              <div style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>● Convoy healthy</div>
            </div>
          </div>
        </div>
      </div>

      <div className="leader-grid">
        <div className="stat-card"><b>{online} / {members.length}</b><span>Online Riders*</span></div>
        <div className="stat-card"><b>{separated}</b><span>Separated</span></div>
        <div className="stat-card"><b>{stopped}</b><span>Stopped</span></div>
        <div className="stat-card"><b>{offline}</b><span>Offline</span></div>
        <div className="stat-card"><b>{speedKmh} km/h</b><span>Avg Speed Now</span></div>
        <div className="stat-card"><b>{trip.riders}</b><span>Total Riders</span></div>
      </div>
      <p style={{ color: 'var(--text-faint)', fontSize: 11, padding: '8px 20px 0', margin: 0 }}>* Online counts the 5 named riders shown live; {trip.riders} riders are on the trip in total (mock data).</p>

      <div className="section-label"><h3>Riders</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} members={members} />
          ))}
        </div>
      </div>

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

      <div className="section-label"><h3>Analytics — Speed (km/h)</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          {SPEED_HISTORY.map((s) => (
            <div className="bar-row" key={s.label}>
              <span>{s.label}</span>
              <div className="bar-track"><div className="bar-fill" style={{ width: `${(s.value / maxSpeed) * 100}%` }} /></div>
              <b style={{ width: 34, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</b>
            </div>
          ))}
          <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '10px 0 0' }}>Alerts this ride: {alerts.length} · Safety score 98% · 3,140 km logged overall.</p>
        </div>
      </div>

      {showSummary ? (
        <Modal
          title="Trip summary"
          icon="🏁"
          onClose={() => setShowSummary(false)}
          actions={<button className="btn-confirm" onClick={() => navigate('/home')}>Done — back home</button>}
        >
          <p>{trip.name} · {trip.from} → {trip.to}</p>
          <div className="summary-grid">
            <div className="stat-card"><b>{Math.round(distanceCoveredKm)} km</b><span>Distance ridden</span></div>
            <div className="stat-card"><b>{formatRideTime(rideSeconds)}</b><span>Ride time</span></div>
            <div className="stat-card"><b>{trip.riders}</b><span>Riders</span></div>
            <div className="stat-card"><b>98%</b><span>Safety score</span></div>
          </div>
          <p style={{ marginBottom: 0 }}>Mock summary — distances and times are simulated, not real GPS data.</p>
        </Modal>
      ) : null}
      <BottomNavigation />
    </div>
  )
}
