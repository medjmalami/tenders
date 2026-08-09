# ZetaBox Tender Pipeline — Case Study

## Overview
A two-service system that scrapes public tenders from the Tunisian procurement portal (Tuneps), filters and enriches them with an LLM-driven LangGraph agent, and surfaces the results in an internal review dashboard. The repository also ships a reveal.js slide deck (`index.html`) that documents the architecture evolution of the pipeline across six revisions.

## Problem / Context
The README files in `server/` are empty, so the motivating problem is stated in code comments, prompts, and the architecture deck. The pipeline exists to convert daily Tuneps bid listings into actionable shortlists for ZetaBox — described in the ranker prompts as "a software company in Sfax, Tunisia" — so that human reviewers only spend time on tenders that plausibly match the company's capabilities. The deck frames the underlying tension as: more tender sources will be added over time, the LLM processing load grows faster than everything else, and the hardware budget is constrained, so the system has to stay low-cost while still being scalable where it matters.

## Architecture & Stack

### Backend (`server/`)
- **Python 3.11+** managed with **uv** (`uv.lock`, `.python-version`) and packaging defined in `pyproject.toml`.
- **FastAPI** (with `fastapi[standard]`) exposing HTTP routes; **Uvicorn** is the implied ASGI runner.
- **SQLAlchemy 2.x async ORM** with `asyncpg` against **PostgreSQL 16** (provisioned via `docker-compose.yml`).
- **Alembic** for schema migrations (`migrations/versions/`).
- **APScheduler** (`AsyncIOScheduler` + `CronTrigger`) running a daily scrape/processing job.
- **LangGraph** + **LangChain Core**, with two configured LLM backends:
  - Local **Ollama** (`ChatOllama`, model `gemma4:31b-cloud`) — currently the active `llm` per `graph/llm.py`.
  - **Google Gemini** (`ChatGoogleGenerativeAI`, model `gemini-3.1-flash-lite`, `max_retries=2`).
- **httpx** async client for all outbound HTTP (Tuneps API + internal "Tender Data API").
- **DuckDuckGo Search** (`ddgs` / `duckduckgo-search`) and **BeautifulSoup4** for web-research tools exposed to the drafter agent.
- **Pydantic v2** models for request/response shapes and static internal data (`src/data.py`).
- **psycopg** is not present; **asyncpg** is the async driver.

### Frontend (`frontend/`)
- **Next.js 16.2.6** (App Router) with **React 19** and **TypeScript 5.7**.
- **Tailwind CSS 4** + **shadcn/ui** (style `base-nova`) and **radix-style primitives** via `@base-ui/react`.
- **date-fns**, **react-day-picker** for date filtering; **react-markdown** + **remark-gfm** for proposal rendering.
- **@react-pdf/renderer** for PDF export, **docx** for DOCX export.
- **sonner** for toasts, **lucide-react** for icons, **@vercel/analytics** wired in production builds.
- Talks to the backend via `NEXT_PUBLIC_API_URL` (`http://localhost:8000` in `frontend/.env`).

### Data flow (current code state)
1. `scheduler.scrape_tenders_job` (`server/src/scheduler.py`) fires daily at 03:00, fetches the prior day's Tuneps listings via `helpers.fetchTenders.fetch_tuneps_tenders_by_date`, opens a `Batch`, then iterates each tender.
2. For every tender it runs the LangGraph graph (`graph/graph.py`) defined as:
   `ranker` → conditional edge → (`augmentation` → re-rank, or `drafter`, or `END`).
   `augmentation` calls `helpers.getTender.get_general_info` and `helpers.getArticles.get_articles` in parallel with `asyncio.gather`, then asks the LLM to produce a structured "Tender Brief" via the prompt in `graph/prompts.TENDER_PARSER_SYSTEM_PROMPT`.
   `drafter` is a tool-using agent (`ToolNode(tools)` with `tools_condition`) that consults `list_employees` / `list_projects` / `get_employee_details` / `get_project_details` (against the in-process static data in `src/data.py`, via `graph/api_client.py` calling the same FastAPI app) and optionally `web_search` / `fetch_webpage`.
3. After the graph returns, `scheduler._save_tender` persists the row into the `tenders` table along with the parsed `Tender Brief`, lots info, classification, and the drafter's final AIMessage content as `proposal_ai_generated`. Failed tenders increment `tenders_failed_count` on the batch.
4. FastAPI controllers serve the dashboard data: `tender_routes` (`/tenders`, `/tenders/{id}`), `dashboard_routes` (`/stats`), `batch_routes` (`/pipelines`), and `mock_routes` (`/projects`, `/employees`).
5. The Next.js dashboard fetches `/stats` and `/tenders` (filterable by status, institution, deadline range) and links to a per-tender detail page where the proposal markdown can be exported as PDF or DOCX.

### Schema (`migrations/versions/`)
Two Alembic revisions:
- `13f909071fcd` creates `batches` (`id`, `run_number`, `tenders_found_count`, `run_date`, `target_date`) and `tenders` (FK to batches, plus JSONB columns for `scraped_data`, `general_info`, `lots_info`, `llm_merged_object`, an enum `tender_status` with values `accepted`/`rejected`/`needs_more_data`, multilingual name fields, and an originally-included `proposal_final` column).
- `260bb028528b` drops `tenders.proposal_final` and adds `batches.tenders_failed_count` (commit message: "removed final proposal and added failures fields in batch").

### Architecture deck (`index.html`)
A standalone reveal.js presentation titled "ZetaBox Tender Pipeline — Architecture Evolution" (`ZetaBox — Tender Intelligence Pipeline`, "presented by Amine · ZetaBox internship"). It documents six revisions (v1 `setInterval` loop → v2 serial calls → v3 lazy detail-page fetch → v4 RabbitMQ queue → v5 BullMQ per-site jobs → v6 LangGraph as a separate, stateless microservice communicating via two queues `tender-jobs` and `tender-results`) and includes SVG diagrams of each architecture plus the LangGraph state graph (`ranker` → `getDetailedPage` loop or `makeDraft` → `END`).

## My Contributions
The repository has two git authors — `amine` (38 commits) and `medjmalami` (33 commits) — so attribution can be split roughly as follows based on commit messages:

- **amine (Jul 1 – Jul 24, 2026)** authored the backend LangGraph pipeline end-to-end:
  - Initial commit through the first LangGraph implementation (`836651e added langgraph graph`, `de397e7 migrate graph to ollama`, `c5833ee migrate to gemini instead of ollama`).
  - Data enrichment helpers (`28517b5 added helper function to get tuneps tenders`, `4478d6e added helper functions to get tender and his articles`, `9b31672 augment the data`).
  - Graph refactor into multiple files and tool wiring (`4557579 refactor the graph into multiple files`, `b11a557 added search tools for the drafter`, `918081c switching from mock APIs to real ones in the graph`, `4e43035 add real tools and fixed the imports`, `c1c49ae added file to test graph + fixed agent tool call`).
  - Prompt tuning (`ca89ac9 adjusting system prompt`, `7db6966 added test data + saving final response to md file + fixed dissapearing of system prompt in drafter node`).
  - SQLAlchemy + Alembic setup (`3a222a8 setting up sqlalchemy`, `c54daf0 setting up alembic`, `2471f4f added batch and tender tables and removed the user table`, `201f1a4`/`26fe9b4 migrated batch and tender tables`).
  - Persistence: `57179c8 feat: added persistence to fetched and processed tenders`.
  - Scheduler: `9762f3e feat: adds a cron job that fetches tuneps every 30s`, `4c4a51f chore: update scheduler to run at 3am`, `c7429ac chore: better log for scheduler`.
  - Frontend bootstrap: `7587a7c add frontend`, plus `167419d update ui to match the tender and batch models`, `acab49a remove settings section`, `491136b remove settings component`.
  - The architecture-evolution slide deck in `index.html` (initial commit `8094c50 first commit`, `e55b73a fixed the text display and the diagrams`, `af365dd fixed queues in v6`).
- **medjmalami (Aug 3 – Aug 7, 2026)** authored the persistence, batch-tracking, and dashboard layer:
  - Schema/migration work: `260bb028528b removed final proposal and added failures fields in batch` (committed as `3bfe390 feat: added failures persistence`, `a8486bc feat: added failures count to batch controller`, `1422113 feat: added ui for failures count in batches`).
  - API surface: `4911768 feat: added dahsboard controller`, `0b31b65 feat: added dashbaord controller into routes`, `b0e63ed feat: added tenders route`, `82e0da5 feat: added get tender controller`, `82cd4aa feat: added batch route`, `4c49545 feat: linked the dashbaord by backend`, `09100d0 feat: linked pipeline page by backend`, `2a8dd79 feat: linked tender page by backend and merged the proposal page into the tender page`.
  - Frontend features: `83d16ad feat: added saerch bar to institution`, `e653a83 feat: added downlaod as docx feature`, `c0e57d9 feat: added downlaod as PDF feature`, `31c7366`/`609d038`/`18c291a` ordering/UX tweaks, `07aa7c1 feat: added cors`, `a31129a chore: fixing issue with dark theme ui`.
  - Cleanup: `bfdd8e4 chore: removed mock data`, `f6efd1c chore: removed logged db data`, `977b479 chore: update scheduler to run at yesterday date`, `8d6f670 chore: removed typed error`.

## Notable Challenges

- **Conditional LLM-driven enrichment**: `ranker_router` and `augmentation_router` (`server/src/graph/nodes/ranker.py`, `.../augmentation.py`) implement the same "skip the expensive detail fetch unless needed" idea in two places. The ranker runs first on raw JSON; if it returns `need_more_data`, control passes to `augmentation`, which fans out two async API calls (`asyncio.gather`) and re-ranks with a structured `Tender Brief`. If augmentation is reached a second time and still returns `need_more_data`, the graph ends — the same lazy-fetch idea documented as the v3 revision in the architecture deck, now expressed as a conditional edge inside the state graph.
- **Tolerating messy LLM output**: `graph/utils.parse_llm_json` strips leading/trailing markdown fences wherever they appear and falls back to `json.JSONDecoder().raw_decode` so trailing prose or stray fences don't break the parse. `parse_classification` does substring matching for the ranker's three-class answer.
- **Schema evolution with hard constraints**: the `tenders.proposal_final` column from the initial migration was dropped in `260bb028528b` (commit message "removed final proposal and added failures fields in batch") and replaced by a `tenders_failed_count` aggregate on `batches`, with corresponding UI updates.
- **Static data swapped behind a stable interface**: `src/data.py` holds hard-coded `PROJECTS` and `EMPLOYEES` lists with a comment "Swap PROJECTS / EMPLOYEES for a DB-backed repository later without touching main.py, since the routes only depend on these two lists" — i.e. the code is deliberately structured so the drafter tool surface is decoupled from the storage backend.
- **Resilient fetching against an external source**: every Tuneps call (`fetchTenders.fetch_tuneps_tenders_by_date`, `getTender.get_general_info`, `getArticles.get_articles`) uses `httpx.AsyncClient(verify=False, timeout=...)` and `response.raise_for_status()`, and `graph/api_client.get` returns plain strings on HTTP errors (404 → "Not found: …") so the drafter agent can recover gracefully instead of crashing the graph.
- **Tool-bounding prompts**: `prompts.PROPOSAL_DRAFTER_SYSTEM_PROMPT` enforces rules like "Never call any tool with the same arguments twice," "Always call `list_employees` and `list_projects` with NO arguments first," and a `[[À COMPLÉTER: …]]` placeholder convention for missing company data, instead of letting the LLM fabricate certifications, financials, or team members.
- **Dashboard pagination with "unexpired first" ordering**: `dashboard_controller.get_dashboard_stats` and `tender_controller.list_tenders` both use a `case` expression on `final_submission_date <= today` so live tenders surface ahead of expired ones, then a secondary `asc().nullslast()` ordering.

## Outcome / Status
As of the most recent commit (`1422113 feat: added ui for failures count in batches`, 2026-08-07), the system is in an actively-developed state with a working end-to-end loop: scheduled Tuneps scraping → LangGraph rank/augment/draft → Postgres persistence → Next.js dashboard with PDF/DOCX proposal export and a batch history page. The `docker-compose.yml` provisions Postgres locally and `postgres-data/` is checked in alongside Alembic migrations, so a developer can stand the backend up with the standard `docker compose up` + `alembic upgrade head` + `uv run fastapi` workflow. The architecture deck marks v6 (LangGraph as a standalone microservice via BullMQ/RabbitMQ) as the "current target," but the v6 split is not present in the committed code — the current server runs the LangGraph graph in-process inside the FastAPI app via `scheduler.scrape_tenders_job` (`graph.ainvoke(initial_state)` is awaited in the scheduler loop), so v6 is a planned, not yet implemented, revision. Performance metrics, user counts, production deployment status, and whether the active LLM is actually Ollama or Gemini in the deployed environment are [UNVERIFIED: not documented in the repo].

## Tech Tags
Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, asyncpg, APScheduler, LangGraph, LangChain, Ollama, Gemini, httpx, Pydantic, DuckDuckGo Search, BeautifulSoup, Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, react-markdown, @react-pdf/renderer, docx, reveal.js, Docker Compose
