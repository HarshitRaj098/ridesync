# RideSync — Working Charter (agreed 2026-11-24, voice call)

No project code was changed to write this. This is the working agreement
for how RideSync will be fixed, step by step.

## The problem, in the user's words (paraphrased, kept faithful)
- The project is already in progress and already in the user's hands.
  It is not a fresh build.
- The idea / ideology / philosophy behind the buttons and features is
  not in line. The features and buttons themselves are mostly good —
  the main problem is execution.
- Much of the site is vibe-coded, from material received from team members.
  The parts in the different folders are not compatible with each other.
- Some features are on screen but do not align with the backend. They are
  vibe-coded only — they look ready, they do not work.
- We will NOT jump to a new domain or a new solution. We will give the
  existing product a new direction, without letting the ideology clash
  with the problems we are fixing.

## Rules
1. Do not destroy ready-made / working features. Before touching any code,
   name what must keep working, and verify it still works after.
2. Frontend WILL be touched, but only in the aspects agreed for that step.
   No blanket frontend rewrite.
3. Maintain the markers — the already-declared structures and parameters:
   - Dark theme, Primary Blue #007BFF, Cyan #00C2FF, Poppins
   - 11 screens, Convoy Dashboard as the core
   - Manali Mountain Convoy: Bhopal → Manali, 612 km, 12 riders, code A1B2C9
   - Routes, mock login behaviour, SOS flow, broadcast → chat + notifications,
     regroup, end-trip summary — unless a step explicitly agrees to change one
   - Stack: ridesync-web (React + Vite, Vercel), ridesync-mobile (React Native /
     Expo), ridesync-server (Node + Express + Socket.IO + MongoDB), html-prototype
4. One feature at a time, iterative: discuss → agree the sequence →
   implement that one feature → report → verify → then the next.
5. Partition every problem: one issue, one place, one fix. No fixing five
   things inside one change.
6. A report is given for EVERY feature, EVERY time. No silent changes.
   Report format: what was agreed, what changed, what was checked,
   what still does not work, what is next.

## Issue partitions (tracked, not fixed yet)
- Frontend dummy / toast-only buttons: `REVIEW_LIST.md` — 12 items (A1–A12)
- Frontend logic not aligned with its own data: `REVIEW_LIST.md` — 14 items (B1–B14)
- Frontend layout / alignment: `REVIEW_LIST.md` — 6 items (C1–C6)
- Backend + logistics not aligned: `BACKEND_LOGISTICS_REVIEW.md` —
  34 items (A1–A8), in 8 proposed steps

## Proposed sequence (to be confirmed feature by feature)
1. Deploy + persist: Atlas → host server → Vercel env vars → leave mock mode
2. Auth + users: real secret, profile edit, server-side settings, stats on end-trip
3. Trips + join: real distance, leader saved, capacity, private request/approve
4. Live location + separated logic: validated GPS, server distance, alerts
5. Chat / broadcast / notifications
6. Leader controls: regroup point, real end-trip summary
7. SOS + emergency contacts
8. Voice: wire web + mobile to signalling, TURN/STUN

## Root cause (user's perspective, 2026-11-24)
- The site was made in a hurry from the beginning. That is why every
  feature has no conclusion — it starts, it shows on screen, it never
  finishes into a working, finished behaviour.
- The site looks AI-coded. That is a problem in itself: it must be made
  to look and feel professional, not generated.
- Think like the user's innovation, from the user's perspective, not
  from a generic template. Every fix must answer: what does this feature
  conclude for a real rider / leader on a real convoy?

## Conclusion rule — every feature gets a conclusion
Every feature we touch must have, before work starts:
- What "done" means for that feature (its conclusion), in one sentence
- What the user can do after it that they could not do before
- What must still keep working (the ready-made part we protect)
- How we will verify it (build + live check + report)
No feature is closed without its conclusion written in its report.

## Branch / layout rule — separate, do not intersect
- Keep a structured layout. New progress is made on a separate branch
  from earlier progress, so new work does not intersect / overwrite the
  already-made progress.
- Separate the problems: one branch / one partitioned issue at a time.
  Do not mix backend, frontend and logistics fixes in one change.
- New logic is written to conclude the problem, not to replace the
  product's direction.

## Professional polish rule
- Remove the AI-coded look: consistent spacing, alignment, radius,
  button styles, real states (loading / empty / error / done) instead
  of toasts that pretend something happened, no fake QR / fake counts,
  no dead buttons left visible.
- Polish is part of concluding a feature, not a separate cosmetic pass
  at the end — but it never changes the markers (dark theme, #007BFF /
  #00C2FF, Poppins) or the product's direction.

## Status
- 2026-11-24: Charter agreed, root-cause + conclusion/branch/polish rules
  added. No code changed. Waiting for the user to pick the first feature
  to discuss.
