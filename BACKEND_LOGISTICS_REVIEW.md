# RideSync — Backend + Logistics Review (no code changed)

Date: 2026-11-24. Scope: backend (`ridesync-server`) and logistics only.
Frontend is OUT of scope by the user's instruction — no frontend code was changed.
Live web site is still in mock mode: no MongoDB Atlas, no deployed server,
no `VITE_API_URL` / `VITE_SOCKET_URL` set on Vercel.

## What already exists in the backend (verified in code)
- Node.js + Express + Socket.IO + Mongoose, JWT auth (`/api/auth/login|register|me`)
- Trips: create, list, get, join by code, members, chat, SOS, broadcast, regroup, end
- Users: stats, trip history. Notifications: list, mark read.
- Socket rooms `trip:<tripId>`, events: trip:join/leave, location:update,
  chat:message, sos, voice:offer/answer/ice-candidate (signalling only)
- Two stores behind one interface: MemoryStore (default, seeded Manali convoy)
  and MongoStore (only when `MONGODB_URI` is set — untested, no Atlas yet)

## A. Functions not in line / not aligning — backend + logistics

### A1. Not deployed, not persisted — the biggest gap
1. Server is not hosted anywhere (no Render/host). Live site cannot reach it.
2. No MongoDB Atlas cluster / connection string. Memory mode loses ALL users,
   trips, chat, SOS and locations on every restart.
3. Vercel has no `VITE_API_URL` / `VITE_SOCKET_URL`, so web + mobile never
   call the real API/socket — they fall back to simulated data.
4. Mobile has no real API client in use at all — `mockServices` only,
   `EXPO_PUBLIC_API_URL` is unused.

### A2. Trips / join logic — frontend and server disagree
5. Distance is client-supplied and trusted: server accepts any `distanceKm`.
   Frontend always shows 612 km Bhopal → Manali whatever destination is typed.
   No geocoding / route-distance calculation anywhere.
6. Leader is not saved by the frontend trip flow, but the server DOES save
   `leaderId` on create — the two flows never meet in mock mode.
7. Join: no capacity check (trip `riders` limit is ignored), no private-trip
   approval flow. Frontend "Request" button has NO backend endpoint at all.
8. Join code: server checks code against the trip being joined, frontend
   checks only A1B2C9 / blank code still joins Manali. No invite-link
   parsing — frontend link field is never read.
9. No trip update / cancel / delete endpoint. No list filtering — `GET /api/trips`
   returns EVERY trip to ANY logged-in user. `GET /api/trips/:id` has no
   membership check either.
10. Riders count is inconsistent: server increments `riders` on join, but seed
    trip says 12 riders with only 5 named members; frontend shows 12 / 5 / 3
    online at the same time. No single source of truth.

### A3. Live location / convoy logistics — no server-side logic
11. `location:update` accepts any lat/lng/speed, no validation, no bounds,
    no timestamp from the device, no speed sanity check.
12. No distance-from-leader calculation on the server. Frontend calculates it
    locally, and the member `note` ("58 km/h · 1.2 km ahead") is static while
    live speed/distance change every second.
13. No separated-rider detection on the server. Frontend counts Stopped
    (Puneet) and Offline (Sameer) as "separated" even under 2 km, so it
    always shows 2 separated. No alert is generated server-side when a rider
    actually falls behind.
14. No offline/stopped timeout: a rider who disconnects is marked offline
    only on socket disconnect, with no grace period and no "last seen" time.
15. Locations in Mongo: every update creates a NEW Location document —
    unbounded growth, no TTL, no aggregation, no latest-position index use.
    MemoryStore keeps only the latest position (different behaviour per mode).
16. No route / ETA logic on the server: ETA, remaining km and distance
    covered are all computed in the frontend from mock numbers.
17. No fuel stops / regroup points / waypoints model at all — regroup is just
    a status flip (see A5).

### A4. Chat / broadcast / notifications
18. Chat has no pagination — `listChat` returns the whole history.
19. Broadcast: server checks leader, but frontend broadcast also writes a
    local chat message + notification, so in mock mode it can double-appear.
20. No push notifications (no FCM / APNs). Only in-app DB rows + frontend
    `browserNotify`. No "mark all read" endpoint.
21. Notifications are only created for SOS and broadcast. No notification for
    separated rider, member joined/left, regroup, or trip ended.

### A5. Leader controls — regroup / end trip
22. Regroup (`POST /:id/regroup`): no leader check — ANY member can call it.
    It only flips `stopped` members to online at a fixed 55 km/h with a
    hardcoded note. No regroup point, no distance, no confirmation from riders.
23. End trip (`POST /:id/end`): no leader check either. Summary is partly
    hardcoded — `safetyScore: 98` always, regardless of separated riders.
24. No "start trip / go live" transition: seed trip is hardcoded `status: live`,
    created trips stay `upcoming` forever — nothing moves them to live.

### A6. SOS + emergency contacts — the safety gap
25. SOS on the server only writes an alert + in-app notifications to trip
    members and emits a socket event. It does NOT contact anyone outside the app.
26. There is NO emergency-contacts model, endpoint, or storage anywhere.
    Frontend Settings "Edit" is a dead button for this reason — there is
    nothing behind it. No SMS / call / email to contacts.
27. SOS has no acknowledgement: leader cannot confirm "help on the way", and
    the sender gets no delivery receipt.

### A7. Voice (push-to-talk)
28. Server is signalling-only (WebRTC offer/answer/ICE relay). No TURN/STUN
    config, no media server — voice will fail across most mobile networks.
29. Web frontend does NOT use the signalling at all: it records the mic
    locally and discards the audio. Mobile only toggles a boolean.
    So "push-to-talk" exists in three different, unconnected forms.

### A8. Auth / users / settings
30. JWT dev fallback secret (`ridesync-dev-secret-change-me`) is used when
    `JWT_SECRET` is unset. No refresh token, no logout/blacklist, no password
    reset, no email verification.
31. No rate limiting on login/register, no account lockout.
32. No profile-edit endpoint, no avatar, no settings endpoint — all settings
    (theme, live location, notifications, voice) live only in browser
    localStorage, so they do not follow the user to another device.
33. User stats (`totalRides`, `kmLogged`, `safetyScore`) are never updated by
    real rides — they are seeded (47 / 3140 / 98) and stay frozen. End-trip
    does not update them.
34. Seed data mismatch: seed trip `leaderId` is the string `'seed-rohit'`,
    which is not a real user id — leader checks against the seed trip can fail.

## B. Proposed iterative sequence (one feature at a time, in order)
1. Deploy + persist: Atlas cluster → host server (Render) → set Vercel
   `VITE_API_URL` + `VITE_SOCKET_URL` → verify live site leaves mock mode.
2. Auth + users: real JWT secret, profile edit, settings stored server-side,
   stats updated on end-trip.
3. Trips + join: real distance (geocode/route), leader saved, capacity +
   private-trip request/approve endpoint, invite-link parsing, membership
   checks on every trip read.
4. Live location + separated logic: validate GPS, server-computed distance
   from leader, separated threshold + alert, offline timeout + last-seen.
5. Chat / broadcast / notifications: pagination, mark-all-read, notifications
   for join/leave/separated/regroup/end.
6. Leader controls: leader-only regroup + end, real regroup point, real
   end-trip summary (real distance, riders, safety score from events).
7. SOS + emergency contacts: contacts model + endpoints, SOS acknowledgement,
   then an SMS/call channel for contacts.
8. Voice: wire web + mobile to the existing signalling, add TURN/STUN, test
   phone-to-phone.

## C. What stays unchanged in this review
- No frontend code was changed. No design, colour, route or copy was changed.
- Frontend review list remains at `REVIEW_LIST.md` (12 dummy buttons,
  14 logic-alignment items, 6 layout items) — separate from this backend list.
