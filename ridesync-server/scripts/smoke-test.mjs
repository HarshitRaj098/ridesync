/**
 * Smoke test — `npm run smoke` (server must be running on BASE, default
 * http://localhost:4000, in memory mode or with a fresh DB).
 *
 * Registers a user, logs in, lists the seeded Manali trip, joins it by
 * code, posts a chat message, connects a Socket.IO client and proves a
 * location:update broadcast comes back with the member list.
 * Exits 0 on success, 1 on the first failure. Uses a unique email each
 * run so it can be re-run safely.
 */
import { io } from 'socket.io-client'

const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:4000'
const email = `smoke-${Date.now()}@ridesync.app`

let failures = 0
function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const { status: healthStatus, data: health } = await api('/health')
check('GET /health', healthStatus === 200 && health.status === 'ok', `mode=${health.mode} users=${health.users} trips=${health.trips}`)

const reg = await api('/api/auth/register', { method: 'POST', body: { name: 'Smoke Rider', email, password: 'smoke123' } })
check('POST /api/auth/register', reg.status === 201 && !!reg.data.token, `status=${reg.status}`)
const token = reg.data.token

const badLogin = await api('/api/auth/login', { method: 'POST', body: { email, password: 'wrong-password' } })
check('POST /api/auth/login rejects wrong password', badLogin.status === 401, `status=${badLogin.status}`)

const login = await api('/api/auth/login', { method: 'POST', body: { email, password: 'smoke123' } })
check('POST /api/auth/login', login.status === 200 && !!login.data.token, `status=${login.status}`)

const me = await api('/api/auth/me', { token })
check('GET /api/auth/me', me.status === 200 && me.data.user?.email === email, `status=${me.status}`)

const trips = await api('/api/trips', { token })
const manali = trips.data.trips?.find((t) => t.id === 'manali-2026' || t.code === 'A1B2C9')
check('GET /api/trips lists seeded Manali convoy', trips.status === 200 && !!manali, `trips=${trips.data.trips?.length}`)

const wrongJoin = await api(`/api/trips/${manali?.id ?? 'manali-2026'}/join`, { method: 'POST', token, body: { code: 'WRONG1' } })
check('POST join rejects wrong code', wrongJoin.status === 400, `status=${wrongJoin.status}`)

const join = await api(`/api/trips/${manali?.id ?? 'manali-2026'}/join`, { method: 'POST', token, body: { code: 'A1B2C9' } })
check('POST join with code A1B2C9', join.status === 200 && join.data.joined === true, `status=${join.status}`)

const members = await api(`/api/trips/${manali?.id ?? 'manali-2026'}/members`, { token })
check('GET members includes seeded riders + new rider', members.status === 200 && members.data.members?.length >= 6, `members=${members.data.members?.length}`)

const chat = await api(`/api/trips/${manali?.id ?? 'manali-2026'}/chat`, { method: 'POST', token, body: { text: 'Smoke test — hello convoy' } })
check('POST chat message', chat.status === 201 && chat.data.message?.text === 'Smoke test — hello convoy', `status=${chat.status}`)

const stats = await api('/api/users/me/stats', { token })
check('GET /api/users/me/stats', stats.status === 200 && typeof stats.data.totalRides === 'number', `totalRides=${stats.data.totalRides}`)

// Socket.IO: join the trip, send a location, expect a broadcast back.
const socketOk = await new Promise((resolve) => {
  const socket = io(BASE, { auth: { token }, transports: ['websocket'] })
  const timeout = setTimeout(() => {
    console.log('FAIL  socket location:update broadcast — timed out')
    failures += 1
    socket.disconnect()
    resolve(false)
  }, 8000)
  socket.on('connect_error', (err) => {
    clearTimeout(timeout)
    console.log(`FAIL  socket connect — ${err.message}`)
    failures += 1
    resolve(false)
  })
  socket.on('connect', () => socket.emit('trip:join', { tripId: manali?.id ?? 'manali-2026' }))
  socket.on('location:update', (payload) => {
    if (Array.isArray(payload?.members) && payload.members.length >= 6) {
      clearTimeout(timeout)
      console.log(`PASS  socket location:update broadcast — members=${payload.members.length}`)
      socket.disconnect()
      resolve(true)
    }
  })
  // Send our location a moment after joining.
  setTimeout(() => socket.emit('location:update', { tripId: manali?.id ?? 'manali-2026', lat: 23.26, lng: 77.41, speedKmh: 55 }), 1500)
})
check('socket connected + broadcast received', socketOk)

console.log(failures === 0 ? '\nSmoke test: ALL PASS' : `\nSmoke test: ${failures} FAILURE(S)`)
process.exit(failures === 0 ? 0 : 1)
