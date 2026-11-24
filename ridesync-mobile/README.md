# RideSync — Mobile App (Expo + TypeScript)

Smart Convoy Management Platform for group travel: live map, trip management,
leader controls, group chat, voice, SOS and notifications.

> **Mock build.** All data in this app is mock/simulated — the Manali Mountain
> Convoy, members, chat, alerts and stats are hard-coded in
> `src/data/mockData.ts` and live movement is simulated on a timer
> (`src/hooks/useRideTimer.ts` + `src/socket/socketService.ts`). There is no
> real backend, no real accounts, and no real API key in this repo.

## Screens (11)

1. **Splash** — GPS / internet / session checks, auto-advances (~2.6s)
2. **Login / Register** — mock auth (any email + password works; "Continue as Guest" too)
3. **Home Dashboard** — hero, quick actions, upcoming trip card, rider stats
4. **Create Trip** — name, destination, date/time, type, rider stepper, invite QR/code
5. **Join Trip** — trip code, QR scan (device only), invite link, nearby trips
6. **Trip Lobby** — pre-ride waiting room with rider list and invite link
7. **Convoy Dashboard** (core) — live map with leader/member markers + route,
   speed gauge + ETA, bottom sheet with Members / Chat / Alerts, SOS + Push-to-Talk
8. **Leader Dashboard** — ride health score, online/offline/stopped/separated
   riders, regroup, broadcast, end trip, analytics
9. **Notifications** — alerts with unread badges, mark-all-read
10. **Profile** — rider stats via React Query (mock fetch)
11. **Settings** — dark theme, notifications, location sharing, voice, units

## Mock data (shared with the web app and HTML prototype)

- **Manali Mountain Convoy**, Bhopal → Manali, **612 km**, **12 riders**,
  starts in 24 min, 2026-07-25 06:00, invite code `A1B2C9`
- Members: Rohit Verma (Leader, 58 km/h, 1.2 km ahead), Ananya Kapoor
  (61 km/h, 300m ahead), Puneet Sharma (Stopped, fuel station, 2 min),
  Tanya Mehra (60 km/h, alongside), Sameer Khan (Offline, last seen 4 min ago)
- Chat: Rohit "Fuel stop in 5 km, regroup at the dhaba", Ananya "Copy that,
  riding steady", Tanya "Fog near the ghat section, slow down"
- Alerts: Puneet stopped 2 min near KM 214; weather/fog reduced visibility
- Stats: 47 total rides, 3,140 km logged, 98% safety score

## Tech stack

Expo (~52) · React Native 0.76 · TypeScript · React Navigation (stack + bottom
tabs) · Redux Toolkit · React Query (@tanstack/react-query) · Socket.IO client
· react-native-maps · expo-location

State flow (per the Architecture doc): GPS → Socket → Redux → UI.

## How to run

```bash
cd ridesync-mobile
npm install
npx expo start
```

Then open the app in **Expo Go** on your phone, or press `a` for an Android
emulator / `i` for an iOS simulator. For the web preview:

```bash
npx expo start --web
```

> Install note (this workspace): plain `npm install` failed here with an
> `EPERM: chown` error while linking package binaries on the sandbox
> filesystem. The workaround that worked was
> `npm install --no-bin-links --ignore-scripts`. On a normal machine plain
> `npm install` should work.

Typecheck without running the app:

```bash
npm run typecheck   # tsc --noEmit
```

## Maps — device/emulator + API key note

- **Full live maps need a device or emulator.** `react-native-maps` does not
  run on web. On web (`npx expo start --web`) the Convoy Dashboard renders
  a web-safe fallback: a styled placeholder with the route line and member
  positions from the same mock coordinates. This is implemented as a
  platform split — `src/components/ConvoyMap.native.tsx` (real maps) vs
  `src/components/ConvoyMap.web.tsx` (fallback) — so the native-only maps
  code is never bundled for web. A web export (`npx expo export --platform
  web`) was verified to build in this workspace.
- **Google Maps API key (Android):** put your key in `app.json` under
  `expo.android.config.googleMaps.apiKey` (currently the placeholder
  `YOUR_GOOGLE_MAPS_API_KEY_HERE`). No key is bundled in this repo — do not
  commit a real key. Without a key, maps may render with limited tiles.
  iOS uses Apple Maps by default and needs no key.
- Location permission is requested by `expo-location`; the app currently
  simulates movement, so it works without granting it.

## Connecting the real backend (TODO)

1. Build the Node.js + MongoDB backend from the Architecture doc.
2. Set `EXPO_PUBLIC_API_URL` (see `src/api/client.ts`) and
   `EXPO_PUBLIC_SOCKET_URL` + `EXPO_PUBLIC_USE_REAL_SOCKET=1`
   (see `src/socket/socketService.ts`).
3. Replace the mock services in `src/services/mockServices.ts` with real
   calls, and the mock auth in `src/store/slices/authSlice.ts` with real JWT
   auth. Socket events to subscribe to: `location:update`, `member:join`,
   `member:left`, `sos`, `trip:update`, `broadcast`.

## Project structure

```
App.tsx                  Entry (Redux + React Query providers)
app.json                 Expo config (incl. Google Maps API key placeholder)
src/
  theme/                 colors (#007BFF / #00C2FF / #080B12…), typography
  data/mockData.ts       Shared mock trip / members / chat / alerts / stats
  store/                 Redux Toolkit: auth, trip, members, notifications, settings
  api/client.ts          API client stub (TODO: real backend URL)
  services/              Mock auth / trip / profile services
  socket/socketService.ts Simulated socket + real socket.io-client wiring (TODO)
  hooks/                 useAppStore, useRideTimer (simulated live tick)
  components/            PrimaryButton, InputField, TripCard, MemberCard,
                         StatusBadge, SOSButton, VoiceButton, MapControls,
                         GlassCard, NotificationCard, AppHeader, ConvoyMap,
                         SpeedGauge
  navigation/            AppNavigator (stack + bottom tabs), types
  screens/               The 11 screens listed above
  utils/                 format helpers (duration, ETA, km)
```

## Status / honesty notes

- **Not tested on a phone.** This build was typechecked in this workspace
  (see typecheck result in the build report); no device or emulator test
  was run here.
- **Poppins font is not bundled** — no font files were supplied, so the app
  uses the system font. Drop Poppins `.ttf` files into
  `src/assets/fonts/` and load them with `expo-font` to match the design
  system exactly.
