# RideSync — Web (Track 2)

Smart Convoy Management Platform for group travel — React web app built with
Vite + React + TypeScript. This is **Track 2** of the RideSync build
(`~/workspace/ridesync/`); the HTML prototype lives in `html-prototype/` and
the React Native app in `ridesync-mobile/`.

> **No fake data — the app starts empty.** There is no demo trip, no demo
> riders, no demo stats, no demo chat or alerts. The only data the app
> shows is data the user created on this device (a trip they created or
> joined, a join request they sent, an emergency contact they saved, a
> notification from their own action) or live data from the real backend
> when one is configured. See “Fake data — removed (2026-11-25)” below.
> There is no real server, no API key and no Google Maps key. Maps use
> **Leaflet + react-leaflet** with free CartoDB dark tiles (satellite
> toggle uses Esri World Imagery).

## Screens / routes (all 11)

| Route | Screen |
| --- | --- |
| `/` | Splash (loading, then auto-routes) |
| `/login` | Login (local auth — any email + 6-char password, stored in this browser) |
| `/register` | Register (local auth, stored in localStorage) |
| `/home` | Home Dashboard — hero, quick actions, your trips, rider stats (0 until you ride) |
| `/trips/create` | Create Trip |
| `/trips/join` | Join Trip — code, invite link, QR, join requests |
| `/trips/:id/lobby` | Trip Lobby — riders, trip details, invite code |
| `/trips/:id/convoy` | **Convoy Dashboard (core)** — Leaflet map centred on your real position (when location is on), speed gauge + ETA, Members / Chat / Alerts bottom sheet, SOS + Push-to-Talk |
| `/trips/:id/leader` | Leader Dashboard — ride health score, online / stopped / offline / separated riders, regroup, broadcast, end trip, speed analytics |
| `/notifications` | Notifications (mark read / mark all read) |
| `/profile` | Profile — stats + ride history (React Query) |
| `/settings` | Settings — theme / notifications / location / voice toggles |

Protected routes redirect to `/login` when signed out.

## Data — real local data only

The app starts empty. The only trips are trips the user created or joined
(stored in Redux + localStorage, key `ridesync-trips`); the only members
are the signed-in rider (added when they open a trip's convoy) plus real
members from the backend when one is connected; the only chat messages,
alerts and notifications are the ones the user's own actions created;
rider stats start at 0 rides / 0 km / no safety score and only grow when
the user actually ends a trip. Positions, speed and distance come from
the browser's real geolocation while location sharing is on — with no
fix, the map shows the default view and no marker, and speed/distance
stay at zero. Nothing is seeded, simulated or labelled as a demo: the
seeded Manali trip, its 5 riders, the 47 / 3,140 / 98% stats, the seeded
chat, alerts, notifications, past trips, route waypoints and distance
estimates were all deleted on 2026-11-25 (see “Fake data — removed”
below). `src/data/mockData.ts` now holds only types and pure helpers
(Haversine distance, leader/separation checks, ride-time formatting).

## Tech stack

- Vite 8 + React 19 + TypeScript
- React Router 7, Redux Toolkit + react-redux, React Query (@tanstack/react-query)
- Leaflet + react-leaflet (no Google Maps API key)
- socket.io-client (real backend only — see `src/services/socketService.ts`;
  without a backend there is no socket, no simulated positions)

## Design system

Dark theme by default: bg `#080B12`, card `#121826`, Primary Blue `#007BFF`,
Cyan `#00C2FF`, Green `#22C55E`, Red `#EF4444`, Warning `#F59E0B`,
Poppins font. Shared components in `src/components/ui.tsx`: Button, Input,
PasswordField, TripCard, MemberCard, StatusBadge, Badge, BottomNavigation,
MapControls, SOSButton, VoiceButton (real hold-to-talk mic), GlassCard,
AppHeader, Toast, Modal, Loader, EmptyState, ErrorState, ErrorBoundary.
Map in `src/components/ConvoyMap.tsx`.

## Run locally

```bash
cd ridesync-web
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build -> dist/
npm run preview    # serve the production build locally
```

Local sign-in: any email + a password of 6+ characters. Your account is
stored only in this browser. Join a trip with the code from its invite.

## Deploy to Vercel

No backend or environment variables are required for this mock build.

1. Push this folder to GitHub (parent/coordinator step — not done here).
2. In Vercel: **Add New → Project → import the repo**, set:
   - Framework Preset: **Vite**
   - Root Directory: `ridesync-web`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
3. Deploy. SPA routing is handled by `vercel.json` (all routes rewrite to
   `index.html`), so deep links like `/trips/manali-2026/convoy` work.

Or from the CLI (from this folder):

```bash
npx vercel          # first run links the project
npx vercel --prod   # production deploy
```

## Real backend

The real backend lives in `../ridesync-server` (Node.js + Express +
Socket.IO + MongoDB, with an in-memory mode when no `MONGODB_URI` is set).
See its `README.md` for the full API, socket events, and deploy steps.

To point this web app at it, set in Vercel (or a local `.env`):

```bash
VITE_API_URL=https://ridesync-server.onrender.com   # your deployed server URL
VITE_SOCKET_URL=https://ridesync-server.onrender.com
```

With those set, login/register use the real API (JWT in `localStorage`
`ridesync-token`), rider stats / trip history / members load from the
server, the Convoy Dashboard joins the trip's Socket.IO room and sends
its own real GPS, and chat / SOS go through the server. With them unset,
the app runs on local data only — it starts empty and shows only what
the user did on this device. Demo login against a local server:
`demo@ridesync.app` / `ridesync123`.

## Week 1–6 checklist

| Week | Item | Status |
| --- | --- | --- |
| 1 | Setup, dark Poppins theme, navigation, reusable components | ✅ Done — Button, Input, PasswordField, Modal, Loader, EmptyState, ErrorState, Badge, Toast, TripCard, MemberCard |
| 1 | ErrorBoundary + lazy-loaded routes | ✅ Done — all 11 routes lazy-loaded (`dist/assets/*.js` chunks), `ErrorBoundary` in `App.tsx` |
| 1 | Protected routes | ✅ Done — `/home`, `/trips/*`, `/notifications`, `/profile`, `/settings` redirect to `/login` when signed out |
| 2 | Auth validation (email format, password ≥ 6 chars, inline per-field errors, show/hide password) | ✅ Done — validation is real, but sign-in is still local only |
| 2 | Logout + localStorage session | ✅ Done — logout in Profile and Settings; session persists in `ridesync-user` |
| 3 | Home trip list (upcoming + past trips) | ✅ Done — only trips the user created or joined; empty state when there are none |
| 3 | Create Trip validation + adds to list | ✅ Done — name/destination/date validated, new trip appears on Home |
| 3 | Join Trip code validation (clear error for wrong codes) | ✅ Done — 6-char check, inline error, matches any known trip code |
| 3 | Trip Lobby countdown + member list | ✅ Done — countdown from the trip's own date + start time; member list is the real members |
| 4 | Map markers / route / satellite / recenter | ✅ Done — Leaflet + CartoDB dark tiles, Esri satellite toggle; markers only for riders with a real GPS fix |
| 4 | Per-member distance from leader | ✅ Done — Haversine distance on MemberCard, map tooltips and Leader view (real GPS only; 0 when a position is unknown) |
| 4 | Separated-rider detection | ✅ Done — offline / stopped / > 2 km from leader flagged “Separated” |
| 5 | Leader health score, online / stopped / offline / separated | ✅ Done — computed from the real members in the store; “—” before any ride |
| 5 | Broadcast → Convoy chat + notification | ✅ Done — broadcast appears in chat, in-app notification, and optional browser notification |
| 5 | Regroup → stopped riders ride again + notification | ✅ Done — no-op with a plain message when there are no other riders |
| 5 | End Trip → trip summary (distance, time, riders, safety) | ✅ Done — summary modal with the ride's real recorded values, then back home |
| 6 | Voice: real push-to-talk (hold), mic-level meter, speaking indicator | ✅ Done (local mic only) — `getUserMedia` + `MediaRecorder` + live meter; audio is captured locally and discarded, nobody else hears it |
| 6 | Voice: graceful fallback if mic denied / unavailable | ✅ Done — inline fallback message explains how to allow the mic |
| 6 | Notifications: All / Unread / Alerts filters, new notification on SOS / regroup / broadcast / chat | ✅ Done — read state persisted in localStorage; the list starts empty |
| 6 | Browser Notification permission (optional) | ✅ Done — “Enable” button on Notifications and Settings; fires only while the app is open, no push server |
| 6 | Settings toggles persist | ✅ Done — saved in `ridesync-settings` localStorage |
| 6 | Loading / empty / error states, aria labels on icon buttons | ✅ Done — Loader / EmptyState / ErrorState on Home, Profile, Convoy, Notifications; aria-labels on map controls, voice, SOS, filters |

## Join Trip — concluded (local layer, 2026-11-25)

One shared join logic in `src/services/join.ts` (`attemptJoin` / `parseInviteLink` / `resolveJoinCode` / `buildInviteLink`) that code, invite link, QR and Request all go through:

- **Code:** blank and wrong codes are rejected with an inline error. Valid codes (case-insensitive) join and open the lobby.
- **Invite link:** pasted links are parsed (`/trips/join?code=XXXXXX`, `/join/XXXXXX`, bare code). Opening a link goes to Join Trip with the code pre-filled. Create Trip generates a real copyable invite link + code for the trip it creates.
- **QR:** a real QR code is generated client-side from the invite link (`qrcode` library, rendered as a PNG data URL) in Create Trip and the Trip Lobby. No fake QR graphic remains.
- **Request:** stored in Redux + localStorage (`ridesync-join-requests`), cancellable by the requester from Join Trip, and visible to the leader on the Leader Dashboard and in the Trip Lobby, with the requester's name. A notification is also added when a request is sent.
- **Home Nearby:** goes to Join Trip instead of toasting.
- **Trip Lobby Invite:** copies the real link + code to the clipboard (with a hand-copy fallback if clipboard is unavailable).

Still local: requests stay "pending" — leader approval and capacity checks need the real backend (Deploy + the request/approve endpoint).

## Map + fake data + "coming soon" — fast fix pass (2026-11-25)

See “Fake data — removed (2026-11-25)” at the end of this file: the seeded
demo data described in this section (the Manali demo corridor, the demo
stats, the distance-estimate table, the simulated traffic layer) was
deleted on 2026-11-25 at the user's request. The "coming soon" fixes in
this section still stand — the header menu is a real dropdown and
emergency contacts are a real add/edit/delete editor.

### Still needs a real backend (not done — do not mistake the above for live)

- **Real auth server** — login/register are local; any valid-looking email signs in on this device only.
- **Real Socket.IO / GPS** — chat, SOS, regroup and broadcasts stay on this device; rider positions come only from this device's own GPS.
- **Real voice server** — push-to-talk records the local mic only; there is no voice channel, so other riders cannot hear it.
- **Real push notifications** — browser notifications only work while the app is open; there is no push service or service worker.
- **Real trips** — created/joined trips live only in this browser (Redux + localStorage); nothing is shared with other riders.

## Leader Dashboard — concluded (local layer, 2026-11-25)

- **One source of truth:** `src/services/convoySummary.ts` (`getConvoySummary`) computes online / stopped / offline / separated, health score, average speed, rider limit vs riders present and alerts from the same store state. The Leader Dashboard and the Convoy Dashboard both read it — no second hard-coded count anywhere.
- **Leader-only controls are actually leader-only:** `isTripLeader` matches the signed-in user's account name against the trip's leader (`trip.leaderName`, set to the creator at creation time). A non-leader opening `/trips/:id/leader` sees a clear read-only view (health, stats, riders, analytics) with a note naming the leader and saying the controls are hidden — not a toast, not the controls. Join Requests and Leader Actions (broadcast, regroup, end trip) only render for the leader. A user who creates a trip IS its leader and sees the controls.
- **Broadcast and regroup unchanged:** same store actions as before — broadcast posts to convoy chat + a notification, regroup posts a regroup alert + notification. Regroup does nothing (with a plain message) when there are no other riders in the convoy.
- **End-trip summary:** the ride's real recorded values (distance covered from real GPS, elapsed time, riders present, health) — health shows “—” before any ride. Ending a trip records a real completed trip in Ride History and adds to the lifetime totals.

Still local: the leader check is a name match — real enforcement by user id needs the server (Deploy). Leader approval of join requests and capacity checks also still need Deploy + the request/approve endpoint.

## Backend status

- ✅ **Real backend exists** — `../ridesync-server` (REST + Socket.IO +
  JWT auth + MongoDB / in-memory mode). Set `VITE_API_URL` /
  `VITE_SOCKET_URL` (see "Real backend" above) to use it.
- **Still needs a host + database for production** — the server has not
  been deployed anywhere and there is no MongoDB Atlas cluster yet; see
  `ridesync-server/README.md` for Render + Atlas setup.
- **Real voice server** — push-to-talk still records the local mic only;
  the server relays WebRTC signalling (`voice:offer` / `voice:answer` /
  `voice:ice-candidate`) so two browsers can connect peer-to-peer, but
  there is no TURN/media server yet.
- **Real push notifications** — browser notifications only work while the
  app is open; there is no push service or service worker.

## Fake data — removed (2026-11-25)

The user asked for ALL fake data to be removed, not relabelled as demo.
Everything seeded was deleted from what the app shows:

- **Seeded trip gone:** the Manali Mountain Convoy (Bhopal → Manali, 612 km,
  12 riders, code `A1B2C9`), the two past trips (Bhopal Loop, Indore Run)
  and the nearby-trips list. The store starts with no trips; trips are
  only the ones the user creates or joins, persisted in `ridesync-trips`.
- **Seeded riders gone:** Rohit, Ananya, Puneet, Tanya, Sameer. The only
  member in a convoy is the signed-in rider (added when they open the
  trip), plus real members from the backend when one is connected.
- **Seeded stats gone:** 47 rides / 3,140 km / 98% safety score. Stats
  start at 0 / 0 / no score (new key `ridesync-lifetime-v2`; the old
  seeded totals are never read) and only grow when the user ends a trip.
- **Seeded chat, alerts and notifications gone:** chat, alerts and the
  notification list all start empty. Old seeded notifications saved in
  earlier versions (ids `n1`–`n5`) are dropped on load.
- **Seeded route gone:** the 15-waypoint Bhopal → Manali corridor, the
  route polyline, the simulated traffic overlay and the simulated
  traffic toggle are all deleted. The map shows only real GPS positions;
  with no fix it shows the default view and no markers.
- **Simulated movement gone:** the 1s random-walk tick, the simulated
  socket (deleted entirely — `socketService.ts` is real-backend only)
  and the fake GPS jitter sent to the server are all gone. Speed and
  distance come only from the browser's real geolocation while location
  sharing is on; the 1s timer only counts elapsed time on the convoy
  screen.
- **Invented numbers gone:** the distance-estimate table (Create Trip
  no longer guesses a distance — a trip shows "distance not estimated
  yet"), the 24-minute lobby countdown (now counted from the trip's own
  date + start time), the fake TripCard avatars, the demo speed-history
  chart (now only speeds actually recorded on this ride), and the demo
  login example credentials.
- **SOS / broadcast / regroup made honest:** with no other riders in the
  convoy, SOS says plainly nobody else will see it; regroup does nothing
  with a plain message when there are no other riders; broadcast posts
  to the convoy chat and says so when nobody else is in the convoy.

What still works with real local data: create a trip (own name, from/to,
date, time, rider limit, real generated code + invite link + QR), join
by code or invite link, send/cancel join requests, add/edit/delete
emergency contacts, post chat messages, broadcast, end a trip (records a
real completed trip in Ride History), and all settings toggles. Every
screen that had fake data now shows an honest empty state instead.
