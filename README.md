# Tenders

## About this project

I designed and built the pipeline architecture end-to-end during my AI
Engineer internship at ZetaBox, iterating through several designs before
landing on the current one:

- **v1**: `setInterval`-based scraping with parallel LangGraph fan-out per
  tender.
- **v2**: moved enrichment (`getTender`, `getArticles`) inside the graph
  as conditional steps rather than pre-fetching everything up front.
- **v3 (current)**: serialized processing through a single FastAPI
  service, per mentor guidance to avoid premature microservices — the
  graph in `server/src/graph/graph.py` reflects this.

The architecture, database schema, migration setup, and the ranker /
augmentation / drafter node logic are my design decisions. Company-specific
data (employee/project records used by the drafter's tools) is mocked for
this public repo.


Automated discovery and triage of public procurement tenders published on
[TUNEPS](https://www.tuneps.tn) (Tunisian e-Procurement Portal). A scheduled
job scrapes tenders published the previous day, runs each one through a
LangGraph pipeline that decides whether ZetaBox (a software company in Sfax,
Tunisia) should bid, fetches additional details when needed, and uses a
tool-using LLM agent to draft a French-language proposal. A Next.js dashboard
surfaces the results for human review.

## Architecture

The processing pipeline is implemented as a LangGraph `StateGraph` in
`server/src/graph/graph.py`. It is invoked once per tender by the scheduled
job in `server/src/scheduler.py:scrape_tenders_job`.

```
                    ┌──────────────────────────────────────────┐
                    │  scheduler.scrape_tenders_job (03:00)   │
                    │  fetch_tuneps_tenders_by_date(yesterday)│
                    └────────────────────┬─────────────────────┘
                                         │ list[TenderRaw]
                                         ▼
                            ┌────────────────────────┐
                            │  ranker_node           │
                            │  classify as one of:   │
                            │   - acceptable         │
                            │   - rejected           │
                            │   - need_more_data     │
                            └───────────┬────────────┘
                                        │ ranker_router
                ┌───────────────────────┼─────────────────────────┐
        rejected│              need_more_data              acceptable│
                ▼                       │                          ▼
               END                      ▼                ┌──────────────┐
                                ┌────────────────┐        │ drafter_node │
                                │ augmentation_  │        │ + tools      │
                                │ node           │        │ (ToolNode)   │
                                │  - getTender   │        │ loop until   │
                                │  - getArticles │        │ final AI msg │
                                │  - LLM parse → │        └──────┬───────┘
                                │    TenderBrief │               │
                                └───────┬────────┘               │
                                        │ augmentation_router    │
                                        └─────────┬──────────────┘
                                                  ▼
                            (augmented? → drafter, else re-rank)
                                                  │
                                                  ▼
                                          persist to Postgres
                                          (Batch + Tender rows)
```

Key files:
- Graph wiring: `server/src/graph/graph.py:14`
- Ranker + classification: `server/src/graph/nodes/ranker.py:10`
- Augmentation (Tender Parser): `server/src/graph/nodes/augmentation.py:13`
- Drafter (tool-using agent): `server/src/graph/nodes/drafter.py:13`
- Tools the drafter can call: `server/src/graph/tools/` (`list_employees`,
  `get_employee_details`, `list_projects`, `get_project_details`,
  `web_search`, `fetch_webpage`)
- State shape: `server/src/graph/state.py:TenderState`
- Scheduler entry: `server/src/scheduler.py:126` (cron `hour=3, minute=0`)
- FastAPI app: `server/src/main.py:19` (scheduler is started in `lifespan`)

The TUNEPS scrape uses three internal helpers in `server/src/helpers/`:
`fetchTenders.fetch_tuneps_tenders_by_date`, `getTender.get_general_info`,
`getArticles.get_articles`.

## Tech stack

### Backend (`server/pyproject.toml`, Python `>=3.11`)

| Package                     | Version    |
| --------------------------- | ---------- |
| fastapi[standard]           | >=0.139.0  |
| langgraph                   | >=1.2.9    |
| langchain-core              | >=1.4.9    |
| langchain-google-genai      | >=4.2.7    |
| langchain-ollama            | >=1.1.0    |
| sqlalchemy[asyncio]         | >=2.0.51   |
| alembic                     | >=1.18.5   |
| asyncpg                     | >=0.31.0   |
| apscheduler                 | >=3.11.3   |
| httpx                       | >=0.28.1   |
| beautifulsoup4              | >=4.15.0   |
| ddgs / duckduckgo-search    | >=9.14.4 / >=8.1.1 |
| python-dotenv               | >=1.2.2    |

Database: PostgreSQL 16 (see `docker-compose.yml`).

### Frontend (`frontend/package.json`)

| Package              | Version   |
| -------------------- | --------- |
| next                 | 16.2.6    |
| react / react-dom    | ^19       |
| typescript           | 5.7.3     |
| tailwindcss          | ^4.3.3    |
| @base-ui/react       | ^1.5.0    |
| @react-pdf/renderer  | ^4.5.1    |
| docx                 | ^9.7.1    |
| react-markdown       | ^10.1.0   |
| date-fns             | ^4.4.0    |
| sonner               | ^2.0.7    |
| shadcn               | ^4.8.0    |

Runtime: Bun (`oven/bun:1.3.11-alpine` in `frontend/Dockerfile`).

## Project structure

```
.
├── docker-compose.yml          # postgres + backend + frontend
├── .env.example                # DB_USER, DB_PASSWORD, DB_NAME, GOOGLE_API_KEY
├── server/
│   ├── pyproject.toml          # Python deps, requires-python >= 3.11
│   ├── uv.lock                 # uv lockfile
│   ├── alembic.ini             # script_location = migrations
│   ├── Dockerfile              # uv sync, alembic upgrade head, uvicorn
│   ├── migrations/
│   │   ├── env.py              # async, picks up DATABASE_URL from src.db.session
│   │   └── versions/           # 13f909... (initial), 260bb02... (later)
│   └── src/
│       ├── main.py             # FastAPI app, lifespan starts scheduler, CORS
│       ├── data.py             # in-memory PROJECTS / EMPLOYEES (sample data)
│       ├── scheduler.py        # APScheduler AsyncIOScheduler, scrape_tenders_job
│       ├── db/
│       │   ├── base.py         # SQLAlchemy DeclarativeBase
│       │   └── session.py      # async engine, AsyncSessionLocal, get_db
│       ├── models/
│       │   ├── batch.py        # Batch model
│       │   ├── tender.py       # Tender model + TenderStatus enum
│       │   └── models.py       # Pydantic Project / Employee for the mock API
│       ├── routes/             # FastAPI routers (no auth, no prefix)
│       │   ├── batch_routes.py
│       │   ├── dashboard_routes.py
│       │   ├── mock_routes.py  # /projects, /employees
│       │   └── tender_routes.py
│       ├── controllers/        # route handlers (FastAPI Depends on get_db)
│       ├── services/           # in-memory lookups for mock data
│       ├── helpers/            # raw httpx clients for TUNEPS endpoints
│       │   ├── fetchTenders.py
│       │   ├── getTender.py
│       │   └── getArticles.py
│       └── graph/              # LangGraph pipeline
│           ├── graph.py        # StateGraph wiring
│           ├── state.py        # TenderState TypedDict
│           ├── llm.py          # ollama_llm + google_llm, active = llm
│           ├── prompts.py      # TENDER_PARSER_*, PROPOSAL_DRAFTER_*
│           ├── utils.py        # parse_llm_json, parse_classification
│           ├── api_client.py   # httpx client used by drafter tools
│           ├── nodes/
│           │   ├── ranker.py        # ranker_node + ranker_router
│           │   ├── augmentation.py  # augmentation_node + augmentation_router
│           │   └── drafter.py       # drafter_node (LLM with tools bound)
│           └── tools/
│               ├── company.py  # list/get employees, list/get projects
│               └── web.py      # web_search, fetch_webpage
└── frontend/
    ├── package.json            # next 16, react 19, bun
    ├── Dockerfile              # oven/bun, build, start
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx            # dashboard (stats + tender table + filters)
    │   ├── pipeline/page.tsx   # batch history
    │   └── tenders/[id]/page.tsx  # tender detail with AI summary + proposal
    ├── components/             # app-layout, tender-table, tender-filters,
    │                           #   batch-history, proposal-editor,
    │                           #   dashboard-stats, status-badge, data-block,
    │                           #   urgent-indicator, tender-action-bar, ui/*
    └── lib/
        ├── api.ts              # fetch wrappers for the FastAPI backend
        ├── types.ts            # TypeScript types mirroring API responses
        ├── markdown-ast.ts
        ├── markdown-to-docx.ts # proposal export to .docx
        ├── markdown-to-pdf.tsx # proposal export to PDF
        └── utils.ts
```

## Setup & installation

### 1. Environment variables

`.env.example` at the repo root is the canonical example. The backend's
`src/db/session.py` reads `DB_URL` directly (it will raise `KeyError` if
missing), while `docker-compose.yml` passes the individual `DB_USER`,
`DB_PASSWORD`, `DB_NAME` plus a derived `DB_URL` to the backend container.

```ini
# .env (repo root, used by docker-compose and copied to server/.env)
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=tender
GOOGLE_API_KEY=your-google-api-key-here
DB_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/tender
```

The frontend needs:

```ini
# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

The drafter tools' internal API client reads `TENDER_DATA_API_URL`
(`server/src/graph/api_client.py:9`), defaulting to `http://localhost:8000`
when unset.

### 2. Database

Start Postgres (the `docker-compose.yml` service is configured for a
`postgres:16-alpine` image with a `postgres-data` volume):

```sh
docker compose up -d postgres
```

Apply migrations (the backend's `Dockerfile` runs this automatically on
container start, but for local dev run it from the `server/` directory):

```sh
cd server
uv run alembic upgrade head
```

Current revisions: `13f909071fcd` (initial `batches` + `tenders`) and
`260bb028528b` (drops `proposal_final`, adds the AI-generated proposal
column layout the API now exposes).

### 3. Backend

```sh
cd server
uv sync
uv run uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The FastAPI app is defined in `server/src/main.py:app`. Its lifespan
(`lifespan` in `main.py:11`) calls `start_scheduler()` from
`server/src/scheduler.py:201`, which registers the daily scrape job.

### 4. Frontend

```sh
cd frontend
bun install
bun run dev
```

The dashboard runs on `http://localhost:3000` and calls the backend on
`http://localhost:8000` (configurable via `NEXT_PUBLIC_API_URL`). CORS
is locked to `http://localhost:3000` in `server/src/main.py:29`.

## Running locally

```sh
# 1. database
docker compose up -d postgres

# 2. backend (in one terminal)
cd server
uv run alembic upgrade head
uv run uvicorn src.main:app --reload

# 3. frontend (in another terminal)
cd frontend
bun install
bun run dev
```

Or run the whole stack:

```sh
docker compose up --build
```

The `scrape_tenders_job` runs at **03:00 server time** (see Configuration
below). To trigger it manually without waiting, call the underlying
coroutine in a Python REPL against a running app, or temporarily change
the trigger in `server/src/scheduler.py:203` to a more frequent schedule
during development.

## Configuration

- **Scheduler interval**: hard-coded to `CronTrigger(hour=3, minute=0)` in
  `server/src/scheduler.py:202`. `max_instances=1` and `replace_existing=True`
  prevent overlapping runs. The job always scrapes "yesterday" relative to
  the current date (`datetime.now() - timedelta(days=1)`).
- **LLM backend**: `server/src/graph/llm.py` defines two clients
  (`ollama_llm`, `google_llm`) and binds the active one to `llm`. To switch
  backends, change the `llm = ...` assignment. The pipeline does not
  currently read this from env.
- **Ranker / classification prompt**: the prompt lives inline in
  `server/src/graph/nodes/ranker.py:10` and uses two variants — a stricter
  prompt for the first pass on raw tender data (with a `need_more_data`
  option) and a relaxed prompt for the second pass on the augmented
  Tender Brief (only `acceptable` / `rejected`).
- **Tender Parser prompt**: `server/src/graph/prompts.py:TENDER_PARSER_SYSTEM_PROMPT`.
  Includes the full source-to-output field mapping table.
- **Proposal Drafter prompt**: `server/src/graph/prompts.py:PROPOSAL_DRAFTER_SYSTEM_PROMPT`.
  Defines the document structure, retrieval discipline, and placeholder
  format (`[[À COMPLÉTER: ...]]`).
- **DB connection pool**: `server/src/db/session.py:10` uses
  `pool_size=5, max_overflow=10`.
- **Page size**: hard-coded to 10 in both `tender_controller.py:PAGE_SIZE`
  and `batch_controller.py:PAGE_SIZE`.
- **Frontend dev server**: Next.js default port `3000`; CORS allow-list
  in `server/src/main.py:29` must match.

## API endpoints

All routes are mounted in `server/src/main.py:37` with no global prefix,
so `http://localhost:8000/...` is the base URL.

| Method | Path                       | Defined in                                | Purpose                                                                 |
| ------ | -------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| GET    | `/projects`                | `routes/mock_routes.py:9`                 | List ZetaBox past projects (summary). Backed by `src/data.py` in memory. |
| GET    | `/projects/{project_id}`   | `routes/mock_routes.py:15`                | Full project details.                                                   |
| GET    | `/employees`               | `routes/mock_routes.py:23`                | List ZetaBox employees (summary). Backed by `src/data.py` in memory.    |
| GET    | `/employees/{employee_id}` | `routes/mock_routes.py:29`                | Full employee details.                                                  |
| GET    | `/stats`                   | `routes/dashboard_routes.py:6`            | Dashboard counters + 10 most recent tenders.                             |
| GET    | `/tenders`                 | `routes/tender_routes.py:6`               | Paginated, filterable tender list. Query params: `limit`, `offset`, `statuses[]`, `institution`, `deadline_from`, `deadline_to`. |
| GET    | `/tenders/{tender_id}`     | `routes/tender_routes.py:7`               | Single tender (full payload + AI summary + proposal draft).             |
| GET    | `/pipelines`               | `routes/batch_routes.py:5`                | Paginated batch list (most recent + page of historical runs).           |

The `/projects` and `/employees` endpoints are read directly by the
proposal-drafter tools (via `api_client.py`) during graph execution. They
are served from in-process data (`src/data.py`); there is no auth and no
persistence layer for them. TODO: move `PROJECTS` and `EMPLOYEES` to a real
table when employee/project management goes beyond static seed data
(see the in-source note in `src/data.py:3`).
