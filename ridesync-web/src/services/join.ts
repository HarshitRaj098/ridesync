/**
 * Shared join logic — the one place every way into a trip goes through.
 * Code, invite link, QR and Request all resolve here, so Join Trip,
 * Create Trip, the Trip Lobby and the Leader Dashboard can never drift
 * apart again (Frontend X5).
 *
 * Local layer only: everything is resolved against the trips in the Redux
 * store and persisted in localStorage. The real layer (leader approves a
 * stored request, capacity check) waits for Deploy + the request/approve
 * endpoint. Nothing here pretends a server call happened.
 */
import type { Trip } from '../data/mockData.ts'

/** Trip codes are 6 uppercase letters/digits, e.g. K7M2P9. */
export const CODE_RE = /^[A-Z0-9]{6}$/

/** Base of an invite link: the origin the app is actually served from. */
export function inviteOrigin(): string {
  return typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://ridesync-ten.vercel.app'
}

/** Canonical invite link for a trip: /trips/join?code=XXXXXX */
export function buildInviteLink(trip: { code: string }): string {
  return `${inviteOrigin()}/trips/join?code=${trip.code.toUpperCase()}`
}

/** Copyable text shown next to the link: link + code, so a rider who only
 * gets the code can still join by hand. */
export function buildInviteText(trip: { name: string; code: string }): string {
  return `Join ${trip.name} on RideSync: ${buildInviteLink(trip)} (code ${trip.code.toUpperCase()})`
}

/** Generate a new 6-character trip code (no 0/O/1/I, so it reads clearly). */
export function generateTripCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export type ParsedInvite =
  | { ok: true; code: string }
  | { ok: false; error: string }

/**
 * Pull a trip code out of whatever the rider pasted. Accepts:
 * - a bare code: `K7M2P9`
 * - a full link: `https://ridesync-ten.vercel.app/trips/join?code=K7M2P9`
 * - a path link: `https://ridesync.app/join/K7M2P9` or `/trips/join/K7M2P9`
 * - a link with the code in the query under `code`
 * Anything else is an inline error, never a silent join.
 */
export function parseInviteLink(raw: string): ParsedInvite {
  const value = raw.trim()
  if (!value) return { ok: false, error: 'Paste an invite link or enter a trip code.' }
  const bare = value.toUpperCase()
  if (CODE_RE.test(bare)) return { ok: true, code: bare }

  let url: URL
  try {
    // Allow pasting a bare path (/trips/join?code=…) as well as a full URL.
    url = new URL(value.startsWith('/') ? `${inviteOrigin()}${value}` : value)
  } catch {
    return { ok: false, error: 'That does not look like a RideSync invite link or a trip code.' }
  }
  const fromQuery = (url.searchParams.get('code') ?? '').trim().toUpperCase()
  if (fromQuery) {
    if (CODE_RE.test(fromQuery)) return { ok: true, code: fromQuery }
    return { ok: false, error: `The link carries code “${fromQuery}”, which is not a valid 6-character trip code.` }
  }
  const segments = url.pathname.split('/').filter(Boolean)
  const last = (segments[segments.length - 1] ?? '').toUpperCase()
  if (CODE_RE.test(last)) return { ok: true, code: last }
  return { ok: false, error: 'That link has no trip code in it. Check the link and try again.' }
}

export type JoinResolution =
  | { ok: true; trip: Trip }
  | { ok: false; error: string }

/**
 * Resolve a code against the trips the app knows. Blank and wrong codes
 * are rejected with a clear error — blank never joins a trip.
 */
export function resolveJoinCode(code: string, trips: Trip[]): JoinResolution {
  const entered = code.trim().toUpperCase()
  if (!entered) return { ok: false, error: 'Enter a trip code.' }
  if (!CODE_RE.test(entered)) {
    return { ok: false, error: `“${entered}” is not a valid trip code. Codes are 6 characters, e.g. K7M2P9.` }
  }
  const match = trips.find((t) => t.code.toUpperCase() === entered)
  if (!match) {
    return { ok: false, error: `No trip found with code “${entered}”. Check the code and try again.` }
  }
  return { ok: true, trip: match }
}

/**
 * One entry point for joining: code field, invite link, or both.
 * A link, when present, is parsed and wins over the code field.
 */
export function attemptJoin(input: { code: string; link: string }, trips: Trip[]): JoinResolution {
  if (input.link.trim()) {
    const parsed = parseInviteLink(input.link)
    if (!parsed.ok) return parsed
    return resolveJoinCode(parsed.code, trips)
  }
  return resolveJoinCode(input.code, trips)
}

/** Copy text to the clipboard. Falls back to a hidden textarea + execCommand
 * for browsers without the async Clipboard API; returns false (not a toast)
 * when nothing worked, so the caller can show the link to copy by hand. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to the textarea fallback below.
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
