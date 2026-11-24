# RideSync Web — Review List (for user approval, no code changed yet)

Date: 2026-11-24. Source: code audit of `ridesync-web/src` — all 11 routes, `components/ui.tsx`, `components/ConvoyMap.tsx`, `index.css`, `store/store.ts`, `data/mockData.ts`.
Live: https://ridesync-ten.vercel.app — Build verified earlier: pass, 225 modules, 879ms.

## Rules for this work (user's words, kept as-is)
1. Dummy buttons ko real function se jodo — sirf toast dikhana kaafi nahi.
2. Design thoda update karo, alignment fix karo.
3. Logic aur features ke saath koi chhedchhad nahi — output same hona chahiye.
4. Design ka basic basis wahi rahe: dark theme, Primary Blue #007BFF, Cyan #00C2FF, Poppins.
5. Pehle poori list banao, isi chat mein review karenge, phir ek baar mein poora structured layout do.

## A. Dummy / toast-only buttons (click par sirf toast, koi real kaam nahi)
| # | Kahan | Button | Abhi kya karta hai | Fix ka matlab (logic same rakhte hue) |
|---|-------|--------|-------------------|--------------------------------------|
| A1 | Har page — AppHeader (`ui.tsx:267`) | ☰ Menu | `showToast('Menu coming soon')` | Real menu khole — Home / Trips / Notifications / Profile / Settings links, wahi routes |
| A2 | Convoy — MapControls (`ui.tsx:313`) | 🧭 Compass | Sirf toast 'Compass: heading north' | Map ko north par reset kare (Recenter jaisa real action), ya button hatao |
| A3 | Convoy — MapControls (`ui.tsx:319`) | 🔗 Share live location | Sirf toast 'Live location shared' | Real share: invite link + trip code A1B2C9 copy kare (clipboard), nahi to button hatao |
| A4 | Convoy — MapControls (`ui.tsx:320`) | 📷 Camera | Sirf toast 'Camera opened' | Camera kholta hi nahi — ya to hatao, ya photo capture ka real flow do (mock mein bhi state dikhe) |
| A5 | Home (`Home.tsx:39`) | 📍 Nearby | Sirf toast 'Finding nearby groups' | Nearby trips ki list dikhaye (JoinTrip wale NEARBY_TRIPS data se), ya Join page par le jaye |
| A6 | Join Trip (`JoinTrip.tsx:62`) | 📷 Scan QR Code | Sirf toast 'Opening camera scanner (mock)' | QR scan ka real attempt (camera) ya button hatao; code se join hi main flow rahe |
| A7 | Join Trip (`JoinTrip.tsx:75`) | Nearby trips — Request | Sirf toast 'Request sent to leader' | Request ki state save ho (Requested ✓ dikhe), dobara click par cancel ho — data store mein |
| A8 | Trip Lobby (`TripLobby.tsx:35`) | Invite + | Sirf toast 'Invite link copied (mock)' — clipboard copy nahi hota | Real clipboard copy: invite link + code A1B2C9, 'Copied ✓' dikhe |
| A9 | Trip Lobby (`TripLobby.tsx:26`) | TripCard click | Sirf toast 'You are in the lobby' | Card click ka koi matlab nahi lobby mein — click disable karo ya details expand karo |
| A10 | Settings (`Settings.tsx:56`) | Emergency contacts — Edit | Sirf toast 'Emergency contacts editor coming soon' | 2 contacts ka real editor (naam/number, localStorage mein save) ya Edit hatao |
| A11 | Create Trip | Invite QR box | Static nakli QR graphic, koi share/copy nahi | Trip ka code + link copy button do; QR graphic ko code se jodo |
| A12 | TripCard (`ui.tsx:197`) | ••• (three dots) | Plain text, click par kuch nahi | Ya to menu khole (Open lobby / Open map / Share) ya ••• hatao |

## B. Logic ke saath align nahi hone wale features (output same rahe, andar ka mismatch fix ho)
| # | Kahan | Mismatch |
|---|-------|----------|
| B1 | Convoy top compass (`ConvoyDashboard.tsx:130`) | Button toast mein 'Standard/Satellite view' bolta hai par `satOn` toggle hi nahi karta — MapControls wala satellite button hi toggle karta hai. Dono ka kaam ek jaisa hona chahiye. |
| B2 | Settings — Dark theme toggle | Toggle store mein save hota hai par CSS mein light theme hai hi nahi — on/off karne par screen par kuch badalta nahi. |
| B3 | Settings — Live location sharing toggle | Toggle save hota hai par map/socket par koi asar nahi — location sharing band karne par bhi apni position dikhti rehti hai. |
| B4 | Settings — Notifications toggle | Sirf browserNotify check karta hai; in-app notifications par toggle ka asar nahi. |
| B5 | Create Trip — Leader select | Leader choose hota hai par banne wale trip object mein leader save hi nahi hota — sirf neeche text mein dikhta hai. |
| B6 | Create Trip — Distance | Destination kuch bhi ho, distance hamesha 612 km aur from hamesha Bhopal. |
| B7 | Join Trip — Invite link input | Link field ka value save hota hai par Join button use padhta hi nahi — sirf code check hota hai. Khali code par bhi Manali join ho jata hai. |
| B8 | Riders count — 12 vs 5 | Trip mein 12 riders, live mein sirf 5 named members. Leader Dashboard mein 'Online 3/5' aur 'Total Riders 12' — denominator alag-alag. Convoy/Lobby mein '+7 more' likha hai, Home mein 12. Ek hi hisaab hona chahiye. |
| B9 | Member note vs live position | `tick()` har second lat/lng aur speed badalta hai, par member ka note static hai ('58 km/h · 1.2 km ahead') — live speed/distance se match nahi karta. Tooltip mein live distance sahi hai, note mein nahi. |
| B10 | Leader — 'Avg Speed Now' | Ye current speed hai, average nahi — label galat hai. |
| B11 | Leader — Health / Safety score | Health score `98 - separated×3` se banta hai, par text hamesha 'Convoy healthy' aur summary/analytics mein safety hamesha hardcoded 98%. |
| B12 | Separated logic | Stopped (Puneet) aur Offline (Sameer) ko bhi 'Separated' mana jata hai, chahe distance 2 km se kam ho — isliye hamesha 2 separated dikhte hain. |
| B13 | Bottom nav — Trips | Trips button hamesha hardcoded `/trips/manali-2026/convoy` par jata hai, chahe naya trip banaya ho ya current trip kuch aur ho. |
| B14 | Convoy — Voice + SOS position | Voice button ka wrapper right-bottom mein hai, SOS bhi right-bottom 220px par — CSS mein `.voice-fab` left-bottom bhi likha hai, dono rules ladte hain. Speed gauge (bottom 236px) bhi usi zone mein hai. |

## C. Design / layout update (logic nahi badlega)
| # | Kya |
|---|-----|
| C1 | Convoy Dashboard: map controls (compass/recenter/satellite/traffic/share/camera) ek hi column, ek hi size, overlap nahi; speed gauge + ETA chip + Voice + SOS + bottom sheet (210px collapsed) ke beech clear gap. |
| C2 | Bottom sheet tabs (Members / Chat / Alerts) — count aur active state hamesha sahi dikhe; chat input sirf Chat tab mein. |
| C3 | Header (back/menu, bell + unread dot, avatar) aur Bottom nav — har page par ek jaisi height, spacing, active colour. |
| C4 | Cards, buttons, inputs, toggles — ek hi radius, padding, font size; primary button hamesha Blue→Cyan gradient, danger hamesha red, ghost hamesha transparent. |
| C5 | Home Quick Actions (4), stats grid (3), Leader grid (2 column) — mobile par overflow/text-cut nahi. |
| C6 | Toast/modal/sheet z-index aur safe-area — toast bottom nav ke upar dikhe, modal sheet ke upar. |

## D. Jo bilkul same rahega (output same)
- 11 routes aur unke naam, join code A1B2C9, mock login (koi bhi valid email + 6+ char password), Manali convoy data (Bhopal → Manali, 612 km, 12 riders), live simulated movement (1s tick, 2.5s socket), SOS flow, real push-to-talk mic, broadcast → chat + notifications, regroup, end-trip summary, notification filters, settings save (localStorage).
- Design basis: dark theme, #007BFF / #00C2FF, Poppins. Koi naya feature, naya page, naya colour nahi.

## E. Kaam ka order (review ke baad, ek baar mein)
1. List approve ho → A1–A12 dummy buttons fix + B1–B14 logic alignment fix + C1–C6 layout fix, ek hi pass mein.
2. `npm run build` verify.
3. GitHub push (HarshitRaj098/ridesync) → Vercel auto-deploy, live link check.
