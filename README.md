# FinAI - Financial Logic Score

A personal finance dashboard that reads your income, expenses and investments and turns them into a **Financial Logic Score out of 100**, using five simple rules you can read and check yourself.

> **Honest by design.** The score is rule-based maths, not machine learning. There is no AI model and no live market data in this project. Investment prices are typed in by hand. The name is a nod to the goal (financial *intelligence*), not a claim about the method.

<!-- Add screenshots to docs/ and update the paths in the Screenshots section below. -->

## Features

- **Dashboard** with monthly income, expenses, savings, investments and a portfolio summary.
- **Financial Logic Score** with a per-rule breakdown and a dedicated page that shows every formula.
- **Portfolio analyzer** for stocks, mutual funds, ETFs, bonds, gold, crypto, real estate and cash (manual demo data).
- **Insights** in plain English: spending patterns, savings performance, emergency fund, debt load, allocation and concentration.
- **Full CRUD** for transactions and holdings, with validation on both the form and the API.
- **Realistic demo data** (seven months of transactions and nine holdings) loaded automatically, so the dashboard works on first run.
- **Responsive UI**: sidebar on desktop, compact top navigation on phones, keyboard-friendly dialogs, reduced-motion support.

## Screenshots

| Dashboard | Score details |
| --- | --- |
| ![Dashboard](docs/dashboard.png) | ![Score details](docs/score.png) |

| Transactions | Portfolio |
| --- | --- |
| ![Transactions](docs/transactions.png) | ![Portfolio](docs/portfolio.png) |

*Run the app, take screenshots, and save them in `docs/` with the file names above.*

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS 3, React Router, Recharts |
| Backend | Python 3.10+, FastAPI, Pydantic v2 |
| Database | PostgreSQL via SQLAlchemy 2.0 (`psycopg2-binary` driver) |
| Config | One `.env` file at the project root |

No paid APIs. Runtime dependencies are kept small on purpose.

## How the score works

Five rules, 100 points in total. Each rule is a straight line from zero points to full points.

| Rule | Points | Full marks when... | Zero points when... |
| --- | ---: | --- | --- |
| Savings rate | 25 | you save 20% of income or more | savings rate is 0% or negative |
| Spending balance | 20 | "wants" are 30% of income or less | wants reach 50% of income |
| Emergency fund | 20 | cash covers 6 months of expenses | there is no cash |
| Diversification | 20 | 4+ asset types and no holding above 20% | one asset type, or one holding at 60%+ |
| Debt burden | 15 | loan payments are 10% of income or less | loan payments reach 40% of income |

**Grades:** 80+ Strong, 60-79 Stable, 40-59 Developing, below 40 At risk.

Details worth knowing:

- Figures are averaged over the last *N* **complete** calendar months (default 3). The current month is excluded because a half-finished month flatters savings. If no complete month exists yet, all recorded data is used.
- **Needs vs wants:** Housing, Groceries, Utilities, Transport, Healthcare, Insurance, Education and Debt Payment count as needs. Everything else counts as a want.
- **Cash** is a holding of type "Cash & savings". It feeds the emergency-fund rule and is excluded from diversification.
- Every threshold lives at the top of [`backend/app/scoring.py`](backend/app/scoring.py). Change a number there and the score, insights and score page all follow.

## Architecture

```
┌─────────────────────┐   JSON over HTTP    ┌──────────────────────────┐        ┌──────────────┐
│  React + Vite UI    │ ──────────────────▶ │  FastAPI  (/api/...)     │ ─────▶ │ PostgreSQL   │
│  Recharts, Tailwind │ ◀────────────────── │  routers -> schemas      │ ◀───── │ transactions │
└─────────────────────┘                     │  analysis -> scoring ->  │        │ investments  │
                                            │  insights  (pure Python) │        └──────────────┘
                                            └──────────────────────────┘
```

The backend keeps database code and business logic apart:

- `routers/` handle HTTP and talk to the database through SQLAlchemy.
- `analysis.py`, `scoring.py` and `insights.py` are **plain Python with no database or web imports**. They take simple dataclasses and return dicts, which makes them easy to read and unit-test.
- `categories.py` is the single source of truth for categories and asset types. The frontend loads them from `GET /api/meta`, so forms and validation cannot drift apart. The same endpoint supplies the display currency.

## Folder structure

```
FinAI/
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── api/client.js     # all backend calls + error handling
│   │   ├── components/       # gauge, charts, forms, layout, modal
│   │   ├── pages/            # Dashboard, Transactions, Portfolio, ScoreDetails
│   │   ├── context/          # categories/currency from /api/meta
│   │   ├── hooks/useAsync.js
│   │   └── lib/format.js     # money, percent and date formatting
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # app, CORS, startup (create tables, seed)
│   │   ├── config.py         # reads .env
│   │   ├── database.py       # engine + session
│   │   ├── models.py         # Transaction, Investment tables
│   │   ├── schemas.py        # validation + response models
│   │   ├── categories.py     # categories, needs/wants, asset types
│   │   ├── analysis.py       # window selection, snapshot, trend, portfolio
│   │   ├── scoring.py        # the five rules
│   │   ├── insights.py       # rule-based insights
│   │   ├── demo_data.py      # generated sample data
│   │   ├── seed.py           # python -m app.seed [--reset]
│   │   └── routers/          # transactions, investments, analytics
│   ├── tests/test_scoring.py
│   └── requirements.txt
├── docs/                     # screenshots
├── docker-compose.yml        # optional local PostgreSQL
├── .env.example
├── .gitignore
└── README.md
```

## Setup

**Prerequisites:** Python 3.10+, Node.js 18+, and PostgreSQL (or Docker).

### 1. Configure

```bash
cp .env.example .env
```

The defaults work with the Docker database below. Edit `.env` if you use your own PostgreSQL.

### 2. Database

**Option A - Docker (simplest):**

```bash
docker compose up -d
```

**Option B - existing PostgreSQL:**

```bash
psql -U postgres -c "CREATE USER finai WITH PASSWORD 'finai';"
psql -U postgres -c "CREATE DATABASE finai OWNER finai;"
```

Tables are created automatically when the backend starts, and demo data is loaded if the database is empty (`AUTO_SEED=true`). There is no separate migration step for this project. To manage the data yourself:

```bash
cd backend
python -m app.seed            # load demo data only if tables are empty
python -m app.seed --reset    # wipe both tables and reload the demo data
```

### 3. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: <http://localhost:8000> - interactive docs: <http://localhost:8000/docs>

### 4. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### Tests

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest
```

The tests cover the scoring rules, the analysis window and the demo data. They need no database.

## Environment variables

All variables live in the root `.env` file.

| Variable | Default | Used by | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | `postgresql+psycopg2://finai:finai@localhost:5432/finai` | backend | SQLAlchemy connection string |
| `CORS_ORIGINS` | `http://localhost:5173` | backend | Comma-separated origins allowed to call the API |
| `AUTO_SEED` | `true` | backend | Load demo data on startup when the database is empty |
| `CURRENCY` | `USD` | backend, frontend | Display currency (ISO code). The frontend reads it from `/api/meta` |
| `VITE_API_URL` | `http://localhost:8000/api` | frontend | Base URL of the API |

## API endpoints

All routes are under `/api`. Full interactive documentation is at `/docs`.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness check |
| GET | `/meta` | Categories, asset types, currency |
| GET | `/dashboard?months=3` | Summary, trend, categories, portfolio, score and insights in one call |
| GET | `/score?months=3` | Financial Logic Score with per-rule breakdown |
| GET | `/insights?months=3` | Rule-based insights, most urgent first |
| GET | `/portfolio` | Portfolio totals, allocation and holdings with weights |
| GET | `/transactions` | List. Filters: `type`, `category`, `month=YYYY-MM`, `limit`, `offset` |
| POST | `/transactions` | Create (201) |
| GET / PUT / DELETE | `/transactions/{id}` | Read, replace, delete (204) |
| GET | `/investments` | List. Filter: `asset_type` |
| POST | `/investments` | Create (201) |
| GET / PUT / DELETE | `/investments/{id}` | Read, replace, delete (204) |
| POST | `/demo/reset` | Wipe everything and reload demo data |

Validation errors return `422` with field-level messages, and missing records return `404`. The UI shows both in plain language.

## Sample output

`GET /api/score` with the bundled demo data (figures are deterministic):

```json
{
  "score": 78,
  "grade": "Stable",
  "components": [
    { "key": "savings_rate",     "points": 19.5, "max_points": 25, "value_display": "15.6% of income",                       "status": "ok" },
    { "key": "spending_balance", "points": 20.0, "max_points": 20, "value_display": "27.1% of income on wants",              "status": "good" },
    { "key": "emergency_fund",   "points": 5.0,  "max_points": 20, "value_display": "1.5 months covered",                    "status": "needs_work" },
    { "key": "diversification",  "points": 18.4, "max_points": 20, "value_display": "6 asset types, largest holding 26.3%",  "status": "good" },
    { "key": "debt_burden",      "points": 15.0, "max_points": 15, "value_display": "7.4% of income",                        "status": "good" }
  ]
}
```

A typical insight:

```json
{
  "id": "emergency-low",
  "area": "emergency",
  "severity": "warning",
  "title": "Cash covers 1.5 months of expenses",
  "detail": "Aim for 3 to 6 months. Six months is about 28,924 USD.",
  "action": "Direct new savings to cash before investing more"
}
```

## Limitations

- **Not financial advice.** The rules are common rules of thumb (20% savings, 30% wants, six-month cushion). They ignore your goals, taxes, local cost of living and risk tolerance.
- **No live market data.** Prices are entered manually, so portfolio values are only as fresh as your last edit.
- **No authentication or multi-user support.** One shared dataset. Do not expose it to the public internet as is.
- **No migrations.** Tables are created with `create_all`. Changing a model later means recreating the table or adding Alembic.
- **Single currency**, set in `.env`.
- **Averages over months that contain data.** A skipped month in the middle of your history is not counted as zero.
- `POST /api/demo/reset` deletes all data. It is handy for a demo and should be removed or protected in any real deployment.

## Future improvements

- User accounts and per-user data.
- Alembic migrations.
- CSV import for bank statements and broker exports.
- Optional free price source for holdings, clearly marked as live.
- Budgets and savings goals with progress tracking.
- Editable score thresholds from the UI.
- Docker images for the backend and frontend.
- Frontend tests and API integration tests against a test database.
