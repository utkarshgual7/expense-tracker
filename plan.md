# Role and Goal

Act as a Senior Full-Stack Engineer. Your task is to build a production-grade, highly modular, and scalable "Mini Expense Tracker" MVP within a 30-minute time constraint.

Prioritize reliability, strict validation, clean architecture, and scalability. Do not use Vite; this must be a Next.js application. Read through all requirements before writing any code. Work iteratively.

## Tech Stack

- **Framework**: Next.js (App Router) - Full-Stack setup (no Vite).
- **Database**: Supabase (PostgreSQL) + Prisma ORM (for strict type-safety and scalable migrations).
- **State & Data Fetching**: React Query (for async state, caching, pagination on the client) + Server Actions/Route Handlers for API.
- **Validation**: Zod (shared between client forms and backend routes).
- **Styling**: Tailwind CSS + shadcn/ui (optional, but keep it clean and minimal).
- **Deployment**: Render (Web Service for Next.js SSR) + Supabase.

## 1. Project Structure & Scalability (Crucial)

Do not dump logic into monolithic files. Adopt a layered, modular architecture to ensure scalability:
/expense-tracker
/prisma (Schema and migrations)
/src
/app (Next.js routing: pages and /api routes)
/components (Reusable UI: Form, List, Layout)
/lib (Shared utilities, Prisma client with connection pooling best practices)
/validations (Zod schemas shared by frontend and backend)
/services (Backend business logic and DB queries decoupled from API routes)
render.yaml (Render deployment config)

## 2. Database Schema (Prisma -> Supabase)

Create a `schema.prisma` mapping to a Supabase Postgres database.
Model `Expense`:

- `id`: String (UUID, primary key)
- `title`: String (Max 100 chars)
- `amount`: Decimal (scale 2)
- `category`: String (Enforce Enum at DB or application level: 'food', 'travel', 'bills', 'other')
- `date`: DateTime (Defaults to now)
- `createdAt`: DateTime
  _Scalability note: Add an index on `date` and `category` as they will be heavily filtered._

## 3. Backend Requirements (Next.js API Routes / Services)

Implement robust error handling that catches Zod errors and DB errors, returning standardized responses: `{ "error": "message" }` with correct status codes (e.g., 400 for bad input, 404 for not found).

### Endpoints to implement (in Priority Order):

**1. POST /api/expenses**

- **Payload Validation (Zod)**:
  - `title`: string, required, max 100 characters.
  - `amount`: number, strictly > 0, max 2 decimal places.
  - `category`: strictly one of ['food', 'travel', 'bills', 'other'].
  - `date`: optional, format YYYY-MM-DD, default to today. Cannot be in the future.

**2. GET /api/expenses**

- **Query Params**: `?category=`, `?from=` (YYYY-MM-DD), `?to=` (YYYY-MM-DD), `?page=` (default 1), `?limit=` (default 10).
- **Logic**: Apply filters. Order by newest date first.
- **Response Shape**: `{ items: [...], total_count: number, total_amount: number }`.
- _CRITICAL SCALABILITY NOTE_: `total_amount` and `total_count` must be calculated based on the matching filters across the _entire_ dataset, NOT just the paginated subset. Run a `Promise.all` with a Prisma transaction to fetch the paginated rows, the total count, and the aggregate sum concurrently to optimize DB performance.

**3. DELETE /api/expenses/:id**

- Return 404 if the record does not exist.
- Return 200 on success.

**4. GET /api/expenses/summary?month=YYYY-MM**

- Return the sum of expenses grouped by category for the requested month.

## 4. Frontend Requirements

Use React Query to fetch and mutate data. Use React Hook Form with the `@hookform/resolvers/zod` package, importing the exact same Zod schemas used by the backend.

**Features:**

1. **Expense Form**: Inputs for Title, Amount, Category, and Date.
   - Button MUST be disabled while saving (`isPending`).
   - Show inline validation errors seamlessly.
   - Show server-returned errors (toast/alert).
2. **Expense List**:
   - Display items cleanly.
   - Implement Previous/Next pagination controls based on the API's `total_count` and `page`/`limit`.
   - Implement a Category dropdown filter.
3. **Total Amount Display**: Render the `total_amount` directly from the `GET /api/expenses` response (do NOT calculate this by adding up the visible page items).
4. **Delete Feature**: Add a delete button on list items. Trigger a native `window.confirm()` before calling the DELETE API. On success, invalidate the React Query cache to refresh the list and totals dynamically.

## 5. Deployment Setup (Render & Supabase)

Ensure the repository is ready for a zero-config Render deployment of a Next.js SSR app.

- Create a `render.yaml` at the root:
  - **Service Type**: Web Service
  - **Environment**: Node
  - **Build Command**: `npm install && npx prisma generate && npx prisma db push && npm run build` (Note: handling DB push here for the MVP, though in pure production we'd use `prisma migrate deploy`).
  - **Start Command**: `npm start`
- Create a `.env.example` file documenting `DATABASE_URL` (Supabase connection string with PgBouncer/Transaction pooling port 6543) and `DIRECT_URL`.

## 6. Execution Plan

Work strictly in this order, stopping to verify logic after each step:

1. Initialize the Next.js app, folder structure, and `render.yaml`.
2. Set up the Prisma Schema, shared Zod validations, and DB connection utility.
3. Build the Backend (Services + API Routes: GET and POST first, ensuring strict data aggregation logic).
4. Build the Frontend (React Query Provider, Form component with Hook Form, List component with Pagination).
5. Add DELETE and Summary API routes + Frontend integration.
6. Final architectural review: Ensure no logic is duplicated, files are modularized appropriately, and the constraints (2 decimal places, future date block, full-dataset aggregation) are flawlessly implemented.

Let's begin with Step 1 and 2. Generate the directory structure, the Prisma schema, and the shared Zod validation file.
