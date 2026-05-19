# AGENTS.md

This file provides guidance to Codex and other agentic tools when working with
code in this repository. Mirrors [`CLAUDE.md`](CLAUDE.md) — keep both in sync when conventions change.

## Project Overview

**PC Prize Pick** is a skill-based prize competition platform for premium PCs.
Users buy entries (priced per build tier, R10 → R100+) for a chance to win a
handpicked PC or take the cash equivalent. The format is modelled on
[Dream Drive](https://dreamdrive.co.za/), which runs the same mechanic for
cars in the South African market.

The skill mechanic — described as **Spot-the-Pixel** in current copy — is what
keeps the product on the competition side of SA gambling law. Entries cap per
draw, and every draw is auditable.

**Cadence:** competitions run on fully synchronized 4-week (28-day) waves.
Every wave closes Sunday 23:59:59.999 SAST. One wave clock per page, not per
build. See [`BACKLOG.md`](BACKLOG.md) for the full backlog.

Pre-alpha. Homepage exists against mock data; backend skeleton in place with
one sample module (Competitions); payments / skill engine unimplemented.

## Repo layout

```
pc-prize-pick/
├── Frontend/         # Angular 21 SPA
├── Backend/          # ASP.NET Core 10 API + EF Core + Postgres
├── tools/            # Postgres init SQL, dev scripts
├── docker-compose.yml  # Local Postgres for development
└── *.md              # Top-level docs (this file, BACKLOG, DESIGN, etc.)
```

`Frontend/` and `Backend/` each have their own README, build tooling,
and `.gitignore`.

## Frontend

### Stack
Angular 21 (standalone components, signals, `@angular/build`) · TypeScript 5.9 ·
SCSS with BEM · CSS custom properties as design tokens · Vitest + jsdom ·
`en-ZA` locale (ZAR currency, SA date formats).

### Commands (run from `Frontend/`)

```powershell
npm start              # development config (default)
npm run start:local    # against localhost backend
npm run start:dev      # shared dev API
npm run start:qa
npm run start:prod
npm run build          # production
npm test               # vitest via @angular/build:unit-test
```

### Architecture

**Routing:** `app.routes.ts` is flat. Today only `/` (`HomePageComponent`) is
wired, with a wildcard redirecting to `/`. No lazy loading yet.

**Feature modules:** per-feature folders at `src/app/<feature>/` hold a
`<feature>-page/` component and a `_shared/components/` directory for
section-level components used only by that feature.

**Global shared code:** `src/app/_shared/` holds `components/`, `models/`,
`services/`, etc. for cross-cutting concerns.

**Environments:** five files in `src/environments/` swapped via
`fileReplacements` in `angular.json`.

**Locale:** `app.config.ts` registers `en-ZA` and provides it as `LOCALE_ID`.
Always pass `'en-ZA'` explicitly to the `currency` pipe.

**Styling:** Global styles under `src/assets/scss/`. **Do not edit
`src/styles.scss`** — it just `@use`s `assets/scss/main`. `_tokens.scss` holds
CSS custom properties; component styles reference them directly.

**Wave clock:** `home/_shared/components/wave-clock/` renders the single
shared wave countdown. Per-card / per-build countdowns are deliberately absent.

### Conventions

- **File / folder names:** `kebab-case`.
- **Class names:** `PascalCase`. Variables / functions: `camelCase`.
- **Function names:** verbs / action words.
- **Collections:** plural nouns.
- **Components:** standalone, `ChangeDetectionStrategy.OnPush`. Use
  `signal()`, `computed()`, `input()`, and `inject()` over constructor
  injection.
- **Every component has three sibling files** — `<name>.component.ts`,
  `<name>.component.html`, `<name>.component.scss` — referenced via
  `templateUrl` and `styleUrl`. Inline `template:` / `styles:` strings are
  not used at any size.
- **Money:** stored in cents (`*PriceCents`, `*ValueCents`), divided by 100
  at render time.
- **Dates:** ISO 8601 strings on models; convert at component boundaries.

## Backend

### Stack
ASP.NET Core 10 (net10.0), minimal APIs, EF Core 9 + Npgsql, PostgreSQL 17.
Clean Architecture lite — Api → Application + Infrastructure → Domain.

### Commands (run from `Backend/`)

```powershell
dotnet build PcPrizePick.slnx
dotnet run --project src/PcPrizePick.Api
dotnet test PcPrizePick.slnx

# EF Core migrations
dotnet ef migrations add <Name> --project src/PcPrizePick.Infrastructure --startup-project src/PcPrizePick.Api
dotnet ef database update --project src/PcPrizePick.Infrastructure --startup-project src/PcPrizePick.Api
```

### Architecture

- **`PcPrizePick.Domain/`** — entities, value types, repository interfaces.
  Pure C#. No EF Core, no ASP.NET, no external SDK references.
- **`PcPrizePick.Application/`** — use-case services and DTOs. Talks to the
  Domain via repository interfaces.
- **`PcPrizePick.Infrastructure/`** — EF Core `AppDbContext`, Npgsql,
  repository implementations. EF entity configuration lives in
  `AppDbContext.OnModelCreating` (no `[Table]` / `[Column]` attributes on
  domain types).
- **`PcPrizePick.Api/`** — minimal API endpoints grouped under
  `Api/Endpoints/<Module>Endpoints.cs`, registered from `Program.cs`.
  OpenAPI auto-generated. CORS allows `http://localhost:4200` in dev.

### Conventions

- **Minimal APIs over MVC controllers** — reach for controllers only when
  the endpoint genuinely benefits from scaffolding (e.g. complex model
  binding).
- **GUIDs are Version 7** (`Guid.CreateVersion7()`) — time-ordered for
  index locality.
- **Repository pattern** — interfaces in `Domain/`, implementations in
  `Infrastructure/`.
- **DTOs in `Application/`** — never expose Domain entities directly
  from endpoints; project to DTOs in services.
- **Async all the way** — repos return `Task<T>`, endpoints accept
  `CancellationToken` and pass it through.
- **One DbContext** for now. Split per-module once modules grow tense.

### Local dev DB

`docker compose up -d postgres` at the repo root starts Postgres on
`localhost:5432` with db / user / password all = `pcprizepick`. The
connection string in `appsettings.Development.json` matches.

## Branches

| Branch      | Purpose                                                       |
| ----------- | ------------------------------------------------------------- |
| `main`      | Production tip.                                               |
| `qa`        | QA promotion.                                                 |
| `dev`       | Active development integration.                               |
| `local_env` | **Personal sandbox for the maintainer.** Never push or merge. |

Promote shared changes `dev → qa → main`. Do not modify `local_env` on the
maintainer's behalf.

## See also

- [`Frontend/README.md`](Frontend/README.md), [`Backend/README.md`](Backend/README.md)
- [`BACKLOG.md`](BACKLOG.md) — product backlog
- [`DESIGN.md`](DESIGN.md) — design tokens, typography, accent usage
