# RideSync — Frontend Review (2026-11-24, voice call)

No project code was changed. Source: re-read of `ridesync-web/src`
(all 11 routes, `components/ui.tsx`, `components/ConvoyMap.tsx`,
`store/store.ts`, `data/mockData.ts`) + `REVIEW_LIST.md`.
Live: https://ridesync-ten.vercel.app

## Verdict in one line
The frontend is not broken as a set of screens — it is broken as a set of
conclusions. Almost every screen shows a feature, but the feature does not
finish: it toasts, it shows a static number, or it does another screen's job.

## 1. Expectation vs actual, screen by screen

### Splash / Login / Register — mostly concluded
- Expectation: enter, sign in, reach Home.
- Actual: works, but mock only — any valid email + 6+ char password signs
  in, stored only in localStorage. No real account is created.
- Intersection: Login and Register both write the same `auth` slice and
  both toast a welcome message; Register's "mock registration" note is
  the only place the user is told this.

### Home — 1 fake, 1 intersecting
- Expectation: see my trip, my stats, start / join / nearby.
- Actual: TripCard + stats render from mock data. Quick Action "Nearby"
  only toasts "Finding nearby groups" — it does not open JoinTrip, even
  though JoinTrip already has the NEARBY_TRIPS list.
- Intersection: Home stats (47 rides / 3140 km / 98%) are the same frozen
  numbers shown on Profile and in the Leader end-trip summary. Three
  screens, one hardcoded source, none of them updated by a real ride.

### Create Trip — 2 not concluded
- Expectation: create a trip, choose a leader, get a shareable code/QR.
- Actual: leader select is shown but never saved in the trip object.
  Distance is always 612 km, from always Bhopal, whatever is typed.
  The Invite QR box is a static graphic — no copy, no share, no link
  to the code that was just created.
- Intersection: Create Trip invents a trip locally, but Join Trip and
  the Lobby only know the seeded Manali trip. A newly created trip
  cannot be joined by code in the same session in any real sense.

### Join Trip — 3 not concluded
- Expectation: join by code, by link, by QR, or request to join a nearby trip.
- Actual: only code is read, and blank code still joins Manali. The
  invite-link field is saved and never read. Scan QR only toasts.
  "Request" only toasts — no request is stored, no leader sees it,
  it cannot be cancelled.
- Intersection: Join, Request and Invite are three different ways into
  the same trip, designed as if they were three different features.
  There is no single "join" logic behind them.

### Trip Lobby — 2 not concluded
- Expectation: see who is in, invite more, start the ride.
- Actual: TripCard click only toasts "You are in the lobby". Invite +
  only toasts "Invite link copied (mock)" — nothing is copied.
- Intersection: Lobby reuses Home's TripCard with a different `onOpen`.
  Same component, different expectation, no shared meaning for a click.

### Convoy Dashboard — the biggest intersection
- Expectation: live map, speed + ETA, members, chat, alerts, SOS, voice.
- Actual: map + simulated movement work (1s tick, 2.5s socket). The rest
  is mixed: two compass buttons, one real satellite toggle, share and
  camera only toast, voice records locally and discards audio, SOS
  toasts that contacts were notified when they were not.
- Intersection, the core problem: this ONE screen owns map, members,
  chat, alerts, SOS, voice, speed gauge, ETA, traffic and recenter.
  A change to any one of them touches the others — e.g. the Voice and
  SOS buttons and the speed gauge all fight for the same bottom-right
  space, and the top compass and the side satellite button both claim
  to control the map style.

### Leader Dashboard — duplicates Convoy
- Expectation: leader-only controls — broadcast, regroup, end trip,
  health, analytics.
- Actual: broadcast and regroup work locally (chat + notifications),
  end trip shows a summary. But health is `98 - separated x 3` while
  the text always says "Convoy healthy" and the summary always says
  98%. "Avg Speed Now" is current speed, not an average.
- Intersection: Leader Dashboard repeats Convoy's broadcast, regroup,
  SOS alerts and member list, with different numbers for the same
  riders (Online 3/5 vs Total Riders 12). Two screens, one convoy,
  two truths. No leader check on the frontend — any rider who opens
  the route sees leader controls.

### Notifications — intersects everything
- Expectation: all alerts in one place, filterable, mark read.
- Actual: filters and mark-read work locally. But notifications are
  written from chat, broadcast, SOS and regroup with no source
  separation, and the Settings notifications toggle does not affect
  in-app notifications at all — only the browser permission check.
- Intersection: the same "Enable browser notifications" button exists
  here AND in Settings, doing the same permission check twice.

### Profile / Settings — settings intersect Convoy, but do nothing
- Expectation: my profile, my stats, my preferences, my emergency contacts.
- Actual: Profile shows frozen mock stats and a Logout that works.
  Settings toggles save to localStorage, but: dark theme has no light
  theme in CSS (nothing changes), live-location toggle does not hide
  your position on the map, notifications toggle does not stop in-app
  notifications, voice toggle only gates the mic button.
  Emergency contacts Edit only toasts "coming soon" — there is no
  contacts data anywhere behind it.
- Intersection: Settings is the control panel for Convoy (voice, location,
  notifications) and for SOS (emergency contacts), but it controls
  neither in practice. Logout exists in both Profile and Settings.

## 2. Intersections — features crossing into features we did NOT design
| # | Crossing | Why it is a problem |
|---|----------|---------------------|
| X1 | Convoy Dashboard owns 7 features at once | Map, chat, alerts, SOS, voice, speed, ETA — one file, one screen, no boundary between them |
| X2 | Leader Dashboard duplicates Convoy | Broadcast / regroup / members / alerts in two places, with different counts and different logic |
| X3 | Settings → Convoy / Notifications / SOS | Toggles claim to control voice, location, notifications, contacts — none of them reach those features |
| X4 | TripCard reused Home / Lobby / Create | Same card, three different click meanings, one of them a toast |
| X5 | Share / Invite / QR / Request | Four entry points into one trip, no shared join logic |
| X6 | Two compasses + one satellite toggle | Two 🧭 buttons + one 🛰️ button all claim the map style; only 🛰️ works |
| X7 | Two Enable-notifications buttons | Settings + Notifications, same check, no effect on in-app list |
| X8 | Two Logout buttons | Profile + Settings, same action, no reason to exist twice |
| X9 | Bottom nav Trips hardcoded | Always `/trips/manali-2026/convoy`, ignores the trip just created or joined |
| X10 | `ui.tsx` is one shared file for everything | Header, nav, TripCard, MemberCard, MapControls, SOS, Voice, Toast, Modal — a change to one shared piece intersects every screen |
| X11 | Notifications written from 4 sources | Chat, broadcast, SOS, regroup all write the same list with no source, no dedupe |
| X12 | Stats frozen in 3 places | Home, Profile, Leader summary all show 47 / 3140 / 98% from the same seed, never updated by a ride |

## 3. What this review does NOT ask for
- No new screen, no new feature, no new colour, no new domain.
- No blanket frontend rewrite. These are the OLD, vibe-coded parts —
  not a new design. Fixing them means giving each one a conclusion
  inside the existing markers (dark theme, #007BFF / #00C2FF, Poppins,
  11 routes, A1B2C9, Manali data), on a separate branch, one at a time.
- The earlier list still stands: `REVIEW_LIST.md` A1–A12 dummy buttons,
  B1–B14 logic mismatches, C1–C6 layout. This file adds the intersections
  (X1–X12) on top of it — it does not replace it.

## 4. Conclusion per frontend area (what "done" must mean)
- Home / Nearby: tapping Nearby shows real nearby trips or goes to Join.
- Create Trip: leader is saved, distance is real for the destination,
  code + link can actually be copied.
- Join Trip: code, link and request each finish — request is stored,
  can be cancelled, leader can see it.
- Lobby: Invite copies a real link + code; TripCard click does something real.
- Convoy: one compass, one satellite control, share copies, camera either
  works or is removed; voice reaches another rider or is honestly labelled local-only.
- Leader: one source of truth for online / total / separated / health;
  leader-only controls are actually leader-only.
- Notifications / Settings: a toggle changes the thing it names, in the
  app, not just in localStorage. Emergency contacts can be edited and are used by SOS.
- Every screen: no toast that pretends a real action happened.
