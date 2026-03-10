# TOBLI - Business Directory

A location‑based business discovery platform built with React and Supabase.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Routing**: React Router v6
- **State Management**: Zustand & React Query (TanStack Query)
- **Backend**: Supabase (Postgres, Auth, Functions)
- **Maps**: Leaflet with custom markers
- **Excel Parsing**: SheetJS (`xlsx`)
- **Icons**: Lucide
- **Deployment**: any static host (Cloudflare Pages, Vercel, Netlify, etc.)

> Legacy Cloudflare D1 workers and cron scripts remain in `functions/` and `src/cron.js` but are no longer used by the current Supabase‑powered application.

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create a Supabase project**
   - Sign in at https://app.supabase.com and create a new project.
   - Note the **Project URL** and **anon/public API key**.

3. **Configure environment variables**
   Create a `.env` file in the project root with the following values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   > **Never** commit sensitive keys. The service role key is only used on the server (in `supabaseAdmin.js`).

4. **Apply database schema**
   The SQL migrations live in the `migrations/` directory. You can apply them via the Supabase SQL editor or the CLI:
   ```bash
   # using the CLI (after installing and logging in)
   supabase db push
   # or manually run each file
   supabase db reset --file migrations/0001_initial_schema.sql
   supabase db reset --file migrations/0002_add_admin_flag.sql
   ```
   Ensure the `search_items` stored procedure (RPC) is also created; its definition is included in the first migration.

5. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available on `http://localhost:5173` by default.

6. **Build for production**
   ```bash
   npm run build
   npm run preview    # to preview the production bundle locally
   ```
   Deploy the generated `dist/` directory to your preferred static host.

## Admin Access
To grant yourself admin privileges you can toggle the `is_admin` column on your business record via the Supabase dashboard or run SQL:
```sql
UPDATE businesses SET is_admin = TRUE WHERE email = 'your_email@example.com';
```
Admins can visit `/admin` to manage businesses, view stats, and export payment logs.

## Environment Variables
| Name                      | Description                                      |
|---------------------------|--------------------------------------------------|
| VITE_SUPABASE_URL         | Public URL for the Supabase project              |
| VITE_SUPABASE_ANON_KEY    | Public anon key used by the frontend             |
| SUPABASE_SERVICE_ROLE_KEY | Secret service role key used by server code      |

## Notes & Tips
- Authentication and business metadata are handled via Supabase; the frontend lives in `src/`.  
- The `src/lib/supabase.js` file exports the public client; `supabaseAdmin.js` uses the service role key for privileged operations.  
- Search is performed by the `search_items` RPC, which must exist in your database.  
- `src/pages/Dashboard.jsx` and `src/pages/Admin.jsx` contain the main business and admin logic respectively.  
- Legacy Cloudflare functions (`functions/api/...`) were part of an earlier architecture and can be ignored or removed.

Enjoy building with TOBLI! If anything changes in the architecture, update this README accordingly.
