/**
 * Shared mock data — MUST match the web app / HTML prototype exactly.
 * Do not invent different data. All of this is labelled MOCK in the README
 * and is replaced by the real Node.js + MongoDB backend (see socket/ and api/).
 */

export type MemberStatus = 'online' | 'stopped' | 'offline';

export interface Member {
  id: string;
  name: string;
  initials: string;
  role: 'leader' | 'rider';
  status: MemberStatus;
  speedKmh: number | null;
  position: string;
  /** Offset from the convoy centre (Bhopal) in degrees — drives the map markers. */
  lat: number;
  lng: number;
}

export interface ChatMessage {
  id: string;
  author: string;
  initials: string;
  isLeader: boolean;
  text: string;
  time: string;
}

export interface AlertItem {
  id: string;
  title: string;
  detail: string;
  kind: 'warning' | 'weather' | 'info';
  time: string;
}

export const TRIP = {
  id: 'trip-manali-001',
  name: 'Manali Mountain Convoy',
  origin: 'Bhopal',
  destination: 'Manali',
  distanceKm: 612,
  riderCount: 12,
  vehicleCount: 3,
  type: 'Public' as const,
  startsInMinutes: 24,
  date: '2026-07-25',
  startTime: '06:00',
  code: 'A1B2C9',
  inviteLink: 'https://ridesync.app/join/A1B2C9',
} as const;

export const RIDER_STATS = {
  totalRides: 47,
  kmLogged: 3140,
  safetyScore: 98,
} as const;

export const CURRENT_USER = {
  id: 'me',
  name: 'Sameer Khan',
  initials: 'SK',
  email: 'sameer.khan@example.com',
  bike: 'Royal Enfield Himalayan 450',
} as const;

/** Bhopal centre — same coordinates as the HTML prototype's Leaflet map. */
export const MAP_CENTER = { latitude: 23.2599, longitude: 77.4126 };

export const MEMBERS: Member[] = [
  { id: 'rohit', name: 'Rohit Verma', initials: 'RV', role: 'leader', status: 'online', speedKmh: 58, position: '1.2 km ahead', lat: 23.2639, lng: 77.4186 },
  { id: 'ananya', name: 'Ananya Kapoor', initials: 'AK', role: 'rider', status: 'online', speedKmh: 61, position: '300m ahead', lat: 23.2579, lng: 77.4156 },
  { id: 'puneet', name: 'Puneet Sharma', initials: 'PS', role: 'rider', status: 'stopped', speedKmh: null, position: 'Stopped · fuel station, 2 min', lat: 23.2609, lng: 77.4086 },
  { id: 'tanya', name: 'Tanya Mehra', initials: 'TM', role: 'rider', status: 'online', speedKmh: 60, position: 'alongside you', lat: 23.2549, lng: 77.4116 },
  { id: 'sameer', name: 'Sameer Khan', initials: 'SK', role: 'rider', status: 'offline', speedKmh: null, position: 'Offline · last seen 4 min ago', lat: 23.2599, lng: 77.4126 },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', author: 'Rohit Verma', initials: 'RV', isLeader: true, text: 'Fuel stop in 5 km, regroup at the dhaba', time: '06:12' },
  { id: 'm2', author: 'Ananya Kapoor', initials: 'AK', isLeader: false, text: 'Copy that, riding steady', time: '06:13' },
  { id: 'm3', author: 'Tanya Mehra', initials: 'TM', isLeader: false, text: 'Fog near the ghat section, slow down', time: '06:15' },
];

export const ALERTS: AlertItem[] = [
  { id: 'a1', title: 'Puneet stopped moving', detail: 'Stationary for 2 minutes near KM 214', kind: 'warning', time: '2 min ago' },
  { id: 'a2', title: 'Weather alert', detail: 'Reduced visibility ahead, ride cautiously', kind: 'weather', time: '5 min ago' },
];

export const NEARBY_TRIPS = [
  { id: 'n1', name: 'Bhopal Bikers Sunday Loop', distance: '1.2 km away', riders: 8 },
  { id: 'n2', name: 'Highway Cruisers – Indore Run', distance: '4.6 km away', riders: 15 },
];

export const NOTIFICATIONS = [
  { id: 'n1', title: 'Puneet stopped moving', body: 'Stationary for 2 minutes near KM 214', time: '2 min ago', unread: true, kind: 'warning' as const },
  { id: 'n2', title: 'Weather alert — fog ahead', body: 'Reduced visibility near the ghat section', time: '5 min ago', unread: true, kind: 'weather' as const },
  { id: 'n3', title: 'Manali Mountain Convoy starts soon', body: 'Starts in 24 min · Bhopal → Manali, 612 km', time: '18 min ago', unread: true, kind: 'info' as const },
  { id: 'n4', title: 'Ananya joined the convoy', body: '12 riders are now in the Manali Mountain Convoy', time: '1 hr ago', unread: false, kind: 'info' as const },
];
