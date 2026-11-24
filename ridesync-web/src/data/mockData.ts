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
  /** Server user id of the sender (real backend only) — used to ignore our own echo. */
  authorId?: string
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
  /** Name of the trip leader, when one was chosen at creation time. */
  leaderName?: string
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

/** Past (completed) mock trips, shown on Home below the upcoming trip. */
export const PAST_TRIPS: Trip[] = [
  {
    id: 'bhopal-loop',
    name: 'Bhopal Bikers Sunday Loop',
    from: 'Bhopal',
    to: 'Bhopal',
    distanceKm: 86,
    riders: 8,
    vehicles: 2,
    type: 'Public',
    date: '2026-07-19',
    startTime: '06:30',
    startsIn: 'Completed',
    code: 'LOOP86',
  },
  {
    id: 'indore-run',
    name: 'Highway Cruisers – Indore Run',
    from: 'Bhopal',
    to: 'Indore',
    distanceKm: 198,
    riders: 15,
    vehicles: 4,
    type: 'Public',
    date: '2026-07-12',
    startTime: '05:30',
    startsIn: 'Completed',
    code: 'IND198',
  },
]

/** Haversine distance between two lat/lng points, in km. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.sqrt(a))
}

export function leaderOf(members: Member[]): Member | undefined {
  return members.find((m) => m.role === 'Leader') ?? members[0]
}

/** Distance of a member from the convoy leader, in km (0 for the leader). */
export function distanceFromLeaderKm(member: Member, members: Member[]): number {
  const leader = leaderOf(members)
  if (!leader || member.id === leader.id) return 0
  return haversineKm(member.lat, member.lng, leader.lat, leader.lng)
}

/**
 * Why a rider counts as separated from the convoy, or null if they are
 * riding with the group. A rider is separated when offline, stopped, or
 * more than 2 km from the leader (simulated GPS positions).
 */
export function separatedReason(member: Member, members: Member[]): string | null {
  if (member.role === 'Leader') return null
  if (member.status === 'offline') return 'Offline — last known position shown'
  if (member.status === 'stopped') return 'Stopped — not moving with the convoy'
  const d = distanceFromLeaderKm(member, members)
  if (d > 2) return `Separated — ${d.toFixed(1)} km from the leader`
  return null
}

/**
 * Nearby trips are real trips from the store (same ids/codes as PAST_TRIPS),
 * so a Request from here targets a trip the join logic actually knows.
 */
export const NEARBY_TRIPS = [
  { id: 'nearby-1', tripId: 'bhopal-loop', name: 'Bhopal Bikers Sunday Loop', detail: '1.2 km away · 8 riders', code: 'LOOP86' },
  { id: 'nearby-2', tripId: 'indore-run', name: 'Highway Cruisers – Indore Run', detail: '4.6 km away · 15 riders', code: 'IND198' },
]

export const NOTIFICATIONS = [
  { id: 'n1', title: 'Puneet stopped moving', detail: 'Puneet Sharma has been stationary for 2 minutes near KM 214.', time: '2 min ago', kind: 'warn' as const, unread: true, source: 'system' as const },
  { id: 'n2', title: 'Weather alert — fog ahead', detail: 'Reduced visibility near the ghat section. Ride cautiously.', time: '6 min ago', kind: 'warn' as const, unread: true, source: 'system' as const },
  { id: 'n3', title: 'Rohit broadcast a message', detail: '“Fuel stop in 5 km, regroup at the dhaba.”', time: '12 min ago', kind: 'info' as const, unread: true, source: 'broadcast' as const },
  { id: 'n4', title: 'Trip starts in 24 minutes', detail: 'Manali Mountain Convoy departs Bhopal at 06:00 on 2026-07-25.', time: '30 min ago', kind: 'ok' as const, unread: false, source: 'system' as const },
  { id: 'n5', title: 'Ananya joined the convoy', detail: 'Ananya Kapoor joined Manali Mountain Convoy.', time: '1 hr ago', kind: 'ok' as const, unread: false, source: 'join' as const },
]

export const SPEED_HISTORY = [
  { label: '06:00', value: 42 },
  { label: '06:30', value: 58 },
  { label: '07:00', value: 61 },
  { label: '07:30', value: 55 },
  { label: '08:00', value: 62 },
  { label: '08:30', value: 48 },
]

/**
 * Route polyline: the Bhopal → Manali demo corridor (Bhopal, Guna, Jhansi,
 * Gwalior, Agra, Mathura, Delhi, Panipat, Ambala, Chandigarh, Rupnagar,
 * Bilaspur, Mandi, Kullu, Manali). These are approximate waypoints for the
 * DEMO map only — positions on this map are simulated, not live GPS, and
 * the trip's 612 km is mapped onto this corridor, so the route is
 * compressed. The map must say so (see ConvoyDashboard's demo chip).
 */
export const ROUTE_POINTS: Array<[number, number]> = [
  [23.2599, 77.4126], // Bhopal
  [24.645, 77.31], // Guna
  [25.4484, 78.5685], // Jhansi
  [26.2183, 78.1828], // Gwalior
  [27.1767, 78.0081], // Agra
  [27.4924, 77.6737], // Mathura
  [28.6139, 77.209], // Delhi
  [29.3909, 76.9635], // Panipat
  [30.3782, 76.7767], // Ambala
  [30.7333, 76.7794], // Chandigarh
  [30.9685, 76.5233], // Rupnagar
  [31.3345, 76.757], // Bilaspur (HP)
  [31.7087, 76.9318], // Mandi
  [31.9579, 77.1095], // Kullu
  [32.2396, 77.1887], // Manali
]

/** Total length of the demo route polyline, in km. */
export const ROUTE_LENGTH_KM: number = (() => {
  let total = 0
  for (let i = 1; i < ROUTE_POINTS.length; i += 1) {
    total += haversineKm(ROUTE_POINTS[i - 1][0], ROUTE_POINTS[i - 1][1], ROUTE_POINTS[i][0], ROUTE_POINTS[i][1])
  }
  return total
})()

/** Point along the demo route at fraction `frac` (0 = Bhopal, 1 = Manali). */
export function pointAlongRoute(frac: number): [number, number] {
  const f = Math.max(0, Math.min(1, frac))
  const target = f * ROUTE_LENGTH_KM
  let walked = 0
  for (let i = 1; i < ROUTE_POINTS.length; i += 1) {
    const [lat1, lng1] = ROUTE_POINTS[i - 1]
    const [lat2, lng2] = ROUTE_POINTS[i]
    const seg = haversineKm(lat1, lng1, lat2, lng2)
    if (walked + seg >= target || i === ROUTE_POINTS.length - 1) {
      const t = seg === 0 ? 0 : (target - walked) / seg
      return [lat1 + (lat2 - lat1) * t, lng1 + (lng2 - lng1) * t]
    }
    walked += seg
  }
  return ROUTE_POINTS[ROUTE_POINTS.length - 1]
}

/** Position of a rider on the demo route, from the trip's progress.
 * `frac` is distanceCoveredKm / tripDistanceKm (0 = start, 1 = destination),
 * plus the rider's fixed offset from the leader. Stopped/offline riders do
 * not advance — they keep the position they had, so they fall behind. */
export function memberRoutePosition(memberId: string, distanceCoveredKm: number, tripDistanceKm: number): [number, number] {
  const frac = tripDistanceKm > 0 ? distanceCoveredKm / tripDistanceKm : 0
  const offsetFrac = (MEMBER_ROUTE_OFFSET_KM[memberId] ?? 0) / Math.max(1, tripDistanceKm)
  return pointAlongRoute(frac + offsetFrac)
}

/** Live note for a member row: online riders show their current speed
 * (distance from the leader is shown separately, live, by MemberCard).
 * Stopped/offline notes describe the status, not a live number. */
export function liveMemberNote(member: Member): string {
  if (member.status === 'online') return `${member.speedKmh} km/h`
  return member.note
}
export function nearestRouteIndex(lat: number, lng: number): number {
  let best = 0
  let bestD = Number.POSITIVE_INFINITY
  ROUTE_POINTS.forEach(([plat, plng], i) => {
    const d = haversineKm(lat, lng, plat, plng)
    if (d < bestD) {
      bestD = d
      best = i
    }
  })
  return best
}

/**
 * Each named rider's offset from the leader along the route, in trip km.
 * Positive = ahead of the leader, negative = behind. These are the demo
 * spacings behind the "1.2 km ahead" / "300 m ahead" notes.
 */
export const MEMBER_ROUTE_OFFSET_KM: Record<string, number> = {
  rohit: 0,
  ananya: 0.3,
  tanya: 0,
  puneet: -0.8,
  sameer: -1.5,
}

/**
 * Rough road distance from Bhopal to a few common destinations, in km.
 * Estimates only — used so Create Trip does not claim every destination
 * is 612 km away. Returns null when the destination is not known, and the
 * caller must then show "distance not estimated" instead of inventing one.
 */
const KNOWN_DISTANCES_KM: Array<{ match: RegExp; km: number }> = [
  { match: /manali/i, km: 612 },
  { match: /indore/i, km: 198 },
  { match: /ujjain/i, km: 185 },
  { match: /jaipur/i, km: 480 },
  { match: /delhi/i, km: 580 },
  { match: /agra/i, km: 430 },
  { match: /gwalior/i, km: 430 },
  { match: /jhansi/i, km: 330 },
  { match: /shimla/i, km: 640 },
  { match: /rishikesh/i, km: 690 },
  { match: /mumbai/i, km: 780 },
  { match: /pune/i, km: 660 },
  { match: /goa/i, km: 860 },
  { match: /hyderabad/i, km: 740 },
  { match: /bhopal/i, km: 86 },
]
export function estimateDistanceKm(destination: string): number | null {
  const hit = KNOWN_DISTANCES_KM.find((d) => d.match.test(destination))
  return hit ? hit.km : null
}

export function formatRideTime(totalSeconds: number): string {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
