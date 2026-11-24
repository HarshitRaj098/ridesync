import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Button, Input, PasswordField, showToast, validateEmail, validatePassword } from '../components/ui.tsx'
import { login } from '../store/store.ts'
import { apiErrorMessage, isRealApi, registerApi } from '../services/api.ts'

export default function Register() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const nErr = name.trim().length < 2 ? 'Enter your full name (at least 2 characters).' : ''
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    setNameError(nErr)
    setEmailError(eErr)
    setPasswordError(pErr)
    if (nErr || eErr || pErr) return
    if (isRealApi) {
      setBusy(true)
      try {
        const { user, token } = await registerApi(name.trim(), email.trim(), password)
        localStorage.setItem('ridesync-token', token)
        dispatch(login({ id: user.id, name: user.name, email: user.email, initials: user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() }))
        showToast(`Welcome to RideSync, ${user.name.split(' ')[0]}`)
        navigate('/home', { replace: true })
      } catch (err) {
        setEmailError(apiErrorMessage(err))
      } finally {
        setBusy(false)
      }
      return
    }
    // Mock auth: no backend configured — registration is stored locally.
    const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    dispatch(login({ name: name.trim(), email: email.trim(), initials }))
    showToast(`Welcome to RideSync, ${name.trim().split(' ')[0]}`)
    navigate('/home', { replace: true })
  }

  return (
    <div className="page no-nav">
      <div className="auth-wrap">
        <div className="brand">
          <div className="brand-mark">🏍️</div>
          RideSync
        </div>
        <h1>Create your account</h1>
        <p>Join convoys, lead rides and keep your whole crew connected.</p>
        <form onSubmit={submit} noValidate>
          <Input id="name" label="Full name" placeholder="Harshit Raj" value={name} onChange={(e) => { setName(e.target.value); if (nameError) setNameError('') }} error={nameError} aria-invalid={Boolean(nameError)} />
          <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }} error={emailError} aria-invalid={Boolean(emailError)} />
          <PasswordField id="password" label="Password" placeholder="6+ characters" value={password} onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError('') }} error={passwordError} />
          <Button type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create Account'}</Button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
      <div className="mock-note">
        {isRealApi ? (
          <><b>Real backend connected.</b> Your account is created on the RideSync server (password is hashed, never stored in plain text).</>
        ) : (
          <><b>Mock registration (no backend configured):</b> your account is stored only in this browser (localStorage).</>
        )}
      </div>
    </div>
  )
}
