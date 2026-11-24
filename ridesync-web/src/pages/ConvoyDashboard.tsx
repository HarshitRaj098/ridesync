import { useEffect, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ConvoyMap from '../components/ConvoyMap.tsx'
import { EmptyState, MapControls, MemberCard, Modal, SOSButton, VoiceButton, showToast } from '../components/ui.tsx'
import { BASE_LAT, BASE_LNG, formatRideTime, separatedReason } from '../data/mockData.ts'
import { browserNotify } from '../services/notify.ts'
import { simulatedSocket } from '../services/socketService.ts'
import { addChat, addNotification, applyLocationUpdate, closeSos, confirmSos, tick } from '../store/store.ts'
import type { AppDispatch, RootState } from '../store/store.ts'
import type { Member } from '../data/mockData.ts'

type Tab = 'members' | 'chat' | 'alerts'

export default function ConvoyDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { members, chat, alerts, rideSeconds, speedKmh, distanceCoveredKm, voiceActive, sosActive, sosSent } = useSelector((s: RootState) => s.convoy)
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const user = useSelector((s: RootState) => s.auth.user)
  const [tab, setTab] = useState<Tab>('members')
  const [expanded, setExpanded] = useState(false)
  const [chatText, setChatText] = useState('')
  const [satOn, setSatOn] = useState(false)
  const [trafficOn, setTrafficOn] = useState(false)
  const [center, setCenter] = useState<[number, number]>([BASE_LAT, BASE_LNG])

  // Simulated live movement: 1s timer ticks (speed/clock) + simulated
  // socket location:update events every 2.5s. No real server.
  useEffect(() => {
    const timer = setInterval(() => dispatch(tick()), 1000)
    const off = simulatedSocket.on('location:update', (payload) => {
      const p = payload as { members: Member[] }
      if (p?.members) dispatch(applyLocationUpdate(p.members))
    })
    simulatedSocket.start()
    return () => {
      clearInterval(timer)
      off()
      simulatedSocket.stop()
    }
  }, [dispatch])

  const remainingKm = Math.max(0, trip.distanceKm - Math.round(distanceCoveredKm))
  const etaHours = speedKmh > 0 ? remainingKm / speedKmh : 0
  const etaText = `${Math.floor(etaHours)}h ${Math.round((etaHours % 1) * 60)}m to ${trip.to}`
  const gaugePct = Math.min(speedKmh / 120, 1)
  const gaugeOffset = 264 - 264 * gaugePct * 0.75

  const separatedCount = members.filter((m) => separatedReason(m, members)).length
  const sendChat = (e: FormEvent) => {
    e.preventDefault()
    const text = chatText.trim()
    if (!text) return
    dispatch(addChat({ text, author: user?.name ?? 'You', initials: user?.initials ?? 'HR' }))
    dispatch(addNotification({ title: 'Message sent to convoy', detail: text, kind: 'info' }))
    setChatText('')
  }

  const sendSos = () => {
    dispatch(confirmSos())
    dispatch(addNotification({ title: 'SOS sent', detail: 'Your live location was broadcast to the convoy leader and emergency contacts.', kind: 'danger' }))
    browserNotify('SOS sent', 'Your live location was broadcast to the convoy leader and emergency contacts.')
    showToast('🚨 SOS broadcast to convoy & contacts')
  }

  return (
    <div className="page no-nav dash-screen">
      <div className="map-wrap">
        <ConvoyMap members={members} center={center} satOn={satOn} trafficOn={trafficOn} />

        <div className="map-overlay-top">
          <button className="circle-btn" onClick={() => navigate('/home')} aria-label="Back home">←</button>
          <div className="glass-chip timer-chip">
            <span className="rec" />
            <span>{formatRideTime(rideSeconds)}</span>
          </div>
          <button className="circle-btn" onClick={() => showToast(satOn ? 'Standard view' : 'Satellite view')} aria-label="Toggle map style">🧭</button>
        </div>

        <MapControls
          satOn={satOn}
          onToggleSat={() => setSatOn((v) => !v)}
          trafficOn={trafficOn}
          onToggleTraffic={() => {
            setTrafficOn((v) => !v)
            showToast(trafficOn ? 'Traffic layer off' : 'Traffic layer on (simulated)')
          }}
          onRecenter={() => {
            setCenter([BASE_LAT, BASE_LNG])
            showToast('Recentered on convoy')
          }}
        />

        <div className="speed-cluster">
          <div className="gauge-wrap">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="42" stroke="url(#gaugeGrad)" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="264" strokeDashoffset={gaugeOffset} />
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#007BFF" />
                  <stop offset="100%" stopColor="#00C2FF" />
                </linearGradient>
              </defs>
            </svg>
            <div className="gauge-center"><b>{speedKmh}</b><span>km/h</span></div>
          </div>
          <div className="eta-chip">ETA {etaText} · {remainingKm} km left</div>
          <div className="eta-chip">{trip.name} · {members.filter((m) => m.status === 'online').length} riding · {Math.round(distanceCoveredKm)} km done</div>
        </div>

        <VoiceButton />
        <SOSButton />

        <div className={`sheet${expanded ? ' expanded' : ''}`}>
          <div className="sheet-handle" onClick={() => setExpanded((v) => !v)} />
          <div className="sheet-tabs">
            <button className={`sheet-tab${tab === 'members' ? ' active' : ''}`} onClick={() => { setTab('members'); setExpanded(true) }}>Members · {trip.riders}</button>
            <button className={`sheet-tab${tab === 'chat' ? ' active' : ''}`} onClick={() => { setTab('chat'); setExpanded(true) }}>Chat</button>
            <button className={`sheet-tab${tab === 'alerts' ? ' active' : ''}`} onClick={() => { setTab('alerts'); setExpanded(true) }}>Alerts · {alerts.length}</button>
          </div>
          <div className="sheet-body">
            {tab === 'members' && (
              <div>
                {separatedCount > 0 ? (
                  <p style={{ color: 'var(--warning)', fontSize: 12, margin: '0 0 10px', fontWeight: 600 }}>⚠️ {separatedCount} rider{separatedCount > 1 ? 's' : ''} separated from the convoy</p>
                ) : null}
                {members.map((m) => (
                  <MemberCard key={m.id} member={m} members={members} />
                ))}
                <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '10px 0 0' }}>+ 7 more riders in this convoy. {voiceActive ? '🎙️ Push-to-talk is live.' : ''}</p>
              </div>
            )}
            {tab === 'chat' && (
              <div>
                {chat.length === 0 ? (
                  <EmptyState icon="💬" title="No messages yet" detail="Say hi to the convoy — messages here are mock and stay on this device." />
                ) : (
                  chat.map((msg) => (
                    <div className="chat-msg" key={msg.id}>
                      <div className="c-avatar">{msg.initials}</div>
                      <div className="c-body"><b>{msg.author}</b><p>{msg.text}</p></div>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === 'alerts' && (
              <div>
                {sosSent ? (
                  <div className="alert-row" style={{ borderColor: 'rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.07)' }}>
                    <div className="a-ic" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--danger)' }}>🚨</div>
                    <div><b>SOS broadcast sent</b><span>Leader and emergency contacts notified.</span></div>
                  </div>
                ) : null}
                {alerts.length === 0 ? (
                  <EmptyState icon="✅" title="No alerts" detail="Convoy alerts will appear here when a rider stops, goes offline or an SOS is sent." />
                ) : (
                  alerts.map((a) => (
                    <div className="alert-row warn" key={a.id}>
                      <div className="a-ic">{a.kind === 'danger' ? '🚨' : '⚠️'}</div>
                      <div><b>{a.title}</b><span>{a.detail}</span></div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {tab === 'chat' ? (
            <form className="chat-input-row" onSubmit={sendChat}>
              <input type="text" placeholder="Message the convoy…" value={chatText} onChange={(e) => setChatText(e.target.value)} />
              <button className="chat-send" type="submit" aria-label="Send message">➤</button>
            </form>
          ) : null}
        </div>
      </div>

      {sosActive ? (
        <Modal
          title="Send Emergency SOS?"
          icon="⚠️"
          onClose={() => dispatch(closeSos())}
          actions={
            <>
              <button className="btn-cancel" onClick={() => dispatch(closeSos())}>Cancel</button>
              <button className="btn-confirm" onClick={sendSos}>Send SOS</button>
            </>
          }
        >
          <p>Your live location and vehicle details will be broadcast to your convoy leader, emergency contacts, and nearby riders immediately.</p>
        </Modal>
      ) : null}
    </div>
  )
}
