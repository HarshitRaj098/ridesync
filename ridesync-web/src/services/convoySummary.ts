/**
 * Convoy summary — the ONE source of truth for Leader Dashboard and
 * Convoy Dashboard counts (Frontend X2 / REVIEW B8).
 *
 * Before this module, Leader and Convoy each computed their own counts
 * from the same Redux slice and showed different denominators for the
 * same riders ("Online 3/5" on Leader vs "Total Riders 12" next to it,
 * "Members · 12" on Convoy). Both pages now call `getConvoySummary`
 * with the same store state and render the numbers it returns, so a
 * rider who is offline / stopped / separated in one place is the same
 * in the other, and the health score is the same wherever it is read.
 *
 * This is the mock layer: member positions, speeds and alerts are the
 * simulated convoy state in the store. The real layer (server-computed
 * counts, leader approval, capacity check) waits for Deploy.
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
  /** Ride health: 98% safety baseline, minus 3 per separated rider, floor 60. */
  healthScore: number
  /** The text must say what the number says — it used to always read
   * "Convoy healthy" even when riders were separated and the score fell. */
  healthText: { label: string; color: string }
  /** Real average of the speeds recorded this ride — not the current speed. */
  avgSpeed: number
  /** Riders on the trip in total (trip.riders — 12 for Manali). */
  totalRiders: number
  /** Named riders tracked live (members.length — 5 for Manali). */
  namedCount: number
  /** Riders on the trip beyond the named ones shown live. */
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
  const { members, trip, alerts, speedSamples, speedKmh } = args
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
      : speedKmh
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
 * in `trip.leaderName` (the creator, or a named rider). The seeded
 * Manali trip stores none, so its leader is the member with
 * `role: 'Leader'` — Rohit Verma.
 */
export function getTripLeaderName(trip: Trip, members: Member[]): string {
  if (trip.leaderName && trip.leaderName.trim().length > 0) return trip.leaderName
  return leaderOf(members)?.name ?? 'Unknown'
}

/** Names are compared case-insensitively, ignoring extra spaces and a
 * trailing full stop — so "Rohit V." (Create Trip's short option) and
 * "Rohit V" (the same name from an email login) count as the same person. */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\.+$/, '')
}

/**
 * Is the signed-in user the leader of this trip? Mock layer only: the
 * signed-in user is the leader only when their (mock) account name
 * matches the trip's leader name. The seeded Manali leader is Rohit
 * Verma, so a rider signed in as anyone else — e.g. Harshit — is NOT
 * the leader of Manali and sees the read-only Leader Dashboard. A user
 * who creates a trip and picks "You (Trip Creator)" as its leader IS
 * its leader, and sees the controls. Real leader enforcement (by user
 * id, from the server) waits for Deploy — a name match is all the mock
 * layer can honestly check.
 */
export function isTripLeader(
  user: { name?: string } | null,
  trip: Trip,
  members: Member[],
): boolean {
  if (!user?.name) return false
  return normalizeName(user.name) === normalizeName(getTripLeaderName(trip, members))
}
