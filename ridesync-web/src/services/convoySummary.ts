/**
 * Convoy summary — the ONE source of truth for Leader Dashboard and
 * Convoy Dashboard counts.
 *
 * Both pages call `getConvoySummary` with the same store state and
 * render the numbers it returns, so a rider who is offline / stopped /
 * separated in one place is the same in the other, and the health score
 * is the same wherever it is read.
 *
 * Everything here is computed from real local state: the members in the
 * store (the signed-in rider, plus real members from the backend when
 * one is connected), the trip the user created or joined, and speeds
 * recorded from real GPS fixes. With no members and no ride, the
 * counts are zero and the average speed is zero — the pages show an
 * empty state instead of a health percentage for a ride that never
 * happened.
 */
import { leaderOf, separatedReason, type AlertItem, type Member, type Trip } from '../data/mockData.ts'

export interface ConvoySummary {
  /** The same member list both screens render (store `convoy.members`). */
  members: Member[]
  /** The same alerts both screens read (store `convoy.alerts`). */
  alerts: AlertItem[]
  /** The trip leader, from the members list (`role: 'Leader'`). */
  leader: Member | undefined
  /** Display name of the trip leader. */
  leaderName: string
  online: number
  stopped: number
  offline: number
  /** Riders currently separated from the convoy, with their reason each. */
  separated: Array<{ member: Member; reason: string }>
  separatedCount: number
  /** Ride health: 98% baseline, minus 3 per separated rider, floor 60.
   * Computed from the real separated count — never a fixed number. */
  healthScore: number
  /** The text must say what the number says. */
  healthText: { label: string; color: string }
  /** Average of the speeds actually recorded this ride — 0 when no
   * speed was ever recorded, not the current speed. */
  avgSpeed: number
  /** Maximum riders the creator set for this trip. */
  totalRiders: number
  /** Riders actually in the convoy (members.length). */
  namedCount: number
  /** Free spots left (rider limit minus riders in the convoy). */
  extraRiders: number
  alertsCount: number
}

export function getConvoySummary(args: {
  members: Member[]
  trip: Trip
  alerts: AlertItem[]
  speedSamples: number[]
  speedKmh: number
}): ConvoySummary {
  const { members, trip, alerts, speedSamples } = args
  const leader = leaderOf(members)
  const online = members.filter((m) => m.status === 'online').length
  const stopped = members.filter((m) => m.status === 'stopped').length
  const offline = members.filter((m) => m.status === 'offline').length
  const separated = members
    .map((m) => ({ member: m, reason: separatedReason(m, members) }))
    .filter((s): s is { member: Member; reason: string } => s.reason !== null)
  const separatedCount = separated.length
  const healthScore = Math.max(60, 98 - separatedCount * 3)
  const healthText =
    separatedCount === 0
      ? { label: '● Convoy healthy', color: 'var(--success)' }
      : healthScore >= 85
        ? { label: `● ${separatedCount} rider${separatedCount > 1 ? 's' : ''} separated — mostly healthy`, color: 'var(--warning)' }
        : { label: `● ${separatedCount} rider${separatedCount > 1 ? 's' : ''} separated — needs attention`, color: 'var(--danger)' }
  const avgSpeed =
    speedSamples.length > 0
      ? Math.round(speedSamples.reduce((a, b) => a + b, 0) / speedSamples.length)
      : 0
  return {
    members,
    alerts,
    leader,
    leaderName: getTripLeaderName(trip, members),
    online,
    stopped,
    offline,
    separated,
    separatedCount,
    healthScore,
    healthText,
    avgSpeed,
    totalRiders: trip.riders,
    namedCount: members.length,
    extraRiders: Math.max(0, trip.riders - members.length),
    alertsCount: alerts.length,
  }
}

/**
 * Who leads this trip. A trip created in Create Trip stores its leader
 * in `trip.leaderName` (the creator). Otherwise the leader is the member
 * with `role: 'Leader'` — the signed-in rider, when they lead the trip.
 */
export function getTripLeaderName(trip: Trip, members: Member[]): string {
  if (trip.leaderName && trip.leaderName.trim().length > 0) return trip.leaderName
  return leaderOf(members)?.name ?? 'No leader yet'
}

/** Names are compared case-insensitively, ignoring extra spaces and a
 * trailing full stop — so "Alex K." and "Alex K" count as the same
 * person. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.+$/, '')
}

/**
 * Is the signed-in user the leader of this trip? Local layer only: the
 * signed-in user is the leader when their account name matches the
 * trip's leader name. A user who creates a trip IS its leader. Real
 * leader enforcement (by user id, from the server) waits for Deploy —
 * a name match is all the local layer can honestly check.
 */
export function isTripLeader(
  user: { name?: string } | null,
  trip: Trip,
  members: Member[],
): boolean {
  if (!user?.name) return false
  return normalizeName(user.name) === normalizeName(getTripLeaderName(trip, members))
}
