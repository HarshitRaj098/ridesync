# RideSync — HTML Prototype (Track 3)

Quickest win: a single self-contained HTML prototype. Open `index.html` (or
`ridesync__1.html` — same app) directly in a browser. No build step, no backend.

## Run

Open `index.html` in any modern browser. Internet is needed only for the
Poppins font and the Leaflet CDN (map tiles + library); the rest works offline
from the file.

## Files

- `index.html` — the full prototype (copy of `ridesync__1.html`).
- `ridesync__1.html` — the main app, extended from the original 47 KB prototype.
- `login.html` — standalone fixed login page (was a broken stub: missing opening
  `<form>` tag and closing `</form>`). Now styled to the dark Poppins design,
  with `<form action="/login" method="post">`, and a link back to `index.html`.
- `README.md` — this file.

## All 11 screens (in-page, via the bottom nav / buttons)

1. Splash — auto-fades after ~2.6 s (GPS / internet / session checks).
2. Login/Register — `Login / Register` button on Home, avatar/sign-out flows.
   Mock sign-in: any email + password works, nothing is sent anywhere.
3. Home Dashboard — hero, quick actions, Manali trip card, stats.
4. Create Trip — form; "Create Trip" now goes to the Trip Lobby.
5. Join Trip — trip code / QR / link; "Join Trip" now goes to the Trip Lobby.
6. Trip Lobby — countdown (24 min), rider list with Ready states, Start Ride.
7. Convoy Dashboard — Leaflet live map, speed gauge, ride timer, Members /
   Chat / Alerts bottom sheet, SOS modal, push-to-talk voice button.
8. Leader Dashboard — ride-health 98%, online/stopped/separated counts,
   regroup / broadcast / end-trip (mock) actions. Reached from the Lobby.
9. Notifications — bell icon, bottom-nav Alerts tab, "Mark all read".
10. Profile — avatar, stats, ride history; "Settings" link. Reached from the
    top-bar avatar or bottom nav.
11. Settings — toggles (dark theme, location, voice, notifications, SOS,
    satellite map). Reached from Profile.

## Mock data (exactly as specified — no backend, no API keys, no Google Maps key)

- Manali Mountain Convoy, Bhopal → Manali, 612 km, 12 riders, starts in 24 min,
  2026-07-25 06:00.
- Members: Rohit Verma (Leader, 58 km/h, 1.2 km ahead), Ananya Kapoor
  (61 km/h, 300 m ahead), Puneet Sharma (Stopped, fuel station, 2 min),
  Tanya Mehra (60 km/h, alongside), Sameer Khan (Offline, last seen 4 min ago).
- Chat: Rohit "Fuel stop in 5 km, regroup at the dhaba", Ananya "Copy that,
  riding steady", Tanya "Fog near the ghat section, slow down".
- Alerts: Puneet stopped 2 min near KM 214; weather/fog reduced visibility.
- Stats: 47 total rides, 3,140 km logged, 98% safety score.

## Design system

Dark theme, Primary Blue `#007BFF`, Cyan `#00C2FF`, Green `#22C55E`,
Red `#EF4444`, Warning `#F59E0B`, bg `#080B12`, card `#121826`, Poppins.

## What changed vs the original `ridesync__1.html`

- Added the 6 missing screens above (Login/Register, Trip Lobby, Leader
  Dashboard, Notifications, Profile, Settings) as in-page screens with
  shared CSS/JS; original Splash/Home/Create/Join/Convoy Dashboard, Leaflet
  map, speed gauge, timer, Members/Chat/Alerts sheet, SOS modal and voice
  button are unchanged.
- Wired the bell → Notifications, avatar → Profile, bottom-nav Alerts/Profile
  (previously toast-only) to real screens; added a Login/Register button on Home.
- Create Trip / Join Trip now land in the Trip Lobby (was Convoy Dashboard
  directly); Lobby's "Start Ride" opens the Convoy Dashboard.
- Standalone `login.html` fixed and restyled; the in-page auth form also
  carries `action="/login" method="post"` and intercepts submit locally
  (mock) so the file works opened directly.

## Verification performed

- `grep` confirmed all 11 `screen-*` ids exist in `ridesync__1.html` /
  `index.html`; `<form action="/login" method="post">` and matching
  `</form>` present in both `login.html` and the in-page auth screen.
- Python `html.parser` parsed both HTML files without errors; JS brace
  balance checked.
- Not live-rendered in a browser (no browser available to this subagent) —
  please open `index.html` once to eyeball the map (Leaflet CDN) and the
  new screens.
