# Emergency Blood Donor & SOS Alert Directory - Backend

Node.js + Express + MongoDB (Mongoose) + Socket.IO. JWT auth, bcrypt passwords.

## Run
```bash
cd backend
cp .env.example .env        # edit MONGO_URI, JWT_SECRET, CLIENT_URL
npm install
npm run seed:admin          # creates the admin account from .env
npm run dev                 # http://localhost:5000
```
`CLIENT_URL` accepts a comma-separated list (add your Figma Make preview URL) or `*` while developing.

## Auth
Send `Authorization: Bearer <token>` on every endpoint except register/login/health.
All errors: `{ "message": "...", "errors": [...]? }` with 400/401/403/404/500.

## Endpoints
| Method | Path | Access | Body / Query | Returns |
|---|---|---|---|---|
| GET | /api/health | Public | | `{status:"ok"}` |
| POST | /api/auth/register | Public | name, email, phone, password(min 6), bloodGroup, locality, city?, pincode? | `{token, user}` |
| POST | /api/auth/login | Public | email, password | `{token, user}` |
| GET | /api/auth/me | Logged in | | `{user}` |
| GET | /api/donors | Logged in | ?bloodGroup (exact) or ?compatibleWith=<patient group> (donors who can give to it), &locality &available=true &page &limit | `{total,page,limit,donors[]}` each donor has `contact:{tel,whatsapp}` |
| PUT | /api/donors/profile | Logged in | any of name, phone, bloodGroup, locality, city, pincode | `{user}` |
| PATCH | /api/donors/availability | Logged in | - | `{isAvailable}` or 400 `{message, daysRemaining}` (90-day cooldown) |
| PATCH | /api/donors/donated | Logged in | sosRequestId? | `{message, user}`; sets unavailable for 90 days |
| GET | /api/donors/history | Logged in | | donation list |
| POST | /api/sos | Logged in | patientName, bloodGroupNeeded, unitsNeeded?, hospitalName, hospitalAddress?, locality, urgency? (`critical`/`within 24h`/`planned`), contactName?, contactPhone?, relation? | 201 `{sos, matchedDonors}` |
| GET | /api/sos/active | Logged in | ?bloodGroup (group needed) &canDonate=<my group> (only requests I can help with) &locality | active, non-expired SOS[] (each with `contact`) |
| GET | /api/sos/mine | Logged in | | SOS posted by me |
| GET | /api/sos/:id | Logged in | | one SOS |
| PATCH | /api/sos/:id/fulfill | Owner/Admin | | updated SOS |
| DELETE | /api/sos/:id | Admin | | `{message}` |
| GET | /api/admin/stats | Admin | | `{donors, verifiedDonors, activeSOS, fulfilled, expired}` |
| GET | /api/admin/donors/pending | Admin | | unverified donors[] |
| PATCH | /api/admin/donors/:id/verify | Admin | | `{message,id}` |
| GET | /api/admin/sos | Admin | | all SOS (any status) |

Blood groups: `A+ A- B+ B- O+ O- AB+ AB-`.
SOS expiry: 24h for critical / within 24h, 72h for planned (a background job flips them to `expired` every 5 min).

## Blood compatibility
An SOS is matched and broadcast to every available donor in the locality whose group can give to the patient
(red blood cell rules, derived from A/B/Rh antigens in `utils/bloodCompatibility.js`):

| Patient needs | Donor groups alerted |
|---|---|
| O- | O- |
| O+ | O+, O- |
| A- | A-, O- |
| A+ | A+, A-, O+, O- |
| B- | B-, O- |
| B+ | B+, B-, O+, O- |
| AB- | AB-, A-, B-, O- |
| AB+ | all 8 groups |

`POST /api/sos` also returns `compatibleGroups` and `alertedOnline`. This only speeds up donor discovery; the hospital
still screens and cross-matches every donation.

## Real-time (Socket.IO)
Connect with `io(API_ORIGIN, { auth: { token } })`. The server puts you in the room for your own
locality + blood group automatically.
- Server -> client `socket:ready` `{room}`
- Server -> client `sos:new` (SOS object incl. `compatibleGroups`, only to compatible donors in that locality)
- Server -> client `sos:fulfilled` `{id}` (everyone)
- Server -> client `sos:removed` `{id}` (everyone)

If a donor edits locality/blood group, reconnect the socket so the room updates.
