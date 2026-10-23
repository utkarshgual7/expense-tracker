# Mini Expense Tracker

Next.js (App Router) + Prisma + Supabase Postgres + React Query.

## Local setup

```bash
npm install
cp .env.example .env      # fill in Supabase DATABASE_URL (port 6543) and DIRECT_URL (port 5432)
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Architecture

| Path | Role |
| --- | --- |
| `src/validations/expense.ts` | Zod schemas + response types, shared by API routes and the React Hook Form |
| `src/services/expense.service.ts` | All DB queries and Decimal/Date serialization |
| `src/app/api/expenses/**` | Thin route handlers: parse → service → JSON |
| `src/lib/prisma.ts` | Single Prisma client over the Supabase pooler |
| `src/lib/http.ts` | `withErrors` wrapper → `{ error }` with 400/404/500 |

`GET /api/expenses` returns `total_count` / `total_amount` aggregated over the **entire** filtered set
(`findMany` + `aggregate` run concurrently via `Promise.all`), not the page.

## API

- `POST /api/expenses` — `{ title ≤100, amount > 0 with ≤2dp, category ∈ food|travel|bills|other, date? YYYY-MM-DD (not future) }`
- `GET /api/expenses?category=&from=&to=&page=1&limit=10` → `{ items, total_count, total_amount }`
- `DELETE /api/expenses/:id` → 200 `{ ok: true }` / 404
- `GET /api/expenses/summary?month=YYYY-MM` → per-category sums + total

## Deploy (Render)

`render.yaml` defines the web service; set `DATABASE_URL` and `DIRECT_URL` in the Render dashboard.
Build runs `prisma migrate deploy` (committed migration in `prisma/migrations/`) rather than `db push`.
