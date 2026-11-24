import { Router, type Request, type Response } from 'express'
import { hashPassword, signToken, verifyPassword, type AuthedRequest, authRequired } from '../auth'
import { getStore } from '../db'

function publicUser(u: { id: string; name: string; email: string; totalRides: number; kmLogged: number; safetyScore: number }) {
  return { id: u.id, name: u.name, email: u.email, totalRides: u.totalRides, kmLogged: u.kmLogged, safetyScore: u.safetyScore }
}

export function authRouter(): Router {
  const r = Router()

  r.post('/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string }
    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Enter your full name (at least 2 characters).' })
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    const store = getStore()
    if (await store.findUserByEmail(email)) return res.status(409).json({ error: 'An account with this email already exists.' })
    const user = await store.createUser({ name: name.trim(), email: email.trim(), passwordHash: await hashPassword(password) })
    return res.status(201).json({ user: publicUser(user), token: signToken(user.id) })
  })

  r.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string }
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' })
    const store = getStore()
    const user = await store.findUserByEmail(email)
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }
    return res.json({ user: publicUser(user), token: signToken(user.id) })
  })

  r.get('/me', authRequired, async (req: AuthedRequest, res: Response) => {
    const user = await getStore().findUserById(req.userId as string)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    return res.json({ user: publicUser(user) })
  })

  return r
}
