import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  haversineKm,
  liveMemberNote,
  type AlertItem,
  type ChatMessage,
  type Member,
  type Trip,
} from '../data/mockData.ts'

/* Persisted slices survive a reload via localStorage (no backend yet).
 * Only data the user created on this device is ever stored here — there
 * is no seeded demo data anywhere in this file. */
function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full / private mode — the app keeps working in-memory.
  }
}

/* ---------------- Auth ---------------- */
export interface AuthUser {
  id?: string
  name: string
  email: string
  initials: string
}
interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
}
const storedUser = (() => {
  try {
    const raw = localStorage.getItem('ridesync-user')
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
})()
const authSlice = createSlice({
  name: 'auth',
  initialState: { user: storedUser, isAuthenticated: storedUser !== null } as AuthState,
  reducers: {
    login(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
      state.isAuthenticated = true
      localStorage.setItem('ridesync-user', JSON.stringify(action.payload))
    },
    logout(state) {
      state.user = null
      state.isAuthenticated = false
      localStorage.removeItem('ridesync-user')
      localStorage.removeItem('ridesync-token')
    },
  },
})

/* ---------------- Trips ----------------
 * Starts EMPTY. There is no demo trip: the only trips in this slice are
 * trips the user created or joined, persisted in localStorage so they
 * survive a reload. */
interface PersistedTrips {
  trips: Trip[]
  joinedTripIds: string[]
  currentTripId: string | null
}
interface TripState {
  currentTrip: Trip | null
  trips: Trip[]
  joinedTripIds: string[]
}
const storedTrips = loadJson<PersistedTrips>('ridesync-trips', { trips: [], joinedTripIds: [], currentTripId: null })
function saveTrips(state: TripState): void {
  saveJson('ridesync-trips', {
    trips: state.trips,
    joinedTripIds: state.joinedTripIds,
    currentTripId: state.currentTrip?.id ?? null,
  } satisfies PersistedTrips)
}
const tripSlice = createSlice({
  name: 'trip',
  initialState: {
    currentTrip: storedTrips.trips.find((t) => t.id === storedTrips.currentTripId) ?? null,
    trips: storedTrips.trips,
    joinedTripIds: storedTrips.joinedTripIds,
  } as TripState,
  reducers: {
    createTrip(state, action: PayloadAction<Trip>) {
      state.trips.unshift(action.payload)
      state.currentTrip = action.payload
      state.joinedTripIds.push(action.payload.id)
      saveTrips(state)
    },
    joinTrip(state, action: PayloadAction<string>) {
      if (!state.joinedTripIds.includes(action.payload)) state.joinedTripIds.push(action.payload)
      saveTrips(state)
    },
    selectTrip(state, action: PayloadAction<string>) {
      const found = state.trips.find((t) => t.id === action.payload)
      if (found) {
        state.currentTrip = found
        saveTrips(state)
      }
    },
  },
})

/* ---------------- Join requests ----------------
 * A request to join a trip is stored here and in localStorage, so it
 * survives a reload, can be cancelled by the requester, and is visible
 * to the leader (Leader Dashboard + Trip Lobby). The REAL layer — leader
 * approves a stored request, capacity check — waits for Deploy and the
 * request/approve endpoint; until then a request is "pending" and the
 * leader sees it but cannot approve it in-app. */
export interface JoinRequest {
  id: string
  tripId: string
  tripName: string
  requesterName: string
  requesterInitials: string
  status: 'pending' | 'cancelled'
  createdAt: string
}
interface JoinRequestsState {
  items: JoinRequest[]
}
const storedRequests = loadJson<JoinRequest[]>('ridesync-join-requests', [])
const joinRequestsSlice = createSlice({
  name: 'joinRequests',
  initialState: { items: storedRequests } as JoinRequestsState,
  reducers: {
    /** Store a new join request. Callers must check for an existing pending
     * request for the same trip first — this reducer will not duplicate one. */
    requestJoin(state, action: PayloadAction<{ tripId: string; tripName: string; requesterName: string; requesterInitials: string }>) {
      const { tripId, requesterName } = action.payload
      const existing = state.items.find(
        (r) => r.tripId === tripId && r.requesterName === requesterName && r.status === 'pending',
      )
      if (existing) return
      state.items.unshift({
        id: `jr-${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...action.payload,
      })
      saveJson('ridesync-join-requests', state.items)
    },
    /** Cancel a request (requester only). Kept as 'cancelled' so the
     * requester can see what happened and request again. */
    cancelJoinRequest(state, action: PayloadAction<string>) {
      state.items = state.items.map((r) => (r.id === action.payload ? { ...r, status: 'cancelled' as const } : r))
      saveJson('ridesync-join-requests', state.items)
    },
  },
})

/* ---------------- Convoy (live) ----------------
 * Starts EMPTY and moves only on real data. There is no simulated
 * movement: no 1s random-walk tick, no simulated socket rebuilding
 * positions, no demo route, no fake speeds. The only things that change
 * this slice are the rider's own actions (chat, SOS, broadcast,
 * regroup) and real GPS from the browser's geolocation (Convoy
 * Dashboard, only while location sharing is on) or the real backend
 * when one is configured. rideSeconds is the only thing a timer
 * advances — the real time the convoy screen has been open. */
interface ConvoyState {
  /** Which trip this convoy state belongs to; switching trips resets it. */
  tripId: string | null
  members: Member[]
  chat: ChatMessage[]
  alerts: AlertItem[]
  rideSeconds: number
  speedKmh: number
  /** Speed samples recorded from real GPS fixes only (may stay empty). */
  speedSamples: number[]
  /** Distance covered, accumulated from real GPS position changes only. */
  distanceCoveredKm: number
  voiceActive: boolean
  sosActive: boolean
  sosSent: boolean
  /** Last real GPS fix, used to accumulate distance. Not persisted. */
  lastPosition: { lat: number; lng: number; at: number } | null
}
const convoySlice = createSlice({
  name: 'convoy',
  initialState: {
    tripId: null,
    members: [],
    chat: [],
    alerts: [],
    rideSeconds: 0,
    speedKmh: 0,
    speedSamples: [],
    distanceCoveredKm: 0,
    voiceActive: false,
    sosActive: false,
    sosSent: false,
    lastPosition: null,
  } as ConvoyState,
  reducers: {
    /** The 1s timer only counts real elapsed time on the convoy screen.
     * It moves nobody and invents no speed or position. */
    tick(state) {
      state.rideSeconds += 1
    },
    /** Opening a different trip's convoy starts it fresh — members,
     * chat and alerts belong to one trip, not to the whole app. */
    startConvoyForTrip(state, action: PayloadAction<string>) {
      if (state.tripId === action.payload) return
      state.tripId = action.payload
      state.members = []
      state.chat = []
      state.alerts = []
      state.rideSeconds = 0
      state.speedKmh = 0
      state.speedSamples = []
      state.distanceCoveredKm = 0
      state.voiceActive = false
      state.sosActive = false
      state.sosSent = false
      state.lastPosition = null
    },
    /** The signed-in rider is the only member the app can know without
     * a backend — add them once, as themselves, with no position until
     * a real GPS fix arrives. */
    ensureSelfMember(state, action: PayloadAction<{ id: string; name: string; initials: string; role?: 'Leader' }>) {
      if (state.members.some((m) => m.id === action.payload.id)) return
      state.members.push({
        ...action.payload,
        status: 'online',
        speedKmh: 0,
        note: 'Position not shared yet',
        color: '#007BFF',
      })
    },
    /** A real GPS fix for one member. Distance is accumulated from the
     * change in position; speed comes from the fix when the browser
     * reports it, otherwise from the distance covered since the last
     * fix. No fix, no movement — nothing is simulated. */
    setMyPosition(
      state,
      action: PayloadAction<{ memberId: string; lat: number; lng: number; speedKmh: number | null }>,
    ) {
      const member = state.members.find((m) => m.id === action.payload.memberId)
      if (!member) return
      const now = Date.now()
      let speedKmh = member.speedKmh
      if (state.lastPosition) {
        const movedKm = haversineKm(state.lastPosition.lat, state.lastPosition.lng, action.payload.lat, action.payload.lng)
        // Ignore GPS jitter under ~10 m.
        if (movedKm >= 0.01) {
          state.distanceCoveredKm = Math.round((state.distanceCoveredKm + movedKm) * 100) / 100
          const hours = (now - state.lastPosition.at) / 3600000
          if (action.payload.speedKmh === null && hours > 0) {
            speedKmh = Math.round(Math.min(200, movedKm / hours))
          }
        }
      }
      if (action.payload.speedKmh !== null) speedKmh = Math.round(action.payload.speedKmh)
      state.lastPosition = { lat: action.payload.lat, lng: action.payload.lng, at: now }
      member.lat = action.payload.lat
      member.lng = action.payload.lng
      member.speedKmh = speedKmh
      member.note = liveMemberNote(member)
      state.speedKmh = speedKmh
      if (speedKmh > 0) {
        state.speedSamples.push(speedKmh)
        if (state.speedSamples.length > 120) state.speedSamples.shift()
      }
    },
    applyLocationUpdate(state, action: PayloadAction<Member[]>) {
      state.members = action.payload
    },
    addChat(state, action: PayloadAction<{ text: string; author: string; initials: string; authorId?: string }>) {
      state.chat.push({ id: `c-${Date.now()}`, ...action.payload })
    },
    toggleVoice(state) {
      state.voiceActive = !state.voiceActive
    },
    setVoiceActive(state, action: PayloadAction<boolean>) {
      state.voiceActive = action.payload
    },
    openSos(state) {
      state.sosActive = true
    },
    closeSos(state) {
      state.sosActive = false
    },
    confirmSos(state) {
      state.sosActive = false
      state.sosSent = true
      // Honest: the SOS is shown to the convoy on this device only.
      // Nobody is actually messaged — there is no messaging service
      // yet, so the alert must not claim contacts were notified.
      state.alerts.unshift({
        id: `a-${Date.now()}`,
        title: 'SOS sent',
        detail: 'Shown to the convoy on this device. Emergency contacts were not messaged — no messaging service is connected yet.',
        kind: 'danger',
      })
    },
    regroup(state) {
      state.members = state.members.map((m) =>
        m.status === 'stopped' ? { ...m, status: 'online' as const, speedKmh: 0, note: 'Riding — speed not available' } : m,
      )
      state.alerts.unshift({ id: `a-${Date.now()}`, title: 'Regroup requested', detail: 'Leader asked all riders to regroup at the next stop.', kind: 'info' })
    },
  },
})

/* ---------------- Notifications ----------------
 * Starts EMPTY. Every notification carries its source (chat / broadcast
 * / SOS / regroup / join request / system) so the list never mixes
 * writers into one anonymous feed. The Settings notifications toggle is
 * honoured here too: when it is off, no new in-app notification is
 * stored (browser pop-ups are already gated in services/notify.ts).
 * Migration: notifications saved by earlier versions carried seeded
 * demo items (ids n1–n5) — those are dropped on load, they were fake. */
export type NotificationKind = 'warn' | 'danger' | 'info' | 'ok'
export type NotificationSource = 'chat' | 'broadcast' | 'sos' | 'regroup' | 'system' | 'join'
export interface NotificationItem {
  id: string
  title: string
  detail: string
  time: string
  kind: NotificationKind
  unread: boolean
  source: NotificationSource
}
interface NotificationsState {
  items: NotificationItem[]
  unreadCount: number
}
const SEEDED_NOTIFICATION_IDS = new Set(['n1', 'n2', 'n3', 'n4', 'n5'])
const storedNotifications = loadJson<NotificationItem[]>('ridesync-notifications', [])
  .filter((n) => !SEEDED_NOTIFICATION_IDS.has(n.id))
  .map((n) => ({ ...n, source: (n as NotificationItem).source ?? 'system' }))
function notificationsEnabledInSettings(): boolean {
  try {
    const raw = localStorage.getItem('ridesync-settings')
    if (!raw) return true
    return (JSON.parse(raw) as { notificationsEnabled?: boolean }).notificationsEnabled !== false
  } catch {
    return true
  }
}
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: storedNotifications,
    unreadCount: storedNotifications.filter((n) => n.unread).length,
  } as NotificationsState,
  reducers: {
    /** A new in-app notification (SOS, regroup, broadcast, new chat). Persisted.
     * Dropped entirely when notifications are off in Settings. */
    addNotification(state, action: PayloadAction<{ title: string; detail: string; kind: NotificationKind; source?: NotificationSource }>) {
      if (!notificationsEnabledInSettings()) return
      state.items.unshift({
        id: `n-${Date.now()}`,
        time: 'Just now',
        unread: true,
        source: action.payload.source ?? 'system',
        ...action.payload,
      })
      state.unreadCount = state.items.filter((n) => n.unread).length
      saveJson('ridesync-notifications', state.items)
    },
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, unread: false }))
      state.unreadCount = 0
      saveJson('ridesync-notifications', state.items)
    },
    markRead(state, action: PayloadAction<string>) {
      state.items = state.items.map((n) => (n.id === action.payload ? { ...n, unread: false } : n))
      state.unreadCount = state.items.filter((n) => n.unread).length
      saveJson('ridesync-notifications', state.items)
    },
  },
})

/* ---------------- Settings ---------------- */
interface SettingsState {
  darkMode: boolean
  notificationsEnabled: boolean
  locationSharing: boolean
  voiceEnabled: boolean
}
const storedSettings = loadJson<SettingsState>('ridesync-settings', {
  darkMode: true,
  notificationsEnabled: true,
  locationSharing: true,
  voiceEnabled: true,
})
const settingsSlice = createSlice({
  name: 'settings',
  initialState: storedSettings,
  reducers: {
    toggleSetting(state, action: PayloadAction<keyof SettingsState>) {
      state[action.payload] = !state[action.payload]
      saveJson('ridesync-settings', state)
    },
  },
})

/* ---------------- Lifetime rider stats ----------------
 * Starts at ZERO. The only rides counted are trips the user actually
 * ended in this app, and the only kilometres are the ones actually
 * covered (from real GPS while riding, or 0 without it). Completed
 * trips are stored too, so Ride History shows real rides only.
 * Stored under a new key (ridesync-lifetime-v2) so the old seeded
 * 47 rides / 3,140 km totals from earlier versions are never read. */
export interface CompletedTripRecord {
  id: string
  name: string
  route: string
  distanceKm: number
  date: string
}
interface LifetimeState {
  totalRides: number
  kmLogged: number
  completedTrips: CompletedTripRecord[]
}
const storedLifetime = loadJson<LifetimeState>('ridesync-lifetime-v2', {
  totalRides: 0,
  kmLogged: 0,
  completedTrips: [],
})
const lifetimeSlice = createSlice({
  name: 'lifetime',
  initialState: storedLifetime,
  reducers: {
    recordCompletedTrip(state, action: PayloadAction<{ km: number; trip?: CompletedTripRecord }>) {
      state.totalRides += 1
      state.kmLogged += Math.max(0, Math.round(action.payload.km))
      if (action.payload.trip) state.completedTrips.unshift(action.payload.trip)
      saveJson('ridesync-lifetime-v2', state)
    },
  },
})

/* ---------------- Emergency contacts (SOS) ----------------
 * Real contacts, added/edited/deleted in Settings and stored in
 * localStorage. Starts EMPTY — contacts are only the ones the user
 * adds. SOS lists them; it never claims to message them, because no
 * messaging service is connected yet. */
export interface EmergencyContact {
  id: string
  name: string
  phone: string
}
interface ContactsState {
  items: EmergencyContact[]
}
const storedContacts = loadJson<EmergencyContact[]>('ridesync-emergency-contacts', [])
const contactsSlice = createSlice({
  name: 'contacts',
  initialState: { items: storedContacts } as ContactsState,
  reducers: {
    addContact(state, action: PayloadAction<{ name: string; phone: string }>) {
      state.items.push({ id: `ec-${Date.now()}`, ...action.payload })
      saveJson('ridesync-emergency-contacts', state.items)
    },
    updateContact(state, action: PayloadAction<{ id: string; name: string; phone: string }>) {
      state.items = state.items.map((c) => (c.id === action.payload.id ? { ...action.payload } : c))
      saveJson('ridesync-emergency-contacts', state.items)
    },
    removeContact(state, action: PayloadAction<string>) {
      state.items = state.items.filter((c) => c.id !== action.payload)
      saveJson('ridesync-emergency-contacts', state.items)
    },
  },
})

export const { login, logout } = authSlice.actions
export const { createTrip, joinTrip, selectTrip } = tripSlice.actions
export const { requestJoin, cancelJoinRequest } = joinRequestsSlice.actions
export const { tick, startConvoyForTrip, ensureSelfMember, setMyPosition, applyLocationUpdate, addChat, toggleVoice, setVoiceActive, openSos, closeSos, confirmSos, regroup } = convoySlice.actions
export const { addNotification, markAllRead, markRead } = notificationsSlice.actions
export const { toggleSetting } = settingsSlice.actions
export const { recordCompletedTrip } = lifetimeSlice.actions
export const { addContact, updateContact, removeContact } = contactsSlice.actions

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    trip: tripSlice.reducer,
    joinRequests: joinRequestsSlice.reducer,
    convoy: convoySlice.reducer,
    notifications: notificationsSlice.reducer,
    settings: settingsSlice.reducer,
    lifetime: lifetimeSlice.reducer,
    contacts: contactsSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
