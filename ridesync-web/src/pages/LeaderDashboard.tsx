import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { AppHeader, BottomNavigation, Button, MemberCard, showToast } from '../components/ui.tsx'
import { SPEED_HISTORY } from '../data/mockData.ts'
import { regroup } from '../store/store.ts'
import type { RootState } from '../store/store.ts'

export default function LeaderDashboard() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const { members, alerts, speedKmh } = useSelector((s: RootState) => s.convoy)
  const [broadcast, setBroadcast] = useState('')

  const online = members.filter((m) => m.status === 'online').length
  const stopped = members.filter((m) => m.status === 'stopped').length
  const offline = members.filter((m) => m.status === 'offline').length
  const separated = stopped + offline
  // Ride health: mock score derived from live member states (98% safety baseline).
  const healthScore = Math.max(60, 98 - separated * 3)
  const maxSpeed = Math.max(...SPEED_HISTORY.map((s) => s.value), speedKmh)

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
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      </div>

      <div className="section-label"><h3>Leader Actions</h3></div>
      <div className="form-wrap" style={{ paddingTop: 0 }}>
        <Button onClick={() => { dispatch(regroup()); showToast('Regroup request sent to all riders') }}>🔄 Regroup Convoy</Button>
        <div className="field" style={{ marginTop: 14 }}>
          <label htmlFor="broadcast">Broadcast message</label>
          <input id="broadcast" type="text" placeholder="Message all riders…" value={broadcast} onChange={(e) => setBroadcast(e.target.value)} />
        </div>
        <Button variant="ghost" onClick={() => { if (broadcast.trim()) { showToast(`Broadcast sent: “${broadcast.trim()}”`); setBroadcast('') } else showToast('Type a broadcast message first') }}>📣 Send Broadcast</Button>
        <Button variant="danger" onClick={() => { showToast('Trip ended (mock) — ride summary saved'); navigate('/home') }}>End Trip</Button>
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
      <BottomNavigation />
    </div>
  )
}
