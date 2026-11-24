import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, Input, QrCode, showToast } from '../components/ui.tsx'
import { buildInviteLink, copyText, generateTripCode } from '../services/join.ts'
import { createTrip } from '../store/store.ts'
import type { RootState } from '../store/store.ts'
import type { Trip } from '../data/mockData.ts'

export default function CreateTrip() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((s: RootState) => s.auth.user)
  const [name, setName] = useState('')
  const [from, setFrom] = useState('')
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [type, setType] = useState<'Public' | 'Private'>('Public')
  const [riders, setRiders] = useState(2)
  const [nameError, setNameError] = useState('')
  const [fromError, setFromError] = useState('')
  const [destError, setDestError] = useState('')
  const [dateError, setDateError] = useState('')
  // The invite code and id are fixed when the form opens, so the QR code
  // and invite link shown below are the real ones for the trip that will
  // be created — not a fake graphic, and not a different code afterwards.
  const [code] = useState(() => generateTripCode())
  const [tripId] = useState(() => `trip-${Date.now()}`)
  const [copied, setCopied] = useState(false)
  const inviteLink = buildInviteLink({ code })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const nErr = name.trim().length < 3 ? 'Give your trip a name (at least 3 characters).' : ''
    const fErr = from.trim().length < 2 ? 'Enter where the trip starts.' : ''
    const dErr = destination.trim().length < 2 ? 'Enter a destination.' : ''
    const dtErr = !date || !time ? 'Pick a date and a start time.' : ''
    setNameError(nErr)
    setFromError(fErr)
    setDestError(dErr)
    setDateError(dtErr)
    if (nErr || fErr || dErr || dtErr) return
    // The creator leads the trip they create. Distance is not estimated
    // here — no table of made-up distances. The trip is created with
    // distance 0 and the app shows "distance not estimated yet" until
    // the real backend measures it from GPS.
    const trip: Trip = {
      id: tripId,
      name: name.trim(),
      from: from.trim(),
      to: destination.replace(/,.*$/, '').trim(),
      distanceKm: 0,
      riders,
      vehicles: Math.max(1, Math.ceil(riders / 4)),
      type,
      date,
      startTime: time,
      startsIn: 'Starts soon',
      code,
      leaderName: user?.name ?? 'You',
    }
    dispatch(createTrip(trip))
    showToast('Trip created — invite your riders!')
    navigate(`/trips/${trip.id}/lobby`)
  }

  return (
    <div className="page">
      <AppHeader title="Create Trip" showBack />
      <form className="form-wrap" onSubmit={submit}>
        <Input id="trip-name" label="Trip Name" placeholder="e.g. Weekend Mountain Ride" value={name} onChange={(e) => { setName(e.target.value); if (nameError) setNameError('') }} error={nameError} aria-invalid={Boolean(nameError)} />
        <Input id="from" label="Starting Point" placeholder="e.g. Bhopal" value={from} onChange={(e) => { setFrom(e.target.value); if (fromError) setFromError('') }} error={fromError} aria-invalid={Boolean(fromError)} />
        <Input id="destination" label="Destination" placeholder="Search destination…" value={destination} onChange={(e) => { setDestination(e.target.value); if (destError) setDestError('') }} error={destError} aria-invalid={Boolean(destError)} />
        <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '-8px 0 16px' }}>
          Distance is not estimated for this trip — it will show “distance not estimated yet” until the real backend measures it from GPS.
        </p>
        <div className="field row2">
          <div>
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => { setDate(e.target.value); if (dateError) setDateError('') }} aria-invalid={Boolean(dateError)} />
          </div>
          <div>
            <label htmlFor="time">Start Time</label>
            <input id="time" type="time" value={time} onChange={(e) => { setTime(e.target.value); if (dateError) setDateError('') }} aria-invalid={Boolean(dateError)} />
          </div>
        </div>
        {dateError ? <span className="error" role="alert">{dateError}</span> : null}
        <div className="field">
          <label>Trip Type</label>
          <div className="seg-group">
            <div className={`seg${type === 'Public' ? ' selected' : ''}`} onClick={() => setType('Public')}>Public</div>
            <div className={`seg${type === 'Private' ? ' selected' : ''}`} onClick={() => setType('Private')}>Private</div>
          </div>
        </div>
        <div className="field">
          <label>Maximum Riders</label>
          <div className="stepper">
            <button type="button" onClick={() => setRiders(Math.max(1, riders - 1))}>−</button>
            <b>{riders}</b>
            <button type="button" onClick={() => setRiders(Math.min(50, riders + 1))}>+</button>
          </div>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 16px' }}>
          Leader: you{user ? ` (${user.name})` : ''} — the trip creator leads the trip.
        </p>
        <div className="section-label" style={{ padding: 0, margin: '4px 0 12px' }}><h3>Invite</h3></div>
        <div className="qr-box">
          <QrCode value={inviteLink} size={112} label={`QR code to join ${name.trim() || 'this trip'}`} />
          <div className="qr-text">
            <b>Invite QR — code {code}</b>
            <span>{inviteLink}</span>
            <button
              type="button"
              className="nt-join"
              style={{ alignSelf: 'flex-start', marginTop: 8 }}
              onClick={async () => {
                const ok = await copyText(inviteLink)
                setCopied(ok)
                if (!ok) showToast('Copy did not work — long-press the link to copy it by hand')
              }}
            >
              {copied ? 'Link copied ✓' : 'Copy invite link'}
            </button>
          </div>
        </div>
        <Button type="submit">Create Trip</Button>
      </form>
      <BottomNavigation />
    </div>
  )
}
