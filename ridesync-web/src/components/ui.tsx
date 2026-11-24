import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import type { Member, Trip } from '../data/mockData.ts'
import type { RootState } from '../store/store.ts'
import { toggleVoice, openSos } from '../store/store.ts'

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
export function MemberCard({ member }: { member: Member }) {
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
        </b>
        <span>{member.note}</span>
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
export function MapControls({ onRecenter, onToggleSat, satOn }: { onRecenter: () => void; onToggleSat: () => void; satOn: boolean }) {
  return (
    <div className="map-side-controls">
      <button className="circle-btn" title="Compass" onClick={() => showToast('Compass: heading north')}>🧭</button>
      <button className="circle-btn" title="Recenter" onClick={onRecenter}>◎</button>
      <button className="circle-btn" title={satOn ? 'Standard view' : 'Satellite view'} onClick={onToggleSat}>🛰️</button>
      <button className="circle-btn" title="Share live location" onClick={() => showToast('Live location shared')}>🔗</button>
      <button className="circle-btn" title="Camera" onClick={() => showToast('Camera opened')}>📷</button>
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

/* ---------- VoiceButton (Push-to-Talk) ---------- */
export function VoiceButton() {
  const dispatch = useDispatch()
  const voiceActive = useSelector((s: RootState) => s.convoy.voiceActive)
  return (
    <button
      className={`voice-fab${voiceActive ? ' active' : ''}`}
      onClick={() => {
        dispatch(toggleVoice())
        showToast(voiceActive ? 'Voice off' : 'Push-to-talk live')
      }}
      aria-label="Push to talk"
      aria-pressed={voiceActive}
    >
      🎙️
    </button>
  )
}
