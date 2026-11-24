/**
 * API layer for React Query.
 *
 * Two modes, chosen by environment:
 * - Real backend: set VITE_API_URL (e.g. http://localhost:4000) — all calls
 *   below go to the RideSync server (ridesync-server) with the JWT from
 *   localStorage. See ridesync-server/README.md.
 * - Mock (default, VITE_API_URL unset): the shared mock data resolves after
 *   a short delay, exactly as the live site behaves today.
 */
import axios from 'axios'
import { CURRENT_TRIP, MEMBERS, RIDER_STATS, type Member } from '../data/mockData.ts'

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

export async function fetchRiderStats() {
  if (!isRealApi) {
    await delay(350)
    return { ...RIDER_STATS }
  }
  const { data } = await api.get<{ totalRides: number; kmLogged: number; safetyScore: number }>('/api/users/me/stats')
  return data
}

export async function fetchTripHistory() {
  if (!isRealApi) {
    await delay(350)
    return [
      { id: 'manali-2026', name: CURRENT_TRIP.name, route: `${CURRENT_TRIP.from} → ${CURRENT_TRIP.to}`, distanceKm: CURRENT_TRIP.distanceKm, date: CURRENT_TRIP.date },
      { id: 'bhopal-loop', name: 'Bhopal Bikers Sunday Loop', route: 'Bhopal → Bhopal', distanceKm: 86, date: '2026-07-19' },
      { id: 'indore-run', name: 'Highway Cruisers – Indore Run', route: 'Bhopal → Indore', distanceKm: 198, date: '2026-07-12' },
    ]
  }
  const { data } = await api.get<{ trips: Array<{ id: string; name: string; route: string; distanceKm: number; date: string }> }>('/api/users/me/trips')
  return data.trips
}

export async function fetchMembers(tripId = 'manali-2026'): Promise<Member[]> {
  if (!isRealApi) {
    await delay(300)
    return MEMBERS
  }
  const { data } = await api.get<{ members: Member[] }>(`/api/trips/${tripId}/members`)
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
