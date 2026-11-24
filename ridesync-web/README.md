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
TripCard, MemberCard, StatusBadge, BottomNavigation, MapControls, SOSButton,
VoiceButton, GlassCard, AppHeader, Toast. Map in `src/components/ConvoyMap.tsx`.

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

## Future backend swap

- Real API: replace the mock functions in `src/services/api.ts` with Axios
  calls (see the `TODO` comments).
- Real sockets: set `VITE_SOCKET_URL` (see `.env.example`) and use
  `createRealSocket()` from `src/services/socketService.ts`; the simulated
  timer in `ConvoyDashboard` should then be removed.
