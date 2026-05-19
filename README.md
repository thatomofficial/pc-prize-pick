# PC Prize Pick

A skill-based prize competition platform for premium PCs. Users buy entries
for a chance to win handpicked builds (or take the cash equivalent).
Modelled on [Dream Drive](https://dreamdrive.co.za/) — which runs the same
format for cars — but built around the PC enthusiast market.

> Status: pre-alpha. Homepage scaffolded against mock data; backend
> skeleton in place with one sample module; payments / skill engine
> not yet implemented.

## Layout

```
pc-prize-pick/
├── Frontend/         # Angular 21 app (SCSS, signals, standalone components)
├── Backend/          # ASP.NET Core 10 API (EF Core + PostgreSQL)
├── tools/            # Operational helpers, postgres init, dev scripts
├── docker-compose.yml  # Local Postgres for the Backend
├── BACKLOG.md        # Full product backlog (epics, stories, AC)
├── CLAUDE.md         # Guidance for Claude Code sessions
├── AGENTS.md         # Guidance for Codex / other agents
├── DESIGN.md         # Visual system tokens and patterns
└── README.md         # This file
```

## Prereqs

- **Node.js 22 LTS** (older odd-numbered versions build with warnings)
- **.NET 10 SDK** (`10.0.300`+)
- **Docker** for local Postgres

## Quick start

```powershell
# Start Postgres (from repo root)
docker compose up -d postgres

# Backend (in another terminal)
cd Backend
dotnet run --project src/PcPrizePick.Api

# Frontend (in another terminal)
cd Frontend
npm install        # first time only
npm start
```

Frontend: <http://localhost:4200>
Backend OpenAPI doc: `<api-url>/openapi/v1.json` (Development env)

## Branches

| Branch      | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| `main`      | Production tip                                         |
| `qa`        | QA promotion                                           |
| `dev`       | Active development integration                         |
| `local_env` | **Personal sandbox.** Not shared; don't push or merge. |

## See also

- [`Frontend/README.md`](Frontend/README.md) — Angular setup, scripts, env
  configs
- [`Backend/README.md`](Backend/README.md) — .NET setup, endpoints,
  migrations
- [`tools/README.md`](tools/README.md) — dev scripts and Postgres init
- [`BACKLOG.md`](BACKLOG.md) — product backlog and sprint slicing
- [`DESIGN.md`](DESIGN.md) — visual system for the frontend
- [`CLAUDE.md`](CLAUDE.md) — full architecture notes for AI assistants
