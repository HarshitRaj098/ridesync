/**
 * API layer for React Query.
 *
 * Two modes, chosen by environment:
 * - Real backend: set VITE_API_URL (e.g. http://localhost:4000) — all calls
 *   below go to the RideSync server (ridesync-server) with the JWT from
 *   localStorage. See ridesync-server/README.md.
 * - Local (default, VITE_API_URL unset): everything is read from this
 *   device's own stored data. There is no seeded data — a fresh install
 *   returns zero rides, zero kilometres, no safety score and no history.
 */
import axios from 'axios'
import type { Member } from '../data/mockData.ts'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || ''
export const isRealApi = API_URL.length > 0

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const api = axios.create({ baseURL: API_URL || undefined, timeout: 15000 })
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ridesync-token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    if (data?.error) return data.error
    if (err.code === 'ERR_NETWORK') return 'Could not reach the RideSync server — is it running?'
    return err.message
  }
  return err instanceof Error ? err.message : 'Something went wrong.'
}

export interface AuthResponse {
  user: { id: string; name: string; email: string; totalRides: number; kmLogged: number; safetyScore: number }
  token: string
}

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/login', { email, password })
  return data
}

export async function registerApi(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/api/auth/register', { name, email, password })
  return data
}

export interface RiderStats {
  totalRides: number
  kmLogged: number
  /** Null until the user has completed a ride — no invented score. */
  safetyScore: number | null
}

export async function fetchRiderStats(): Promise<RiderStats> {
  if (!isRealApi) {
    await delay(350)
    // Only what the user actually did in this app (see the lifetime
    // slice in store.ts) — a fresh install is 0 rides, 0 km, no score.
    try {
      const raw = localStorage.getItem('ridesync-lifetime-v2')
      if (raw) {
        const saved = JSON.parse(raw) as { totalRides: number; kmLogged: number }
        // No safety score without a backend — a score would be invented.
        return { totalRides: saved.totalRides, kmLogged: saved.kmLogged, safetyScore: null }
      }
    } catch {
      // Fall through to zeros.
    }
    return { totalRides: 0, kmLogged: 0, safetyScore: null }
  }
  const { data } = await api.get<{ totalRides: number; kmLogged: number; safetyScore: number }>('/api/users/me/stats')
  return data
}

export interface TripHistoryItem {
  id: string
  name: string
  route: string
  distanceKm: number
  date: string
}

export async function fetchTripHistory(): Promise<TripHistoryItem[]> {
  if (!isRealApi) {
    await delay(350)
    // Only trips the user actually ended in this app — none on a fresh install.
    try {
      const raw = localStorage.getItem('ridesync-lifetime-v2')
      if (raw) {
        const saved = JSON.parse(raw) as { completedTrips?: TripHistoryItem[] }
        return saved.completedTrips ?? []
      }
    } catch {
      // Fall through to empty.
    }
    return []
  }
  const { data } = await api.get<{ trips: TripHistoryItem[] }>('/api/users/me/trips')
  return data.trips
}

export async function fetchMembers(_tripId = ''): Promise<Member[]> {
  if (!isRealApi) {
    await delay(300)
    // No backend, no directory of riders — the convoy's members come
    // from the store (the signed-in rider), never from a seed list.
    return []
  }
  const { data } = await api.get<{ members: Member[] }>(`/api/trips/${_tripId}/members`)
  return data.members
}

export async function postChat(tripId: string, text: string): Promise<void> {
  if (!isRealApi) return
  await api.post(`/api/trips/${tripId}/chat`, { text })
}

export async function sendSosApi(tripId: string, lat?: number, lng?: number): Promise<void> {
  if (!isRealApi) return
  await api.post(`/api/trips/${tripId}/sos`, { lat, lng })
}

export async function broadcastApi(tripId: string, text: string): Promise<void> {
  if (!isRealApi) return
  await api.post(`/api/trips/${tripId}/broadcast`, { text })
}

export async function regroupApi(tripId: string): Promise<{ regrouped: number }> {
  if (!isRealApi) return { regrouped: 0 }
  const { data } = await api.post<{ regrouped: number }>(`/api/trips/${tripId}/regroup`)
  return data
}

export async function endTripApi(tripId: string): Promise<unknown> {
  if (!isRealApi) return null
  const { data } = await api.post(`/api/trips/${tripId}/end`)
  return data
}
