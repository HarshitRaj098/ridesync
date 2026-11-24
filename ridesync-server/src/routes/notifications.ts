import { Router, type Request, type Response } from 'express'
import { authRequired, type AuthedRequest } from '../auth'
import { getStore } from '../db'

export function notificationsRouter(): Router {
  const r = Router()
  r.use(authRequired)

  r.get('/', async (req: AuthedRequest, res: Response) => {
    const items = await getStore().listNotifications(req.userId as string)
    return res.json({
      notifications: items.map((n) => ({
        id: n.id, title: n.title, detail: n.detail, kind: n.kind, unread: !n.read, time: n.at,
      })),
    })
  })

  r.post('/:id/read', async (req: AuthedRequest, res: Response) => {
    const n = await getStore().markNotificationRead(req.userId as string, req.params.id as string)
    if (!n) return res.status(404).json({ error: 'Notification not found.' })
    return res.json({ notification: { id: n.id, title: n.title, detail: n.detail, kind: n.kind, unread: !n.read, time: n.at } })
  })

  return r
}
