# Mini Expense Tracker

Two independently deployable services over a Supabase Postgres database.

```
backend/    Hono API — validation, SQL, CORS          (Node service)
frontend/   Next.js App Router UI — React Query       (Node service)
shared/     Zod schemas + response types, used by both
supabase/   schema.sql — run once in the SQL editor
```

The Zod contract lives in `shared/` and is imported by the API routes and by the
React Hook Form resolver, so client and server validate against the same rules.

## Local setup

```bash
npm install                      # npm workspaces: installs all three
psql "$DATABASE_URL" -f supabase/schema.sql   # or paste into the Supabase SQL editor

cp backend/.env.example backend/.env          # set DATABASE_URL
cp frontend/.env.example frontend/.env.local  # NEXT_PUBLIC_API_URL=http://localhost:4000

npm run dev -w @expense/backend   # :4000
npm run dev -w @expense/frontend  # :3000
```

## API

| Endpoint | Notes |
| --- | --- |
| `POST /api/expenses` | `title` ≤100, `amount` > 0 with ≤2dp, `category ∈ food\|travel\|bills\|other`, `date?` YYYY-MM-DD and not future |
| `GET /api/expenses` | `?category=&from=&to=&page=1&limit=10` → `{ items, total_count, total_amount }` |
| `DELETE /api/expenses/:id` | 200 `{ ok: true }`, or 404 |
| `GET /api/expenses/summary?month=YYYY-MM` | per-category sums + total |

Errors are always `{ "error": string }` — 400 for invalid input, 404 for a missing
record, 500 otherwise (logged server-side, never leaked to the client).

`total_count` and `total_amount` are aggregated in Postgres across the **entire**
filtered set, concurrently with the page query, and rendered by the UI as returned —
never summed from the visible rows.

## Deploy (Render)

`render.yaml` defines both services. Deploy order matters, because
`NEXT_PUBLIC_API_URL` is inlined into the frontend bundle at build time:

1. Deploy `expense-backend`, set `DATABASE_URL` (Supabase transaction pooler, port
   6543, keep `?pgbouncer=true`).
2. Deploy `expense-frontend`, set `NEXT_PUBLIC_API_URL` to the backend's full origin
   (`https://…onrender.com`, including the scheme).
3. Set the backend's `CORS_ORIGINS` to the frontend's origin, then redeploy it.

Changing the backend URL later requires rebuilding the frontend, not just restarting it.

## Known limitations

- No authentication: every client sees the same expenses. The table has RLS enabled
  with no policy, so Supabase's public API keys cannot reach it — only this backend can.
- TLS to Supabase uses `rejectUnauthorized: false`: encrypted, but the certificate
  chain is not verified. Pin Supabase's CA before handling real data.
- `schema.sql` is applied by hand. A real deployment wants versioned migrations.
