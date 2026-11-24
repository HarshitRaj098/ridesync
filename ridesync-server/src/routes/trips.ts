import { Router, type Request, type Response } from 'express'
import { authRequired, type AuthedRequest } from '../auth'
import { getStore } from '../db'
import { initialsOf } from '../seedData'
import { emitToTrip } from '../socket'

function tripJson(t: {
  id: string; name: string; from: string; to: string; distanceKm: number; riders: number;
  vehicles: number; type: 'Public' | 'Private'; date: string; startTime: string; startsIn: string;
  code: string; leaderId: string; status: string; distanceCoveredKm: number
}) {
  return { ...t }
}

async function requireTrip(req: Request, res: Response) {
  const trip = await getStore().getTrip(req.params.id as string)
  if (!trip) res.status(404).json({ error: 'Trip not found.' })
  return trip
}

export function tripsRouter(): Router {
  const r = Router()
  r.use(authRequired)

  r.get('/', async (_req: Request, res: Response) => {
    const trips = await getStore().listTrips()
    return res.json({ trips: trips.map(tripJson) })
  })

  r.post('/', async (req: AuthedRequest, res: Response) => {
    const { name, from, to, distanceKm, riders, vehicles, type, date, startTime } = req.body as Record<string, unknown>
    if (!name || typeof name !== 'string' || name.trim().length < 3) return res.status(400).json({ error: 'Trip name must be at least 3 characters.' })
    if (!from || !to || !date || !startTime) return res.status(400).json({ error: 'From, to, date and start time are required.' })
    const km = Number(distanceKm)
    if (!Number.isFinite(km) || km <= 0) return res.status(400).json({ error: 'Distance must be a positive number of kilometres.' })
    const store = getStore()
    const trip = await store.createTrip(
      { name: name.trim(), from: String(from), to: String(to), distanceKm: km, riders: Number(riders) || 1, vehicles: Number(vehicles) || 1, type: type === 'Private' ? 'Private' : 'Public', date: String(date), startTime: String(startTime) },
      req.userId as string,
    )
    const me = await store.findUserById(req.userId as string)
    await store.addMember(trip.id, {
      userId: req.userId as string,
      name: me?.name ?? 'Leader',
      initials: initialsOf(me?.name ?? 'Leader'),
      role: 'Leader',
      status: 'online',
      speedKmh: 0,
      note: 'Leader',
      lat: 23.2599,
      lng: 77.4126,
      color: '#007BFF',
    })
    return res.status(201).json({ trip: tripJson(trip) })
  })

  r.get('/:id', async (req: Request, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    return res.json({ trip: tripJson(trip) })
  })

  r.post('/:id/join', async (req: AuthedRequest, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const { code } = req.body as { code?: string }
    if (!code || String(code).toUpperCase() !== trip.code) {
      return res.status(400).json({ error: `Wrong join code — this trip's code is ${trip.code.length} characters. Check the code and try again.` })
    }
    const store = getStore()
    const me = await store.findUserById(req.userId as string)
    const existing = await store.getMember(trip.id, req.userId as string)
    if (!existing) {
      await store.addMember(trip.id, {
        userId: req.userId as string,
        name: me?.name ?? 'Rider',
        initials: initialsOf(me?.name ?? 'Rider'),
        status: 'online',
        speedKmh: 0,
        note: 'Joined the convoy',
        lat: 23.2599,
        lng: 77.4126,
        color: '#22C55E',
      })
      await store.updateTrip(trip.id, { riders: trip.riders + 1 })
    }
    emitToTrip(trip.id, 'member:join', { userId: req.userId, name: me?.name ?? 'Rider', tripId: trip.id })
    const updated = await store.getTrip(trip.id)
    return res.json({ trip: tripJson(updated ?? trip), joined: true })
  })

  r.get('/:id/members', async (req: Request, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const members = await getStore().listMembers(trip.id)
    return res.json({
      members: members.map((m) => ({
        id: m.userId, name: m.name, initials: m.initials, role: m.role, status: m.status,
        speedKmh: m.speedKmh, note: m.note, lat: m.lat, lng: m.lng, color: m.color,
      })),
    })
  })

  r.get('/:id/chat', async (req: Request, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const chat = await getStore().listChat(trip.id)
    return res.json({ chat: chat.map((c) => ({ id: c.id, authorId: c.userId, author: c.author, initials: c.initials, text: c.text, at: c.at })) })
  })

  r.post('/:id/chat', async (req: AuthedRequest, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const { text } = req.body as { text?: string }
    if (!text || !text.trim()) return res.status(400).json({ error: 'Message text is required.' })
    if (text.trim().length > 500) return res.status(400).json({ error: 'Message is too long (max 500 characters).' })
    const store = getStore()
    const me = await store.findUserById(req.userId as string)
    const author = me?.name ?? 'Rider'
    const msg = await store.addChat(trip.id, { userId: req.userId as string, author, initials: initialsOf(author), text: text.trim() })
    emitToTrip(trip.id, 'chat:message', { id: msg.id, authorId: req.userId, author, initials: msg.initials, text: msg.text, at: msg.at })
    return res.status(201).json({ message: { id: msg.id, authorId: req.userId, author, initials: msg.initials, text: msg.text, at: msg.at } })
  })

  r.post('/:id/sos', async (req: AuthedRequest, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const store = getStore()
    const me = await store.findUserById(req.userId as string)
    const name = me?.name ?? 'A rider'
    const { lat, lng } = req.body as { lat?: number; lng?: number }
    await store.addAlert(trip.id, { title: `SOS from ${name}`, detail: 'Emergency SOS — live location broadcast to the convoy leader and emergency contacts.', kind: 'danger' })
    const members = await store.listMembers(trip.id)
    for (const m of members) {
      if (m.userId.startsWith('seed-')) continue
      await store.addNotification({ userId: m.userId, tripId: trip.id, title: `SOS from ${name}`, detail: 'Emergency SOS — live location broadcast to the convoy.', kind: 'danger' })
    }
    emitToTrip(trip.id, 'sos', { userId: req.userId, name, tripId: trip.id, lat, lng, at: new Date().toISOString() })
    return res.json({ sent: true })
  })

  r.post('/:id/broadcast', async (req: AuthedRequest, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const { text } = req.body as { text?: string }
    if (!text || !text.trim()) return res.status(400).json({ error: 'Broadcast text is required.' })
    if (text.trim().length > 200) return res.status(400).json({ error: 'Broadcast must be 200 characters or fewer.' })
    if (trip.leaderId !== req.userId) return res.status(403).json({ error: 'Only the trip leader can broadcast.' })
    const store = getStore()
    const me = await store.findUserById(req.userId as string)
    const author = `${me?.name ?? 'Leader'} (Leader)`
    const msg = await store.addChat(trip.id, { userId: req.userId as string, author, initials: initialsOf(me?.name ?? 'Leader'), text: text.trim() })
    const members = await store.listMembers(trip.id)
    for (const m of members) {
      if (m.userId === req.userId || m.userId.startsWith('seed-')) continue
      await store.addNotification({ userId: m.userId, tripId: trip.id, title: `${me?.name ?? 'Leader'} broadcast a message`, detail: `“${text.trim()}”`, kind: 'info' })
    }
    emitToTrip(trip.id, 'broadcast', { id: msg.id, authorId: req.userId, author, text: msg.text, at: msg.at })
    emitToTrip(trip.id, 'chat:message', { id: msg.id, authorId: req.userId, author, initials: msg.initials, text: msg.text, at: msg.at })
    return res.json({ sent: true, message: { id: msg.id, author, text: msg.text } })
  })

  r.post('/:id/regroup', async (req: AuthedRequest, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const store = getStore()
    const members = await store.listMembers(trip.id)
    let regrouped = 0
    for (const m of members) {
      if (m.status === 'stopped') {
        await store.updateMember(trip.id, m.userId, { status: 'online', speedKmh: 55, note: '55 km/h · regrouping with convoy' })
        regrouped += 1
      }
    }
    await store.addAlert(trip.id, { title: 'Regroup requested', detail: 'Leader asked all riders to regroup at the next stop.', kind: 'info' })
    const updated = await store.listMembers(trip.id)
    emitToTrip(trip.id, 'trip:update', { tripId: trip.id, action: 'regroup', regrouped, members: updated.map((m) => ({ id: m.userId, name: m.name, initials: m.initials, role: m.role, status: m.status, speedKmh: m.speedKmh, note: m.note, lat: m.lat, lng: m.lng, color: m.color })) })
    return res.json({ regrouped })
  })

  r.post('/:id/end', async (req: AuthedRequest, res: Response) => {
    const trip = await requireTrip(req, res)
    if (!trip) return
    const store = getStore()
    const updated = await store.updateTrip(trip.id, { status: 'completed' })
    const members = await store.listMembers(trip.id)
    const summary = {
      tripId: trip.id,
      name: trip.name,
      distanceKm: updated?.distanceCoveredKm ?? trip.distanceCoveredKm,
      distancePlannedKm: trip.distanceKm,
      riders: members.length,
      online: members.filter((m) => m.status === 'online').length,
      safetyScore: 98,
    }
    emitToTrip(trip.id, 'trip:update', { tripId: trip.id, action: 'end', status: 'completed', summary })
    return res.json({ summary })
  })

  return r
}
