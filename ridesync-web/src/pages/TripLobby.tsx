import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, EmptyState, MemberCard, QrCode, StatusBadge, TripCard, showToast } from '../components/ui.tsx'
import { buildInviteLink, buildInviteText, copyText } from '../services/join.ts'
import type { RootState } from '../store/store.ts'

export default function TripLobby() {
  const { id } = useParams()
  const navigate = useNavigate()
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const members = useSelector((s: RootState) => s.convoy.members)
  const joined = useSelector((s: RootState) => s.trip.joinedTripIds.includes(trip.id))
  const pendingRequests = useSelector((s: RootState) =>
    s.joinRequests.items.filter((r) => r.tripId === trip.id && r.status === 'pending'),
  )
  const tripId = id ?? trip.id
  const [inviteState, setInviteState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const inviteLink = buildInviteLink(trip)

  const copyInvite = async () => {
    const ok = await copyText(buildInviteText(trip))
    setInviteState(ok ? 'copied' : 'failed')
    if (!ok) showToast('Copy did not work — long-press the link below to copy it by hand')
  }
  // Live countdown to departure (simulated: starts at 24 min, ticks down).
  const [secondsLeft, setSecondsLeft] = useState(24 * 60)
  useEffect(() => {
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [])
  const countdown = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  return (
    <div className="page">
      <AppHeader title="Trip Lobby" showBack />
      <div style={{ paddingTop: 16 }}>
        <TripCard trip={trip} onOpen={() => showToast('You are in the lobby')} />
      </div>
      <div className="countdown-card" role="timer" aria-label={`Trip departs in ${countdown}`}>
        <span>⏱️ Departs in</span>
        <b>{countdown}</b>
        <span className="countdown-sub">{trip.date} · {trip.startTime} · {trip.from} → {trip.to}</span>
      </div>
      <div className="section-label">
        <h3>Riders · {trip.riders}</h3>
        <span
          className="link"
          role="button"
          tabIndex={0}
          onClick={() => void copyInvite()}
          onKeyDown={(e) => { if (e.key === 'Enter') void copyInvite() }}
        >
          {inviteState === 'copied' ? 'Invite copied ✓' : 'Invite +'}
        </span>
      </div>
      {inviteState === 'failed' ? (
        <p className="error" role="alert" style={{ padding: '0 20px' }}>
          Copying did not work in this browser — copy the link below by hand: {inviteLink}
        </p>
      ) : null}
      <div className="qr-box" style={{ margin: '0 20px 16px' }}>
        <QrCode value={inviteLink} size={96} label={`QR code to join ${trip.name}`} />
        <div className="qr-text">
          <b>Invite — code {trip.code}</b>
          <span>{inviteLink}</span>
          <button type="button" className="nt-join" style={{ alignSelf: 'flex-start', marginTop: 8 }} onClick={() => void copyInvite()}>
            {inviteState === 'copied' ? 'Link copied ✓' : 'Copy invite link'}
          </button>
        </div>
      </div>
      <div className="section-label"><h3>Join Requests · {pendingRequests.length}</h3></div>
      <div className="list-wrap">
        {pendingRequests.length === 0 ? (
          <EmptyState icon="✉️" title="No pending join requests" detail="When a rider requests to join this trip, their name shows up here for the leader." />
        ) : (
          <div className="list-card">
            {pendingRequests.map((r) => (
              <div className="request-row" key={r.id}>
                <div className="m-avatar">{r.requesterInitials}</div>
                <div className="nt-info">
                  <b>{r.requesterName}</b>
                  <span>Asked to join · {new Date(r.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className="nt-pending">Pending</span>
              </div>
            ))}
            <p style={{ color: 'var(--text-faint)', fontSize: 12, margin: '10px 0 0' }}>
              Approval needs the real backend (after Deploy) — for now requests are stored and shown here.
            </p>
          </div>
        )}
      </div>
      <div className="list-wrap">
        <div className="list-card">
          {members.map((m) => (
            <MemberCard key={m.id} member={m} members={members} />
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
