import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, Input, showToast } from '../components/ui.tsx'
import { NEARBY_TRIPS, CURRENT_TRIP } from '../data/mockData.ts'
import { joinTrip } from '../store/store.ts'
import type { RootState } from '../store/store.ts'

export default function JoinTrip() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const [code, setCode] = useState('')
  const [link, setLink] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const entered = code.trim().toUpperCase()
    if (entered && entered !== CURRENT_TRIP.code) {
      showToast('Trip code not found (mock) — try A1B2C9')
      return
    }
    dispatch(joinTrip(CURRENT_TRIP.id))
    showToast('Joined trip lobby')
    navigate(`/trips/${CURRENT_TRIP.id}/lobby`)
  }

  return (
    <div className="page">
      <AppHeader title="Join Trip" showBack />
      <form className="form-wrap" onSubmit={submit}>
        <div className="field">
          <label htmlFor="code">Enter Trip Code</label>
          <input id="code" type="text" maxLength={6} placeholder="A1B2C9" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 20, letterSpacing: 3, textTransform: 'uppercase' }} />
        </div>
        <Button type="button" variant="ghost" onClick={() => showToast('Opening camera scanner (mock)')}>📷 Scan QR Code</Button>
        <div className="divider-or">or paste link</div>
        <Input id="link" label="Invite link" placeholder="https://ridesync.app/join/…" value={link} onChange={(e) => setLink(e.target.value)} />
        <Button type="submit">Join Trip</Button>
        <p style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 12 }}>
          Mock: the Manali Mountain Convoy code is <b style={{ color: 'var(--cyan)' }}>{CURRENT_TRIP.code}</b> (leave blank to join it).
        </p>

        <div className="section-label" style={{ padding: 0, margin: '26px 0 12px' }}><h3>Nearby Trips</h3></div>
        {NEARBY_TRIPS.map((t) => (
          <div className="nearby-trip" key={t.id}>
            <div className="notif-ic">🏍️</div>
            <div className="nt-info"><b>{t.name}</b><span>{t.detail}</span></div>
            <button type="button" className="nt-join" onClick={() => showToast('Request sent to leader')}>Request</button>
          </div>
        ))}
        <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>Current trip: {trip.name} · {trip.from} → {trip.to}</p>
      </form>
      <BottomNavigation />
    </div>
  )
}
