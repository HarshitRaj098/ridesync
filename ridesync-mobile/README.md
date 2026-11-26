# RideSync — Mobile App (Expo + TypeScript)

Smart Convoy Management Platform for group travel: live map, trip management,
leader controls, group chat, voice, SOS and notifications.

> **No fake data.** Since 2026-11-26 this app shows no seeded trip,
> riders, chat, alerts or stats — every screen starts empty and only
> real local data appears (see "Fake data — removed" below). Your own
> position and speed on the Convoy Dashboard are real GPS via
> `expo-location` (`src/services/locationService.ts` +
> `src/hooks/useUserLocation.ts`). There is no real backend, no real
> accounts, and no real API key in this repo.

## Screens (11)

1. **Splash** — auto-advances (~2.6s)
2. **Login / Register** — local sign-in only (any email + password works; "Continue as Guest" too). No backend, no real account.
3. **Home Dashboard** — hero, quick actions, your trip (or "No trips yet"), real local ride totals (0 until a ride is completed)
4. **Create Trip** — name, from, destination, date/time, type, rider limit, real generated invite code + link
5. **Join Trip** — trip code or invite link; joins the trip on this device, blank/wrong codes rejected inline
6. **Trip Lobby** — pre-ride waiting room for the real trip on this device ("Trip not found" when there is none)
7. **Convoy Dashboard** (core) — live map following your real GPS, speed gauge (GPS speed or 0), bottom sheet with Members / Chat / Alerts, SOS + Push-to-Talk
8. **Leader Dashboard** — ride health / average speed ("—" until a real ride), regroup, broadcast, end trip, analytics
9. **Notifications** — starts empty; mark-all-read
10. **Profile** — the signed-in user + real local ride totals
11. **Settings** — notifications, location sharing, voice, units

## Fake data — removed (2026-11-26)

The seeded data that used to live in `src/data/mockData.ts` was deleted in
full: the "Manali Mountain Convoy" trip (Bhopal → Manali, 612 km, 12 riders,
code `A1B2C9`), the five named riders (Rohit Verma, Ananya Kapoor, Puneet
Sharma, Tanya Mehra, Sameer Khan), the 47 rides / 3,140 km / 98% stats, the
seeded chat, alerts, notifications and nearby trips, and the fake "Sameer
Khan" signed-in user. `src/data/mockData.ts` now holds only types and pure
helpers (trip-code generation, invite links, countdown labels).

**What is real now:**
- Your own position and speed on the Convoy map — real GPS (`expo-location`).
- Trips you create: name / from / to / date / time / rider limit, with a real
  generated 6-character code and invite link. A trip lives in Redux for the
  session only — there is no persistence (no AsyncStorage), so a trip created
  in one session is gone when the app restarts.
- Join by code or invite link, against the trip on this device.
- Chat, broadcast, regroup and end-trip actions on the real trip (chat and
  notifications on this device only).
- Ride totals: +1 ride when a trip is actually ended on this device.

**What is still mock (no backend yet):**
- Local sign-in (any email + password; details stored only on this device).
- SOS is shown on this device only — nobody is messaged.
- Voice (push-to-talk) is not connected.
- Members, chat, alerts and notifications exist only on this device;
  nothing is shared with other riders until the backend is live.
- The simulated socket is gone: `socketService.connect()` is a no-op
  without `EXPO_PUBLIC_USE_REAL_SOCKET=1`, and the ride clock only runs
  while a real trip is live.

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
- **Google Maps API key (Android):** Expo Go needs **no key** — it uses its own
  built-in key, so the map works in Expo Go with no setup. That is why
  `app.json` has **no** `android.config.googleMaps.apiKey` in this repo: a key
  restricted to `app.ridesync` is rejected by Google when the app runs inside
  Expo Go (`host.exp.exponent`), and the map then shows "API key required".
  A key is only needed for a real development/production build (EAS build or
  `npx expo run:android`), where the app runs as `app.ridesync` — add it
  there, locally, as `expo.android.config.googleMaps.apiKey`, and keep it out
  of the public repo. Do not commit a real key.
  iOS uses Apple Maps by default and needs no key.
- Location permission is requested by `expo-location` on the Convoy
  Dashboard: the map follows the rider's **real GPS position** (watch,
  recenter/north-up, real GPS speed on the gauge). If permission is denied
  the map shows a banner instead of pretending; if location sharing is off
  in Settings, GPS stays off. With no GPS fix yet, the map shows a neutral
  default view and a "No GPS fix yet" chip — never a fake position.

## Connecting the real backend

The backend now exists in this repo: `../ridesync-server/` (Node.js +
Express + Socket.IO + MongoDB, JWT auth, demo login
`demo@ridesync.app` / `ridesync123`). To use it:

1. Run the server locally (`cd ../ridesync-server && npm install && npm run dev`, localhost:4000) or deploy it (see its README for Render + Atlas).
2. Set `EXPO_PUBLIC_API_URL` (see `src/api/client.ts`) and
   `EXPO_PUBLIC_SOCKET_URL` + `EXPO_PUBLIC_USE_REAL_SOCKET=1`
   (see `src/socket/socketService.ts`).
3. Replace the mock services in `src/services/mockServices.ts` with real
   calls, and the mock auth in `src/store/slices/authSlice.ts` with real JWT
   auth. Socket events to subscribe to: `location:update`, `member:join`,
   `member:left`, `sos`, `trip:update`, `broadcast`.

## App assets

`src/assets/` now has a generated app icon (`icon.png`, 1024×1024), splash
screen (`splash.png`) and `favicon.png` in the RideSync dark-blue/cyan
style, matching `app.json`. These are PNG binaries, so they were uploaded
to GitHub through the web UI rather than the text-only snapshot push.

## Project structure

```
App.tsx                  Entry (Redux + React Query providers)
app.json                 Expo config (incl. Google Maps API key placeholder)
src/
  theme/                 colors (#007BFF / #00C2FF / #080B12…), typography
  data/mockData.ts       Types + pure helpers only (fake data removed 2026-11-26)
  store/                 Redux Toolkit: auth, trip, members, notifications, settings
  api/client.ts          API client stub (TODO: real backend URL)
  services/              Local auth / trip services (TODO: real backend)
  socket/socketService.ts Socket.io-client wiring (no-op without a real backend)
  hooks/                 useAppStore, useRideTimer (real ride clock), useUserLocation (real GPS)
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
  was run here. The GPS follow / recenter / share / permission-banner
  behaviour needs Expo Go on a real phone to verify.
- **Trips are session-only.** A trip created in the app disappears when
  the app restarts (no AsyncStorage yet). Join-by-code only works for the
  trip on the same device.
- **Poppins font is not bundled** — no font files were supplied, so the app
  uses the system font. Drop Poppins `.ttf` files into
  `src/assets/fonts/` and load them with `expo-font` to match the design
  system exactly.
