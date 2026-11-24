import { Component, useEffect, useRef, useState, type ButtonHTMLAttributes, type ErrorInfo, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { distanceFromLeaderKm, separatedReason, type Member, type Trip } from '../data/mockData.ts'
import type { RootState } from '../store/store.ts'
import { setVoiceActive, openSos } from '../store/store.ts'

/* ---------- Validation helpers (Week 2) ---------- */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function validateEmail(value: string): string {
  if (!value.trim()) return 'Email is required.'
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address, e.g. you@example.com.'
  return ''
}
export function validatePassword(value: string): string {
  if (!value) return 'Password is required.'
  if (value.length < 6) return 'Password must be at least 6 characters.'
  return ''
}

/* ---------- Loader ---------- */
export function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon = '🗺️', title, detail, action }: { icon?: string; title: string; detail?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state-ic" aria-hidden="true">{icon}</div>
      <b>{title}</b>
      {detail ? <span>{detail}</span> : null}
      {action}
    </div>
  )
}

/* ---------- ErrorState ---------- */
export function ErrorState({ title = 'Something went wrong', detail, onRetry }: { title?: string; detail?: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <div className="empty-state-ic" aria-hidden="true">⚠️</div>
      <b>{title}</b>
      {detail ? <span>{detail}</span> : null}
      {onRetry ? <Button size="small" onClick={onRetry}>Try again</Button> : null}
    </div>
  )
}

/* ---------- Badge ---------- */
export function Badge({ tone = 'info', children }: { tone?: 'success' | 'warn' | 'danger' | 'info' | 'muted'; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

/* ---------- Modal (reusable bottom sheet) ---------- */
export function Modal({ title, icon, children, onClose, actions }: { title: string; icon?: string; children: ReactNode; onClose?: () => void; actions?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {icon ? <div className="modal-ic">{icon}</div> : null}
        <h3>{title}</h3>
        {children}
        {actions ? <div className="modal-actions">{actions}</div> : null}
      </div>
    </div>
  )
}

/* ---------- ErrorBoundary (Week 1) ---------- */
interface ErrorBoundaryState { hasError: boolean }
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }
  static getDerivedStateFromError(): ErrorBoundaryState { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('RideSync render error:', error, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <ErrorState
            title="This screen crashed"
            detail="Something went wrong rendering this page. Your trips and login are safe — try loading it again."
            onRetry={() => this.setState({ hasError: false })}
          />
        </div>
      )
    }
    return this.props.children
  }
}

/* ---------- Toast (global, event-driven) ---------- */
export function showToast(message: string): void {
  window.dispatchEvent(new CustomEvent('ridesync-toast', { detail: message }))
}
export function ToastHost() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const handler = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail)
      setVisible(true)
      clearTimeout(timer)
      timer = setTimeout(() => setVisible(false), 2400)
    }
    window.addEventListener('ridesync-toast', handler)
    return () => {
      window.removeEventListener('ridesync-toast', handler)
      clearTimeout(timer)
    }
  }, [])
  return <div className={`toast${visible ? ' show' : ''}`}>{msg}</div>
}

/* ---------- Button ---------- */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'md' | 'small'
}
export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  const cls = `btn${variant === 'ghost' ? ' ghost' : ''}${variant === 'danger' ? ' danger' : ''}${size === 'small' ? ' small' : ''} ${className}`.trim()
  return <button type="button" className={cls} {...rest} />
}

/* ---------- Input ---------- */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}
export function Input({ label, error, id, ...rest }: InputProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
      {error ? <span className="error">{error}</span> : null}
    </div>
  )
}

/* ---------- PasswordField (show/hide) ---------- */
export function PasswordField({ label, error, id, ...rest }: InputProps) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input id={id} type={show ? 'text' : 'password'} aria-invalid={Boolean(error)} {...rest} />
        <button type="button" className="password-toggle" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? '🙈' : '👁️'}
        </button>
      </div>
      {error ? <span className="error">{error}</span> : null}
    </div>
  )
}

/* ---------- StatusBadge ---------- */
export function StatusBadge({ tone = 'success', children }: { tone?: 'success' | 'warn' | 'danger' | 'info' | 'muted'; children: ReactNode }) {
  const cls = tone === 'success' ? 'status-pill' : `status-pill ${tone}`
  return (
    <span className={cls}>
      <span className="dot" />
      {children}
    </span>
  )
}

export function memberBadgeTone(status: Member['status']): 'success' | 'warn' | 'muted' {
  return status === 'online' ? 'success' : status === 'stopped' ? 'warn' : 'muted'
}

/* ---------- GlassCard ---------- */
export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass ${className}`.trim()}>{children}</div>
}

/* ---------- TripCard ---------- */
export function TripCard({ trip, onOpen }: { trip: Trip; onOpen?: () => void }) {
  const navigate = useNavigate()
  const open = () => {
    if (onOpen) onOpen()
    else navigate(`/trips/${trip.id}/lobby`)
  }
  return (
    <div className="card trip-card" onClick={open} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') open() }}>
      <div className="trip-card-top">
        <StatusBadge>{trip.startsIn}</StatusBadge>
        <span style={{ color: 'var(--text-faint)' }}>•••</span>
      </div>
      <h4>{trip.name}</h4>
      <div className="route-line">
        <span>📍</span>
        {trip.from} → {trip.to} · {trip.distanceKm} km
      </div>
      <div className="trip-avatars">
        <div className="mini-avatar">RV</div>
        <div className="mini-avatar">AK</div>
        <div className="mini-avatar">PS</div>
        <div className="mini-avatar">TM</div>
        <div className="mini-avatar more">+8</div>
      </div>
      <div className="trip-stats-row">
        <div className="trip-stat"><b>{trip.riders}</b><span>Riders</span></div>
        <div className="trip-stat"><b>{trip.vehicles}</b><span>Vehicles</span></div>
        <div className="trip-stat"><b>{trip.type}</b><span>Type</span></div>
      </div>
    </div>
  )
}

/* ---------- MemberCard ---------- */
export function MemberCard({ member, members }: { member: Member; members?: Member[] }) {
  const distanceKm = members ? distanceFromLeaderKm(member, members) : null
  const separated = members ? separatedReason(member, members) : null
  return (
    <div className="member-row">
      <div className="m-avatar">
        {member.initials}
        <span className={`m-status ${member.status}`} />
      </div>
      <div className="m-info">
        <b>
          {member.name}
          {member.role === 'Leader' ? <span className="m-lead-tag">LEADER</span> : null}
          {separated ? <Badge tone="warn">Separated</Badge> : null}
        </b>
        <span>
          {member.note}
          {distanceKm !== null && member.role !== 'Leader' ? ` · ${distanceKm.toFixed(1)} km from leader` : ''}
        </span>
        {separated ? <span className="separated-note">{separated}</span> : null}
      </div>
      <StatusBadge tone={memberBadgeTone(member.status)}>
        {member.status === 'online' ? 'Riding' : member.status === 'stopped' ? 'Stopped' : 'Offline'}
      </StatusBadge>
    </div>
  )
}

/* ---------- AppHeader ---------- */
export function AppHeader({ title, showBack = false, onBack }: { title?: string; showBack?: boolean; onBack?: () => void }) {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const unread = useSelector((s: RootState) => s.notifications.unreadCount)
  const goBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }
  return (
    <header className="topbar">
      <div className="topbar-left">
        {showBack ? (
          <button className="icon-btn" onClick={goBack} aria-label="Back">←</button>
        ) : (
          <button className="icon-btn" onClick={() => showToast('Menu coming soon')} aria-label="Menu">☰</button>
        )}
        <div className="brand">
          <div className="brand-mark">🏍️</div>
          {title ?? 'RideSync'}
        </div>
      </div>
      <div className="topbar-left">
        <Link className="icon-btn" to="/notifications" aria-label="Notifications">
          🔔
          {unread > 0 ? <span className="badge-dot" /> : null}
        </Link>
        <Link to="/profile" className="avatar" aria-label="Profile">
          {user?.initials ?? 'HR'}
        </Link>
      </div>
    </header>
  )
}

/* ---------- BottomNavigation ---------- */
const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/trips/manali-2026/convoy', label: 'Trips', icon: '🗺️' },
  { to: '/notifications', label: 'Alerts', icon: '🔔' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]
export function BottomNavigation() {
  const unread = useSelector((s: RootState) => s.notifications.unreadCount)
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-ic">{item.icon}</span>
          <span>{item.label}</span>
          {item.to === '/notifications' && unread > 0 ? <span className="nb" /> : null}
        </NavLink>
      ))}
    </nav>
  )
}

/* ---------- MapControls ---------- */
export function MapControls({ onRecenter, onToggleSat, satOn, onToggleTraffic, trafficOn }: { onRecenter: () => void; onToggleSat: () => void; satOn: boolean; onToggleTraffic?: () => void; trafficOn?: boolean }) {
  return (
    <div className="map-side-controls">
      <button className="circle-btn" title="Compass" aria-label="Compass — heading north" onClick={() => showToast('Compass: heading north')}>🧭</button>
      <button className="circle-btn" title="Recenter" aria-label="Recenter map on convoy" onClick={onRecenter}>◎</button>
      <button className="circle-btn" title={satOn ? 'Standard view' : 'Satellite view'} aria-label={satOn ? 'Switch to standard map view' : 'Switch to satellite view'} aria-pressed={satOn} onClick={onToggleSat}>🛰️</button>
      {onToggleTraffic ? (
        <button className={`circle-btn${trafficOn ? ' active' : ''}`} title="Traffic (simulated)" aria-label="Toggle simulated traffic layer" aria-pressed={Boolean(trafficOn)} onClick={onToggleTraffic}>🚦</button>
      ) : null}
      <button className="circle-btn" title="Share live location" aria-label="Share live location" onClick={() => showToast('Live location shared')}>🔗</button>
      <button className="circle-btn" title="Camera" aria-label="Open camera" onClick={() => showToast('Camera opened')}>📷</button>
    </div>
  )
}

/* ---------- SOSButton ---------- */
export function SOSButton() {
  const dispatch = useDispatch()
  return (
    <button className="sos-fab" onClick={() => dispatch(openSos())} aria-label="Emergency SOS">
      SOS
    </button>
  )
}

/* ---------- VoiceButton — real push-to-talk (Week 6) ----------
 * Press and HOLD to talk: opens the local microphone with getUserMedia,
 * records with MediaRecorder and shows a live mic-level meter. Audio is
 * captured locally only and discarded when you release — there is NO voice
 * server yet, so nobody else in the convoy can hear it (mock voice).
 * If the mic is denied or unavailable, a clear fallback message is shown. */
type VoiceStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'unsupported'
export function VoiceButton() {
  const dispatch = useDispatch()
  const voiceActive = useSelector((s: RootState) => s.convoy.voiceActive)
  const voiceEnabled = useSelector((s: RootState) => s.settings.voiceEnabled)
  const [status, setStatus] = useState<VoiceStatus>('idle')
  const [speaking, setSpeaking] = useState(false)
  const [error, setError] = useState('')
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef(0)
  const meterRef = useRef<HTMLDivElement | null>(null)

  const stopTalking = () => {
    cancelAnimationFrame(rafRef.current)
    recorderRef.current?.stop()
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => undefined)
    audioCtxRef.current = null
    analyserRef.current = null
    if (meterRef.current) meterRef.current.style.width = '0%'
    setSpeaking(false)
    setStatus('idle')
    dispatch(setVoiceActive(false))
  }

  const startTalking = async () => {
    if (!voiceEnabled) { showToast('Push-to-talk is off in Settings'); return }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unsupported')
      setError('Microphone is not available in this browser.')
      return
    }
    setStatus('requesting')
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      // Record locally only; chunks are discarded on release — no server.
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = () => undefined
      recorder.start(250)
      recorderRef.current = recorder
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 512
      source.connect(analyser)
      analyserRef.current = analyser
      setStatus('live')
      dispatch(setVoiceActive(true))
      const data = new Uint8Array(analyser.frequencyBinCount)
      let wasSpeaking = false
      const loop = () => {
        analyser.getByteTimeDomainData(data)
        let peak = 0
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128)
        if (meterRef.current) meterRef.current.style.width = `${Math.round(Math.min(1, peak * 1.6) * 100)}%`
        const nowSpeaking = peak > 0.08
        if (nowSpeaking !== wasSpeaking) { wasSpeaking = nowSpeaking; setSpeaking(nowSpeaking) }
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()
    } catch (err) {
      setStatus('denied')
      setError(err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow mic access in your browser to use push-to-talk.'
        : 'Could not open the microphone. Check that a mic is connected and allowed.')
      dispatch(setVoiceActive(false))
    }
  }

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close().catch(() => undefined)
  }, [])

  return (
    <div className="voice-wrap">
      {status === 'live' ? (
        <div className="mic-meter" role="status" aria-label={speaking ? 'Speaking — microphone live' : 'Microphone live, listening'}>
          <div className="mic-meter-fill" ref={meterRef} />
          <span>{speaking ? 'Speaking…' : 'Listening…'}</span>
        </div>
      ) : null}
      {(status === 'denied' || status === 'unsupported') && error ? (
        <div className="voice-fallback" role="alert">{error}</div>
      ) : null}
      <button
        className={`voice-fab${voiceActive ? ' active' : ''}`}
        onPointerDown={(e) => { e.preventDefault(); void startTalking() }}
        onPointerUp={stopTalking}
        onPointerLeave={stopTalking}
        onPointerCancel={stopTalking}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="Hold to talk — press and hold to use the microphone"
        aria-pressed={voiceActive}
      >
        🎙️
      </button>
      <span className="voice-hint">Hold to talk · local mic only</span>
    </div>
  )
}
