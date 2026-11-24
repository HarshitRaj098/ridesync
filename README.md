# RideSync — Smart Convoy Management Platform

Group travel, managed as a convoy: live map, trip management, leader controls,
group chat, voice, SOS, and notifications.

**Shared design (all three tracks):** dark theme by default, Primary Blue
`#007BFF`, Cyan `#00C2FF`, Green success `#22C55E`, Red danger `#EF4444`,
Warning `#F59E0B`, background `#080B12`, card `#121826`, Poppins font.

**Shared mock data (all three tracks):** Manali Mountain Convoy, Bhopal →
Manali, 612 km, 12 riders, starts in 24 min, 2026-07-25 06:00, trip code
`A1B2C9`. Members: Rohit Verma (Leader, 58 km/h, 1.2 km ahead), Ananya Kapoor
(61 km/h, 300 m ahead), Puneet Sharma (Stopped, fuel station, 2 min),
Tanya Mehra (60 km/h, alongside), Sameer Khan (Offline, last seen 4 min ago).
Stats: 47 total rides, 3,140 km logged, 98% safety score.

**11 screens (all three tracks):** Splash, Login/Register, Home Dashboard,
Create Trip, Join Trip, Trip Lobby, Convoy Dashboard (core), Leader Dashboard,
Notifications, Profile, Settings.

Convoy Dashboard is the core: live map with leader/member markers and route,
speed + ETA, bottom sheet with Members / Chat / Alerts, SOS and Push-to-Talk
floating buttons. Leader Dashboard: ride health score, online/offline/stopped/
separated riders, regroup, broadcast, end trip, analytics.

> **All live data is mock / simulated.** There is no real backend yet. No
> API keys or Google Maps key are used anywhere.

## Tracks

### 1. HTML prototype — quickest to open
`html-prototype/`

- `index.html` / `ridesync__1.html` — single-file app, all 11 screens in-page,
  Leaflet map via CDN, speed gauge, timer, Members/Chat/Alerts sheet, SOS
  modal, voice button. Extended from the original 47 KB prototype (now ~66 KB).
- `login.html` — fixed standalone login page (`<form action="/login"
  method="post">`, dark Poppins styling, mock submit).
- `README.md` — run instructions and screen map.

Run: open `html-prototype/index.html` in a browser (needs internet only for
the Poppins font + Leaflet CDN).

### 2. React web — Vite + React + TypeScript (recommended for Vercel)
`ridesync-web/`

Vite 8 + React 19 + TypeScript, React Router 7, Redux Toolkit, React Query,
react-leaflet (CartoDB dark tiles — **no Google Maps API key needed**),
socket.io-client (simulated socket service; see `src/services/socketService.ts`).

All 11 routes: `/` Splash, `/login` + `/register`, `/home`, `/trips/create`,
`/trips/join`, `/trips/:id/lobby`, `/trips/:id/convoy`, `/trips/:id/leader`,
`/notifications`, `/profile`, `/settings`. Live movement is simulated
(marker positions/speeds jitter every 2.5 s, 1 s timer tick).

```bash
cd ridesync-web
npm install
npm run dev     # http://localhost:5173
npm run build   # -> dist/   ✅ verified passing
```

Deploy to Vercel: import the repo, set root directory to `ridesync-web`,
build command `npm run build`, output directory `dist`. A `vercel.json` SPA
rewrite is included. See `ridesync-web/README.md`.

### 3. React Native mobile — Expo + TypeScript
`ridesync-mobile/`

Expo ~52 + React Native 0.76.5, React Navigation, Redux Toolkit, React Query,
react-native-maps, socket.io-client (simulated by default; real socket behind
`EXPO_PUBLIC_USE_REAL_SOCKET=1`). Same 11 screens, theme, components and mock
data as the web app. `src/` follows the Phase 1 doc: components, screens,
navigation, store (+ slices), hooks, services, api, socket, assets, theme,
utils.

```bash
cd ridesync-mobile
npm install
npx expo start        # Expo Go on a phone, or a/i for emulator/simulator
npx expo start --web  # web preview (map fallback — see below)
npm run typecheck
```

**Maps:** `react-native-maps` on native needs a device/emulator and a Google
Maps API key for full maps — `app.json` has a placeholder
`YOUR_GOOGLE_MAPS_API_KEY_HERE`, no real key. Web uses a styled map
fallback (`ConvoyMap.web.tsx`).

**Not tested on a phone.** No device/emulator test was run here.

## Verification (2026-11-24, coordinator re-check)

- ✅ Web: `npm run build` passes (tsc + vite, 165 modules, `dist/` produced,
  built in ~0.9 s). Only a non-fatal >500 kB chunk warning.
- ✅ HTML: `index.html` / `login.html` parse clean (Python `html.parser`,
  zero unclosed/stray-tag errors); login form is a valid
  `<form action="/login" method="post">…</form>`. Not live-rendered in a
  browser — open `index.html` once to eyeball the Leaflet map.
- ✅ Mobile: 47 source files under `src/`, all 11 screens present.
  `tsc --noEmit` run directly passes (exit 0).

## Still TODO (not built)

- Real Node.js + MongoDB backend, real Socket.IO server, real auth
  (login is mock in all three tracks; nothing is sent to a server).
- Real GPS live tracking (movement is simulated in web/mobile, mock in HTML).
- Real voice / push notifications.
- Google Maps API key for full native maps (mobile only).
- Poppins font files for the mobile app (system font used; drop `.ttf` files
  into `ridesync-mobile/src/assets/fonts/` and load with `expo-font`).
- Code-split the web Leaflet chunk to clear the 500 kB build warning.

## Source docs

The originals live in `~/workspace/user/files/`:
`RideSync_Frontend_Documentation_Phase1.pdf` (React Native preferred),
`RideSync_Complete_Frontend_Blueprint_React.pdf` (React web + Vite),
`RideSync_Frontend_Architecture_Document.pdf` (Node.js + MongoDB,
GPS → Socket → Redux → UI), `ridesync__1.html` (original prototype),
`login.html` (original broken stub).
