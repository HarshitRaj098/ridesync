# RideSync — Web (Track 2)

Smart Convoy Management Platform for group travel — React web app built with
Vite + React + TypeScript. This is **Track 2** of the RideSync build
(`~/workspace/ridesync/`); the HTML prototype lives in `html-prototype/` and
the React Native app in `ridesync-mobile/`.

> **Mock data only — no backend yet.** All trips, members, chat, alerts and
> live movement are simulated in the browser (see `src/data/mockData.ts` and
> `src/services/socketService.ts`). There is no real server, no API key and
> no Google Maps key. Maps use **Leaflet + react-leaflet** with free
> CartoDB dark tiles (satellite toggle uses Esri World Imagery).

## Screens / routes (all 11)

| Route | Screen |
| --- | --- |
| `/` | Splash (GPS / internet / session checks, then auto-routes) |
| `/login` | Login (mock auth — any email + 6-char password) |
| `/register` | Register (mock auth, stored in localStorage) |
| `/home` | Home Dashboard — hero, quick actions, upcoming trip, rider stats |
| `/trips/create` | Create Trip |
| `/trips/join` | Join Trip — code `A1B2C9`, QR scan (mock), nearby trips |
| `/trips/:id/lobby` | Trip Lobby — riders, trip details, invite code |
| `/trips/:id/convoy` | **Convoy Dashboard (core)** — live Leaflet map, moving markers, route, speed gauge + ETA, Members / Chat / Alerts bottom sheet, SOS + Push-to-Talk |
| `/trips/:id/leader` | Leader Dashboard — ride health score, online / stopped / offline / separated riders, regroup, broadcast, end trip, speed analytics |
| `/notifications` | Notifications (mark read / mark all read) |
| `/profile` | Profile — stats + ride history (React Query) |
| `/settings` | Settings — theme / notifications / location / voice toggles |

Protected routes redirect to `/login` when signed out.

## Shared mock data (exact, from the prototype)

Manali Mountain Convoy, Bhopal → Manali, 612 km, 12 riders, starts in 24 min,
2026-07-25 06:00. Members: Rohit Verma (Leader, 58 km/h, 1.2 km ahead),
Ananya Kapoor (61 km/h, 300 m ahead), Puneet Sharma (Stopped, fuel station,
2 min), Tanya Mehra (60 km/h, alongside), Sameer Khan (Offline, last seen
4 min ago). Chat: Rohit “Fuel stop in 5 km, regroup at the dhaba”, Ananya
“Copy that, riding steady”, Tanya “Fog near the ghat section, slow down”.
Alerts: Puneet stopped 2 min near KM 214; fog / reduced visibility.
Stats: 47 total rides, 3,140 km logged, 98% safety score.

## Tech stack

- Vite 8 + React 19 + TypeScript
- React Router 7, Redux Toolkit + react-redux, React Query (@tanstack/react-query)
- Leaflet + react-leaflet (no Google Maps API key)
- socket.io-client (installed; the live layer is currently the simulated
  service in `src/services/socketService.ts` — see the `TODO` there for the
  real Node.js + MongoDB backend swap)

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

Mock login: any email + a password of 6+ characters, e.g.
`harshit@example.com` / `ridesync123`. Join code for the Manali convoy: `A1B2C9`.

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
its own GPS, and chat / SOS go through the server. With them unset, the
app behaves exactly as before — mock data and the simulated socket.
Demo login against a local server: `demo@ridesync.app` / `ridesync123`,
Manali convoy code `A1B2C9`.

## Week 1–6 checklist

| Week | Item | Status |
| --- | --- | --- |
| 1 | Setup, dark Poppins theme, navigation, reusable components | ✅ Done — Button, Input, PasswordField, Modal, Loader, EmptyState, ErrorState, Badge, Toast, TripCard, MemberCard |
| 1 | ErrorBoundary + lazy-loaded routes | ✅ Done — all 11 routes lazy-loaded (`dist/assets/*.js` chunks), `ErrorBoundary` in `App.tsx` |
| 1 | Protected routes | ✅ Done — `/home`, `/trips/*`, `/notifications`, `/profile`, `/settings` redirect to `/login` when signed out |
| 2 | Auth validation (email format, password ≥ 6 chars, inline per-field errors, show/hide password) | ✅ Done (mock) — validation is real, but sign-in is still local only |
| 2 | Logout + localStorage session | ✅ Done — logout in Profile and Settings; session persists in `ridesync-user` |
| 3 | Home trip list (upcoming + past trips) | ✅ Done (mock) — Manali convoy + Bhopal Loop + Indore Run from `PAST_TRIPS` |
| 3 | Create Trip validation + adds to list | ✅ Done (mock) — name/destination/date validated, new trip appears on Home |
| 3 | Join Trip code validation (`A1B2C9`, clear error for wrong codes) | ✅ Done (mock) — 6-char check, inline error, matches any known trip code |
| 3 | Trip Lobby countdown + member list | ✅ Done (mock) — live 24:00 countdown ticking, member list with distances |
| 4 | Map markers / route / satellite / recenter | ✅ Done — Leaflet + CartoDB dark tiles, Esri satellite toggle |
| 4 | Traffic layer | ✅ Done (simulated) — red congestion overlay on part of the route, labelled “simulated, not live data” |
| 4 | Per-member distance from leader | ✅ Done (mock GPS) — Haversine distance on MemberCard, map tooltips and Leader view |
| 4 | Separated-rider detection | ✅ Done (mock GPS) — offline / stopped / > 2 km from leader flagged “Separated” |
| 5 | Leader health score, online / stopped / offline / separated | ✅ Done (mock) |
| 5 | Broadcast → Convoy chat + notification | ✅ Done (mock) — broadcast appears in chat, in-app notification, and optional browser notification |
| 5 | Regroup → stopped riders ride again + notification | ✅ Done (mock) |
| 5 | End Trip → trip summary (distance, time, riders, safety) | ✅ Done (mock) — summary modal, then back home |
| 6 | Voice: real push-to-talk (hold), mic-level meter, speaking indicator | ✅ Done (local mic only) — `getUserMedia` + `MediaRecorder` + live meter; audio is captured locally and discarded, nobody else hears it |
| 6 | Voice: graceful fallback if mic denied / unavailable | ✅ Done — inline fallback message explains how to allow the mic |
| 6 | Notifications: All / Unread / Alerts filters, new notification on SOS / regroup / broadcast / chat | ✅ Done (mock) — read state persisted in localStorage |
| 6 | Browser Notification permission (optional) | ✅ Done — “Enable” button on Notifications and Settings; fires only while the app is open, no push server |
| 6 | Settings toggles persist | ✅ Done — saved in `ridesync-settings` localStorage |
| 6 | Loading / empty / error states, aria labels on icon buttons | ✅ Done — Loader / EmptyState / ErrorState on Home, Profile, Convoy, Notifications; aria-labels on map controls, voice, SOS, filters |

## Join Trip — concluded (mock layer, 2026-11-25)

One shared join logic in `src/services/join.ts` (`attemptJoin` / `parseInviteLink` / `resolveJoinCode` / `buildInviteLink`) that code, invite link, QR and Request all go through:

- **Code:** blank and wrong codes are rejected with an inline error — blank no longer joins Manali. Valid codes (case-insensitive) join and open the lobby.
- **Invite link:** pasted links are parsed (`/trips/join?code=A1B2C9`, `/join/A1B2C9`, bare code). Opening a link goes to Join Trip with the code pre-filled. Create Trip generates a real copyable invite link + code for the trip it creates.
- **QR:** a real QR code is generated client-side from the invite link (`qrcode` library, rendered as a PNG data URL) in Create Trip, the Trip Lobby and Join Trip. No fake QR graphic remains.
- **Request:** stored in Redux + localStorage (`ridesync-join-requests`), cancellable by the requester from Join Trip, and visible to the leader on the Leader Dashboard and in the Trip Lobby, with the requester's name. A notification is also added when a request is sent.
- **Home Nearby:** goes to Join Trip (nearby list) instead of toasting.
- **Trip Lobby Invite:** copies the real link + code to the clipboard (with a hand-copy fallback if clipboard is unavailable).

Still mock: requests stay "pending" — leader approval and capacity checks need the real backend (Deploy + the request/approve endpoint).

## Map + fake data + "coming soon" — fast fix pass (mock layer, 2026-11-25)

### The map issue — found and fixed
Two writers fought over rider positions: the 1s store tick random-walked members, and the simulated socket rebuilt them from the seed every 2.5s and overwrote the tick — so markers shivered in place around Bhopal and the convoy never travelled, while distance and ETA kept changing. Fixed with one movement model:
- Riders now travel the Bhopal → Manali demo corridor (`ROUTE_POINTS` in `src/data/mockData.ts`, 15 waypoints) driven by `distanceCoveredKm` — position = `memberRoutePosition()` along the route. The map is labelled "Demo map · simulated positions, not live GPS".
- The map follows the leader (pans when the leader moves away from the view centre). Dragging/zooming by hand pauses follow; recenter / compass resume it.
- Compass and recenter now jump to the leader's **live** position (they used to jump to the fixed Bhopal start point). The simulated socket no longer sends member positions at all (heartbeat only).
- The traffic overlay now sits on the stretch the convoy is actually riding (route points nearest the leader), not a fixed segment.
- The map re-validates its size on window resize / orientation change, so it no longer renders half-grey on phones when the browser chrome collapses.
- Still Leaflet + CartoDB/OpenStreetMap tiles, no Google Maps key. Camera not verified on a real device; no visible +/− zoom buttons (Leaflet zoomControl off).

### Fake data — made honest
- **Stats (Home / Profile / Leader summary):** 47 / 3,140 are still the demo seed, but they are now labelled "Demo stats" on both screens, and ending a trip adds to them (`lifetime` slice in the store, persisted in `ridesync-lifetime`, read by `fetchRiderStats`). The end-trip summary no longer always says 98% — it shows the ride's live health score.
- **Leader health:** the text now matches the number (healthy / "N riders separated — mostly healthy" / "needs attention", coloured accordingly).
- **Average speed:** a real average of the speeds recorded this ride (`speedSamples` in the store), not the current speed.
- **SOS:** never claims contacts were notified. The modal, toast, notification and alerts row all say the SOS is shown to the convoy on this device (demo) and no contacts were messaged.
- **Notifications:** every notification carries its source (chat / broadcast / SOS / regroup / system / join request), shown next to its time.
- **Settings toggles:** the notifications toggle now actually stops new in-app notifications (and browser pop-ups already did); the location-sharing toggle stops GPS being sent and shows a "location sharing off" chip on the map; the dark-theme toggle is gone — the app is dark-only and says so instead of a switch that changed nothing.
- **Create Trip:** a real From field, and distance comes from a small estimate table (Manali 612, Indore 198, …). Unknown destinations show "distance not estimated yet" instead of a made-up 612 km.
- **Member notes:** online riders show their live speed; distance from the leader is computed live (was a frozen note). "+7 more riders" is computed from the trip's rider count.
- **Bottom nav Trips** opens the current trip's convoy, not a hardcoded Manali URL. **Home "Live Now"** uses the trip's real fields.

### "Coming soon" — both found, both made real
- **Header ☰ menu** ("Menu coming soon" toast): now a real dropdown menu with links to Home, My Trip map, Trip Lobby, Notifications, Profile and Settings.
- **Settings → Emergency contacts Edit** ("coming soon" toast): now a real editor — add / edit / delete contacts, stored in Redux + localStorage (`ridesync-emergency-contacts`). Contacts start empty on purpose (no fake names/numbers); the SOS modal lists the saved contacts so the rider can see who SOS would reach, and says plainly they are listed, not messaged, in the demo.

### Still needs a real backend (not done — do not mistake the above for live)

- **Real auth server** — login/register are mock; any valid-looking email signs in locally.
- **Real Socket.IO / GPS** — movement, chat, SOS, regroup and broadcasts are simulated timers in the browser; no server, no real rider positions.
- **Real voice server** — push-to-talk records the local mic only; there is no voice channel, so other riders cannot hear it.
- **Real push notifications** — browser notifications only work while the app is open; there is no push service or service worker.
- **Real traffic** — the traffic layer is a simulated overlay on the stretch being ridden, not a live traffic feed.
- **Real trips** — created/joined trips live only in this browser (Redux + localStorage); nothing is shared with other riders.

## Leader Dashboard — concluded (mock layer, 2026-11-25)

- **One source of truth:** `src/services/convoySummary.ts` (`getConvoySummary`) computes online / stopped / offline / separated, health score, average speed, total vs named riders and alerts from the same store state. The Leader Dashboard and the Convoy Dashboard both read it — no second hard-coded count anywhere. A rider separated on one screen is separated on the other; "Online 3 / 5 named" and "Total riders 12" are now labelled with what each number counts.
- **Leader-only controls are actually leader-only:** `isTripLeader` matches the signed-in user's (mock) account name against the trip's leader — `trip.leaderName`, or the member with `role: 'Leader'` for the seeded Manali trip (Rohit Verma). A non-leader opening `/trips/:id/leader` sees a clear read-only view (health, stats, riders, analytics) with a note naming the leader and saying the controls are hidden — not a toast, not the controls. Join Requests and Leader Actions (broadcast, regroup, end trip) only render for the leader. A user who creates a trip and picks "You (Trip Creator)" as its leader IS its leader and sees the controls.
- **Broadcast and regroup unchanged:** same store actions as before — broadcast posts to convoy chat + a notification, regroup posts a regroup alert + notification.
- **End-trip summary unchanged:** still the live health / distance / time values from the previous pass.

Still mock: the leader check is a name match — real enforcement by user id needs the server (Deploy). Leader approval of join requests and capacity checks also still need Deploy + the request/approve endpoint.

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
- **Real traffic** — the traffic layer is a simulated overlay on the stretch being
  ridden, not a live traffic feed.
