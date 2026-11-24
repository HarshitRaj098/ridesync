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
  const [name, setName] = useState('Manali Mountain Convoy')
  const [destination, setDestination] = useState('Manali, Himachal Pradesh')
  const [date, setDate] = useState('2026-07-25')
  const [time, setTime] = useState('06:00')
  const [type, setType] = useState<'Public' | 'Private'>('Public')
  const [riders, setRiders] = useState(12)
  const [leader, setLeader] = useState('You (Trip Creator)')
  const [nameError, setNameError] = useState('')
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
    const dErr = destination.trim().length < 2 ? 'Enter a destination.' : ''
    const dtErr = !date || !time ? 'Pick a date and a start time.' : ''
    setNameError(nErr)
    setDestError(dErr)
    setDateError(dtErr)
    if (nErr || dErr || dtErr) return
    const trip: Trip = {
      id: tripId,
      name: name.trim(),
      from: 'Bhopal',
      to: destination.replace(/,.*$/, '').trim() || 'Manali',
      distanceKm: 612,
      riders,
      vehicles: Math.max(1, Math.ceil(riders / 4)),
      type,
      date,
      startTime: time,
      startsIn: 'Starts soon',
      code,
      leaderName: leader === 'You (Trip Creator)' ? (user?.name ?? 'You') : leader,
    }
    dispatch(createTrip(trip))
    showToast('Trip created — invite your riders!')
    navigate(`/trips/${trip.id}/lobby`)
  }

  return (
    <div className="page">
      <AppHeader title="Create Trip" showBack />
      <form className="form-wrap" onSubmit={submit}>
        <Input id="trip-name" label="Trip Name" placeholder="e.g. Manali Mountain Convoy" value={name} onChange={(e) => { setName(e.target.value); if (nameError) setNameError('') }} error={nameError} aria-invalid={Boolean(nameError)} />
        <Input id="destination" label="Destination" placeholder="Search destination…" value={destination} onChange={(e) => { setDestination(e.target.value); if (destError) setDestError('') }} error={destError} aria-invalid={Boolean(destError)} />
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
            <button type="button" onClick={() => setRiders(Math.max(2, riders - 1))}>−</button>
            <b>{riders}</b>
            <button type="button" onClick={() => setRiders(Math.min(50, riders + 1))}>+</button>
          </div>
        </div>
        <div className="field">
          <label htmlFor="leader">Select Leader</label>
          <select id="leader" value={leader} onChange={(e) => setLeader(e.target.value)}>
            <option>You (Trip Creator)</option>
            <option>Rohit V.</option>
            <option>Ananya K.</option>
          </select>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 16px' }}>
          Leader: {leader}
          {user ? ` · created by ${user.name}` : ''}
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
