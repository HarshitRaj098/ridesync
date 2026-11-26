/**
 * Socket layer.
 *
 * Real mode (when the Node.js + MongoDB backend exists):
 *   1. Set EXPO_PUBLIC_SOCKET_URL (e.g. http://localhost:5000) and
 *      EXPO_PUBLIC_USE_REAL_SOCKET=1.
 *   2. The service below connects with socket.io-client and subscribes to
 *      `location:update`, `member:join`, `member:left`, `sos`,
 *      `trip:update` and `broadcast` — the exact events from the blueprint.
 *   3. GPS -> Socket -> Redux -> UI: location updates dispatch the same
 *      Redux actions the app uses today.
 *
 * Until then, `connect()` does nothing: there is no simulated socket any
 * more (the old fake location:update ticks were removed with the fake
 * data on 2026-11-26). No positions are invented.
 */
import { io, Socket } from 'socket.io-client';

export type SocketEvent =
  | 'location:update'
  | 'member:join'
  | 'member:left'
  | 'sos'
  | 'trip:update'
  | 'broadcast';

type Listener = (payload: unknown) => void;

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:5000';
const USE_REAL_SOCKET = process.env.EXPO_PUBLIC_USE_REAL_SOCKET === '1';

class SocketService {
  private socket: Socket | null = null;
  private listeners = new Map<SocketEvent, Set<Listener>>();

  connect() {
    if (!USE_REAL_SOCKET) return;
    this.socket = io(SOCKET_URL, { transports: ['websocket'] });
    this.socket.on('connect', () => console.log('[socket] connected'));
    (['location:update', 'member:join', 'member:left', 'sos', 'trip:update', 'broadcast'] as SocketEvent[]).forEach(
      (event) => this.socket?.on(event, (payload: unknown) => this.emit(event, payload)),
    );
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: SocketEvent, listener: Listener) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(listener);
    return () => this.listeners.get(event)?.delete(listener);
  }

  emit(event: SocketEvent, payload: unknown) {
    this.listeners.get(event)?.forEach((l) => l(payload));
  }

  sendSos(location: { latitude: number; longitude: number }) {
    if (this.socket) this.socket.emit('sos', location);
    else console.log('[socket] SOS not sent — no backend connected', location);
  }
}

export const socketService = new SocketService();
export const IS_MOCK_SOCKET = !USE_REAL_SOCKET;
