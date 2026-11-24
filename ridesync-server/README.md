# RideSync — Server (Backend)

Smart Convoy Management Platform — real backend for the RideSync web app.
**Node.js + Express + Socket.IO + Mongoose (MongoDB)**, TypeScript.

Architecture (from the Architecture doc): **GPS → Socket → Redux → UI** —
riders send GPS over Socket.IO, the server persists the latest position
and broadcasts it to everyone in the trip room, and the frontend updates
Redux and the Leaflet map.

> **No database required to run locally.** If `MONGODB_URI` is not set,
> the server runs in **memory mode**: everything lives in process memory,
> seeded with the Manali convoy, and it logs which mode it is in.
> Set `MONGODB_URI` to use a real MongoDB (e.g. MongoDB Atlas).

## Run locally

```bash
cd ridesync-server
npm install
npm run dev        # tsx watch — http://localhost:4000
# or
npm run build && npm start
```

In memory mode the server seeds itself on boot. Demo login:

- Email: `demo@ridesync.app` — Password: `ridesync123`
- Manali Mountain Convoy: id `manali-2026`, join code `A1B2C9`

```bash
npm run seed       # (re-)create the demo user + Manali convoy (MongoDB mode)
curl http://localhost:4000/health
npm run smoke      # end-to-end check: register/login/trip/chat + socket broadcast
                   # (needs the server running on http://localhost:4000)
```

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | Server port |
| `MONGODB_URI` | *(empty)* | Empty = memory mode. Atlas: `mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority` |
| `JWT_SECRET` | *(dev fallback)* | **Set a long random secret in production.** Without it the server logs a warning and uses a dev-only fallback. |
| `CORS_ORIGIN` | `http://localhost:5173,http://localhost:3000,https://ridesync-ten.vercel.app` | Comma-separated allowed origins (REST + Socket.IO) |
| `CLIENT_URL` | `http://localhost:5173` | Frontend URL, informational |

## REST API

Base URL: `http://localhost:4000`. All `/api/*` routes except auth
register/login require `Authorization: Bearer <jwt>`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/health` | `{ status, service, mode: "memory" \| "mongo", users, trips }` |
| POST | `/api/auth/register` | `{ name, email, password }` → `{ user, token }` (bcrypt hash, JWT) |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | Current user |
| GET | `/api/trips` | List trips |
| POST | `/api/trips` | Create a trip (caller becomes leader) |
| GET | `/api/trips/:id` | One trip |
| POST | `/api/trips/:id/join` | Join by code: `{ code }` |
| GET | `/api/trips/:id/members` | Members with live position/status |
| GET | `/api/trips/:id/chat` | Chat history |
| POST | `/api/trips/:id/chat` | Post a chat message (broadcast to the room) |
| POST | `/api/trips/:id/sos` | Send SOS — creates an alert + notifications, emits `sos` |
| POST | `/api/trips/:id/broadcast` | Leader-only broadcast (≤ 200 chars) → chat + notifications + `broadcast` |
| POST | `/api/trips/:id/regroup` | Stopped riders ride again, alert + `trip:update` |
| POST | `/api/trips/:id/end` | End the trip → trip summary |
| GET | `/api/users/:id/stats` | `{ totalRides, kmLogged, safetyScore }` (`:id` may be `me`) |
| GET | `/api/users/:id/trips` | Trips the user has joined |
| GET | `/api/notifications` | Current user's notifications (newest first) |
| POST | `/api/notifications/:id/read` | Mark one notification read |

Errors are `{ error: "<message>" }` with a 400 / 401 / 403 / 404 status.
Passwords are hashed with bcrypt — never stored in plain text.

## Socket.IO

Connect to the same URL as the REST API, with JWT auth:

```js
import { io } from 'socket.io-client'
const socket = io('http://localhost:4000', { auth: { token } })
socket.emit('trip:join', { tripId: 'manali-2026' })
```

**Rooms:** one per trip, `trip:<tripId>`.

| Direction | Event | Payload |
| --- | --- | --- |
| Client → server | `trip:join` | `{ tripId }` |
| Client → server | `trip:leave` | `{ tripId }` |
| Client → server | `location:update` | `{ tripId, lat, lng, speedKmh }` — server persists it and broadcasts the full member list |
| Server → room | `location:update` | `{ members: [{ id, name, initials, role, status, speedKmh, note, lat, lng, color }] }` |
| Server → room | `member:join` / `member:left` | `{ userId, name, tripId }` |
| Client → server | `chat:message` | `{ tripId, text }` — persisted, then broadcast |
| Server → room | `chat:message` | `{ id, authorId, author, initials, text, at }` |
| Client → server | `sos` | `{ tripId, lat?, lng? }` |
| Server → room | `sos` | `{ userId, name, tripId, lat?, lng?, at }` |
| Server → room | `trip:update` | `{ tripId, action: "regroup" \| "end", ... }` |
| Server → room | `broadcast` | `{ id, authorId, author, text, at }` |
| Either way | `voice:offer` / `voice:answer` / `voice:ice-candidate` | `{ to: <socketId>, ... }` — **signalling only**, relayed to one peer; audio is peer-to-peer WebRTC, there is no media server |

## Data models (MongoDB)

`User` (name, email unique, passwordHash, totalRides, kmLogged,
safetyScore), `Trip` (string id such as `manali-2026`, code, leaderId,
status, distanceCoveredKm), `TripMember` (tripId, userId, name, role,
status, speedKmh, lat, lng), `Location` (latest positions are also kept
on the member), `ChatMessage`, `Alert`, `Notification`.

## Deploy

### Render (server) + MongoDB Atlas (database)

1. **MongoDB Atlas** (free tier): create a cluster, a database user and
   allow network access (`0.0.0.0/0` for a first deploy, or Render's IPs).
   Copy the connection string.
2. **Render**: New → Web Service → import the repo
   (`HarshitRaj098/ridesync`), Root Directory `ridesync-server`,
   Build Command `npm install && npm run build`, Start Command
   `npm start`, Environment `Node`. Add env vars:
   `MONGODB_URI=<Atlas string>`, `JWT_SECRET=<long random string>`,
   `CORS_ORIGIN=https://ridesync-ten.vercel.app`.
   Note the service URL, e.g. `https://ridesync-server.onrender.com`.
3. **Vercel** (project `ridesync`, root `ridesync-web`): add env vars
   `VITE_API_URL=https://ridesync-server.onrender.com` and
   `VITE_SOCKET_URL=https://ridesync-server.onrender.com`, then redeploy.
   With those set, the web app uses the real API + sockets; unset, it
   keeps the mock/simulated behaviour.

### Docker

```bash
docker build -t ridesync-server .
docker run -p 4000:4000 -e MONGODB_URI='...' -e JWT_SECRET='...' ridesync-server
```

## Seed data

Manali Mountain Convoy (Bhopal → Manali, 612 km, 12 riders, code
`A1B2C9`, 2026-07-25 06:00). Members: Rohit Verma (Leader, 58 km/h),
Ananya Kapoor (61), Puneet Sharma (Stopped), Tanya Mehra (60),
Sameer Khan (Offline). Chat: Rohit “Fuel stop in 5 km, regroup at the
dhaba”, Ananya “Copy that, riding steady”, Tanya “Fog near the ghat
section, slow down”. Stats: 47 rides, 3,140 km, 98% safety.
