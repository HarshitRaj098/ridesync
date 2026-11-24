/**
 * Shared mock data for RideSync web (Track 2).
 * Source: ridesync__1.html prototype + the three Phase 1 / Blueprint / Architecture PDFs.
 * Use EXACTLY this data everywhere — do not invent different trips, members or stats.
 * All data is mock / simulated. There is no backend yet.
 */

export type MemberStatus = 'online' | 'stopped' | 'offline'

export interface Member {
  id: string
  name: string
  initials: string
  role?: 'Leader'
  status: MemberStatus
  speedKmh: number
  note: string
  lat: number
  lng: number
  color: string
}

export interface ChatMessage {
  id: string
  author: string
  initials: string
  text: string
}

export interface AlertItem {
  id: string
  title: string
  detail: string
  kind: 'warn' | 'info' | 'danger'
}

export interface Trip {
  id: string
  name: string
  from: string
  to: string
  distanceKm: number
  riders: number
  vehicles: number
  type: 'Public' | 'Private'
  date: string
  startTime: string
  startsIn: string
  code: string
}

export const CURRENT_TRIP: Trip = {
  id: 'manali-2026',
  name: 'Manali Mountain Convoy',
  from: 'Bhopal',
  to: 'Manali',
  distanceKm: 612,
  riders: 12,
  vehicles: 3,
  type: 'Public',
  date: '2026-07-25',
  startTime: '06:00',
  startsIn: 'Starts in 24 min',
  code: 'A1B2C9',
}

/** Base position: Bhopal (23.2599, 77.4126), matching the HTML prototype map. */
export const BASE_LAT = 23.2599
export const BASE_LNG = 77.4126

export const MEMBERS: Member[] = [
  { id: 'rohit', name: 'Rohit Verma', initials: 'RV', role: 'Leader', status: 'online', speedKmh: 58, note: '58 km/h · 1.2 km ahead', lat: BASE_LAT + 0.004, lng: BASE_LNG + 0.006, color: '#007BFF' },
  { id: 'ananya', name: 'Ananya Kapoor', initials: 'AK', status: 'online', speedKmh: 61, note: '61 km/h · 300 m ahead', lat: BASE_LAT - 0.002, lng: BASE_LNG + 0.003, color: '#00C2FF' },
  { id: 'puneet', name: 'Puneet Sharma', initials: 'PS', status: 'stopped', speedKmh: 0, note: 'Stopped · fuel station, 2 min', lat: BASE_LAT + 0.001, lng: BASE_LNG - 0.004, color: '#F59E0B' },
  { id: 'tanya', name: 'Tanya Mehra', initials: 'TM', status: 'online', speedKmh: 60, note: '60 km/h · alongside you', lat: BASE_LAT - 0.005, lng: BASE_LNG - 0.001, color: '#00C2FF' },
  { id: 'sameer', name: 'Sameer Khan', initials: 'SK', status: 'offline', speedKmh: 0, note: 'Offline · last seen 4 min ago', lat: BASE_LAT - 0.008, lng: BASE_LNG + 0.001, color: '#8B93A7' },
]

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: 'c1', author: 'Rohit (Leader)', initials: 'RV', text: 'Fuel stop in 5 km, regroup at the dhaba' },
  { id: 'c2', author: 'Ananya', initials: 'AK', text: 'Copy that, riding steady' },
  { id: 'c3', author: 'Tanya', initials: 'TM', text: 'Fog near the ghat section, slow down' },
]

export const ALERTS: AlertItem[] = [
  { id: 'a1', title: 'Puneet stopped moving', detail: 'Stationary for 2 minutes near KM 214', kind: 'warn' },
  { id: 'a2', title: 'Weather alert', detail: 'Reduced visibility ahead, ride cautiously', kind: 'warn' },
]

export const RIDER_STATS = { totalRides: 47, kmLogged: 3140, safetyScore: 98 }

export const NEARBY_TRIPS = [
  { id: 'nearby-1', name: 'Bhopal Bikers Sunday Loop', detail: '1.2 km away · 8 riders' },
  { id: 'nearby-2', name: 'Highway Cruisers – Indore Run', detail: '4.6 km away · 15 riders' },
]

export const NOTIFICATIONS = [
  { id: 'n1', title: 'Puneet stopped moving', detail: 'Puneet Sharma has been stationary for 2 minutes near KM 214.', time: '2 min ago', kind: 'warn' as const, unread: true },
  { id: 'n2', title: 'Weather alert — fog ahead', detail: 'Reduced visibility near the ghat section. Ride cautiously.', time: '6 min ago', kind: 'warn' as const, unread: true },
  { id: 'n3', title: 'Rohit broadcast a message', detail: '“Fuel stop in 5 km, regroup at the dhaba.”', time: '12 min ago', kind: 'info' as const, unread: true },
  { id: 'n4', title: 'Trip starts in 24 minutes', detail: 'Manali Mountain Convoy departs Bhopal at 06:00 on 2026-07-25.', time: '30 min ago', kind: 'ok' as const, unread: false },
  { id: 'n5', title: 'Ananya joined the convoy', detail: 'Ananya Kapoor joined Manali Mountain Convoy.', time: '1 hr ago', kind: 'ok' as const, unread: false },
]

export const SPEED_HISTORY = [
  { label: '06:00', value: 42 },
  { label: '06:30', value: 58 },
  { label: '07:00', value: 61 },
  { label: '07:30', value: 55 },
  { label: '08:00', value: 62 },
  { label: '08:30', value: 48 },
]

/** Route polyline (Bhopal area, matching the prototype) for the Leaflet map. */
export const ROUTE_POINTS: Array<[number, number]> = [
  [BASE_LAT - 0.01, BASE_LNG - 0.01],
  [BASE_LAT - 0.005, BASE_LNG - 0.004],
  [BASE_LAT, BASE_LNG],
  [BASE_LAT + 0.002, BASE_LNG + 0.003],
  [BASE_LAT + 0.004, BASE_LNG + 0.006],
  [BASE_LAT + 0.009, BASE_LNG + 0.011],
]

export function formatRideTime(totalSeconds: number): string {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
