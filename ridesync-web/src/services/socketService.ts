/**
 * Socket.IO layer — GPS → Socket → Redux → UI.
 *
 * Two modes, chosen by environment:
 * - Real backend: set VITE_SOCKET_URL (e.g. http://localhost:4000) — the
 *   Convoy Dashboard connects with the JWT from localStorage, joins the
 *   trip room and receives real location:update / broadcast / sos events.
 * - Simulated (default, VITE_SOCKET_URL unset): the timer below emits
 *   location:update every 2.5s so the Convoy Dashboard moves live with
 *   no server. No API key is needed — maps use Leaflet + OpenStreetMap
 *   tiles (CartoDB dark) instead of Google Maps.
 */
import { io, type Socket } from 'socket.io-client'
import { MEMBERS, type Member } from '../data/mockData.ts'

export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim() || ''
export const isRealSocket = SOCKET_URL.length > 0

export type SocketEvent = 'location:update' | 'member:join' | 'member:left' | 'sos' | 'trip:update' | 'broadcast'
export type RealSocketEvent = SocketEvent | 'chat:message' | 'voice:offer' | 'voice:answer' | 'voice:ice-candidate'

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
 * Real Socket.IO client — used when VITE_SOCKET_URL is set. Authenticates
 * with the same JWT as the REST API (localStorage `ridesync-token`).
 * Returns the shared socket instance; callers attach their own listeners.
 */
let realSocket: Socket | null = null
export function createRealSocket(url = SOCKET_URL): Socket {
  if (realSocket?.connected || realSocket) return realSocket
  const token = localStorage.getItem('ridesync-token') ?? ''
  realSocket = io(url, { transports: ['websocket'], auth: { token }, autoConnect: true })
  return realSocket
}

export function disconnectRealSocket(): void {
  realSocket?.disconnect()
  realSocket = null
}
