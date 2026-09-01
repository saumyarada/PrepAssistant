# PrepAssistant
**PrepAssistant — AI-Powered Interview Practice Platform**  
Personal Project

- Built and deployed a full-stack coding-interview prep tool that integrates with users' LeetCode history via GraphQL, clustering solved problems by algorithmic pattern (not raw topic tags) to surface targeted practice recommendations
- Designed an AI-driven hint/evaluation pipeline (Gemini API) that reviews user solutions and generates next-problem suggestions based on pattern mastery gaps
- Implemented progress tracking with SQLite, persisting per-user problem-solving history and pattern coverage over time
- Deployed on Vercel; [add: X users tested, Y problems tracked, or latency/accuracy metric]

An AI-assisted interview practice tool that connects to your LeetCode
profile, gives you an intelligent overview of your progress by algorithm
pattern (not just raw topic counts), and helps you practice smarter with
AI-generated hints, solution fixes, and next-problem suggestions.

## Problem Statement

Practicing for coding interviews on LeetCode gives you a pile of solved
problems but no real feedback loop — no hints when you're stuck (short of
looking up the answer), no help debugging a near-miss solution, and no
guidance on what to practice next based on your actual weak spots.
LeetCode's own topic tags are also fairly noisy (e.g. most problems are
tagged "Array"), so raw counts don't reveal which interview *patterns*
someone actually knows. PrepAssistant sits on top of your LeetCode
activity and closes both gaps: a pattern-level view of your progress,
and an AI layer for hints, fixes, and suggestions.

## Core User Flow

1. User enters their LeetCode username
2. App syncs their public LeetCode profile and shows a dashboard
   (solved by difficulty, solved by topic)
3. App shows recently solved problems and personalized recommendations
  based on patterns the user has not recently solved
4. User can browse pattern groups, refresh recommendations, and select
  a pattern to see matching problems
5. User pastes in a problem they're working on
6. User can ask for a Socratic-style hint, or submit a broken solution
  for an AI-assisted fix (diagnosis + minimal patch, not a rewrite)

## Feature List (current)

1. LeetCode profile sync + overview dashboard (solved by difficulty/topic)
2. **Pattern mastery overview** — recently solved problems classified
  into algorithmic patterns (hardcoded taxonomy for well-known
  problems, AI classification + caching for everything else), with
  weakest and best patterns surfaced
3. AI hints on a problem (given problem + user's current code)
4. AI solution fixing (given problem + code + error/failing case)
5. Dynamic problem recommendations based on recently solved problems
6. React frontend with four-card random refresh, pattern filtering,
  recently solved pagination, and a separate hint/fix tools page
7. Simple static frontend exercising the core API flows

## Out of Scope (for now)

- Live code execution / judging (not rebuilding LeetCode's judge)
- Social features (leaderboards, sharing, following)
- Mobile app
- Additional problem sources (Codeforces, HackerRank, etc.)
- Authentication (see "Known limitations" below)

## Stack

| Layer         | Choice                        | Why                                              |
|---------------|--------------------------------|---------------------------------------------------|
| Backend       | FastAPI (Python)               | Async support, auto-generated API docs            |
| Frontend      | React + Vite (`frontend/`) and static HTML/JS (`frontend-simple/`) | React dashboard plus a no-build API client |
| Database      | Postgres (Supabase / Neon) or SQLite for local dev | Multi-user; SQLite is fine early on |
| AI            | Gemini API                     | Hints, solution fixing, suggestions, pattern classification |
| LeetCode data | Unofficial GraphQL endpoint    | No official public API exists                     |

**Known risk:** LeetCode's GraphQL endpoint (`leetcode.com/graphql`) is
unofficial and undocumented. It powers their own frontend and works for
public profile data without auth, but it could change without notice.
Mitigation: cache aggressively (6-hour TTL, see `routers/leetcode.py`),
isolate the query behind a single service module
(`services/leetcode_service.py`) with retry/backoff on transient
network errors, so a breaking change is a one-file fix.

**Known risk:** the Gemini model name in `services/ai_service.py`
(`GEMINI_MODEL`) can be deprecated by Google without much notice — this
already happened once during development. Override via the
`GEMINI_MODEL` env var if the default starts returning 404s.

## Data Model

```
users
  id (UUID)
  email
  leetcode_username
  created_at

leetcode_snapshots
  id (UUID)
  user_id (FK -> users.id)
  solved_by_difficulty   (JSON: {"Easy": n, "Medium": n, "Hard": n})
  solved_by_topic        (JSON: {"Array": n, "DP": n, ...})
  submission_calendar    (JSON, currently unused)
  last_synced_at

Recent solved problems are fetched from LeetCode during sync and returned
to the frontend; they are not currently stored in the snapshot table.

ai_sessions
  id (UUID)
  user_id (FK -> users.id)
  problem_slug
  session_type   ("hint" | "fix" | "suggest")
  input          (TEXT)
  output         (TEXT)
  created_at

problem_classifications
  slug            (PK)
  title
  pattern         (e.g. "Two Pointers", "Backtracking", "Other")
  source          ("taxonomy" | "ai")
  created_at
```

`pattern_taxonomy.json` (repo root of `backend/`) is a static, curated
mapping of ~15 algorithmic patterns to canonical problems — the base
truth for pattern coverage. Problems outside this taxonomy are
AI-classified once and cached in `problem_classifications`, so the
classification cost is paid at most once per problem, ever, across all
users.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/leetcode/{username}` | Fetch (and cache) profile stats and recent solved problems; returns `user_id` |
| GET | `/api/leetcode/{username}/patterns` | Pattern coverage, solved problems, and unsolved recommendations |
| POST | `/api/ai/hint` | Get a Socratic hint for a problem |
| POST | `/api/ai/fix` | Diagnose and minimally fix a broken solution |
| POST | `/api/ai/suggest` | Get 3 next-problem suggestions based on weak topics |

Full request/response shapes are auto-documented at `/docs` once the
server is running.

## Getting Started

### 1. Backend setup

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` — a Postgres connection string (Supabase/Neon free tier),
  or `sqlite:///./dev.db` to start fast locally
- `GEMINI_API_KEY` — from aistudio.google.com
  ("Get API key" in the left sidebar)

Then run:
```bash
uvicorn main:app --reload
```
Visit `http://127.0.0.1:8000/docs` for interactive API docs.

### 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```
Visit `http://localhost:5500`. Keep the backend running in a separate
terminal — the React frontend calls it at `http://127.0.0.1:8000`.

The original no-build frontend is still available with:

```bash
cd frontend-simple
python3 -m http.server 5500
```

### 3. Validate the LeetCode data source standalone (optional)

```bash
python3 leetcode_query_test.py <your_leetcode_username>
```

## Known Limitations (current stage)

- **No real authentication yet.** The frontend captures a `user_id`
  automatically after loading a profile, but it's held in a page-level
  JS variable — refreshing the browser loses it. Real auth
  (Supabase Auth / Clerk) is planned before deployment.
- **CORS is wide open (`*`)** in `main.py` for local development. This
  must be tightened to a specific origin before deploying publicly.
- **`.env` must never be committed.** It's gitignored; only
  `.env.example` (placeholder values) is tracked. If a real key is ever
  committed by accident, rotate it immediately and purge it from git
  history before pushing again.
- **Pattern coverage and recommendations are based on recent activity, not full history.**
  LeetCode's public API only exposes recent accepted submissions
  without authentication, so users who solved many problems long ago
  (with no recent activity) may see sparse solved cards and pattern
  coverage that understates their actual experience.

## Roadmap

- [x] Phase 1: Spec, stack, schema
- [x] Phase 2: Backend core (LeetCode service, DB models, sync endpoint)
- [x] Phase 3: AI layer (hint / fix / suggest services)
- [x] Phase 3.5: Intelligent pattern-mastery overview (taxonomy + AI
      classification hybrid, with caching)
- [x] Phase 4 (partial): React frontend with dashboard, dynamic
  recommendations, and separate hint/fix tools page
- [ ] Phase 4 (full): Persistent authentication and code editor
- [ ] Phase 5: Deployment (Railway/Render + Vercel)
- [ ] Phase 6: Polish (error handling, measurable claims for resume writeup)
