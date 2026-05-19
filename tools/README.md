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
