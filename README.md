# pestkillwebsite

Website and operations console for **PestKill Pest Solutions**, Jaipur.

- `frontend/` — React + Vite website, customer dashboard, staff console, printable invoices and certificates
- `backend/` — Express API on PostgreSQL, role-based access control and audit logging. In production it also serves the built website.

## Run locally

```bash
# 1. Backend
cd backend
cp .env.example .env          # set JWT_SECRET to a long random value; leave DATABASE_URL empty
npm install
npm run create-owner          # creates your Owner login (asks for name, email, mobile, password)
npm start                     # API on http://localhost:5000

# 2. Frontend (second terminal)
cd frontend
npm install
npm run dev                   # website on http://localhost:3000
```

Without `DATABASE_URL` the backend uses an embedded PostgreSQL stored in `~/.pestkill/pglite`
(your home folder — outside the project, so OneDrive/Dropbox cannot lock or upload it; override
with `PGLITE_DIR`). Only one process can open it at a time. Set `DATABASE_URL` to use a real
PostgreSQL server instead — the SQL is identical.

## Deploy on Render (free) with Neon PostgreSQL (free)

1. **Database** — create a free project at [neon.tech](https://neon.tech) and copy the
   **connection string** (`postgresql://…?sslmode=require`).
2. **Website** — on [render.com](https://render.com): **New → Blueprint**, choose this repo.
   `render.yaml` sets everything up; fill in the values it asks for:
   - `DATABASE_URL` — the Neon connection string
   - `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PHONE`, `OWNER_PASSWORD` — your Owner login
3. After the deploy, sign in at `/login` with `OWNER_EMAIL` and `OWNER_PASSWORD`. While these two
   are set, that account is always an active Owner and that password always works — to change the
   password, edit `OWNER_PASSWORD` in Render and save (Render restarts the site). The Render logs
   show `Owner login created/ready/updated` on every start, or why it was not set.

Manual setup instead of a Blueprint (New → Web Service, Root Directory left empty):

| Setting | Value |
|---|---|
| Build Command | `npm install` (or `npm run build`) |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Environment | `DATABASE_URL`, `TRUST_PROXY=1`, `OWNER_*`; optional `JWT_SECRET` (32+ random characters) |

The root `package.json` builds the frontend and installs the backend; `npm start` runs the server,
which also serves the website. Without `JWT_SECRET`, a random signing key is generated once and kept
in the database. On Render the server refuses to start without `DATABASE_URL`, because Render's disk
is wiped on every deploy (set `ALLOW_TEMPORARY_DB=1` only for a throwaway demo).
Do not set `NODE_ENV=production` at build time (the frontend build needs its dev tools).
Render's free web service sleeps after 15 minutes without visitors; the first visit after that
takes about a minute. Data is safe in Neon either way.

**Moving old data:** `npm run migrate-sqlite` (in `backend/`, with `DATABASE_URL` set) copies an old
`pestkill.db` SQLite file into PostgreSQL. It needs `npm install better-sqlite3 --no-save` first.

## Roles

| Role | Access |
|------|--------|
| Owner | Everything: analytics, bookings, schedule, invoices, customers, team, permissions, audit log, revenue |
| Manager | Only what the owner grants in **Admin → Permissions**. Managers can never create staff, change roles, see revenue or edit permissions. |
| Technician | Own assigned jobs: visit details, directions, visit report, mark completed |
| Client | Own bookings, invoices, treatment certificates, complaints, orders and profile |

Permissions are checked on the server for every request, and changes apply immediately.
Customers see bookings and invoices linked to their account (bookings made while signed in,
or invoices created from those bookings).

## Sign-up checks

- **Email OTP:** a 6-digit code is emailed before the account is created (valid 10 minutes, 5 tries,
  resend after 60 s, max 5 codes/hour per email, rate-limited per IP; stored only as a hash). Free with
  Gmail: set `GMAIL_USER` and `GMAIL_APP_PASSWORD` (Google Account → Security → 2-Step Verification →
  App passwords). Locally without these, the code is shown on screen; the live site refuses sign-ups
  until they are set.
- **Real emails only:** temporary inboxes (mailinator, yopmail, 10minutemail…) and common typos
  (gmial.com) are rejected; on the live site the domain must accept mail (DNS MX check).
- **Real mobiles only:** exactly 10 digits starting 6–9 (optional +91), no fakes like 9999999999 /
  9876543210 / 9898989898, and one account per number.
- **Abuse filter:** names, firm names, booking/career forms and complaints reject abusive words in
  English, Hinglish and Devanagari (including tricks like ch00tiya, f.u.c.k), fake names (test, asdf),
  names with numbers, and staff-looking names (Admin, PestKill). Real names such as Gandhi, Shital or
  Chodankar are not affected. Word lists: `backend/src/utils/antiAbuse.js`.
- SMS OTP for mobile numbers can be added later (Fast2SMS / MSG91); the `phone_verified` column is ready.

Run the backend tests with `npm test` in `backend/`.

## PCO shop

`/shop` sells professional products (Envu, Syngenta, Heranba, Arbuda) to **licensed pest control
operators only**:

1. A buyer creates an account and applies at `/pco-account` with firm name, licence number and address.
2. The owner (or a manager with **PCO buyer accounts** permission) approves it in **Admin → PCO buyers**.
3. Approved buyers check out from the cart; orders appear in **Admin → Shop orders**. Payment is
   cash on delivery, UPI or bank transfer, confirmed by phone. Cancelling an order returns stock.

Prices: everyone sees the **MRP** (inclusive of taxes). An optional **PCO price** (≤ MRP) is shown only
to approved buyers. Products without an MRP show "Price on request" with a WhatsApp quote button.

**Managing prices, offers and photos (Admin → Products):**
- Click a product to edit everything, set an **offer** (price below MRP, offer name, end date — shown to
  everyone with "% off" until the end of that day in IST), or drag a new photo onto it.
- **Edit prices & offers** opens a spreadsheet-style editor for the products currently filtered: change
  MRP, offer, PCO price and stock inline, fill "10% off" for a whole brand/category in one click, change
  photos per row, then **Save** — all rows are saved together, or none if any row is invalid.
- Customers always pay the lowest of MRP, a running offer and (for approved buyers) the PCO price.

The catalogue (`backend/src/data/productSeed.js`, 144 packs) and the official brand pack photos
(`backend/src/data/product-images/`) are loaded on start-up whenever `CATALOG_VERSION` increases. New
products are added; products you have edited in the console are never overwritten. MRPs taken from public
listings are marked **"Check"** until you tick "I have checked this MRP against the printed pack";
products without an MRP show "Price on request". Stock left empty means "not tracked".

## Customer trust features

- **Warranty Wallet**: in *My account*, each completed booking shows how many warranty days are left, based on
  the warranty you enter when you complete the job (for example "90 days" or "1 year"). While the warranty is
  active, the customer can ask for a free re-treatment with one tap. Requests appear in
  **Admin → Warranty claims**, where you can schedule a visit, mark it resolved, or decline it with a note.
  Only one claim per booking can be open at a time.
- **Service proof photos**: technicians add before and after photos from **My jobs**. Managers add them from the
  booking drawer. The limit is 8 photos per job. Customers see the photos, the visit report and the products used
  under *Service proof*.
- **QR-verified certificates**: each treatment certificate has a QR code that opens `/verify/<booking ref>`.
  The page shows whether the certificate is genuine and gives the service, date and warranty. The customer's
  name is partly hidden and the phone number and address are never shown.
- **Pest Identifier** (`/pest-identifier`): five quick questions give the likely pest, how serious it is, and
  the starting price. Customers can then book or send a photo on WhatsApp.
- **Safe Home plan**: when booking, customers can tick kids, pets, elders, pregnancy, asthma or an aquarium. Their
  booking then shows a prep checklist and a suggested re-entry time. This is general guidance. The technician's
  advice and the product label always come first.

Run `npm test` in `backend/` to run the API tests, which cover these features.

## Search engines (SEO)

- **Pre-rendered pages**: `npm run build` in `frontend/` builds the app, then renders every public page (about
  100) to plain HTML (`scripts/prerender.mjs`). Google, Bing, WhatsApp and Facebook see the full content, title
  and description without running JavaScript. React then takes over the same HTML in the browser.
- **One source for page metadata**: `frontend/src/seo/meta.js` sets each page's title, description, canonical
  link and structured data (LocalBusiness, Service with prices, FAQ, BreadcrumbList, BlogPosting, Product). The
  browser, the pre-renderer and the sitemap all read from it.
- **Rajasthan city pages**: `frontend/src/data/rajasthan.js` holds the city pages at `/pest-control/<city>`.
  Each page shows local pests, the peak season, prices, areas covered, nearby cities, FAQs and a Hindi section.
  To add a city, add an entry to that file. To remove one, delete its entry. The old URLs (`/jaipur`, `/kota`, …)
  permanently redirect to the new pages.
- **Server** (`backend/src/seo.js`):
  - `/sitemap.xml` lists the pages and the shop products. `/robots.txt` points to the sitemap.
  - Unknown pages return a real 404.
  - URLs with a trailing slash and moved URLs redirect with a 301.
  - Product pages get their title and description from the database.
- **Settings on Render**:
  - Set `SITE_URL` to your final address, for example `https://www.your-domain.in`. Requests to any other host,
    such as `*.onrender.com`, then redirect to it, and the sitemap and canonical links use it.
  - Optionally, set `GOOGLE_SITE_VERIFICATION` to verify the site in Google Search Console.
- Add your Google Business Profile, Facebook and Instagram links to `socialProfiles` in
  `frontend/src/data/businessConfig.js`.

## Where website forms go

Book Online, inspection, quote, contact and careers forms are saved to the database and appear in
**Admin → Bookings / Applications**. If the API cannot be reached, the form falls back to WhatsApp
so no enquiry is lost.
