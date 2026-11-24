/**
 * Socket.IO layer — GPS → Socket → Redux → UI.
 *
 * Rooms: one per trip, `trip:<tripId>`.
 * Auth: the same JWT as the REST API, sent as `auth: { token }`.
 * Events from clients: trip:join, trip:leave, location:update,
 * chat:message, sos, voice:offer, voice:answer, voice:ice-candidate.
 * Events to clients: location:update, member:join, member:left, sos,
 * trip:update, broadcast, chat:message, voice:offer, voice:answer,
 * voice:ice-candidate.
 * Voice is signalling only — audio stays peer-to-peer (WebRTC), there is
 * no media server.
 */
import type { Server as HttpServer } from 'http'
import { Server, type Socket } from 'socket.io'
import { config } from './config'
import { verifyToken } from './auth'
import { getStore } from './db'
import { initialsOf, SEED_MEMBERS } from './seedData'

let io: Server | null = null
export function getIO(): Server | null {
  return io
}

interface AuthedSocket extends Socket {
  userId?: string
  userName?: string
  currentTripId?: string
}

function room(tripId: string): string {
  return `trip:${tripId}`
}

/** Shape the web frontend expects for a location:update payload. */
async function membersPayload(tripId: string) {
  const store = getStore()
  const members = await store.listMembers(tripId)
  return {
    members: members.map((m) => ({
      id: m.userId,
      name: m.name,
      initials: m.initials,
      role: m.role,
      status: m.status,
      speedKmh: m.speedKmh,
      note: m.note,
      lat: m.lat,
      lng: m.lng,
      color: m.color,
    })),
  }
}

export function emitToTrip(tripId: string, event: string, payload: unknown): void {
  io?.to(room(tripId)).emit(event, payload)
}

export function attachSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: config.corsOrigins, credentials: true },
  })

  io.use((socket: AuthedSocket, next) => {
    const token = (socket.handshake.auth?.token as string | undefined) ?? ''
    const payload = token ? verifyToken(token) : null
    if (!payload) return next(new Error('Unauthorized — a valid JWT is required'))
    socket.userId = payload.sub
    next()
  })

  io.on('connection', (socket: AuthedSocket) => {
    const store = getStore()
    const userId = socket.userId as string

    socket.on('trip:join', async (data: { tripId?: string }) => {
      const tripId = data?.tripId
      if (!tripId) return
      const trip = await store.getTrip(tripId)
      if (!trip) {
        socket.emit('error', { message: `Trip ${tripId} not found` })
        return
      }
      socket.join(room(tripId))
      socket.currentTripId = tripId
      const user = await store.findUserById(userId)
      const existing = await store.getMember(tripId, userId)
      if (!existing && user) {
        // First time this rider joins the trip live — add them as a member.
        await store.addMember(tripId, {
          userId,
          name: user.name,
          initials: initialsOf(user.name),
          status: 'online',
          speedKmh: 0,
          note: 'Joined the convoy',
          lat: SEED_MEMBERS[0].lat,
          lng: SEED_MEMBERS[0].lng,
          color: '#22C55E',
        })
      } else if (existing) {
        await store.updateMember(tripId, userId, { status: 'online' })
      }
      socket.to(room(tripId)).emit('member:join', { userId, name: user?.name ?? userId, tripId })
      socket.emit('location:update', await membersPayload(tripId))
    })

    socket.on('trip:leave', async (data: { tripId?: string }) => {
      const tripId = data?.tripId ?? socket.currentTripId
      if (!tripId) return
      socket.leave(room(tripId))
      await store.updateMember(tripId, userId, { status: 'offline' })
      socket.to(room(tripId)).emit('member:left', { userId, tripId })
      socket.currentTripId = undefined
    })

    socket.on('location:update', async (data: { tripId?: string; lat?: number; lng?: number; speedKmh?: number }) => {
      const tripId = data?.tripId ?? socket.currentTripId
      if (!tripId || typeof data.lat !== 'number' || typeof data.lng !== 'number') return
      const speedKmh = typeof data.speedKmh === 'number' ? data.speedKmh : 0
      await store.saveLocation({ tripId, userId, lat: data.lat, lng: data.lng, speedKmh })
      await store.updateMember(tripId, userId, { lat: data.lat, lng: data.lng, speedKmh, status: 'online', note: `${Math.round(speedKmh)} km/h · riding` })
      io?.to(room(tripId)).emit('location:update', await membersPayload(tripId))
    })

    socket.on('chat:message', async (data: { tripId?: string; text?: string }) => {
      const tripId = data?.tripId ?? socket.currentTripId
      const text = (data?.text ?? '').trim()
      if (!tripId || !text) return
      const user = await store.findUserById(userId)
      const author = user?.name ?? 'Rider'
      const msg = await store.addChat(tripId, { userId, author, initials: initialsOf(author), text })
      io?.to(room(tripId)).emit('chat:message', { id: msg.id, authorId: userId, author, initials: msg.initials, text, at: msg.at })
    })

    socket.on('sos', async (data: { tripId?: string; lat?: number; lng?: number }) => {
      const tripId = data?.tripId ?? socket.currentTripId
      if (!tripId) return
      const user = await store.findUserById(userId)
      const name = user?.name ?? 'A rider'
      await store.addAlert(tripId, { title: `SOS from ${name}`, detail: 'Emergency SOS — live location broadcast to the convoy leader and emergency contacts.', kind: 'danger' })
      const members = await store.listMembers(tripId)
      for (const m of members) {
        if (m.userId.startsWith('seed-')) continue
        await store.addNotification({ userId: m.userId, tripId, title: `SOS from ${name}`, detail: 'Emergency SOS — live location broadcast to the convoy.', kind: 'danger' })
      }
      io?.to(room(tripId)).emit('sos', { userId, name, tripId, lat: data?.lat, lng: data?.lng, at: new Date().toISOString() })
    })

    // WebRTC signalling — relayed to one peer in the same trip room.
    const relayVoice = (event: string, data: { to?: string } & Record<string, unknown>) => {
      if (!data?.to) return
      io?.to(data.to).emit(event, { ...data, from: socket.id, fromUserId: userId })
    }
    socket.on('voice:offer', (d) => relayVoice('voice:offer', d))
    socket.on('voice:answer', (d) => relayVoice('voice:answer', d))
    socket.on('voice:ice-candidate', (d) => relayVoice('voice:ice-candidate', d))

    socket.on('disconnect', async () => {
      const tripId = socket.currentTripId
      if (tripId) {
        await store.updateMember(tripId, userId, { status: 'offline' })
        socket.to(room(tripId)).emit('member:left', { userId, tripId })
      }
    })
  })

  return io
}
