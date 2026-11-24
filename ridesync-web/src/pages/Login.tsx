import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Button, Input, PasswordField, showToast, validateEmail, validatePassword } from '../components/ui.tsx'
import { login } from '../store/store.ts'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    setEmailError(eErr)
    setPasswordError(pErr)
    if (eErr || pErr) return
    // Mock auth: no backend yet — any valid-looking credentials sign in.
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Harshit Raj'
    const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    dispatch(login({ name, email: email.trim(), initials }))
    showToast(`Welcome back, ${name}`)
    const from = (location.state as { from?: string } | null)?.from ?? '/home'
    navigate(from, { replace: true })
  }

  return (
    <div className="page no-nav">
      <div className="auth-wrap">
        <div className="brand">
          <div className="brand-mark">🏍️</div>
          RideSync
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to join your convoy, track riders live and never get lost on the road.</p>
        <form onSubmit={submit} noValidate>
          <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }} error={emailError} aria-invalid={Boolean(emailError)} />
          <PasswordField id="password" label="Password" placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError('') }} error={passwordError} />
          <Button type="submit">Login</Button>
        </form>
        <div className="auth-switch">
          New to RideSync? <Link to="/register">Create an account</Link>
        </div>
      </div>
      <div className="mock-note">
        <b>Mock login (no backend yet):</b> enter any email and a password of 6+ characters — e.g. harshit@example.com / ridesync123 — and you will be signed in locally.
      </div>
    </div>
  )
}
