/**
 * Simulated Socket.IO layer (mock — no real server).
 *
 * The real backend (per the Architecture doc) is Node.js + MongoDB with
 * Socket.IO events: location:update, member:join, member:left, sos,
 * trip:update and broadcast. Until that backend exists, this service
 * simulates those events on a timer so the Convoy Dashboard moves live.
 *
 * TODO (real backend): replace `simulatedSocket` with a real client, e.g.
 *   const socket = createRealSocket(import.meta.env.VITE_SOCKET_URL)
 *   socket.on('location:update', handler)
 * and remove the timer simulation below. No API key is needed for the
 * mock; do not add a Google Maps key — maps use Leaflet + OpenStreetMap
 * tiles (CartoDB dark) instead.
 */
import { io, type Socket } from 'socket.io-client'
import { MEMBERS, type Member } from '../data/mockData.ts'

export type SocketEvent = 'location:update' | 'member:join' | 'member:left' | 'sos' | 'trip:update' | 'broadcast'

type Handler = (payload: unknown) => void

function jitter(value: number, amount: number): number {
  return value + (Math.random() - 0.5) * amount
}

class SimulatedSocket {
  private listeners = new Map<SocketEvent, Set<Handler>>()
  private timer: ReturnType<typeof setInterval> | null = null
  private tickCount = 0

  on(event: SocketEvent, handler: Handler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler)
    return () => {
      this.listeners.get(event)?.delete(handler)
    }
  }

  emit(event: SocketEvent, payload: unknown): void {
    this.listeners.get(event)?.forEach((h) => h(payload))
  }

  /** Start emitting simulated `location:update` events every 2.5s. */
  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.tickCount += 1
      const members: Member[] = MEMBERS.map((m) => ({
        ...m,
        lat: m.status === 'stopped' || m.status === 'offline' ? m.lat : jitter(m.lat, 0.0006),
        lng: m.status === 'stopped' || m.status === 'offline' ? m.lng : jitter(m.lng, 0.0006),
        speedKmh:
          m.status === 'online'
            ? Math.max(45, Math.min(75, m.speedKmh + Math.round((Math.random() - 0.5) * 6)))
            : 0,
      }))
      this.emit('location:update', { members, tick: this.tickCount, at: new Date().toISOString() })
    }, 2500)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
}

export const simulatedSocket = new SimulatedSocket()

/**
 * Real Socket.IO client factory — provided for the future backend swap.
 * Not connected in this build (no VITE_SOCKET_URL is configured).
 */
export function createRealSocket(url: string): Socket {
  return io(url, { transports: ['websocket'], autoConnect: false })
}
