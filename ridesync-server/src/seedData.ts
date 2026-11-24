/**
 * Seed data — the exact shared mock data from the frontend
 * (ridesync-web/src/data/mockData.ts). The backend seeds this on first
 * run in memory mode, and `npm run seed` creates it in MongoDB.
 */
export const BASE_LAT = 23.2599
export const BASE_LNG = 77.4126

export const DEMO_USER = {
  name: 'Harshit Raj',
  email: 'demo@ridesync.app',
  password: 'ridesync123',
}

export const SEED_TRIP = {
  id: 'manali-2026',
  name: 'Manali Mountain Convoy',
  from: 'Bhopal',
  to: 'Manali',
  distanceKm: 612,
  riders: 12,
  vehicles: 3,
  type: 'Public' as const,
  date: '2026-07-25',
  startTime: '06:00',
  startsIn: 'Starts in 24 min',
  code: 'A1B2C9',
}

export const SEED_MEMBERS = [
  { id: 'rohit', name: 'Rohit Verma', role: 'Leader' as const, status: 'online' as const, speedKmh: 58, note: '58 km/h · 1.2 km ahead', lat: BASE_LAT + 0.004, lng: BASE_LNG + 0.006, color: '#007BFF' },
  { id: 'ananya', name: 'Ananya Kapoor', role: undefined, status: 'online' as const, speedKmh: 61, note: '61 km/h · 300 m ahead', lat: BASE_LAT - 0.002, lng: BASE_LNG + 0.003, color: '#00C2FF' },
  { id: 'puneet', name: 'Puneet Sharma', role: undefined, status: 'stopped' as const, speedKmh: 0, note: 'Stopped · fuel station, 2 min', lat: BASE_LAT + 0.001, lng: BASE_LNG - 0.004, color: '#F59E0B' },
  { id: 'tanya', name: 'Tanya Mehra', role: undefined, status: 'online' as const, speedKmh: 60, note: '60 km/h · alongside you', lat: BASE_LAT - 0.005, lng: BASE_LNG - 0.001, color: '#00C2FF' },
  { id: 'sameer', name: 'Sameer Khan', role: undefined, status: 'offline' as const, speedKmh: 0, note: 'Offline · last seen 4 min ago', lat: BASE_LAT - 0.008, lng: BASE_LNG + 0.001, color: '#8B93A7' },
]

export const SEED_CHAT = [
  { author: 'Rohit (Leader)', text: 'Fuel stop in 5 km, regroup at the dhaba' },
  { author: 'Ananya', text: 'Copy that, riding steady' },
  { author: 'Tanya', text: 'Fog near the ghat section, slow down' },
]

export const SEED_ALERTS = [
  { title: 'Puneet stopped moving', detail: 'Stationary for 2 minutes near KM 214', kind: 'warn' as const },
  { title: 'Weather alert', detail: 'Reduced visibility ahead, ride cautiously', kind: 'warn' as const },
]

export const SEED_NOTIFICATIONS = [
  { title: 'Puneet stopped moving', detail: 'Puneet Sharma has been stationary for 2 minutes near KM 214.', kind: 'warn' as const },
  { title: 'Weather alert — fog ahead', detail: 'Reduced visibility near the ghat section. Ride cautiously.', kind: 'warn' as const },
  { title: 'Rohit broadcast a message', detail: '“Fuel stop in 5 km, regroup at the dhaba.”', kind: 'info' as const },
  { title: 'Trip starts in 24 minutes', detail: 'Manali Mountain Convoy departs Bhopal at 06:00 on 2026-07-25.', kind: 'ok' as const },
  { title: 'Ananya joined the convoy', detail: 'Ananya Kapoor joined Manali Mountain Convoy.', kind: 'ok' as const },
]

export const SEED_STATS = { totalRides: 47, kmLogged: 3140, safetyScore: 98 }

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
