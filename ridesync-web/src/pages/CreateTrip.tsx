import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, Input, showToast } from '../components/ui.tsx'
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

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return showToast('Give your trip a name')
    const trip: Trip = {
      id: `trip-${Date.now()}`,
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
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    }
    dispatch(createTrip(trip))
    showToast('Trip created — invite your riders!')
    navigate(`/trips/${trip.id}/lobby`)
  }

  return (
    <div className="page">
      <AppHeader title="Create Trip" showBack />
      <form className="form-wrap" onSubmit={submit}>
        <Input id="trip-name" label="Trip Name" placeholder="e.g. Manali Mountain Convoy" value={name} onChange={(e) => setName(e.target.value)} />
        <Input id="destination" label="Destination" placeholder="Search destination…" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <div className="field row2">
          <div>
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label htmlFor="time">Start Time</label>
            <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
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
        <div className="qr-box">
          <div className="qr-graphic" />
          <div className="qr-text">
            <b>Invite QR generated</b>
            <span>Riders can scan to join instantly, or share the link below.</span>
          </div>
        </div>
        <Button type="submit">Create Trip</Button>
      </form>
      <BottomNavigation />
    </div>
  )
}
