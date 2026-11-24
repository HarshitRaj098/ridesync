import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import {
  ALERTS,
  CHAT_MESSAGES,
  CURRENT_TRIP,
  MEMBERS,
  NOTIFICATIONS,
  RIDER_STATS,
  type AlertItem,
  type ChatMessage,
  type Member,
  type Trip,
} from '../data/mockData.ts'

/* ---------------- Auth ---------------- */
export interface AuthUser {
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
    trips: [CURRENT_TRIP],
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

/* ---------------- Convoy (live) ---------------- */
interface ConvoyState {
  members: Member[]
  chat: ChatMessage[]
  alerts: AlertItem[]
  rideSeconds: number
  speedKmh: number
  distanceCoveredKm: number
  voiceActive: boolean
  sosActive: boolean
  sosSent: boolean
}
const convoySlice = createSlice({
  name: 'convoy',
  initialState: {
    members: MEMBERS,
    chat: CHAT_MESSAGES,
    alerts: ALERTS,
    rideSeconds: 6128, // 01:42:08, matching the prototype timer
    speedKmh: 62,
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
      state.members = state.members.map((m) =>
        m.status === 'online'
          ? { ...m, lat: m.lat + (Math.random() - 0.5) * 0.0006, lng: m.lng + (Math.random() - 0.5) * 0.0006, speedKmh: Math.max(45, Math.min(75, m.speedKmh + Math.round((Math.random() - 0.5) * 4))) }
          : m,
      )
    },
    applyLocationUpdate(state, action: PayloadAction<Member[]>) {
      state.members = action.payload
    },
    addChat(state, action: PayloadAction<{ text: string; author: string; initials: string }>) {
      state.chat.push({ id: `c-${Date.now()}`, ...action.payload })
    },
    toggleVoice(state) {
      state.voiceActive = !state.voiceActive
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
      state.alerts.unshift({ id: `a-${Date.now()}`, title: 'SOS sent', detail: 'Your live location was broadcast to the convoy leader and emergency contacts.', kind: 'danger' })
    },
    regroup(state) {
      state.members = state.members.map((m) =>
        m.status === 'stopped' ? { ...m, status: 'online' as const, speedKmh: 55, note: '55 km/h · regrouping with convoy' } : m,
      )
      state.alerts.unshift({ id: `a-${Date.now()}`, title: 'Regroup requested', detail: 'Leader asked all riders to regroup at the next stop.', kind: 'info' })
    },
  },
})

/* ---------------- Notifications ---------------- */
interface NotificationsState {
  items: typeof NOTIFICATIONS
  unreadCount: number
}
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: NOTIFICATIONS,
    unreadCount: NOTIFICATIONS.filter((n) => n.unread).length,
  } as NotificationsState,
  reducers: {
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, unread: false }))
      state.unreadCount = 0
    },
    markRead(state, action: PayloadAction<string>) {
      state.items = state.items.map((n) => (n.id === action.payload ? { ...n, unread: false } : n))
      state.unreadCount = state.items.filter((n) => n.unread).length
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
const settingsSlice = createSlice({
  name: 'settings',
  initialState: { darkMode: true, notificationsEnabled: true, locationSharing: true, voiceEnabled: true } as SettingsState,
  reducers: {
    toggleSetting(state, action: PayloadAction<keyof SettingsState>) {
      state[action.payload] = !state[action.payload]
    },
  },
})

export const { login, logout } = authSlice.actions
export const { createTrip, joinTrip, selectTrip } = tripSlice.actions
export const { tick, applyLocationUpdate, addChat, toggleVoice, openSos, closeSos, confirmSos, regroup } = convoySlice.actions
export const { markAllRead, markRead } = notificationsSlice.actions
export const { toggleSetting } = settingsSlice.actions

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    trip: tripSlice.reducer,
    convoy: convoySlice.reducer,
    notifications: notificationsSlice.reducer,
    settings: settingsSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

/** Stats are mock data served through React Query in Profile/Home (see services/api). */
export const mockStats = RIDER_STATS
