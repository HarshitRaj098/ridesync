import { Router, type Request, type Response } from 'express'
import { authRequired, type AuthedRequest } from '../auth'
import { getStore } from '../db'

export function usersRouter(): Router {
  const r = Router()
  r.use(authRequired)

  r.get('/:id/stats', async (req: AuthedRequest, res: Response) => {
    const id = req.params.id === 'me' ? (req.userId as string) : (req.params.id as string)
    const user = await getStore().findUserById(id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    return res.json({ totalRides: user.totalRides, kmLogged: user.kmLogged, safetyScore: user.safetyScore })
  })

  r.get('/:id/trips', async (req: AuthedRequest, res: Response) => {
    const id = req.params.id === 'me' ? (req.userId as string) : (req.params.id as string)
    const user = await getStore().findUserById(id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    const trips = await getStore().listTripsForUser(id)
    return res.json({
      trips: trips.map((t) => ({ id: t.id, name: t.name, route: `${t.from} → ${t.to}`, distanceKm: t.distanceKm, date: t.date })),
    })
  })

  return r
}
