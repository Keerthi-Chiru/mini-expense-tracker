# Mini Expense Tracker

A full-stack, responsive Expense Tracker built with **React + Vite**, **Node.js + Express**, and **Supabase PostgreSQL**.

---

## Architecture & Project Structure

```
├── .gitignore
├── README.md
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── test-api.js
│   └── src/
│       ├── index.js
│       ├── supabase.js
│       └── routes/
│           └── expenses.js
└── frontend/
    ├── .env
    ├── .env.example
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── main.jsx
        ├── api.js
        └── components/
            ├── ExpenseForm.jsx
            ├── ExpenseList.jsx
            └── MonthlySummary.jsx
```

---

## Priority 1: Backend & Database Implementation

### Database Schema (Supabase PostgreSQL)
- **Table**: `public.expenses`
  - `id`: UUID PRIMARY KEY DEFAULT `gen_random_uuid()`
  - `title`: `VARCHAR(100) NOT NULL`
  - `amount`: `NUMERIC(12, 2) NOT NULL CHECK (amount > 0)`
  - `category`: `VARCHAR(20) NOT NULL CHECK (category IN ('food', 'travel', 'bills', 'other'))`
  - `date`: `DATE NOT NULL DEFAULT CURRENT_DATE CHECK (date <= CURRENT_DATE)`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT now()`
- **Indexes**: `idx_expenses_date` on `(date DESC, created_at DESC)`, `idx_expenses_category` on `category`
- **RPC Functions**:
  - `get_expenses_totals(filter_category, filter_from, filter_to)`: Atomic calculation of `total_count` and `total_amount` across **all** matching records before pagination.
  - `get_monthly_summary(target_month)`: Monthly breakdown grouped by category.

### API Endpoints
1. `POST /expenses`:
   - Validates `title` (required, non-empty, max 100 characters).
   - Validates `amount` (required, number > 0, at most 2 decimal places).
   - Validates `category` (must be `food`, `travel`, `bills`, or `other`).
   - Validates `date` (optional, defaults to today's date in `YYYY-MM-DD`, cannot be in the future).
   - Returns `400` with `{ "error": "message" }` on validation failure; `201` on success.
2. `GET /expenses`:
   - Supports query params: `category`, `from`, `to`, `page` (default `1`), `limit` (default `10`).
   - Sorts newest first (`date DESC, created_at DESC`).
   - Returns `{ items, total_count, total_amount }` matching all filter criteria prior to pagination.
3. `DELETE /expenses/:id`:
   - Validates UUID format.
   - Returns `404` with `{ "error": "Expense not found" }` if nonexistent.
   - Returns `200` on successful deletion.
4. `GET /expenses/summary?month=YYYY-MM`:
   - Returns monthly total amount and breakdown per category.

---

## Priority 2: Frontend Implementation

- **Expense Form**:
  - Strict input validations mirroring the backend constraints.
  - Character counter for title (100 char limit).
  - Client-side error messages and server error alert banners.
  - Submit button disabled with loading spinner while saving.
- **Expense List**:
  - Displays paginated records with category badges, date, and formatted currency.
  - Header displays **Total Filtered Amount** computed over all matching records.
  - Category filter dropdown.
  - Previous / Next pagination controls with active page count.
  - Loading, empty, and error fallback states.
- **Delete Confirmation**:
  - Confirmation dialog before deletion with optimistic list update.

---

## Priority 3: Monthly Breakdown

- Interactive month selector (`YYYY-MM`).
- Shows overall monthly total and percentage bar breakdown across each category.

---

## Running Locally

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL and SUPABASE_ANON_KEY in .env
npm install
npm start
# or for automated integration tests:
npm test
```

### 2. Frontend Setup
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.
