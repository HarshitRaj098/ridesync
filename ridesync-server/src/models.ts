import { Schema, model, type Document } from 'mongoose'

export interface UserDoc extends Document {
  name: string
  email: string
  passwordHash: string
  totalRides: number
  kmLogged: number
  safetyScore: number
  createdAt: Date
}
const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    totalRides: { type: Number, default: 0 },
    kmLogged: { type: Number, default: 0 },
    safetyScore: { type: Number, default: 100 },
  },
  { timestamps: true },
)
export const UserModel = model<UserDoc>('User', userSchema)

export interface TripDoc extends Document {
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
const tripSchema = new Schema(
  {
    // Trips use a readable string id (e.g. "manali-2026") so the frontend
    // route /trips/:id works unchanged against the seeded convoy.
    _id: { type: String, required: true },
    name: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    distanceKm: { type: Number, required: true },
    riders: { type: Number, default: 1 },
    vehicles: { type: Number, default: 1 },
    type: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    startsIn: { type: String, default: '' },
    code: { type: String, required: true, unique: true, uppercase: true },
    leaderId: { type: String, required: true },
    status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
    distanceCoveredKm: { type: Number, default: 0 },
  },
  { timestamps: true },
)
export const TripModel = model<TripDoc>('Trip', tripSchema)

export interface TripMemberDoc extends Document {
  tripId: string
  userId: string
  name: string
  initials: string
  role?: 'Leader'
  status: 'online' | 'stopped' | 'offline'
  speedKmh: number
  note: string
  lat: number
  lng: number
  color: string
}
const memberSchema = new Schema<TripMemberDoc>(
  {
    tripId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    name: { type: String, required: true },
    initials: { type: String, required: true },
    role: { type: String, enum: ['Leader'], required: false },
    status: { type: String, enum: ['online', 'stopped', 'offline'], default: 'online' },
    speedKmh: { type: Number, default: 0 },
    note: { type: String, default: '' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    color: { type: String, default: '#007BFF' },
  },
  { timestamps: true },
)
memberSchema.index({ tripId: 1, userId: 1 }, { unique: true })
export const TripMemberModel = model<TripMemberDoc>('TripMember', memberSchema)

export interface LocationDoc extends Document {
  tripId: string
  userId: string
  lat: number
  lng: number
  speedKmh: number
  at: Date
}
const locationSchema = new Schema<LocationDoc>({
  tripId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speedKmh: { type: Number, default: 0 },
  at: { type: Date, default: () => new Date() },
})
export const LocationModel = model<LocationDoc>('Location', locationSchema)

export interface ChatMessageDoc extends Document {
  tripId: string
  userId: string
  author: string
  initials: string
  text: string
  at: Date
}
const chatSchema = new Schema<ChatMessageDoc>(
  {
    tripId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    author: { type: String, required: true },
    initials: { type: String, required: true },
    text: { type: String, required: true },
    at: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
)
export const ChatMessageModel = model<ChatMessageDoc>('ChatMessage', chatSchema)

export interface AlertDoc extends Document {
  tripId: string
  title: string
  detail: string
  kind: 'warn' | 'info' | 'danger'
  at: Date
}
const alertSchema = new Schema<AlertDoc>(
  {
    tripId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    kind: { type: String, enum: ['warn', 'info', 'danger'], default: 'warn' },
    at: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
)
export const AlertModel = model<AlertDoc>('Alert', alertSchema)

export interface NotificationDoc extends Document {
  userId: string
  tripId?: string
  title: string
  detail: string
  kind: 'warn' | 'info' | 'danger' | 'ok'
  read: boolean
  at: Date
}
const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: String, required: true, index: true },
    tripId: { type: String, required: false },
    title: { type: String, required: true },
    detail: { type: String, required: true },
    kind: { type: String, enum: ['warn', 'info', 'danger', 'ok'], default: 'info' },
    read: { type: Boolean, default: false },
    at: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
)
export const NotificationModel = model<NotificationDoc>('Notification', notificationSchema)
