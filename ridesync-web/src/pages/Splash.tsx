import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store.ts'

const CHECKS = ['Loading RideSync…', 'Checking your session…', 'Opening your trips…']

export default function Splash() {
  const navigate = useNavigate()
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated)
  const [done, setDone] = useState(0)

  useEffect(() => {
    const timers = CHECKS.map((_, i) => setTimeout(() => setDone(i + 1), 500 + i * 700))
    const go = setTimeout(() => navigate(isAuthenticated ? '/home' : '/login', { replace: true }), 2600)
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(go)
    }
  }, [navigate, isAuthenticated])

  return (
    <div className="splash">
      <div className="splash-logo">🏍️</div>
      <div className="splash-title">RideSync</div>
      <div className="splash-tag">
        Stay Connected.
        <br />
        Never Get Lost.
      </div>
      <div className="splash-checks">
        {CHECKS.map((label, i) => (
          <div key={label} className={`check-row${done > i ? ' done' : ''}`}>
            <div className="check-dot" />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="spinner" aria-label="Loading" />
    </div>
  )
}
