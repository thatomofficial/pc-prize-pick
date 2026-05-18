# AGENTS.md

This file provides guidance to Codex and other agentic tools when working with
code in this repository. Mirrors [`CLAUDE.md`](CLAUDE.md) — keep both in sync
when conventions change.

## Project Overview

**PC Prize Pick** is a skill-based prize competition platform for premium PCs.
Users buy entries (priced per build tier, R10 → R100+) for a chance to win a
handpicked PC or take the cash equivalent. The format is modelled on
[Dream Drive](https://dreamdrive.co.za/), which runs the same mechanic for
cars in the South African market.

The skill mechanic — described as **Spot-the-Pixel** in current copy — is what
keeps the product on the competition side of SA gambling law. Entries cap per
draw, and every draw is auditable.

Pre-alpha. The homepage exists against mock data; backend, payment integration,
and the actual skill-question engine are unimplemented.

## Stack

Angular 21 (standalone components, signals, `@angular/build`) · TypeScript 5.9 ·
SCSS with BEM · CSS custom properties as design tokens · Vitest + jsdom ·
`en-ZA` locale (ZAR currency, SA date formats).

## Commands

Run from the repository root.

```powershell
# Dev servers (each uses the matching configuration in angular.json)
npm start              # development config (default)
npm run start:local    # against localhost backend
npm run start:dev      # shared dev API
npm run start:qa       # QA API
npm run start:prod     # prod API (rare)

# Builds
npm run build          # production
npm run build:local    # / dev / qa / prod

# Tests
npm test               # vitest via @angular/build:unit-test
```

## Architecture

### Routing
`app.routes.ts` is flat. Today only `/` (`HomePageComponent`) is wired, with a
wildcard redirecting to `/`. Routing imports are direct (no lazy loading) until
the app gets large enough to justify it.

### Feature modules
Per-feature folders live at `src/app/<feature>/`, each holding:
- A `<feature>-page/` component that the router renders.
- A `_shared/components/` directory with section-level components used only by
  that feature.

Currently only `home/` exists. Future features (`competitions/`, `account/`,
`checkout/`, …) should follow the same shape.

### Global shared code
`src/app/_shared/` holds cross-cutting concerns:
- `components/` — generic widgets (e.g. `CountdownComponent`).
- `models/` — TypeScript interfaces and types.
- `services/` — injectable singletons (currently `MockCompetitionsService`).
- `constants/`, `directives/`, `enums/`, `guards/`, `helpers/`, `interceptors/`,
  `interfaces/`, `pipes/` — empty placeholders, populate as needed.

### Environments
Five files in `src/environments/` (`environment.ts` is the default fallback;
`.local.ts`, `.development.ts`, `.qa.ts`, `.production.ts` are swapped in via
`fileReplacements` in `angular.json`). The shared interface lives at
`src/app/_shared/models/environment.model.ts`.

### Locale
`app.config.ts` registers `en-ZA` and provides it as the `LOCALE_ID`. Always
pass `'en-ZA'` explicitly to the `currency` pipe when formatting ZAR — it
guarantees the symbol and grouping render correctly even if the LOCALE_ID
provider is changed later:

```html
{{ priceCents / 100 | currency: 'ZAR' : 'symbol' : '1.2-2' : 'en-ZA' }}
```

### Styling
- Global styles live under `src/assets/scss/`. **Do not edit `src/styles.scss`** —
  it just `@use`s `assets/scss/main`.
- `_tokens.scss` defines CSS custom properties (`--ink-900`, `--volt`,
  `--font-display`, etc.). Component styles reference those custom properties
  directly; SCSS variables / mixins are not currently used.
- BEM naming: `block`, `block__element`, `block--modifier`,
  `block__element--modifier`.
- Component selectors use the `app-` prefix.
- Component templates and styles are inline (in the `@Component` decorator).
  This is the current convention; reach for separate files only when a template
  or stylesheet exceeds ~300 lines.

### Mock data
`MockCompetitionsService` returns hand-tuned `Competition`, `CompetitionTier`,
and `RecentWinner` data. When wiring real APIs, replace this service rather
than the consumers.

## Conventions

- **File / folder names:** `kebab-case`.
- **Class names:** `PascalCase`.
- **Variables / functions:** `camelCase`.
- **Function names:** verbs / action words.
- **Collections:** plural nouns (`competitions`, not `competitionList`).
- **Components:** standalone, `ChangeDetectionStrategy.OnPush`. Use `signal()`,
  `computed()`, `input()` (signal-based inputs), and `inject()` over
  constructor injection.
- **Money:** stored in cents (`*PriceCents`, `*ValueCents`), divided by 100 at
  render time. No floats in storage.
- **Dates:** ISO 8601 strings on models; convert at component boundaries.

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

- [`DESIGN.md`](DESIGN.md) — design tokens, typography pairings, accent usage.
- [`README.md`](README.md) — setup and scripts.
