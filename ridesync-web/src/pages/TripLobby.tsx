import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, MemberCard, StatusBadge, TripCard, showToast } from '../components/ui.tsx'
import type { RootState } from '../store/store.ts'

export default function TripLobby() {
  const { id } = useParams()
  const navigate = useNavigate()
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const members = useSelector((s: RootState) => s.convoy.members)
  const joined = useSelector((s: RootState) => s.trip.joinedTripIds.includes(trip.id))
  const tripId = id ?? trip.id

  return (
    <div className="page">
      <AppHeader title="Trip Lobby" showBack />
      <div style={{ paddingTop: 16 }}>
        <TripCard trip={trip} onOpen={() => showToast('You are in the lobby')} />
      </div>
      <div className="section-label">
        <h3>Riders · {trip.riders}</h3>
        <span className="link" onClick={() => showToast('Invite link copied (mock)')}>Invite +</span>
      </div>
      <div className="list-wrap">
        <div className="list-card">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
          <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '10px 0 0' }}>+ 7 more riders confirmed for this convoy.</p>
        </div>
      </div>
      <div className="section-label"><h3>Trip Details</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          <div className="setting-row"><div><b>Departure</b><span>{trip.date} at {trip.startTime}</span></div><StatusBadge>{trip.startsIn}</StatusBadge></div>
          <div className="setting-row"><div><b>Route</b><span>{trip.from} → {trip.to} · {trip.distanceKm} km</span></div></div>
          <div className="setting-row"><div><b>Invite code</b><span>Share with riders to join</span></div><b style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)' }}>{trip.code}</b></div>
          <div className="setting-row"><div><b>Joined</b><span>Your seat is confirmed</span></div><span>{joined ? 'Yes ✓' : 'No'}</span></div>
        </div>
      </div>
      <div className="form-wrap">
        <Button onClick={() => navigate(`/trips/${tripId}/convoy`)}>Start / Open Convoy Dashboard</Button>
        <Button variant="ghost" onClick={() => navigate(`/trips/${tripId}/leader`)}>Leader Dashboard</Button>
      </div>
      <BottomNavigation />
    </div>
  )
}
