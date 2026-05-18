# PC Prize Pick

A skill-based prize competition platform for premium PCs. Users buy entries
for a chance to win handpicked builds (or take the cash equivalent).
Modelled on [Dream Drive](https://dreamdrive.co.za/) — which runs the same
format for cars — but built around the PC enthusiast market.

> Status: pre-alpha. Homepage scaffolded against mock data; backend, payments
> and skill-question engine are not yet implemented.

## Stack

- **Angular 21** (standalone components, signals, `@angular/build`)
- **TypeScript 5.9**
- **SCSS** with BEM naming, design tokens as CSS custom properties
- **Vitest** for unit tests, **jsdom** environment
- **Locale:** `en-ZA` (ZAR currency, SA date formats)

## Prerequisites

- **Node.js 22 LTS** is recommended. Newer odd-numbered Node versions (23, 25)
  build but emit a non-LTS warning.
- **npm 10+** (bundled with modern Node releases).
- A Chromium-based browser for the dev server.

## Quick start

```powershell
npm install
npm start          # ng serve on http://localhost:4200 (development config)
```

The homepage is the only wired route. Visit `/` (or anything else — unknown
routes redirect home).

## Environment configurations

Four configurations are wired in `angular.json` with file replacements against
`src/environments/environment.ts`:

| Configuration | File                              | Intended target                      |
| ------------- | --------------------------------- | ------------------------------------ |
| `local`       | `environment.local.ts`            | Local backend at `localhost:5203`    |
| `development` | `environment.development.ts`      | Shared dev API                       |
| `qa`          | `environment.qa.ts`               | QA API                               |
| `production`  | `environment.production.ts`       | Production API                       |

The default fallback (`environment.ts`) is used when no configuration is passed.

## Scripts

```powershell
# Dev servers
npm start                # ng serve, default development config
npm run start:local      # against localhost backend
npm run start:dev        # against shared dev API
npm run start:qa         # against QA API
npm run start:prod       # against prod API (rare)

# Builds
npm run build            # production by default
npm run build:local
npm run build:dev
npm run build:qa
npm run build:prod

# Tests
npm test                 # vitest via @angular/build:unit-test
```

## Branches

Mirrors the work-repo flow: shared changes ride `main`; long-running branches
exist for environment deploys.

| Branch      | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| `main`      | Production tip                                         |
| `qa`        | QA promotion                                           |
| `dev`       | Active development integration                         |
| `local_env` | **Personal sandbox.** Not shared; don't push or merge. |

## Folder layout

```
src/
├── app/
│   ├── _shared/                  # cross-feature shared code
│   │   ├── components/           # generic components (e.g. countdown)
│   │   ├── models/               # interfaces & types
│   │   ├── services/             # cross-cutting services
│   │   └── …
│   ├── home/
│   │   ├── home-page/            # composes the homepage
│   │   └── _shared/components/   # home-only section components
│   ├── app.config.ts             # providers + locale registration
│   └── app.routes.ts             # top-level routes
├── assets/
│   ├── scss/                     # global styles — DO NOT edit styles.scss
│   │   ├── _tokens.scss          # CSS custom properties
│   │   ├── _typography.scss      # display / body / mono helpers
│   │   ├── _reset.scss
│   │   ├── _utilities.scss
│   │   └── main.scss             # entry — imported by src/styles.scss
│   ├── fonts/  icons/  images/
├── environments/                 # one .ts per configuration
├── index.html                    # loads Google Fonts (Instrument Serif,
│                                 # Hanken Grotesk, JetBrains Mono)
└── styles.scss                   # only imports assets/scss/main
```

## Conventions

- **File / folder names:** `kebab-case`.
- **Selectors:** `app-` prefix, kebab-case.
- **Class names:** `PascalCase`; variables / functions: `camelCase`.
- **Components:** standalone, `ChangeDetectionStrategy.OnPush`.
- **Styling:** SCSS + BEM. Block / element / modifier (`block__elem--mod`).
- **Global styles** go in `src/assets/scss/`, never in `styles.scss` directly.
- **Currency:** always pipe through `currency:'ZAR':'symbol':...:'en-ZA'`.

See [`CLAUDE.md`](CLAUDE.md) for architectural notes and [`DESIGN.md`](DESIGN.md)
for the visual system.
