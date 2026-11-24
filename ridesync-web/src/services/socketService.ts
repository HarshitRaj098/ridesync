/**
 * Socket.IO layer — GPS → Socket → Redux → UI.
 *
 * Real backend only: set VITE_SOCKET_URL (e.g. http://localhost:4000) —
 * the Convoy Dashboard connects with the JWT from localStorage, joins
 * the trip room and receives real location:update / broadcast / sos
 * events. Without a backend there is no socket at all: no simulated
 * member positions, no simulated movement, no heartbeat pretending to
 * be a live feed. Maps use Leaflet + OpenStreetMap tiles (CartoDB dark)
 * instead of Google Maps, so no API key is needed.
 */
import { io, type Socket } from 'socket.io-client'

export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined)?.trim() || ''
export const isRealSocket = SOCKET_URL.length > 0

export type SocketEvent = 'location:update' | 'member:join' | 'member:left' | 'sos' | 'trip:update' | 'broadcast'
export type RealSocketEvent = SocketEvent | 'chat:message' | 'voice:offer' | 'voice:answer' | 'voice:ice-candidate'

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
