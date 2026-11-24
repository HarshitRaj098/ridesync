import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Button, Input, showToast } from '../components/ui.tsx'
import { login } from '../store/store.ts'

export default function Register() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return setError('Enter your full name.')
    if (!email.includes('@')) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    // Mock auth: no backend yet — registration is stored locally.
    const initials = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    dispatch(login({ name: name.trim(), email, initials }))
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
        <form onSubmit={submit}>
          <Input id="name" label="Full name" placeholder="Harshit Raj" value={name} onChange={(e) => setName(e.target.value)} />
          <Input id="email" label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input id="password" label="Password" type="password" placeholder="6+ characters" value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
          <Button type="submit">Create Account</Button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
      <div className="mock-note">
        <b>Mock registration (no backend yet):</b> your account is stored only in this browser (localStorage).
      </div>
    </div>
  )
}
