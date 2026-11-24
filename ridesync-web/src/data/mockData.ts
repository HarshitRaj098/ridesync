/**
 * Shared data types and pure helpers for RideSync web (Track 2).
 *
 * This file contains NO seeded data. The app starts empty: there is no
 * demo trip, no demo riders, no demo stats, no demo chat or alerts. The
 * only data the app ever shows is data the user created on this device
 * (a trip they created, a trip they joined, a join request they sent,
 * an emergency contact they saved, a notification from their own
 * action) or live data from the real backend when one is configured.
 * Anything that used to be seeded here was removed on 2026-11-25 at the
 * user's request: "all are fake — remove fake data".
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
  /** Real GPS position, only when location sharing is on and the browser
   * has a fix. Undefined means "position unknown" — never invent one. */
  lat?: number
  lng?: number
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
  /** 0 means the distance was never estimated or measured — the UI must
   * say "distance not estimated yet", never invent a number. */
  distanceKm: number
  /** Maximum riders the creator set for this trip. */
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

/** Distance of a member from the convoy leader, in km (0 for the leader,
 * or when either position is unknown). */
export function distanceFromLeaderKm(member: Member, members: Member[]): number {
  const leader = leaderOf(members)
  if (!leader || member.id === leader.id) return 0
  if (member.lat === undefined || member.lng === undefined || leader.lat === undefined || leader.lng === undefined) return 0
  return haversineKm(member.lat, member.lng, leader.lat, leader.lng)
}

/**
 * Why a rider counts as separated from the convoy, or null if they are
 * riding with the group. A rider is separated when offline, stopped, or
 * more than 2 km from the leader (real GPS positions only — a rider
 * whose position is unknown is never called separated).
 */
export function separatedReason(member: Member, members: Member[]): string | null {
  if (member.role === 'Leader') return null
  if (member.status === 'offline') return 'Offline — last known position shown'
  if (member.status === 'stopped') return 'Stopped — not moving with the convoy'
  const d = distanceFromLeaderKm(member, members)
  if (d > 2) return `Separated — ${d.toFixed(1)} km from the leader`
  return null
}

/** Live note for a member row, from real state only — never a frozen note. */
export function liveMemberNote(member: Member): string {
  if (member.status === 'online') {
    return member.speedKmh > 0 ? `${member.speedKmh} km/h` : 'Riding — speed not available'
  }
  if (member.status === 'stopped') return 'Stopped'
  return 'Offline'
}

export function formatRideTime(totalSeconds: number): string {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}
