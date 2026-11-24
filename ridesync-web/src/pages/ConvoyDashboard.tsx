import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import ConvoyMap from '../components/ConvoyMap.tsx'
import { EmptyState, MapControls, MemberCard, Modal, SOSButton, VoiceButton, showToast } from '../components/ui.tsx'
import { formatRideTime } from '../data/mockData.ts'
import { getConvoySummary, isTripLeader } from '../services/convoySummary.ts'
import { browserNotify } from '../services/notify.ts'
import { isRealApi, postChat, sendSosApi } from '../services/api.ts'
import { createRealSocket, disconnectRealSocket, isRealSocket } from '../services/socketService.ts'
import { addChat, addNotification, applyLocationUpdate, closeSos, confirmSos, ensureSelfMember, setMyPosition, startConvoyForTrip, tick } from '../store/store.ts'
import type { AppDispatch, RootState } from '../store/store.ts'
import type { Member } from '../data/mockData.ts'

type Tab = 'members' | 'chat' | 'alerts'

export default function ConvoyDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { id } = useParams()
  const trips = useSelector((s: RootState) => s.trip.trips)
  const currentTrip = useSelector((s: RootState) => s.trip.currentTrip)
  const trip = (id ? trips.find((t) => t.id === id) : undefined) ?? currentTrip
  const { members, chat, alerts, rideSeconds, speedKmh, speedSamples, distanceCoveredKm, voiceActive, sosActive, sosSent } = useSelector((s: RootState) => s.convoy)
  const user = useSelector((s: RootState) => s.auth.user)
  const locationSharing = useSelector((s: RootState) => s.settings.locationSharing)
  const emergencyContacts = useSelector((s: RootState) => s.contacts.items)
  const [tab, setTab] = useState<Tab>('members')
  const [expanded, setExpanded] = useState(false)
  const [chatText, setChatText] = useState('')
  const [satOn, setSatOn] = useState(false)
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  // Bumped when the compass is tapped: jump to the rider's real position
  // (or the default view when the position is unknown). Bumped by
  // recenter: pan there, keeping the zoom.
  const [resetSignal, setResetSignal] = useState(0)
  const [panSignal, setPanSignal] = useState(0)

  const speedRef = useRef(speedKmh)
  speedRef.current = speedKmh
  // Last real GPS fix, so the real backend (when connected) and SOS send
  // the rider's actual position — never an invented one.
  const userPositionRef = useRef<[number, number] | null>(null)

  // This screen belongs to one trip: opening it starts that trip's
  // convoy fresh, and adds the signed-in rider as its only known member.
  // Nobody else is in the convoy until they join for real.
  useEffect(() => {
    if (!trip) return
    dispatch(startConvoyForTrip(trip.id))
    if (user) {
      dispatch(ensureSelfMember({
        id: 'self',
        name: user.name,
        initials: user.initials,
        role: isTripLeader(user, trip, []) ? 'Leader' : undefined,
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, trip?.id])

  // Real GPS only: while location sharing is on, the browser's
  // geolocation moves the rider on the map and records speed and
  // distance. Denied or unavailable means no position — never a fake one.
  useEffect(() => {
    if (!locationSharing) return
    if (!navigator.geolocation?.watchPosition) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        userPositionRef.current = coords
        setUserPosition(coords)
        dispatch(setMyPosition({
          memberId: 'self',
          lat: coords[0],
          lng: coords[1],
          speedKmh: pos.coords.speed !== null && pos.coords.speed !== undefined ? pos.coords.speed * 3.6 : null,
        }))
      },
      () => {
        // Location denied or unavailable — the rider simply has no
        // position on the map. Nothing is invented to fill the gap.
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [dispatch, locationSharing])

  // The only timer here counts real elapsed time on this screen.
  // Nothing moves, and no speed or position is simulated.
  useEffect(() => {
    const timer = setInterval(() => dispatch(tick()), 1000)
    return () => clearInterval(timer)
  }, [dispatch])

  // Real backend (VITE_SOCKET_URL set): join the trip room, receive real
  // location:update / broadcast / sos events, and send our own real GPS
  // every 2.5s — only when we actually have a fix. Without a backend
  // there is no socket at all.
  useEffect(() => {
    if (!isRealSocket || !trip) return
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
    const locTimer = setInterval(() => {
      const pos = userPositionRef.current
      if (!pos) return // no real fix yet — send nothing, invent nothing
      socket.emit('location:update', { tripId, lat: pos[0], lng: pos[1], speedKmh: speedRef.current })
    }, 2500)
    return () => {
      clearInterval(locTimer)
      socket.off('location:update', onLocation)
      socket.off('chat:message', onChat)
      socket.off('broadcast', onBroadcast)
      socket.off('sos', onSos)
      socket.emit('trip:leave', { tripId })
      disconnectRealSocket()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, trip?.id])

  if (!trip) {
    return (
      <div className="page no-nav dash-screen">
        <div style={{ padding: '24px 20px' }}>
          <EmptyState
            icon="🗺️"
            title="No trip selected"
            detail="Create a trip or join one with an invite code to open its convoy map."
            action={<button className="nt-join" onClick={() => navigate('/trips/create')}>Create a trip</button>}
          />
        </div>
      </div>
    )
  }

  const remainingKm = trip.distanceKm > 0 ? Math.max(0, trip.distanceKm - Math.round(distanceCoveredKm)) : 0
  const etaHours = speedKmh > 0 && trip.distanceKm > 0 ? remainingKm / speedKmh : 0
  // A trip whose distance was never estimated shows that honestly instead
  // of a made-up ETA.
  const etaText = trip.distanceKm > 0
    ? `${Math.floor(etaHours)}h ${Math.round((etaHours % 1) * 60)}m to ${trip.to}`
    : `Distance to ${trip.to} not estimated yet`
  const gaugePct = Math.min(speedKmh / 120, 1)
  const gaugeOffset = 264 - 264 * gaugePct * 0.75

  // ONE source of truth: the same summary the Leader Dashboard reads.
  const summary = getConvoySummary({ members, trip, alerts, speedSamples, speedKmh })
  const separatedCount = summary.separatedCount
  const sendChat = (e: FormEvent) => {
    e.preventDefault()
    const text = chatText.trim()
    if (!text) return
    dispatch(addChat({ text, author: user?.name ?? 'You', initials: user?.initials ?? 'HR', authorId: user?.id }))
    if (isRealApi) postChat(trip.id, text).catch(() => showToast('Message saved locally — server unreachable'))
    dispatch(addNotification({ title: 'Message posted to convoy chat', detail: text, kind: 'info', source: 'chat' }))
    setChatText('')
  }

  // SOS is shown to the convoy on this device only. Nobody is actually
  // messaged — there is no messaging service yet — so the copy must never
  // claim contacts were notified. The modal lists the saved emergency
  // contacts so the rider can see who SOS would reach.
  const sendSos = () => {
    dispatch(confirmSos())
    if (isRealApi) {
      const pos = userPositionRef.current
      sendSosApi(trip.id, pos?.[0], pos?.[1]).catch(() => showToast('SOS saved locally — server unreachable'))
    }
    dispatch(addNotification({ title: 'SOS sent', detail: 'Shown to the convoy on this device. Emergency contacts were not messaged — no messaging service is connected yet.', kind: 'danger', source: 'sos' }))
    browserNotify('SOS sent', 'SOS shown to the convoy on this device. No contacts messaged.')
    showToast('🚨 SOS shown to convoy — no contacts messaged')
  }

  return (
    <div className="page no-nav dash-screen">
      <div className="map-wrap">
        <ConvoyMap
          members={members}
          satOn={satOn}
          userPosition={userPosition}
          onUserMoved={() => undefined}
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
          onRecenter={() => {
            setPanSignal((v) => v + 1)
            showToast(userPosition ? 'Recentered on your position' : 'Your position is unknown — showing the default view')
          }}
          onResetView={() => {
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
          {!userPosition ? <div className="eta-chip">📍 No GPS fix yet — speed and distance need your real location</div> : null}
          {!locationSharing ? <div className="eta-chip">📍 Location sharing off — your position is hidden from the convoy</div> : null}
        </div>

        <VoiceButton />
        <SOSButton />

        <div className={`sheet${expanded ? ' expanded' : ''}`}>
          <div className="sheet-handle" onClick={() => setExpanded((v) => !v)} />
          <div className="sheet-tabs">
            <button className={`sheet-tab${tab === 'members' ? ' active' : ''}`} onClick={() => { setTab('members'); setExpanded(true) }}>Members · {members.length}</button>
            <button className={`sheet-tab${tab === 'chat' ? ' active' : ''}`} onClick={() => { setTab('chat'); setExpanded(true) }}>Chat</button>
            <button className={`sheet-tab${tab === 'alerts' ? ' active' : ''}`} onClick={() => { setTab('alerts'); setExpanded(true) }}>Alerts · {alerts.length}</button>
          </div>
          <div className="sheet-body">
            {tab === 'members' && (
              <div>
                {separatedCount > 0 ? (
                  <p style={{ color: 'var(--warning)', fontSize: 12, margin: '0 0 10px', fontWeight: 600 }}>⚠️ {separatedCount} rider{separatedCount > 1 ? 's' : ''} separated from the convoy</p>
                ) : null}
                {members.length === 0 ? (
                  <EmptyState icon="👥" title="No riders in this convoy yet" detail="You are the only rider so far. Share the invite code from the Trip Lobby to add riders." />
                ) : (
                  members.map((m) => (
                    <MemberCard key={m.id} member={m} members={members} />
                  ))
                )}
                {voiceActive ? <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '10px 0 0' }}>🎙️ Push-to-talk is live.</p> : null}
              </div>
            )}
            {tab === 'chat' && (
              <div>
                {chat.length === 0 ? (
                  <EmptyState icon="💬" title="No messages yet" detail="Say hi to the convoy — messages stay on this device unless a real backend is connected." />
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
                    <div><b>SOS shown to convoy</b><span>Shown on this device. No emergency contacts were messaged.</span></div>
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
            Your SOS is shown to the convoy on this device only. Nobody is actually messaged — there is no
            messaging service connected yet.
          </p>
          {members.length <= 1 ? (
            <p style={{ marginBottom: 20 }}>No other riders are in this convoy yet, so nobody else will see this SOS.</p>
          ) : null}
          {emergencyContacts.length > 0 ? (
            <p style={{ textAlign: 'left', marginBottom: 20 }}>
              Saved emergency contacts — listed for SOS, not messaged:
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
