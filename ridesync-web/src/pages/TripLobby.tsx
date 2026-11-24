import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, EmptyState, MemberCard, QrCode, StatusBadge, TripCard, showToast } from '../components/ui.tsx'
import { buildInviteLink, buildInviteText, copyText } from '../services/join.ts'
import { isTripLeader } from '../services/convoySummary.ts'
import type { Member } from '../data/mockData.ts'
import type { RootState } from '../store/store.ts'

export default function TripLobby() {
  const { id } = useParams()
  const navigate = useNavigate()
  const trips = useSelector((s: RootState) => s.trip.trips)
  const trip = id ? trips.find((t) => t.id === id) : undefined
  const user = useSelector((s: RootState) => s.auth.user)
  const convoyMembers = useSelector((s: RootState) => (trip && s.convoy.tripId === trip.id ? s.convoy.members : []))
  const joined = useSelector((s: RootState) => (trip ? s.trip.joinedTripIds.includes(trip.id) : false))
  const pendingRequests = useSelector((s: RootState) =>
    trip ? s.joinRequests.items.filter((r) => r.tripId === trip.id && r.status === 'pending') : [],
  )
  const [inviteState, setInviteState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [now, setNow] = useState(() => Date.now())

  // Real countdown: the trip's own date + start time, counted down live.
  // No invented "24 minutes" — if the time has passed, it says so.
  const departureMs = useMemo(() => {
    if (!trip) return null
    const d = new Date(`${trip.date}T${trip.startTime}:00`)
    return Number.isNaN(d.getTime()) ? null : d.getTime()
  }, [trip])
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const secondsLeft = departureMs !== null ? Math.max(0, Math.floor((departureMs - now) / 1000)) : null
  const countdown = secondsLeft !== null
    ? `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`
    : null

  if (!trip) {
    return (
      <div className="page">
        <AppHeader title="Trip Lobby" showBack />
        <div style={{ padding: '24px 20px' }}>
          <EmptyState
            icon="👥"
            title="Trip not found"
            detail="This trip does not exist on this device. Create a trip or join one with an invite code."
            action={<button className="nt-join" onClick={() => navigate('/trips/create')}>Create a trip</button>}
          />
        </div>
        <BottomNavigation />
      </div>
    )
  }

  const inviteLink = buildInviteLink(trip)
  const copyInvite = async () => {
    const ok = await copyText(buildInviteText(trip))
    setInviteState(ok ? 'copied' : 'failed')
    if (!ok) showToast('Copy did not work — long-press the link below to copy it by hand')
  }

  // Riders are the convoy's real members when this trip's convoy has
  // been opened; otherwise the only rider the app can know is you, if
  // you joined this trip. Nobody else is listed until they join.
  const selfMember: Member | null =
    joined && user
      ? {
          id: 'self',
          name: user.name,
          initials: user.initials,
          role: isTripLeader(user, trip, convoyMembers) ? 'Leader' : undefined,
          status: 'online',
          speedKmh: 0,
          note: 'You',
          color: '#007BFF',
        }
      : null
  const displayMembers = convoyMembers.length > 0 ? convoyMembers : selfMember ? [selfMember] : []

  return (
    <div className="page">
      <AppHeader title="Trip Lobby" showBack />
      <div style={{ paddingTop: 16 }}>
        <TripCard trip={trip} />
      </div>
      {secondsLeft !== null && secondsLeft > 0 ? (
        <div className="countdown-card" role="timer" aria-label={`Trip departs in ${countdown}`}>
          <span>⏱️ Departs in</span>
          <b>{countdown}</b>
          <span className="countdown-sub">{trip.date} · {trip.startTime} · {trip.from} → {trip.to}</span>
        </div>
      ) : (
        <div className="countdown-card" role="timer" aria-label="Departure time has passed">
          <span>⏱️ Departure</span>
          <b>{trip.date} · {trip.startTime}</b>
          <span className="countdown-sub">Departure time has passed</span>
        </div>
      )}
      <div className="section-label">
        <h3>Riders · {displayMembers.length}</h3>
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
        {displayMembers.length === 0 ? (
          <EmptyState icon="👥" title="No riders in this convoy yet" detail="Share the invite code above — riders who join will show up here." />
        ) : (
          <div className="list-card">
            {displayMembers.map((m) => (
              <MemberCard key={m.id} member={m} members={displayMembers} />
            ))}
          </div>
        )}
      </div>
      <div className="section-label"><h3>Trip Details</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          <div className="setting-row"><div><b>Departure</b><span>{trip.date} at {trip.startTime}</span></div><StatusBadge>{trip.startsIn}</StatusBadge></div>
          <div className="setting-row"><div><b>Route</b><span>{trip.from} → {trip.to}{trip.distanceKm > 0 ? ` · ${trip.distanceKm} km` : ' · distance not estimated yet'}</span></div></div>
          <div className="setting-row"><div><b>Invite code</b><span>Share with riders to join</span></div><b style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--cyan)' }}>{trip.code}</b></div>
          <div className="setting-row"><div><b>Joined</b><span>Your seat is confirmed</span></div><span>{joined ? 'Yes ✓' : 'No'}</span></div>
        </div>
      </div>
      <div className="form-wrap">
        <Button onClick={() => navigate(`/trips/${trip.id}/convoy`)}>Start / Open Convoy Dashboard</Button>
        <Button variant="ghost" onClick={() => navigate(`/trips/${trip.id}/leader`)}>Leader Dashboard</Button>
      </div>
      <BottomNavigation />
    </div>
  )
}
