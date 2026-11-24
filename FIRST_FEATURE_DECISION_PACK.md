# RideSync — First feature: decision pack (DRAFT, no code changed)

Prepared 2026-11-24 evening, for Harshit to pick. Nothing here changes code,
design, markers or the charter — it only closes the loose ends the charter
review flagged: no branch name, 8-step sequence unconfirmed, no measurable
polish checklist, no platform order, and the mock-login clash with Step 2.

Sources: `WORKING_CHARTER.md` (agreed 2026-11-24), `FRONTEND_REVIEW.md`,
`BACKEND_LOGISTICS_REVIEW.md`, `REVIEW_LIST.md`. Live: https://ridesync-ten.vercel.app

## The tension to settle first

The charter's backend sequence says Step 1 is Deploy + persist
(Atlas → host server → Vercel `VITE_API_URL` / `VITE_SOCKET_URL`).
The frontend review asked: conclude Convoy, Join, or Settings first?

Both can be true, if we separate them:
- **First execution step: Deploy + persist.** No Join / Convoy / Settings
  conclusion can be real in mock mode — the request/approve endpoint
  does not exist yet (Backend A2-7), real distance needs a server
  calculation (A2-5), and settings live only in localStorage (A8-32).
- **First feature to discuss: Join Trip.** It is the smallest feature
  whose conclusion can be written now, and it is the one riders actually
  feel first — code, link, QR and request are four doors into one trip
  with no shared logic behind them (Frontend X5).

## The three options, each with its one-sentence conclusion

### A. Join Trip — recommended first feature
- **Done means:** code, invite link, QR and Request all go through one
  join logic — a wrong/blank code is rejected (today blank code still
  joins Manali), a link is actually parsed, a Request is stored, can be
  cancelled, and the leader can see it.
- **After it, the user can:** join the Manali convoy (code A1B2C9) by any
  of the four ways and know which one worked, instead of getting a toast.
- **Must keep working:** mock login, Manali trip, 612 km / 12 riders,
  dark theme #007BFF / #00C2FF, Poppins, all 11 routes.
- **Verify:** build passes + live check — blank code rejected, real code
  joins, request appears and cancels — + a report.
- **Honest limit:** the *real* conclusion (leader approves a stored
  request, capacity check) needs Deploy (Step 1) + the request/approve
  endpoint (Step 3). So Join is discussed first, finished in two layers:
  mock-layer conclusion now, real conclusion after Deploy.

### B. Convoy Dashboard — not recommended first
- **Done means:** one compass, one satellite control, share actually
  copies, camera either works or is honestly removed, SOS does not claim
  contacts were notified when they were not.
- **Why not first:** Convoy owns 7 features at once (map, chat, alerts,
  SOS, voice, speed, ETA — Frontend X1). It is the biggest intersection,
  not one partitioned problem. Concluding it first would mix map, voice
  and SOS fixes in one change, against the charter's one-problem rule.

### C. Settings — not recommended first
- **Done means:** every toggle changes the thing it names, in the app —
  dark theme actually switches, live-location actually hides you on the
  map, notifications actually stop in-app alerts, emergency contacts can
  be edited and are used by SOS.
- **Why not first:** Settings cannot conclude alone — there is no
  settings endpoint and no emergency-contacts model anywhere (Backend
  A8-32, A6-26). Concluding it first would mean building the backend
  for it anyway, while pretending the toggles work.

## Proposed branch names (one branch, one partitioned problem)
- `conclude/deploy-persist` — Atlas → host → Vercel env vars → live site leaves mock mode
- `conclude/join-trip` — one join logic (code / link / QR / request)
- `conclude/convoy-map` — later, map controls only (compass / satellite / share / camera)
- `conclude/settings-controls` — later, after the settings + contacts endpoints exist

## Proposed platform order
1. Server first (deploy + persist) — it unlocks everything else.
2. Web second (`ridesync-web`) — it is live on Vercel and verifiable now.
3. Mobile last (`ridesync-mobile`) — it has never been tested on a real
   phone, and its Google Maps key is still the placeholder
   `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `app.json` (separate pending item),
   so a mobile conclusion cannot be verified yet.

## Proposed professional-polish checklist (measurable, per feature)
A feature is not "done" until all five pass:
1. No toast pretends a real action happened.
2. No fake QR, fake count, or static number presented as live.
3. Real states exist where the feature can fail or be empty:
   loading / empty / error / done — not just a success toast.
4. Spacing, radius and button styles are consistent with the rest of
   the screen; markers unchanged (dark theme, #007BFF / #00C2FF, Poppins).
5. Build passes, live check passes, and the report is written
   (what was agreed, what changed, what was checked, what still does
   not work, what is next).

## Mock-login clash — noted, not solved here
The charter keeps mock login as a marker, but Step 2 (real auth) will
replace it, and the seed trip's leader is the string `'seed-rohit'`,
not a real user id (Backend A8-34). Until Step 2 is agreed, do not build
any new feature that depends on a real user id. Join's mock-layer
conclusion respects this; its real layer waits for Step 2/3.

## What Harshit needs to decide (one reply)
1. Pick one first feature: **Join (recommended)**, Convoy, or Settings.
2. Confirm the sequence: Deploy first, then that feature — or feature
   discussion first, Deploy after.
3. Confirm the branch name for that pick, e.g. `conclude/join-trip`.

No code changes follow until he confirms all three.
