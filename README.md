# TOBLI — Location-Based Business Discovery

A premium location-based business discovery platform built with React, Vite, and Supabase. Tobli lets users find nearby businesses on a live map, view product listings and prices, and contact businesses directly — all from a single interface.

## Tech Stack

| Layer              | Technology                                      |
|--------------------|--------------------------------------------------|
| **Frontend**       | React 19 + Vite 7 + Tailwind CSS + Framer Motion |
| **Routing**        | React Router v6                                  |
| **State**          | Zustand & TanStack React Query                   |
| **Backend**        | Supabase (Postgres, Auth, RPC)                   |
| **Maps**           | Leaflet with custom dark-mode tiles              |
| **Excel I/O**      | SheetJS (`xlsx`)                                 |
| **Icons**          | Lucide React                                     |
| **Deployment**     | Any static host (Vercel, Netlify, Cloudflare)    |

> Legacy Cloudflare D1 workers and cron scripts remain in `functions/` and `src/cron.js` but are **no longer used** by the current Supabase-powered application.

---

## Features

### User's Page (Map View)
- **Live map** with dark-mode CartoDB tiles centered on the user's GPS location.
- **Search bar** with typewriter prompt — searches items across all businesses via Supabase RPC.
- **Nearest-first results** — ranked by distance from the user; cycle through alternatives with "Next Alternative".
- **Business pop-up sheet** showing product name, price, business name, and contact links (WhatsApp, Call, Instagram, X, Website, Directions).
- **Dynamic routing line** — a dashed polyline connects the user to the selected business, and the map auto-zooms to fit both.
- **"+Add" button** for quick signup/login access.

### Business Dashboard (`/dashboard`)
- **Header**: Business name (left), colored Open/Closed toggle (center), Logout button (right).
- **Overview Tab**: Subscription status, open/closed status, goods/services count, map appearance count.
- **Listings Tab**: Add/remove items with name, type, price, and availability. Search items, export an Excel template, or bulk-upload via `.xlsx`.
- **Business Info Tab**: Edit owner name, business name, contacts (WhatsApp, Phone, Instagram, X, Website), bio, and pin your GPS location.
- **Subscription Tab**: View expiry date, last payment date, and trigger a renewal.

### Admin Dashboard (`/admin`)
- **Overview Tab**: Registered businesses, live (open) businesses, live users on map, income for the month.
- **Businesses Tab**: Table with Owner Name, Business Name, Phone, Email, Open Status, Payment Status, and suspend/activate actions.
- **Transactions Tab**: Lists all subscription payments with export-to-CSV.

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

- Sign in at [app.supabase.com](https://app.supabase.com) and create a new project.
- Note the **Project URL** and **anon/public API key**.

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Never** commit sensitive keys. The service role key is only used server-side (in `supabaseAdmin.js`).

### 4. Apply database schema

SQL migrations live in the `migrations/` directory:

```bash
# Using the Supabase CLI
supabase db push

# Or run each file manually
supabase db reset --file migrations/0001_initial_schema.sql
supabase db reset --file migrations/0002_add_admin_flag.sql
```

Ensure the `search_items` stored procedure (RPC) is created — its definition is included in the first migration.

### 5. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### 6. Build for production

```bash
npm run build
npm run preview   # preview the production bundle locally
```

Deploy the generated `dist/` directory to your preferred static host.

---

## Admin Access

To grant yourself admin privileges, toggle the `is_admin` column on your business record:

```sql
UPDATE businesses SET is_admin = TRUE WHERE email = 'your_email@example.com';
```

Admins can visit `/admin` to manage businesses, view platform stats, and export payment logs.

---

## Environment Variables

| Name                        | Description                                 |
|-----------------------------|---------------------------------------------|
| `VITE_SUPABASE_URL`        | Public URL for the Supabase project         |
| `VITE_SUPABASE_ANON_KEY`   | Public anon key used by the frontend        |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret service role key (server-side only)  |

---

## Project Structure

```
src/
├── components/
│   ├── BusinessSheet.jsx     # Pop-up sheet for selected business
│   ├── MapDirectory.jsx      # Main Leaflet map with markers & routing
│   └── SearchOverlay.jsx     # Search bar with typewriter + results
├── lib/
│   ├── supabase.js           # Public Supabase client
│   └── supabaseAdmin.js      # Service-role Supabase client (admin ops)
├── pages/
│   ├── Home.jsx              # User-facing map page
│   ├── Dashboard.jsx         # Business owner dashboard
│   ├── Admin.jsx             # Admin dashboard
│   ├── Login.jsx             # Login page
│   └── Signup.jsx            # Signup page
├── store/
│   ├── authStore.js          # Zustand auth state
│   └── useStore.js           # Zustand app state (search, map, etc.)
├── App.jsx                   # Root component with routing
└── cron.js                   # Legacy Cloudflare cron (unused)
```

---

## Notes & Tips

- Authentication and business metadata are handled via Supabase; the frontend lives in `src/`.
- `src/lib/supabase.js` exports the public client; `supabaseAdmin.js` uses the service role key for privileged operations.
- Search is performed by the `search_items` RPC, which must exist in your database.
- `src/pages/Dashboard.jsx` and `src/pages/Admin.jsx` contain the main business and admin logic respectively.
- Legacy Cloudflare functions (`functions/api/...`) were part of an earlier architecture and can be safely ignored or removed.

---

Built with ❤️ by the Tobli team.
