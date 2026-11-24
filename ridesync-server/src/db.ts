/**
 * Data layer.
 *
 * One `Store` interface is used by every route and by the Socket.IO layer.
 * - If MONGODB_URI is set, `MongoStore` persists everything in MongoDB.
 * - Otherwise `MemoryStore` keeps everything in process memory, seeded with
 *   the Manali convoy, so `npm run dev` works with no accounts at all.
 * The mode is logged on boot and reported by GET /health.
 */
import mongoose from 'mongoose'
import { config } from './config'
import { hashPassword } from './auth'
import {
  DEMO_USER,
  SEED_ALERTS,
  SEED_CHAT,
  SEED_MEMBERS,
  SEED_NOTIFICATIONS,
  SEED_STATS,
  SEED_TRIP,
  initialsOf,
} from './seedData'
import {
  AlertModel,
  ChatMessageModel,
  LocationModel,
  NotificationModel,
  TripMemberModel,
  TripModel,
  UserModel,
} from './models'

export type MemberStatus = 'online' | 'stopped' | 'offline'
export type AlertKind = 'warn' | 'info' | 'danger'
export type NotificationKind = 'warn' | 'info' | 'danger' | 'ok'

export interface UserRecord {
  id: string
  name: string
  email: string
  passwordHash: string
  totalRides: number
  kmLogged: number
  safetyScore: number
}
export interface TripRecord {
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
  leaderId: string
  status: 'upcoming' | 'live' | 'completed'
  distanceCoveredKm: number
}
export interface MemberRecord {
  id: string
  tripId: string
  userId: string
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
export interface ChatRecord {
  id: string
  tripId: string
  userId: string
  author: string
  initials: string
  text: string
  at: string
}
export interface AlertRecord {
  id: string
  tripId: string
  title: string
  detail: string
  kind: AlertKind
  at: string
}
export interface NotificationRecord {
  id: string
  userId: string
  tripId?: string
  title: string
  detail: string
  kind: NotificationKind
  read: boolean
  at: string
}
export interface LocationRecord {
  tripId: string
  userId: string
  lat: number
  lng: number
  speedKmh: number
  at: string
}

export interface CreateTripInput {
  id?: string
  code?: string
  name: string
  from: string
  to: string
  distanceKm: number
  riders?: number
  vehicles?: number
  type?: 'Public' | 'Private'
  date: string
  startTime: string
}

export interface Store {
  mode: 'memory' | 'mongo'
  createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord>
  findUserByEmail(email: string): Promise<UserRecord | null>
  findUserById(id: string): Promise<UserRecord | null>
  createTrip(input: CreateTripInput, leaderId: string): Promise<TripRecord>
  listTrips(): Promise<TripRecord[]>
  getTrip(id: string): Promise<TripRecord | null>
  getTripByCode(code: string): Promise<TripRecord | null>
  updateTrip(id: string, patch: Partial<TripRecord>): Promise<TripRecord | null>
  listTripsForUser(userId: string): Promise<TripRecord[]>
  addMember(tripId: string, member: Omit<MemberRecord, 'id' | 'tripId'>): Promise<MemberRecord>
  listMembers(tripId: string): Promise<MemberRecord[]>
  getMember(tripId: string, userId: string): Promise<MemberRecord | null>
  updateMember(tripId: string, userId: string, patch: Partial<MemberRecord>): Promise<MemberRecord | null>
  saveLocation(loc: Omit<LocationRecord, 'at'>): Promise<LocationRecord>
  addChat(tripId: string, chat: Omit<ChatRecord, 'id' | 'tripId' | 'at'>): Promise<ChatRecord>
  listChat(tripId: string): Promise<ChatRecord[]>
  addAlert(tripId: string, alert: Omit<AlertRecord, 'id' | 'tripId' | 'at'>): Promise<AlertRecord>
  listAlerts(tripId: string): Promise<AlertRecord[]>
  addNotification(n: Omit<NotificationRecord, 'id' | 'read' | 'at'>): Promise<NotificationRecord>
  listNotifications(userId: string): Promise<NotificationRecord[]>
  markNotificationRead(userId: string, id: string): Promise<NotificationRecord | null>
  countUsers(): Promise<number>
  countTrips(): Promise<number>
}

let uidCounter = 0
export function newId(prefix: string): string {
  uidCounter += 1
  return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

/* ---------------- In-memory store ---------------- */

export class MemoryStore implements Store {
  mode = 'memory' as const
  private users = new Map<string, UserRecord>()
  private trips = new Map<string, TripRecord>()
  private members = new Map<string, MemberRecord>() // key: tripId:userId
  private locations = new Map<string, LocationRecord>()
  private chat = new Map<string, ChatRecord[]>()
  private alerts = new Map<string, AlertRecord[]>()
  private notifications = new Map<string, NotificationRecord[]>()

  async createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const user: UserRecord = {
      id: newId('u'),
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      totalRides: 0,
      kmLogged: 0,
      safetyScore: 100,
    }
    this.users.set(user.id, user)
    return user
  }
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const needle = email.toLowerCase()
    for (const u of this.users.values()) if (u.email === needle) return u
    return null
  }
  async findUserById(id: string): Promise<UserRecord | null> {
    return this.users.get(id) ?? null
  }
  async createTrip(input: CreateTripInput, leaderId: string): Promise<TripRecord> {
    const trip: TripRecord = {
      id: input.id ?? newId('t'),
      name: input.name,
      from: input.from,
      to: input.to,
      distanceKm: input.distanceKm,
      riders: input.riders ?? 1,
      vehicles: input.vehicles ?? 1,
      type: input.type ?? 'Public',
      date: input.date,
      startTime: input.startTime,
      startsIn: '',
      code: input.code ?? Math.random().toString(36).slice(2, 8).toUpperCase(),
      leaderId,
      status: 'upcoming',
      distanceCoveredKm: 0,
    }
    this.trips.set(trip.id, trip)
    return trip
  }
  async listTrips(): Promise<TripRecord[]> {
    return [...this.trips.values()]
  }
  async getTrip(id: string): Promise<TripRecord | null> {
    return this.trips.get(id) ?? null
  }
  async getTripByCode(code: string): Promise<TripRecord | null> {
    const needle = code.toUpperCase()
    for (const t of this.trips.values()) if (t.code === needle) return t
    return null
  }
  async updateTrip(id: string, patch: Partial<TripRecord>): Promise<TripRecord | null> {
    const trip = this.trips.get(id)
    if (!trip) return null
    Object.assign(trip, patch)
    return trip
  }
  async listTripsForUser(userId: string): Promise<TripRecord[]> {
    const tripIds = new Set<string>()
    for (const m of this.members.values()) if (m.userId === userId) tripIds.add(m.tripId)
    return [...this.trips.values()].filter((t) => tripIds.has(t.id))
  }
  async addMember(tripId: string, member: Omit<MemberRecord, 'id' | 'tripId'>): Promise<MemberRecord> {
    const rec: MemberRecord = { id: newId('m'), tripId, ...member }
    this.members.set(`${tripId}:${member.userId}`, rec)
    return rec
  }
  async listMembers(tripId: string): Promise<MemberRecord[]> {
    return [...this.members.values()].filter((m) => m.tripId === tripId)
  }
  async getMember(tripId: string, userId: string): Promise<MemberRecord | null> {
    return this.members.get(`${tripId}:${userId}`) ?? null
  }
  async updateMember(tripId: string, userId: string, patch: Partial<MemberRecord>): Promise<MemberRecord | null> {
    const m = this.members.get(`${tripId}:${userId}`)
    if (!m) return null
    Object.assign(m, patch)
    return m
  }
  async saveLocation(loc: Omit<LocationRecord, 'at'>): Promise<LocationRecord> {
    const rec: LocationRecord = { ...loc, at: new Date().toISOString() }
    this.locations.set(`${loc.tripId}:${loc.userId}`, rec)
    return rec
  }
  async addChat(tripId: string, chat: Omit<ChatRecord, 'id' | 'tripId' | 'at'>): Promise<ChatRecord> {
    const rec: ChatRecord = { id: newId('c'), tripId, ...chat, at: new Date().toISOString() }
    const list = this.chat.get(tripId) ?? []
    list.push(rec)
    this.chat.set(tripId, list)
    return rec
  }
  async listChat(tripId: string): Promise<ChatRecord[]> {
    return this.chat.get(tripId) ?? []
  }
  async addAlert(tripId: string, alert: Omit<AlertRecord, 'id' | 'tripId' | 'at'>): Promise<AlertRecord> {
    const rec: AlertRecord = { id: newId('a'), tripId, ...alert, at: new Date().toISOString() }
    const list = this.alerts.get(tripId) ?? []
    list.push(rec)
    this.alerts.set(tripId, list)
    return rec
  }
  async listAlerts(tripId: string): Promise<AlertRecord[]> {
    return this.alerts.get(tripId) ?? []
  }
  async addNotification(n: Omit<NotificationRecord, 'id' | 'read' | 'at'>): Promise<NotificationRecord> {
    const rec: NotificationRecord = { id: newId('n'), ...n, read: false, at: new Date().toISOString() }
    const list = this.notifications.get(n.userId) ?? []
    list.unshift(rec)
    this.notifications.set(n.userId, list)
    return rec
  }
  async listNotifications(userId: string): Promise<NotificationRecord[]> {
    return this.notifications.get(userId) ?? []
  }
  async markNotificationRead(userId: string, id: string): Promise<NotificationRecord | null> {
    const list = this.notifications.get(userId) ?? []
    const n = list.find((x) => x.id === id)
    if (!n) return null
    n.read = true
    return n
  }
  async countUsers(): Promise<number> {
    return this.users.size
  }
  async countTrips(): Promise<number> {
    return this.trips.size
  }

  /** Seed helpers used by seedStore() — public so the seeder can reuse them. */
  putTrip(trip: TripRecord): void {
    this.trips.set(trip.id, trip)
  }
  putUser(user: UserRecord): void {
    this.users.set(user.id, user)
  }
}

/* ---------------- MongoDB store ---------------- */

function userFromDoc(d: { _id: unknown; name: string; email: string; passwordHash: string; totalRides: number; kmLogged: number; safetyScore: number }): UserRecord {
  return { id: String(d._id), name: d.name, email: d.email, passwordHash: d.passwordHash, totalRides: d.totalRides, kmLogged: d.kmLogged, safetyScore: d.safetyScore }
}
function tripFromDoc(d: {
  _id: unknown; name: string; from: string; to: string; distanceKm: number; riders: number; vehicles: number;
  type: 'Public' | 'Private'; date: string; startTime: string; startsIn: string; code: string; leaderId: string;
  status: 'upcoming' | 'live' | 'completed'; distanceCoveredKm: number
}): TripRecord {
  return {
    id: String(d._id), name: d.name, from: d.from, to: d.to, distanceKm: d.distanceKm, riders: d.riders,
    vehicles: d.vehicles, type: d.type, date: d.date, startTime: d.startTime, startsIn: d.startsIn,
    code: d.code, leaderId: d.leaderId, status: d.status, distanceCoveredKm: d.distanceCoveredKm,
  }
}
function memberFromDoc(d: {
  _id: unknown; tripId: string; userId: string; name: string; initials: string; role?: 'Leader';
  status: MemberStatus; speedKmh: number; note: string; lat: number; lng: number; color: string
}): MemberRecord {
  return { id: String(d._id), tripId: d.tripId, userId: d.userId, name: d.name, initials: d.initials, role: d.role, status: d.status, speedKmh: d.speedKmh, note: d.note, lat: d.lat, lng: d.lng, color: d.color }
}

export class MongoStore implements Store {
  mode = 'mongo' as const
  async createUser(input: { name: string; email: string; passwordHash: string }): Promise<UserRecord> {
    const doc = await UserModel.create({ name: input.name, email: input.email.toLowerCase(), passwordHash: input.passwordHash })
    return userFromDoc(doc)
  }
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const doc = await UserModel.findOne({ email: email.toLowerCase() })
    return doc ? userFromDoc(doc) : null
  }
  async findUserById(id: string): Promise<UserRecord | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null
    const doc = await UserModel.findById(id)
    return doc ? userFromDoc(doc) : null
  }
  async createTrip(input: CreateTripInput, leaderId: string): Promise<TripRecord> {
    const doc = await TripModel.create({ _id: input.id ?? newId('t'), ...input, code: input.code ?? Math.random().toString(36).slice(2, 8).toUpperCase(), leaderId, status: 'upcoming', distanceCoveredKm: 0 })
    return tripFromDoc(doc)
  }
  async listTrips(): Promise<TripRecord[]> {
    return (await TripModel.find().sort({ createdAt: -1 })).map(tripFromDoc)
  }
  async getTrip(id: string): Promise<TripRecord | null> {
    const doc = await TripModel.findById(id)
    return doc ? tripFromDoc(doc) : null
  }
  async getTripByCode(code: string): Promise<TripRecord | null> {
    const doc = await TripModel.findOne({ code: code.toUpperCase() })
    return doc ? tripFromDoc(doc) : null
  }
  async updateTrip(id: string, patch: Partial<TripRecord>): Promise<TripRecord | null> {
    const doc = await TripModel.findByIdAndUpdate(id, patch, { new: true })
    return doc ? tripFromDoc(doc) : null
  }
  async listTripsForUser(userId: string): Promise<TripRecord[]> {
    const members = await TripMemberModel.find({ userId })
    const ids = members.map((m) => m.tripId)
    return (await TripModel.find({ _id: { $in: ids } })).map(tripFromDoc)
  }
  async addMember(tripId: string, member: Omit<MemberRecord, 'id' | 'tripId'>): Promise<MemberRecord> {
    const doc = await TripMemberModel.create({ tripId, ...member })
    return memberFromDoc(doc)
  }
  async listMembers(tripId: string): Promise<MemberRecord[]> {
    return (await TripMemberModel.find({ tripId })).map(memberFromDoc)
  }
  async getMember(tripId: string, userId: string): Promise<MemberRecord | null> {
    const doc = await TripMemberModel.findOne({ tripId, userId })
    return doc ? memberFromDoc(doc) : null
  }
  async updateMember(tripId: string, userId: string, patch: Partial<MemberRecord>): Promise<MemberRecord | null> {
    const doc = await TripMemberModel.findOneAndUpdate({ tripId, userId }, patch, { new: true })
    return doc ? memberFromDoc(doc) : null
  }
  async saveLocation(loc: Omit<LocationRecord, 'at'>): Promise<LocationRecord> {
    const doc = await LocationModel.create({ ...loc, at: new Date() })
    return { tripId: doc.tripId, userId: doc.userId, lat: doc.lat, lng: doc.lng, speedKmh: doc.speedKmh, at: doc.at.toISOString() }
  }
  async addChat(tripId: string, chat: Omit<ChatRecord, 'id' | 'tripId' | 'at'>): Promise<ChatRecord> {
    const doc = await ChatMessageModel.create({ tripId, ...chat, at: new Date() })
    return { id: String(doc._id), tripId, userId: doc.userId, author: doc.author, initials: doc.initials, text: doc.text, at: doc.at.toISOString() }
  }
  async listChat(tripId: string): Promise<ChatRecord[]> {
    const docs = await ChatMessageModel.find({ tripId }).sort({ at: 1 })
    return docs.map((d) => ({ id: String(d._id), tripId, userId: d.userId, author: d.author, initials: d.initials, text: d.text, at: d.at.toISOString() }))
  }
  async addAlert(tripId: string, alert: Omit<AlertRecord, 'id' | 'tripId' | 'at'>): Promise<AlertRecord> {
    const doc = await AlertModel.create({ tripId, ...alert, at: new Date() })
    return { id: String(doc._id), tripId, title: doc.title, detail: doc.detail, kind: doc.kind, at: doc.at.toISOString() }
  }
  async listAlerts(tripId: string): Promise<AlertRecord[]> {
    const docs = await AlertModel.find({ tripId }).sort({ at: -1 })
    return docs.map((d) => ({ id: String(d._id), tripId, title: d.title, detail: d.detail, kind: d.kind, at: d.at.toISOString() }))
  }
  async addNotification(n: Omit<NotificationRecord, 'id' | 'read' | 'at'>): Promise<NotificationRecord> {
    const doc = await NotificationModel.create({ ...n, read: false, at: new Date() })
    return { id: String(doc._id), userId: doc.userId, tripId: doc.tripId, title: doc.title, detail: doc.detail, kind: doc.kind, read: doc.read, at: doc.at.toISOString() }
  }
  async listNotifications(userId: string): Promise<NotificationRecord[]> {
    const docs = await NotificationModel.find({ userId }).sort({ at: -1 })
    return docs.map((d) => ({ id: String(d._id), userId: d.userId, tripId: d.tripId, title: d.title, detail: d.detail, kind: d.kind, read: d.read, at: d.at.toISOString() }))
  }
  async markNotificationRead(userId: string, id: string): Promise<NotificationRecord | null> {
    const doc = await NotificationModel.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true })
    if (!doc) return null
    return { id: String(doc._id), userId: doc.userId, tripId: doc.tripId, title: doc.title, detail: doc.detail, kind: doc.kind, read: doc.read, at: doc.at.toISOString() }
  }
  async countUsers(): Promise<number> {
    return UserModel.countDocuments()
  }
  async countTrips(): Promise<number> {
    return TripModel.countDocuments()
  }
}

/* ---------------- Init + seed ---------------- */

let storeInstance: Store | null = null

export async function initStore(): Promise<Store> {
  if (storeInstance) return storeInstance
  if (config.mongodbUri) {
    await mongoose.connect(config.mongodbUri)
    storeInstance = new MongoStore()
    console.log('[ridesync] MongoDB connected')
  } else {
    storeInstance = new MemoryStore()
    console.log('[ridesync] No MONGODB_URI — running in MEMORY mode (nothing is persisted)')
    await seedStore(storeInstance, { force: true })
  }
  return storeInstance
}

export function getStore(): Store {
  if (!storeInstance) throw new Error('Store not initialised — call initStore() first')
  return storeInstance
}

/**
 * Create the demo user + Manali convoy + members + chat + alerts +
 * notifications. Idempotent: skips if the demo user / trip already exist.
 * Returns the demo user and trip.
 */
export async function seedStore(store: Store, opts: { force?: boolean } = {}): Promise<{ user: UserRecord; trip: TripRecord }> {
  const existingUser = await store.findUserByEmail(DEMO_USER.email)
  const user =
    existingUser ??
    (await store.createUser({ name: DEMO_USER.name, email: DEMO_USER.email, passwordHash: await hashPassword(DEMO_USER.password) }))
  if (existingUser && !opts.force) {
    // Refresh demo stats on re-seed.
    const trip = await store.getTripByCode(SEED_TRIP.code)
    if (trip) return { user, trip }
  }
  // Give the demo user the documented stats.
  if ('putUser' in store && typeof (store as MemoryStore).putUser === 'function') {
    const u = await store.findUserById(user.id)
    if (u) {
      u.totalRides = SEED_STATS.totalRides
      u.kmLogged = SEED_STATS.kmLogged
      u.safetyScore = SEED_STATS.safetyScore
    }
  } else if (store.mode === 'mongo') {
    await UserModel.findByIdAndUpdate(user.id, { totalRides: SEED_STATS.totalRides, kmLogged: SEED_STATS.kmLogged, safetyScore: SEED_STATS.safetyScore })
  }

  let trip = await store.getTripByCode(SEED_TRIP.code)
  if (!trip) {
    if (store.mode === 'memory') {
      const mem = store as MemoryStore
      const rec: TripRecord = {
        id: SEED_TRIP.id,
        name: SEED_TRIP.name,
        from: SEED_TRIP.from,
        to: SEED_TRIP.to,
        distanceKm: SEED_TRIP.distanceKm,
        riders: SEED_TRIP.riders,
        vehicles: SEED_TRIP.vehicles,
        type: SEED_TRIP.type,
        date: SEED_TRIP.date,
        startTime: SEED_TRIP.startTime,
        startsIn: SEED_TRIP.startsIn,
        code: SEED_TRIP.code,
        leaderId: 'seed-rohit',
        status: 'live',
        distanceCoveredKm: 214,
      }
      mem.putTrip(rec)
      trip = rec
    } else {
      trip = await store.createTrip(
        { id: SEED_TRIP.id, code: SEED_TRIP.code, name: SEED_TRIP.name, from: SEED_TRIP.from, to: SEED_TRIP.to, distanceKm: SEED_TRIP.distanceKm, riders: SEED_TRIP.riders, vehicles: SEED_TRIP.vehicles, type: SEED_TRIP.type, date: SEED_TRIP.date, startTime: SEED_TRIP.startTime },
        'seed-rohit',
      )
      await store.updateTrip(trip.id, { startsIn: SEED_TRIP.startsIn, status: 'live', distanceCoveredKm: 214 })
      trip = (await store.getTrip(trip.id)) ?? trip
    }
    for (const m of SEED_MEMBERS) {
      await store.addMember(trip.id, {
        userId: `seed-${m.id}`,
        name: m.name,
        initials: initialsOf(m.name),
        role: m.role,
        status: m.status,
        speedKmh: m.speedKmh,
        note: m.note,
        lat: m.lat,
        lng: m.lng,
        color: m.color,
      })
    }
    for (const c of SEED_CHAT) {
      await store.addChat(trip.id, { userId: 'seed-rohit', author: c.author, initials: initialsOf(c.author.replace(' (Leader)', '')), text: c.text })
    }
    for (const a of SEED_ALERTS) {
      await store.addAlert(trip.id, { title: a.title, detail: a.detail, kind: a.kind })
    }
    for (const n of SEED_NOTIFICATIONS) {
      await store.addNotification({ userId: user.id, tripId: trip.id, title: n.title, detail: n.detail, kind: n.kind })
    }
  }
  return { user, trip }
}
