import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  ALERTS,
  CHAT_MESSAGES,
  CURRENT_TRIP,
  MEMBERS,
  NOTIFICATIONS,
  PAST_TRIPS,
  RIDER_STATS,
  liveMemberNote,
  memberRoutePosition,
  type AlertItem,
  type ChatMessage,
  type Member,
  type Trip,
} from '../data/mockData.ts'

/* Persisted slices survive a reload via localStorage (mock only — no backend). */
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

/* ---------------- Trips ---------------- */
interface TripState {
  currentTrip: Trip
  trips: Trip[]
  joinedTripIds: string[]
}
const tripSlice = createSlice({
  name: 'trip',
  initialState: {
    currentTrip: CURRENT_TRIP,
    trips: [CURRENT_TRIP, ...PAST_TRIPS],
    joinedTripIds: [CURRENT_TRIP.id],
  } as TripState,
  reducers: {
    createTrip(state, action: PayloadAction<Trip>) {
      state.trips.unshift(action.payload)
      state.currentTrip = action.payload
      state.joinedTripIds.push(action.payload.id)
    },
    joinTrip(state, action: PayloadAction<string>) {
      if (!state.joinedTripIds.includes(action.payload)) state.joinedTripIds.push(action.payload)
    },
    selectTrip(state, action: PayloadAction<string>) {
      const found = state.trips.find((t) => t.id === action.payload)
      if (found) state.currentTrip = found
    },
  },
})

/* ---------------- Join requests (Join Trip conclusion, mock layer) ----------------
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
 * ONE movement model: the 1s tick is the only thing that moves riders.
 * Positions come from the demo route (memberRoutePosition) driven by
 * distanceCoveredKm — the convoy genuinely travels Bhopal → Manali on
 * the map instead of shivering around the start point. The simulated
 * socket used to overwrite these positions with fresh jitter around the
 * seed every 2.5s, wiping the tick's movement; it no longer sends member
 * positions (see services/socketService.ts). */
interface ConvoyState {
  members: Member[]
  chat: ChatMessage[]
  alerts: AlertItem[]
  rideSeconds: number
  speedKmh: number
  /** Last speed samples (one per tick, capped) — the Leader Dashboard's
   * average speed is a real average of these, not the current speed. */
  speedSamples: number[]
  distanceCoveredKm: number
  voiceActive: boolean
  sosActive: boolean
  sosSent: boolean
}
/** Riders start on the demo route at the trip's progress (214 km done),
 * not at the Bhopal start point — otherwise the map would show them in
 * the wrong place until the first tick. */
function initialConvoyMembers(): Member[] {
  return MEMBERS.map((m) => {
    const [lat, lng] = memberRoutePosition(m.id, 214, CURRENT_TRIP.distanceKm)
    const next = { ...m, lat, lng }
    return { ...next, note: liveMemberNote(next) }
  })
}
const convoySlice = createSlice({
  name: 'convoy',
  initialState: {
    members: initialConvoyMembers(),
    chat: CHAT_MESSAGES,
    alerts: ALERTS,
    rideSeconds: 6128, // 01:42:08, matching the prototype timer
    speedKmh: 62,
    speedSamples: [62],
    distanceCoveredKm: 214,
    voiceActive: false,
    sosActive: false,
    sosSent: false,
  } as ConvoyState,
  reducers: {
    tick(state) {
      state.rideSeconds += 1
      state.speedKmh = Math.max(45, Math.min(75, state.speedKmh + Math.round((Math.random() - 0.5) * 4)))
      state.distanceCoveredKm = Math.round((state.distanceCoveredKm + state.speedKmh / 3600) * 100) / 100
      state.speedSamples.push(state.speedKmh)
      if (state.speedSamples.length > 120) state.speedSamples.shift()
      state.members = state.members.map((m) => {
        if (m.status !== 'online') return { ...m, speedKmh: 0 }
        const speedKmh = Math.max(45, Math.min(75, m.speedKmh + Math.round((Math.random() - 0.5) * 4)))
        // Online riders advance along the demo route with the convoy.
        // Stopped/offline riders keep their position and fall behind.
        const [lat, lng] = memberRoutePosition(m.id, state.distanceCoveredKm, CURRENT_TRIP.distanceKm)
        const next = { ...m, lat, lng, speedKmh }
        return { ...next, note: liveMemberNote(next) }
      })
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
      // Honest in the demo: the SOS is shown to the convoy on this device.
      // Nobody is actually messaged — there is no messaging service yet,
      // so the alert must not claim contacts were notified.
      state.alerts.unshift({ id: `a-${Date.now()}`, title: 'SOS sent', detail: 'Shown to the convoy on this device (demo). Emergency contacts were not messaged — no messaging service is connected yet.', kind: 'danger' })
    },
    regroup(state) {
      state.members = state.members.map((m) =>
        m.status === 'stopped' ? { ...m, status: 'online' as const, speedKmh: 55, note: '55 km/h' } : m,
      )
      state.alerts.unshift({ id: `a-${Date.now()}`, title: 'Regroup requested', detail: 'Leader asked all riders to regroup at the next stop.', kind: 'info' })
    },
  },
})

/* ---------------- Notifications ----------------
 * Every notification carries its source (chat / broadcast / SOS / regroup
 * / join request / system) so the list never mixes four writers into one
 * anonymous feed (Frontend X11). The Settings notifications toggle is
 * honoured here too: when it is off, no new in-app notification is stored
 * (browser pop-ups are already gated in services/notify.ts). */
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
const storedNotifications = loadJson<NotificationItem[]>('ridesync-notifications', NOTIFICATIONS).map((n) => ({
  ...n,
  source: (n as NotificationItem).source ?? 'system',
}))
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

/* ---------------- Lifetime rider stats (demo totals) ----------------
 * Seeded from the prototype's 47 rides / 3,140 km, but no longer frozen:
 * ending a trip in this demo adds to them (recordCompletedTrip), so the
 * Home/Profile totals are real local state that changes when a ride
 * happens. They are still demo totals — the UI labels them as such —
 * because there is no real account or backend yet. */
interface LifetimeState {
  totalRides: number
  kmLogged: number
}
const storedLifetime = loadJson<LifetimeState>('ridesync-lifetime', {
  totalRides: RIDER_STATS.totalRides,
  kmLogged: RIDER_STATS.kmLogged,
})
const lifetimeSlice = createSlice({
  name: 'lifetime',
  initialState: storedLifetime,
  reducers: {
    recordCompletedTrip(state, action: PayloadAction<{ km: number }>) {
      state.totalRides += 1
      state.kmLogged += Math.max(0, Math.round(action.payload.km))
      saveJson('ridesync-lifetime', state)
    },
  },
})

/* ---------------- Emergency contacts (SOS) ----------------
 * Real contacts, added/edited/deleted in Settings and stored in
 * localStorage. Seeded EMPTY on purpose — inventing two fake contacts
 * with fake numbers would be exactly the fake-data problem this pass
 * fixes, and SOS must never claim it notified people who do not exist.
 * The SOS modal lists these contacts so the rider can see who SOS
 * would reach; in the demo they are listed, not messaged, because no
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
export const { tick, applyLocationUpdate, addChat, toggleVoice, setVoiceActive, openSos, closeSos, confirmSos, regroup } = convoySlice.actions
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

/** Stats are mock data served through React Query in Profile/Home (see services/api). */
export const mockStats = RIDER_STATS
