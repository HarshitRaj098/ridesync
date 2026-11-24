import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Button, Input, PasswordField, showToast, validateEmail, validatePassword } from '../components/ui.tsx'
import { login } from '../store/store.ts'
import { apiErrorMessage, isRealApi, loginApi } from '../services/api.ts'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    setEmailError(eErr)
    setPasswordError(pErr)
    if (eErr || pErr) return
    if (isRealApi) {
      setBusy(true)
      try {
        const { user, token } = await loginApi(email.trim(), password)
        localStorage.setItem('ridesync-token', token)
        dispatch(login({ id: user.id, name: user.name, email: user.email, initials: user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() }))
        showToast(`Welcome back, ${user.name}`)
        const from = (location.state as { from?: string } | null)?.from ?? '/home'
        navigate(from, { replace: true })
      } catch (err) {
        setPasswordError(apiErrorMessage(err))
      } finally {
        setBusy(false)
      }
      return
    }
    // Mock auth: no backend configured — any valid-looking credentials sign in.
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
          <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Login'}</Button>
        </form>
        <div className="auth-switch">
          New to RideSync? <Link to="/register">Create an account</Link>
        </div>
      </div>
      <div className="mock-note">
        {isRealApi ? (
          <><b>Real backend connected.</b> Sign in with your RideSync account — demo: demo@ridesync.app / ridesync123.</>
        ) : (
          <><b>Mock login (no backend configured):</b> enter any email and a password of 6+ characters — e.g. harshit@example.com / ridesync123 — and you will be signed in locally.</>
        )}
      </div>
    </div>
  )
}
