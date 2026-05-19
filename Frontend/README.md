# Frontend

Angular 21 SPA for PC Prize Pick. Standalone components, signals, SCSS,
`en-ZA` locale.

## Prereqs

- **Node.js 22 LTS** recommended. Newer odd-numbered Node releases build
  with a non-LTS warning but work.

## Quick start

```powershell
cd Frontend
npm install      # first time only
npm start        # ng serve, default development config
```

The homepage is the only wired route. Unknown routes redirect to `/`.

## Environment configurations

Four configurations are wired in `angular.json`:

| Configuration | File                              | Intended target                    |
| ------------- | --------------------------------- | ---------------------------------- |
| `local`       | `environment.local.ts`            | Local backend at `localhost:5xxx`  |
| `development` | `environment.development.ts`      | Shared dev API                     |
| `qa`          | `environment.qa.ts`               | QA API                             |
| `production`  | `environment.production.ts`       | Production API                     |

## Scripts

```powershell
# Dev servers
npm start                # development config
npm run start:local      # against localhost backend
npm run start:dev        # against shared dev API
npm run start:qa
npm run start:prod

# Builds
npm run build            # production by default
npm run build:local
npm run build:dev
npm run build:qa
npm run build:prod

# Tests
npm test                 # vitest
```

## Folder layout

```
Frontend/
├── src/
│   ├── app/
│   │   ├── _shared/                  # cross-feature shared code
│   │   │   ├── components/           # generic components (countdown)
│   │   │   ├── models/               # interfaces & types
│   │   │   └── services/             # cross-cutting services
│   │   ├── home/
│   │   │   ├── home-page/
│   │   │   └── _shared/components/   # home-only section components
│   │   ├── app.config.ts             # providers + locale registration
│   │   └── app.routes.ts             # top-level routes
│   ├── assets/scss/                  # global styles — DO NOT edit styles.scss
│   ├── environments/                 # one .ts per configuration
│   └── styles.scss                   # imports assets/scss/main
├── angular.json
├── package.json
└── tsconfig.json
```

## Conventions

- **File / folder names:** `kebab-case`.
- **Selectors:** `app-` prefix, kebab-case.
- **Class names:** `PascalCase`; variables / functions: `camelCase`.
- **Components:** standalone, `ChangeDetectionStrategy.OnPush`. Three
  sibling files per component (`.ts`, `.html`, `.scss`) — no inline
  `template:` / `styles:`.
- **Styling:** SCSS + BEM. Global styles in `src/assets/scss/`, never in
  `styles.scss` directly.
- **Currency:** always pipe through `currency:'ZAR':'symbol':...:'en-ZA'`.

See [`../DESIGN.md`](../DESIGN.md) for the visual system and
[`../CLAUDE.md`](../CLAUDE.md) for full architecture notes.
