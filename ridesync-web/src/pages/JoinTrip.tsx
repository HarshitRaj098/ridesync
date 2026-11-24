import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, EmptyState, Input } from '../components/ui.tsx'
import { attemptJoin, parseInviteLink } from '../services/join.ts'
import { addNotification, cancelJoinRequest, joinTrip, requestJoin, selectTrip } from '../store/store.ts'
import type { RootState } from '../store/store.ts'

/**
 * Join Trip. Code, invite link and Request all go through one join
 * logic in services/join.ts:
 * - blank / wrong code → inline error, nothing joins
 * - a pasted invite link is parsed and its code is used
 * - a Request is stored (Redux + localStorage), can be cancelled, and
 *   the leader sees it on the Leader Dashboard and in the Trip Lobby
 * The real layer (leader approves, capacity check) waits for Deploy.
 *
 * There is no directory of other people's trips without a backend, so
 * the Nearby section is empty until a real backend lists trips. The
 * trips below are the ones this device already knows — trips the user
 * created or joined.
 */
export default function JoinTrip() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const { code: codeParam } = useParams()
  const user = useSelector((s: RootState) => s.auth.user)
  const trips = useSelector((s: RootState) => s.trip.trips)
  const joinedTripIds = useSelector((s: RootState) => s.trip.joinedTripIds)
  const requests = useSelector((s: RootState) => s.joinRequests.items)
  const [code, setCode] = useState('')
  const [link, setLink] = useState('')
  const [codeError, setCodeError] = useState('')
  const [linkError, setLinkError] = useState('')
  const [linkNote, setLinkNote] = useState('')

  // An invite link opens this screen with the code pre-filled:
  // /trips/join?code=XXXXXX or /trips/join/XXXXXX
  useEffect(() => {
    const fromLink = searchParams.get('code') ?? codeParam ?? ''
    if (!fromLink.trim()) return
    const parsed = parseInviteLink(fromLink)
    if (parsed.ok) {
      setCode(parsed.code)
      setLinkNote(`Invite link opened — code ${parsed.code} is filled in. Check it and tap Join Trip.`)
    } else {
      setLinkError(parsed.error)
    }
    // Only run when the incoming link changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, codeParam])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    setCodeError('')
    setLinkError('')
    const result = attemptJoin({ code, link }, trips)
    if (!result.ok) {
      // Show the error next to the field that caused it.
      if (link.trim()) setLinkError(result.error)
      else setCodeError(result.error)
      return
    }
    dispatch(joinTrip(result.trip.id))
    dispatch(selectTrip(result.trip.id))
    navigate(`/trips/${result.trip.id}/lobby`)
  }

  const requestNearby = (tripId: string, tripName: string) => {
    const name = user?.name ?? 'You'
    const initials = user?.initials ?? 'HR'
    dispatch(requestJoin({ tripId, tripName, requesterName: name, requesterInitials: initials }))
    dispatch(addNotification({
      title: 'Join request sent',
      detail: `${name} asked to join ${tripName}. The leader can see the request in the Trip Lobby and Leader Dashboard.`,
      kind: 'info',
      source: 'join',
    }))
  }

  const pendingFor = (tripId: string) =>
    requests.find((r) => r.tripId === tripId && r.status === 'pending')
  const myRequests = requests.filter((r) => r.requesterName === (user?.name ?? 'You'))

  return (
    <div className="page">
      <AppHeader title="Join Trip" showBack />
      <form className="form-wrap" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="code">Enter Trip Code</label>
          <input
            id="code"
            type="text"
            maxLength={6}
            placeholder="XXXXXX"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); if (codeError) setCodeError('') }}
            aria-invalid={Boolean(codeError)}
            aria-describedby={codeError ? 'code-error' : undefined}
            style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: 3, textTransform: 'uppercase' }}
          />
          {codeError ? <span className="error" id="code-error" role="alert">{codeError}</span> : null}
        </div>
        <div className="divider-or">or paste link</div>
        <Input
          id="link"
          label="Invite link"
          placeholder="https://ridesync-ten.vercel.app/trips/join?code=XXXXXX"
          value={link}
          onChange={(e) => { setLink(e.target.value); if (linkError) setLinkError(''); if (linkNote) setLinkNote('') }}
          error={linkError}
          aria-invalid={Boolean(linkError)}
        />
        {linkNote ? <p className="field-note" role="status">{linkNote}</p> : null}
        <Button type="submit">Join Trip</Button>
        <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 12 }}>
          Joining is instant for public trips. Only trips this device knows — ones you created or
          joined — can be joined by code.
        </p>

        <div className="section-label" style={{ padding: 0, margin: '26px 0 12px' }}><h3>Your Trips</h3></div>
        {trips.length === 0 ? (
          <EmptyState
            icon="🏍️"
            title="No trips to join yet"
            detail="Create a trip and share its code, or ask a rider to send you their invite link."
            action={<button type="button" className="nt-join" onClick={() => navigate('/trips/create')}>Create a trip</button>}
          />
        ) : (
          trips.map((t) => {
            const joined = joinedTripIds.includes(t.id)
            const pending = pendingFor(t.id)
            return (
              <div className="nearby-trip" key={t.id}>
                <div className="notif-ic">🏍️</div>
                <div className="nt-info"><b>{t.name}</b><span>{t.from} → {t.to} · code {t.code}</span></div>
                {joined ? (
                  <span className="nt-joined">Joined ✓</span>
                ) : pending ? (
                  <button type="button" className="nt-cancel" onClick={() => dispatch(cancelJoinRequest(pending.id))}>
                    Requested — Cancel
                  </button>
                ) : (
                  <button type="button" className="nt-join" onClick={() => requestNearby(t.id, t.name)}>Request</button>
                )}
              </div>
            )
          })
        )}
        <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>
          A request is stored and shown to the trip leader. Approval by the leader needs the
          real backend (after Deploy) — for now a request stays “pending”.
        </p>

        <div className="section-label" style={{ padding: 0, margin: '26px 0 12px' }}><h3>Your Join Requests</h3></div>
        {myRequests.length === 0 ? (
          <EmptyState icon="✉️" title="No join requests yet" detail="Request to join a trip above and it will show up here." />
        ) : (
          myRequests.map((r) => (
            <div className="request-row" key={r.id}>
              <div className="nt-info">
                <b>{r.tripName}</b>
                <span>
                  {r.status === 'pending'
                    ? 'Pending — waiting for the leader'
                    : 'Cancelled by you'}
                </span>
              </div>
              {r.status === 'pending' ? (
                <button type="button" className="nt-cancel" onClick={() => dispatch(cancelJoinRequest(r.id))}>
                  Cancel request
                </button>
              ) : null}
            </div>
          ))
        )}
      </form>
      <BottomNavigation />
    </div>
  )
}
