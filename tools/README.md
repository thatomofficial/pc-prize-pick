# tools/

Operational scripts and dev helpers that live alongside the apps but
aren't part of either one's build.

## Layout

```
tools/
├── postgres/
│   └── init/      # SQL files mounted into the postgres container at first boot
└── scripts/       # one-off dev / deploy / seed scripts (PowerShell, bash, dotnet-script)
```

## Postgres init

Any `*.sql` or `*.sh` file dropped into `postgres/init/` is executed once
the first time the `postgres` container starts against an empty data
volume. Use it for extensions, seed data, and grants that should run
before the API ever touches the database.

The folder is mounted read-only at `/docker-entrypoint-initdb.d` via
`docker-compose.yml`.

## Scripts

Cross-cutting helpers (DB resets, migration runners, deploy tasks). One
script per concern. Name the script after the verb it performs:

- `reset-db.ps1`
- `seed-dev-data.ps1`
- `deploy-staging.ps1`

## PC prebuilt scraper

`pc-prebuild-scraper/` contains a dependency-free Python scraper for retailer
prebuilt desktop PC pages. It emits reviewable raw product JSON, frontend-shaped
competition draft JSON, and an optional Postgres upsert script.

```powershell
.\tools\scripts\scrape-prebuilds.ps1 -Config tools\pc-prebuild-scraper\sources.local.json
```

See [`pc-prebuild-scraper/README.md`](pc-prebuild-scraper/README.md).
