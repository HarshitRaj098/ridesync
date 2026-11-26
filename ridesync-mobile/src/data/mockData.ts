/**
 * Shared data types + pure helpers for the mobile app.
 *
 * FAKE DATA REMOVED (2026-11-26): this file used to seed a fake trip
 * ("Manali Mountain Convoy", Bhopal → Manali, 612 km, 12 riders, code
 * A1B2C9), five fake riders (Rohit Verma, Ananya Kapoor, Puneet Sharma,
 * Tanya Mehra, Sameer Khan), fake stats (47 rides / 3,140 km / 98%
 * safety), fake chat, alerts, notifications and nearby trips. All of it
 * was deleted. Nothing in this file is a seeded value any more — only
 * types and pure functions. Real data is created by the user on this
 * device (a trip they create, a message they send) and lives in Redux
 * for the session; the rider's own position and speed are real GPS.
 *
 * MAP_CENTER is the one exception to "no seeded values": it is a neutral
 * default map view (India-wide) used ONLY while there is no GPS fix. It
 * is never presented as a trip location or a rider position.
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

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: 'warning' | 'weather' | 'info';
}

/** A trip created on this device. `distanceKm` is null until estimated. */
export interface Trip {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number | null;
  riderLimit: number;
  type: 'Public' | 'Private';
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM (24h) */
  startTime: string;
  code: string;
  inviteLink: string;
  leaderName: string;
}

/** Neutral default map view (India) — used ONLY while there is no GPS fix. */
export const MAP_CENTER = { latitude: 23.2599, longitude: 77.4126 };

/** Trip codes are 6 uppercase letters/digits, e.g. K7M2P9. */
export const CODE_RE = /^[A-Z0-9]{6}$/;

/** Generate a new 6-character trip code (no 0/O/1/I, so it reads clearly). */
export function generateTripCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** Canonical invite link for a trip code. */
export function buildInviteLink(code: string): string {
  return `https://ridesync.app/join/${code.toUpperCase()}`;
}

/** Copyable text: link + code, so a rider who only gets the code can still join by hand. */
export function buildInviteText(trip: { name: string; code: string }): string {
  return `Join ${trip.name} on RideSync: ${buildInviteLink(trip.code)} (code ${trip.code.toUpperCase()})`;
}

export type ParsedInvite = { ok: true; code: string } | { ok: false; error: string };

/**
 * Pull a trip code out of whatever the rider pasted. Accepts a bare code
 * (`K7M2P9`), a full link (`https://ridesync.app/join/K7M2P9` or
 * `…/trips/join?code=K7M2P9`), or a bare path. Anything else is an error,
 * never a silent join.
 */
export function parseInviteCode(raw: string): ParsedInvite {
  const value = raw.trim();
  if (!value) return { ok: false, error: 'Enter a trip code or paste an invite link.' };
  const bare = value.toUpperCase();
  if (CODE_RE.test(bare)) return { ok: true, code: bare };

  let url: URL;
  try {
    url = new URL(value.startsWith('/') ? `https://ridesync.app${value}` : value);
  } catch {
    return { ok: false, error: 'That does not look like a RideSync invite link or a trip code.' };
  }
  const fromQuery = (url.searchParams.get('code') ?? '').trim().toUpperCase();
  if (fromQuery) {
    if (CODE_RE.test(fromQuery)) return { ok: true, code: fromQuery };
    return { ok: false, error: `The link carries code “${fromQuery}”, which is not a valid 6-character trip code.` };
  }
  const segments = url.pathname.split('/').filter(Boolean);
  const last = (segments[segments.length - 1] ?? '').toUpperCase();
  if (CODE_RE.test(last)) return { ok: true, code: last };
  return { ok: false, error: 'That link has no trip code in it. Check the link and try again.' };
}

/** Initials from a typed name, e.g. "Harshit Raj" → "HR". */
export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
  return (first + second).toUpperCase();
}

/** A display name derived from a typed email, e.g. "harshit.raj@…" → "Harshit Raj". */
export function nameFromEmail(email: string): string {
  const local = email.trim().split('@')[0] ?? '';
  const words = local.split(/[._-]+/).filter(Boolean);
  if (words.length === 0) return 'Rider';
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Countdown label counted from the trip's own date + start time, e.g.
 * "Starts in 24 min", "Starts in 2h 15m", "Starts 2026-07-25 06:00",
 * or "Start time passed".
 */
export function startsInLabel(trip: { date: string; startTime: string }): string {
  const start = new Date(`${trip.date}T${trip.startTime}:00`);
  if (Number.isNaN(start.getTime())) return `Starts ${trip.date} ${trip.startTime}`;
  const mins = Math.round((start.getTime() - Date.now()) / 60000);
  if (mins < 0) return 'Start time passed';
  if (mins < 60) return `Starts in ${mins} min`;
  if (mins < 60 * 24) return `Starts in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `Starts ${trip.date} ${trip.startTime}`;
}
