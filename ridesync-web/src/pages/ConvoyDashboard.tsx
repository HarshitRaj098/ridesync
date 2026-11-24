import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import ConvoyMap from '../components/ConvoyMap.tsx'
import { EmptyState, MapControls, MemberCard, Modal, SOSButton, VoiceButton, showToast } from '../components/ui.tsx'
import { BASE_LAT, BASE_LNG, formatRideTime } from '../data/mockData.ts'
import { getConvoySummary } from '../services/convoySummary.ts'
import { browserNotify } from '../services/notify.ts'
import { isRealApi, postChat, sendSosApi } from '../services/api.ts'
import { createRealSocket, disconnectRealSocket, isRealSocket } from '../services/socketService.ts'
import { addChat, addNotification, applyLocationUpdate, closeSos, confirmSos, tick } from '../store/store.ts'
import type { AppDispatch, RootState } from '../store/store.ts'
import type { Member } from '../data/mockData.ts'

type Tab = 'members' | 'chat' | 'alerts'

export default function ConvoyDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { members, chat, alerts, rideSeconds, speedKmh, speedSamples, distanceCoveredKm, voiceActive, sosActive, sosSent } = useSelector((s: RootState) => s.convoy)
  const trip = useSelector((s: RootState) => s.trip.currentTrip)
  const user = useSelector((s: RootState) => s.auth.user)
  const locationSharing = useSelector((s: RootState) => s.settings.locationSharing)
  const emergencyContacts = useSelector((s: RootState) => s.contacts.items)
  const [tab, setTab] = useState<Tab>('members')
  const [expanded, setExpanded] = useState(false)
  const [chatText, setChatText] = useState('')
  const [satOn, setSatOn] = useState(false)
  const [trafficOn, setTrafficOn] = useState(false)
  // Map follow: on by default — the map pans with the leader as the
  // convoy rides. Dragging/zooming by hand turns it off (ConvoyMap
  // reports it); recenter / compass turn it back on.
  const [follow, setFollow] = useState(true)
  // Bumped when the compass is tapped: jump to the leader's live
  // position, north-up, zoom 13. Bumped by recenter: pan to the leader,
  // keeping the zoom. Both re-enable follow.
  const [resetSignal, setResetSignal] = useState(0)
  const [panSignal, setPanSignal] = useState(0)

  const speedRef = useRef(speedKmh)
  speedRef.current = speedKmh
  // Ref mirror of the location-sharing toggle, so the GPS timer reads the
  // current value without re-subscribing to the socket.
  const locationSharingRef = useRef(locationSharing)
  locationSharingRef.current = locationSharing

  // Live movement: the 1s tick in the store is the ONLY thing that moves
  // riders (positions come from the demo route, driven by distance
  // covered). There used to be a second writer here — the simulated
  // socket rebuilt members from the seed every 2.5s and overwrote the
  // tick, so markers shivered around the start point and the convoy
  // never travelled. That socket stream is gone; in mock mode nothing
  // subscribes to it. Real backend (VITE_SOCKET_URL set): join the trip
  // room, receive real location:update / broadcast / sos events, and
  // send our own GPS every 2.5s.
  useEffect(() => {
    const timer = setInterval(() => dispatch(tick()), 1000)
    if (!isRealSocket) {
      return () => clearInterval(timer)
    }
    const socket = createRealSocket()
    const tripId = trip.id
    socket.emit('trip:join', { tripId })
    const onLocation = (payload: { members?: Member[] }) => {
      if (payload?.members) dispatch(applyLocationUpdate(payload.members))
    }
    const onChat = (msg: { id: string; authorId?: string; author: string; initials: string; text: string }) => {
      if (msg.authorId && msg.authorId === user?.id) return // our own echo
      dispatch(addChat({ text: msg.text, author: msg.author, initials: msg.initials, authorId: msg.authorId }))
    }
    const onBroadcast = (msg: { author: string; text: string }) => {
      dispatch(addNotification({ title: `${msg.author} broadcast a message`, detail: msg.text, kind: 'info', source: 'broadcast' }))
      browserNotify('Convoy broadcast', msg.text)
    }
    const onSos = (data: { name: string }) => {
      dispatch(addNotification({ title: `SOS from ${data.name}`, detail: 'Emergency SOS — live location broadcast to the convoy.', kind: 'danger', source: 'sos' }))
      browserNotify('SOS received', `${data.name} sent an emergency SOS.`)
    }
    socket.on('location:update', onLocation)
    socket.on('chat:message', onChat)
    socket.on('broadcast', onBroadcast)
    socket.on('sos', onSos)
    // Send our own position so other riders (and the server) see us move —
    // unless live location sharing is off in Settings (then we send nothing).
    const locTimer = setInterval(() => {
      if (!locationSharingRef.current) return
      socket.emit('location:update', {
        tripId,
        lat: BASE_LAT + (Math.random() - 0.5) * 0.001,
        lng: BASE_LNG + (Math.random() - 0.5) * 0.001,
        speedKmh: speedRef.current,
      })
    }, 2500)
    return () => {
      clearInterval(timer)
      clearInterval(locTimer)
      socket.off('location:update', onLocation)
      socket.off('chat:message', onChat)
      socket.off('broadcast', onBroadcast)
      socket.off('sos', onSos)
      socket.emit('trip:leave', { tripId })
      disconnectRealSocket()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, trip.id])

  const remainingKm = trip.distanceKm > 0 ? Math.max(0, trip.distanceKm - Math.round(distanceCoveredKm)) : 0
  const etaHours = speedKmh > 0 && trip.distanceKm > 0 ? remainingKm / speedKmh : 0
  // A trip whose distance was never estimated shows that honestly instead
  // of a made-up ETA.
  const etaText = trip.distanceKm > 0
    ? `${Math.floor(etaHours)}h ${Math.round((etaHours % 1) * 60)}m to ${trip.to}`
    : `Distance to ${trip.to} not estimated yet`
  const gaugePct = Math.min(speedKmh / 120, 1)
  const gaugeOffset = 264 - 264 * gaugePct * 0.75

  // ONE source of truth (Frontend X2): the same summary the Leader
  // Dashboard reads — same online / separated / extra-rider counts, same
  // health score. A rider separated here is separated there too.
  const summary = getConvoySummary({ members, trip, alerts, speedSamples, speedKmh })
  const separatedCount = summary.separatedCount
  const sendChat = (e: FormEvent) => {
    e.preventDefault()
    const text = chatText.trim()
    if (!text) return
    dispatch(addChat({ text, author: user?.name ?? 'You', initials: user?.initials ?? 'HR', authorId: user?.id }))
    if (isRealApi) postChat(trip.id, text).catch(() => showToast('Message saved locally — server unreachable'))
    dispatch(addNotification({ title: 'Message sent to convoy', detail: text, kind: 'info', source: 'chat' }))
    setChatText('')
  }

  // SOS in this demo is shown to the convoy on this device only. Nobody
  // is actually messaged — there is no messaging service yet — so the
  // copy must never claim contacts were notified. The modal lists the
  // saved emergency contacts so the rider can see who SOS would reach.
  const sendSos = () => {
    dispatch(confirmSos())
    if (isRealApi) sendSosApi(trip.id, BASE_LAT, BASE_LNG).catch(() => showToast('SOS saved locally — server unreachable'))
    dispatch(addNotification({ title: 'SOS sent', detail: 'Shown to the convoy on this device (demo). Emergency contacts were not messaged — no messaging service is connected yet.', kind: 'danger', source: 'sos' }))
    browserNotify('SOS sent', 'SOS shown to the convoy on this device (demo). No contacts messaged.')
    showToast('🚨 SOS shown to convoy (demo — no contacts messaged)')
  }

  return (
    <div className="page no-nav dash-screen">
      <div className="map-wrap">
        <ConvoyMap
          members={members}
          satOn={satOn}
          trafficOn={trafficOn}
          follow={follow}
          onUserMoved={() => setFollow(false)}
          resetSignal={resetSignal}
          panSignal={panSignal}
        />

        <div className="map-overlay-top">
          <button className="circle-btn" onClick={() => navigate('/home')} aria-label="Back home">←</button>
          <div className="glass-chip timer-chip">
            <span className="rec" />
            <span>{formatRideTime(rideSeconds)}</span>
          </div>
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
            setFollow(true)
            setPanSignal((v) => v + 1)
            showToast('Recentered on convoy')
          }}
          onResetView={() => {
            setFollow(true)
            setResetSignal((v) => v + 1)
          }}
          trip={trip}
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
          <div className="eta-chip">ETA {etaText}{trip.distanceKm > 0 ? ` · ${remainingKm} km left` : ''}</div>
          <div className="eta-chip">{trip.name} · {summary.online} riding · {Math.round(distanceCoveredKm)} km done</div>
          <div className="eta-chip">Demo map · simulated positions, not live GPS</div>
          {!locationSharing ? <div className="eta-chip">📍 Location sharing off — your position is hidden from the convoy</div> : null}
          {!follow ? <div className="eta-chip">Map paused — tap ◎ to follow the convoy again</div> : null}
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
                <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '10px 0 0' }}>+ {summary.extraRiders} more riders in this convoy. {voiceActive ? '🎙️ Push-to-talk is live.' : ''}</p>
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
                    <div><b>SOS shown to convoy</b><span>Shown on this device (demo). No emergency contacts were messaged.</span></div>
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
          <p>
            Your SOS is shown to the convoy on this device only (demo). Nobody is actually messaged — there is no
            messaging service connected yet.
          </p>
          {emergencyContacts.length > 0 ? (
            <p style={{ textAlign: 'left', marginBottom: 20 }}>
              Saved emergency contacts — listed for SOS, not messaged in the demo:
              <br />{emergencyContacts.map((c) => `${c.name} (${c.phone})`).join(' · ')}
            </p>
          ) : (
            <p style={{ marginBottom: 20 }}>No emergency contacts saved yet — add them in Settings so SOS knows who to list.</p>
          )}
        </Modal>
      ) : null}
    </div>
  )
}
