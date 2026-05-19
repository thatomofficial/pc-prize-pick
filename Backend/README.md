# Backend

PC Prize Pick API — ASP.NET Core 10 (net10.0) + EF Core + PostgreSQL.

## Layout

```
Backend/
├── PcPrizePick.slnx                # .NET 10 solution
├── src/
│   ├── PcPrizePick.Api/            # Web API host (minimal APIs, OpenAPI, CORS)
│   ├── PcPrizePick.Application/    # Use cases / services (DTOs, app-layer logic)
│   ├── PcPrizePick.Domain/         # Entities, value objects, repository interfaces
│   └── PcPrizePick.Infrastructure/ # EF Core DbContext, Npgsql, repo implementations
└── tests/
    └── PcPrizePick.Tests/          # xUnit
```

Dependency direction:
`Api → Application + Infrastructure → Domain` ← `Infrastructure`.
Domain knows nothing about EF Core, ASP.NET, or external services.

## Prereqs

- **.NET 10 SDK** (`dotnet --version` ≥ `10.0.300`)
- **Docker** for local Postgres (`docker compose up -d` at repo root)

## Quick start

```powershell
# From repo root: start Postgres
docker compose up -d postgres

# From Backend/: build + run
dotnet build PcPrizePick.slnx
dotnet run --project src/PcPrizePick.Api
```

Default URL: `http://localhost:5xxx` (port chosen by ASP.NET Core; see
console output). OpenAPI doc lives at `/openapi/v1.json` in Development.

## Endpoints

| Method | Path                          | Notes                            |
| ------ | ----------------------------- | -------------------------------- |
| GET    | `/health`                     | Liveness                          |
| GET    | `/api/competitions`           | Featured competitions (max 4)     |
| GET    | `/api/competitions/wave`      | Current wave close + wave code    |
| GET    | `/api/competitions/{slug}`    | Single competition by slug        |

## Migrations

EF Core migrations are tracked under
`src/PcPrizePick.Infrastructure/Migrations/` (created when the first
migration is added).

```powershell
# Add a migration (run from Backend/)
dotnet ef migrations add Init --project src/PcPrizePick.Infrastructure --startup-project src/PcPrizePick.Api

# Apply migrations against the running Postgres
dotnet ef database update --project src/PcPrizePick.Infrastructure --startup-project src/PcPrizePick.Api
```

## Connection strings

`appsettings.Development.json` points at the docker-compose Postgres
(`localhost:5432`, db `pcprizepick`, user/pass `pcprizepick`).
Override per-environment via `ConnectionStrings__Postgres` env var.

## Conventions

- **Minimal APIs over MVC controllers** — endpoint groups under
  `Api/Endpoints/<Module>Endpoints.cs`, registered from `Program.cs`.
- **Domain layer is pure C#** — no EF Core attributes, no
  ASP.NET references. EF config lives in `AppDbContext.OnModelCreating`.
- **Repositories are interfaces in `Domain/`** — implementations in
  `Infrastructure/`.
- **DTOs / projections in `Application/`** — never expose Domain
  entities directly from endpoints.
- **One DbContext** for now (`AppDbContext`). Split per-module once
  modules grow tense.
- **GUIDs are Version 7** (`Guid.CreateVersion7()`) — time-ordered for
  index locality.
