#requires -version 5.1
<#
.SYNOPSIS
  Seed labels, milestones, and BACKLOG.md stories as GitHub issues.

.DESCRIPTION
  One-shot setup script. Idempotent for labels (uses --force) and milestones
  (skips if title already exists). Issues are created unconditionally — if
  you re-run, you'll get duplicates. Close + delete in the UI if that
  happens.

  Run from repo root:
    pwsh -File tools/scripts/seed-github-issues.ps1
#>
$ErrorActionPreference = 'Stop'

# Resolve repo from the active git remote so the script is portable if someone forks.
$Repo = (gh repo view --json nameWithOwner -q .nameWithOwner)
Write-Host "Target repo: $Repo`n" -ForegroundColor Cyan

# ---------------------------------------------------------------- Labels ----
$labels = @(
    @{ name = 'mvp';              color = 'd8ff3a'; description = 'Required for the MVP user flow (BACKLOG MVP tags)' }
    @{ name = 'type/foundation';  color = '0e8a16'; description = 'Cross-cutting foundation work (F-series)' }
    @{ name = 'type/feature';     color = '1d76db'; description = 'Product feature work (E-series)' }
    @{ name = 'status/partial';   color = 'fbca04'; description = 'Partial implementation already shipped (BACKLOG [~])' }
    @{ name = 'epic/foundations'; color = '5319e7'; description = 'F1–F10 cross-cutting' }
    @{ name = 'epic/landing';     color = 'bfd4f2'; description = 'E1 — Landing & marketing' }
    @{ name = 'epic/competitions'; color = 'bfd4f2'; description = 'E2 — Browse competitions' }
    @{ name = 'epic/detail';      color = 'bfd4f2'; description = 'E3 — Competition detail' }
    @{ name = 'epic/skill';       color = 'bfd4f2'; description = 'E4 — Spot-the-Ball mechanic' }
    @{ name = 'epic/checkout';    color = 'bfd4f2'; description = 'E5 — Entry purchase' }
    @{ name = 'epic/account';     color = 'bfd4f2'; description = 'E6 — Account & profile' }
    @{ name = 'epic/winners';     color = 'bfd4f2'; description = 'E7 — Winners & social proof' }
    @{ name = 'epic/loyalty';     color = 'bfd4f2'; description = 'E8 — Rising Stars loyalty' }
    @{ name = 'epic/about';       color = 'bfd4f2'; description = 'E9 — Workshop & about' }
    @{ name = 'epic/legal';       color = 'bfd4f2'; description = 'E10 — Legal & policies' }
    @{ name = 'epic/support';     color = 'bfd4f2'; description = 'E11 — Support & FAQ' }
    @{ name = 'epic/email';       color = 'bfd4f2'; description = 'E12 — Email & notifications' }
    @{ name = 'epic/admin';       color = 'bfd4f2'; description = 'E13 — Admin / operations' }
)

Write-Host '== Labels ==' -ForegroundColor Yellow
foreach ($l in $labels) {
    gh label create $l.name --color $l.color --description $l.description --force | Out-Null
    Write-Host "  ✓ $($l.name)"
}

# ------------------------------------------------------------- Milestones ---
$milestones = @(
    @{ title = 'Sprint 1 — Foundations';     description = 'F1.1, F1.2, F1.3, F2.1, F2.2, F3.1, F3.2, F4.1, F5.1' }
    @{ title = 'Sprint 2 — Browse & detail'; description = 'E2.1, E3.1, F1.4' }
    @{ title = 'Sprint 3 — Auth UX';         description = 'E6.1, E6.2, E6.3 (mock shipped; backend wiring still pending)' }
    @{ title = 'Sprint 4 — Checkout slice';  description = 'E5.1, E5.2, E5.4, E5.5, E12.1' }
    @{ title = 'Sprint 5 — Skill mechanic';  description = 'E4.1, E4.2' }
    @{ title = 'Sprint 6 — Legal must-haves'; description = 'E10.1, E10.2, E10.3, E10.5' }
    @{ title = 'Sprint 7 — Soft launch';     description = 'F6.2 (E2E), F7.1 (analytics), F8.1 (a11y audit), F10.1 (budgets)' }
)

Write-Host "`n== Milestones ==" -ForegroundColor Yellow
$existing = gh api "repos/$Repo/milestones?state=all" --jq '.[].title'
foreach ($m in $milestones) {
    if ($existing -contains $m.title) {
        Write-Host "  • $($m.title) (already exists, skipped)"
        continue
    }
    gh api "repos/$Repo/milestones" -X POST -f title="$($m.title)" -f description="$($m.description)" -f state=open | Out-Null
    Write-Host "  ✓ $($m.title)"
}

# ----------------------------------------------------------------- Issues ---
# Schema: @{ title; body; labels (array); milestone (string or $null) }
#
# Skipped: BACKLOG [x] (homepage v1) — done work doesn't need an issue.
# BACKLOG [~] items get the `status/partial` label.

$footer = "`n---`nSourced from [``BACKLOG.md``](../blob/main/BACKLOG.md). Edit there if scope shifts."

function New-Story {
    param([string]$Title, [string]$Body, [string[]]$Labels, [string]$Milestone)
    @{ title = $Title; body = ($Body.TrimEnd() + $footer); labels = $Labels; milestone = $Milestone }
}

$stories = @(
    # ------- F1 · API client + HTTP infrastructure
    New-Story 'F1.1 — Define ApiClientService wrapper' @'
Centralised HttpClient wrapper for the Frontend with typed helpers.

## Acceptance criteria
- Typed `get<T>`, `post<T>`, `put<T>`, `delete<T>` helpers.
- Reads base URL from `environment.apiEndpoint`.
- Adds correlation id header (`x-request-id`) per request.
- Unit tests covering URL composition, header injection, and error mapping.
'@ @('epic/foundations', 'type/foundation', 'mvp') 'Sprint 1 — Foundations'

    New-Story 'F1.2 — authInterceptor for bearer tokens' @'
HTTP interceptor that attaches the JWT to outgoing requests.

## Acceptance criteria
- Attaches `Authorization: Bearer <jwt>` when a token is present in `AuthService`.
- Skips public endpoints (login, register, password reset).
- Refreshes silently on 401 once, then signs out on the second 401.
'@ @('epic/foundations', 'type/foundation', 'mvp') 'Sprint 1 — Foundations'

    New-Story 'F1.3 — Global API error mapping' @'
Map backend error shapes to a typed client error.

## Acceptance criteria
- Maps API error shape `{ code, message, fields }` to a typed `ApiError`, rethrows.
- 5xx + network errors surface through `ToastService` (see F3.1).
- Unmapped errors log to Sentry (see F7.2).
'@ @('epic/foundations', 'type/foundation') 'Sprint 1 — Foundations'

    New-Story 'F1.4 — Replace MockCompetitionsService' @'
Wire `CompetitionsApiService` against the real backend endpoints.

## Acceptance criteria
- `CompetitionsApiService` calls `GET /api/competitions`, `GET /api/competitions/:slug`, `GET /api/competitions/recent-winners`.
- Behind a `provideMocks` feature flag so demos still work without backend.
'@ @('epic/foundations', 'type/foundation') 'Sprint 2 — Browse & detail'

    # ------- F2 · Authentication
    New-Story 'F2.1 — AuthService with signal-backed currentUser state' @'
Replace `MockAuthService` with real backend-wired auth, keeping the public signal surface stable.

## Acceptance criteria
- Stores JWT in `localStorage` under a namespaced key.
- Exposes `currentUser = signal<User | null>(null)`, `isAuthed = computed(...)`.
- On boot, rehydrates from storage and verifies the token is still valid.
- Public surface matches the current mock — guards, nav, and account dashboard need no changes.
'@ @('epic/foundations', 'type/foundation', 'mvp', 'status/partial') 'Sprint 1 — Foundations'

    New-Story 'F2.2 — authGuard and guestGuard' @'
Route guards for auth-gated and guest-only pages. **Shipped against mock auth**; this issue tracks the real backend pass.

## Acceptance criteria
- `authGuard` redirects unauthed users to `/login?returnUrl=...`.
- `guestGuard` redirects authed users away from `/login`, `/register`, `/forgot-password`.
- Both functional, wired in `app.routes.ts`.
'@ @('epic/foundations', 'type/foundation', 'mvp', 'status/partial') 'Sprint 1 — Foundations'

    New-Story 'F2.3 — Token refresh' @'
Silent refresh to keep sessions alive without user reload.

## Acceptance criteria
- Background refresh ~60s before expiry.
- On tab focus, re-check expiry.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F2.4 — Social login (Google, Microsoft)' @'
Add social sign-in providers.

## Acceptance criteria
- Reuse `@abacritt/angularx-social-login` or equivalent.
- Client IDs sourced from `environment.socialLoginConfig`.
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F3 · Error handling, loading & toasts
    New-Story 'F3.1 — ToastService + <app-toast-host>' @'
Global toast notifications.

## Acceptance criteria
- Methods `success`, `error`, `info`. Auto-dismiss after 5s.
- Honors `prefers-reduced-motion`.
- Stack max 4 toasts; older drop.
'@ @('epic/foundations', 'type/foundation', 'mvp') 'Sprint 1 — Foundations'

    New-Story 'F3.2 — LoadingState pattern' @'
Standard loading-state primitive.

## Acceptance criteria
- Shape `{ status: ''idle''|''loading''|''ready''|''error'', data?, error? }` exposed via signal.
- `<app-loading-state>` renders skeleton / spinner / error block / content per the signal.
'@ @('epic/foundations', 'type/foundation', 'mvp') 'Sprint 1 — Foundations'

    New-Story 'F3.3 — Empty state component' @'
Reusable empty-state block.

## Acceptance criteria
- Illustration slot, headline, CTA.
- Used by archive, my entries, search-no-results.
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F4 · Forms & validation
    New-Story 'F4.1 — Reactive form helpers' @'
Consistent form scaffolding.

## Acceptance criteria
- `<app-form-field>` wrapping label / control / error message with consistent styles.
- `<app-form-error>` reads control validity, renders message from a typed `ValidationCopy` map.
'@ @('epic/foundations', 'type/foundation', 'mvp') 'Sprint 1 — Foundations'

    New-Story 'F4.2 — Common validators' @'
SA-specific validation helpers.

## Acceptance criteria
- SA mobile (`+27` or `0` prefix).
- SA ID number (Luhn check).
- Strong password (min 10 chars, mixed case + number).
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F5 · Routing & page transitions
    New-Story 'F5.1 — Routes restructure' @'
Split routes by feature area.

## Acceptance criteria
- Split `app.routes.ts` into `home.routes.ts`, `auth.routes.ts`, `competitions.routes.ts`, `account.routes.ts`, `support.routes.ts`, `legal.routes.ts`.
- Wire as flat children in `app.routes.ts`.
'@ @('epic/foundations', 'type/foundation', 'mvp') 'Sprint 1 — Foundations'

    New-Story 'F5.2 — Scroll restoration + reset on navigate' @'
Standard router scroll behaviour.

## Acceptance criteria
- Back-nav restores the previous scroll position.
- Forward-nav resets to top.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F5.3 — Page transition' @'
Subtle fade between routes.

## Acceptance criteria
- 200ms fade on route change.
- Skipped under `prefers-reduced-motion`.
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F6 · Testing strategy
    New-Story 'F6.1 — Vitest baseline + coverage target' @'
Establish the unit-test floor.

## Acceptance criteria
- Add `vitest.config.ts` with `@analogjs/vitest-angular` or built-in Angular runner.
- Coverage target ≥ 70% on `_shared/services` and `_shared/components`.
- CI fails below threshold.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F6.2 — Playwright E2E setup' @'
End-to-end smoke coverage.

## Acceptance criteria
- Headless Chromium + headed local mode.
- One smoke test: load homepage, see hero, ticker scrolls, click first competition CTA.
'@ @('epic/foundations', 'type/foundation') 'Sprint 7 — Soft launch'

    New-Story 'F6.3 — Visual regression baseline' @'
Catch visual regressions on critical pages.

## Acceptance criteria
- Chromatic or Percy on the homepage, competition detail, checkout.
- Runs on every PR to `dev`.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F6.4 — Story-level component tests' @'
Per-component coverage.

## Acceptance criteria
- For each shipped component, a Vitest spec covering the input matrix and OnPush change-detection behaviour.
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F7 · Observability
    New-Story 'F7.1 — Analytics (Plausible or PostHog)' @'
Page + event tracking.

## Acceptance criteria
- Page views auto-tracked.
- Custom events: `entry_started`, `entry_completed`, `skill_submitted`, `payment_failed`.
'@ @('epic/foundations', 'type/foundation') 'Sprint 7 — Soft launch'

    New-Story 'F7.2 — Error reporting (Sentry)' @'
Client + server error capture.

## Acceptance criteria
- DSN per environment from `environment.ts`.
- Source maps uploaded on prod builds.
- PII scrubbing on breadcrumbs.
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F8 · Accessibility
    New-Story 'F8.1 — Audit current homepage for a11y' @'
First a11y pass against the live homepage.

## Acceptance criteria
- Run axe-core; resolve all critical / serious issues.
- Manual keyboard sweep — every interactive element reachable + visible focus ring.
'@ @('epic/foundations', 'type/foundation') 'Sprint 7 — Soft launch'

    New-Story 'F8.2 — Skip-link, landmark roles, heading hierarchy' @'
Structural a11y wins.

## Acceptance criteria
- Skip-link to main content from each page.
- Landmark roles on nav, main, footer.
- Heading hierarchy valid on every route.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F8.3 — Live region for countdowns + ticker' @'
Screen-reader-friendly live updates.

## Acceptance criteria
- `aria-live="polite"` with throttle so screen readers don''t get hammered.
- Verified with NVDA + VoiceOver.
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F9 · SEO
    New-Story 'F9.1 — <title>, <meta description>, OG tags per route' @'
SEO + social card hygiene.

## Acceptance criteria
- Each route sets `<title>` and `<meta name=description>`.
- Open Graph + Twitter card tags on competition detail.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F9.2 — Sitemap.xml + robots.txt' @'
Crawl directives + sitemap.

## Acceptance criteria
- Generated at build time.
- Excludes auth + account routes from sitemap.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F9.3 — Structured data' @'
JSON-LD on competition detail.

## Acceptance criteria
- `Product`-ish schema (caveat: not strictly products, but Google understands it).
- Tested with Google Rich Results.
'@ @('epic/foundations', 'type/foundation') $null

    # ------- F10 · Performance
    New-Story 'F10.1 — Tighten angular.json budgets' @'
Lower budgets to enforce regressions early.

## Acceptance criteria
- Current `1MB` initial error is generous — target `350kB` gzipped.
- CI fails if budget exceeded.
'@ @('epic/foundations', 'type/foundation') 'Sprint 7 — Soft launch'

    New-Story 'F10.2 — Self-host fonts' @'
Eliminate the Google Fonts blocking request.

## Acceptance criteria
- Instrument Serif, Hanken Grotesk, JetBrains Mono self-hosted under `src/assets/fonts/`.
- Preloaded in `index.html` for the above-the-fold fonts only.
'@ @('epic/foundations', 'type/foundation') $null

    New-Story 'F10.3 — Image strategy' @'
Responsive, modern images.

## Acceptance criteria
- `<picture>` with AVIF + WebP + JPEG fallback.
- Sizes per breakpoint.
- Eager loading only on the hero image.
'@ @('epic/foundations', 'type/foundation') $null

    # ============== Product epics ==============

    # ------- E1 · Landing & marketing
    New-Story 'E1.2 — Replace stub PC art with real photography' @'
Workshop photography for each featured build.

## Acceptance criteria
- 1 hero image per featured build.
- AVIF + WebP + JPEG fallback, art-directed crops per breakpoint.
'@ @('epic/landing', 'type/feature') $null

    New-Story 'E1.3 — Marketing landing variant' @'
Paid-acquisition landing.

## Acceptance criteria
- `/welcome` route with a single CTA and no nav.
- A/B tested headline copy via the analytics service.
'@ @('epic/landing', 'type/feature') $null

    New-Story 'E1.4 — Press / Brand page' @'
Brand assets and press contact.

## Acceptance criteria
- Downloadable logo pack.
- Brand guidelines snippet.
- Press contact email.
'@ @('epic/landing', 'type/feature') $null

    New-Story 'E1.5 — Blog / News index (optional)' @'
Optional editorial blog.

## Acceptance criteria
- `/news` index + slug routes.
- Markdown-sourced posts.
'@ @('epic/landing', 'type/feature') $null

    # ------- E2 · Browse competitions
    New-Story 'E2.1 — /competitions listing' @'
Full competitions list with sort + filter.

## Acceptance criteria
- Server-paginated grid, same card shape as homepage.
- Sort by closing soonest / newest / lowest entry / highest value.
- Filter by tier and by build type (gaming / studio / mini).
'@ @('epic/competitions', 'type/feature', 'mvp') 'Sprint 2 — Browse & detail'

    New-Story 'E2.2 — Search' @'
Find a build fast.

## Acceptance criteria
- Client-side fuzzy search over loaded page.
- Server-side once the index grows beyond 500 entries.
'@ @('epic/competitions', 'type/feature') $null

    New-Story 'E2.3 — Archive / past competitions' @'
Past draws made permanent.

## Acceptance criteria
- `/competitions/archive` — same layout as listing but read-only.
- Each row shows "drawn on" + winner attribution.
'@ @('epic/competitions', 'type/feature') $null

    # ------- E3 · Competition detail
    New-Story 'E3.1 — /competitions/:slug page' @'
Single-competition detail.

## Acceptance criteria
- Hero with image gallery, build name, status, countdown.
- Full spec list (CPU, GPU, RAM, storage, PSU, case, cooling, peripherals if any).
- Entries meter (sold / cap), cash alternative, entry price.
- Primary CTA: "Take a shot — R XX,XX".
- Countdown copy reads "this wave closes…" not "this competition closes…"; once a wave closes, surface the draw outcome and link to the next wave''s competition in the same tier.
'@ @('epic/detail', 'type/feature', 'mvp') 'Sprint 2 — Browse & detail'

    New-Story 'E3.2 — Spec card downloadable PDF' @'
Shareable build sheet.

## Acceptance criteria
- "Download build sheet" button on detail page.
- PDF rendered client-side from the spec data.
'@ @('epic/detail', 'type/feature') $null

    New-Story 'E3.3 — Related competitions row' @'
Cross-sell adjacent builds.

## Acceptance criteria
- Bottom-of-page row showing 3 other live competitions.
- Prefers same tier; falls back to adjacent tiers.
'@ @('epic/detail', 'type/feature') $null

    New-Story 'E3.4 — Share menu' @'
Twitter / WhatsApp / copy-link.

## Acceptance criteria
- Prefilled copy includes the countdown.
- Copy-link uses the Web Share API where available.
'@ @('epic/detail', 'type/feature') $null

    # ------- E4 · Skill mechanic (Spot-the-Ball)
    New-Story 'E4.1 — SkillChallengeService API contract' @'
Server contract for fetching challenge + submitting a coordinate.

## Acceptance criteria
- `GET /api/competitions/:slug/challenge` returns `{ imageUrl, challengeId, expiresAt, imageWidth, imageHeight }`.
- `POST /api/skill-submissions` accepts `{ challengeId, x, y, submittedAt }` and returns a receipt id. `x`/`y` are integer pixel coordinates in the natural image space (not the rendered viewport).
- `expiresAt` is bound by the competition''s wave close (28-day cycle) — challenges cannot be submitted after wave close.
'@ @('epic/skill', 'type/feature', 'mvp') 'Sprint 5 — Skill mechanic'

    New-Story 'E4.2 — Skill UI (Spot-the-Ball)' @'
The pixel-pick interface.

## Acceptance criteria
- Full-bleed image with click / tap target placing a crosshair at the cursor.
- Pinch-zoom support on touch; arrow-key nudge on keyboard for fine placement.
- Submit confirms the coordinate; choice cannot be changed after submit.
- The shipped `/skill` demo route already implements the UX shape — port the static demo onto the real service.
'@ @('epic/skill', 'type/feature', 'mvp', 'status/partial') 'Sprint 5 — Skill mechanic'

    New-Story 'E4.3 — Practice mode' @'
Teach the mechanic to first-time entrants.

## Acceptance criteria
- Reduced-stakes practice round against a sample image, no entry burned.
- Reachable from the homepage how-it-works step 03 (link already exists to `/skill`).
'@ @('epic/skill', 'type/feature', 'status/partial') $null

    New-Story 'E4.4 — Audit log' @'
Immutable record of every submission for draw verification.

## Acceptance criteria
- Every submission writes an immutable record with the client timestamp and the server-received timestamp.
- Server-received timestamp is authoritative for tie-breaking.
- Original (un-edited) image and its ball position `(bx, by)` are stored alongside the challenge so any draw can be re-verified.
'@ @('epic/skill', 'type/feature') $null

    # ------- E5 · Entry purchase & checkout
    New-Story 'E5.1 — Cart-less single-competition entry' @'
Buy entries on the competition detail page itself.

## Acceptance criteria
- Quantity stepper with tier discount preview (5% / 10% / 15%).
- Order summary on the right (or below on mobile).
- Payment provider button row.
'@ @('epic/checkout', 'type/feature', 'mvp') 'Sprint 4 — Checkout slice'

    New-Story 'E5.2 — Payment integration — primary provider' @'
Yoco card payments.

## Acceptance criteria
- Yoco redirect flow (no PCI scope for us).
- Webhook receipt handling on backend.
- Client polls for confirmation.
'@ @('epic/checkout', 'type/feature', 'mvp') 'Sprint 4 — Checkout slice'

    New-Story 'E5.3 — Payment fallback — alternative provider' @'
Peach Payments or PayFast fallback.

## Acceptance criteria
- Selected via feature flag.
- Same receipt + entry-creation flow as primary.
'@ @('epic/checkout', 'type/feature') $null

    New-Story 'E5.4 — Failure & retry' @'
Resilient payment UX.

## Acceptance criteria
- Clear copy on declined cards, lost network during redirect, abandoned flows.
- Resume entry from email link within 30 minutes.
'@ @('epic/checkout', 'type/feature', 'mvp') 'Sprint 4 — Checkout slice'

    New-Story 'E5.5 — Confirmation page' @'
Post-payment receipt.

## Acceptance criteria
- Receipt id, entry count, link to take skill shot now or later.
'@ @('epic/checkout', 'type/feature', 'mvp') 'Sprint 4 — Checkout slice'

    New-Story 'E5.6 — Bulk packs' @'
Predefined entry packs.

## Acceptance criteria
- 5 / 10 / 25 packs with displayed discount.
- Single click adds the pack to the order.
'@ @('epic/checkout', 'type/feature') $null

    # ------- E6 · Account & profile
    New-Story 'E6.1 — Sign up' @'
**Shipped against mock auth** at `/register`. This issue tracks real backend wiring + verification.

## Acceptance criteria
- Email + password, with email verification.
- Social login parity (see F2.4).
- Real backend (POST /api/auth/sign-up) replaces mock.
'@ @('epic/account', 'type/feature', 'mvp', 'status/partial') 'Sprint 3 — Auth UX'

    New-Story 'E6.2 — Sign in / forgot password / reset' @'
**Shipped against mock auth.** Tracks real backend + email integration.

## Acceptance criteria
- Real backend for `/login`, `/forgot-password`.
- Actual reset email goes out (E12.1).
- Token refresh (F2.3).
'@ @('epic/account', 'type/feature', 'mvp', 'status/partial') 'Sprint 3 — Auth UX'

    New-Story 'E6.3 — /account dashboard' @'
**Skeleton shipped.** Tracks real data wiring.

## Acceptance criteria
- Open entries by competition (once Competitions API lands).
- Pending skill submissions (once E4.2 ships).
- Recent transactions.
- Loyalty tier badge (once E8 lands).
'@ @('epic/account', 'type/feature', 'mvp', 'status/partial') 'Sprint 3 — Auth UX'

    New-Story 'E6.4 — Profile settings' @'
Editable user profile.

## Acceptance criteria
- Display name, mobile, address (for prize delivery), comms preferences.
- Form validation (F4.2).
'@ @('epic/account', 'type/feature') $null

    New-Story 'E6.5 — Wallet / cash-out alternative' @'
Bank account + payout status for cash-electing winners.

## Acceptance criteria
- Bank account capture form.
- Payout status visible on `/account`.
'@ @('epic/account', 'type/feature') $null

    New-Story 'E6.6 — KYC for prizes over R25 000' @'
Identity verification for high-value payouts.

## Acceptance criteria
- SA ID upload + selfie verification before payout.
- Status visible on `/account`.
'@ @('epic/account', 'type/feature') $null

    # ------- E7 · Winners & social proof
    New-Story 'E7.1 — /winners page' @'
Winners archive. **Skeleton shipped at /winners** with the social-proof testimonial block; this issue tracks the full archive.

## Acceptance criteria
- Reverse-chronological list of past winners with prize, build, and a quote where available.
- Pagination once the list grows past 50.
'@ @('epic/winners', 'type/feature', 'status/partial') $null

    New-Story 'E7.2 — Winner intake' @'
Authenticated post-pickup intake.

## Acceptance criteria
- Form for winners to submit a photo + short quote post-pickup.
- Goes into moderation queue before publishing on /winners.
'@ @('epic/winners', 'type/feature') $null

    New-Story 'E7.3 — Workshop visit booking' @'
Book a slot to see the build before entering. See also E9.

## Acceptance criteria
- Slot picker on `/workshop/visit`.
- Email confirmation.
'@ @('epic/winners', 'type/feature') $null

    # ------- E8 · Loyalty (Rising Stars)
    New-Story 'E8.1 — Tier definitions' @'
Loyalty ladder.

## Acceptance criteria
- Tiers: Stars / Lead Builder / Apex (etc.) with point thresholds.
- Perks per tier: early access window, free entries on birthday, etc.
'@ @('epic/loyalty', 'type/feature') $null

    New-Story 'E8.2 — Point accrual' @'
Earn points per entry spend.

## Acceptance criteria
- 1 point per ZAR spent on entries.
- Bonus on streaks.
- Accrual visible on `/account`.
'@ @('epic/loyalty', 'type/feature') $null

    New-Story 'E8.3 — Tier dashboard card on /account' @'
Surface current tier + progress.

## Acceptance criteria
- Current tier + points to next tier.
- Tier-specific perk list.
'@ @('epic/loyalty', 'type/feature') $null

    # ------- E9 · Workshop & about
    New-Story 'E9.1 — /about page' @'
Story, team, workshop photos.

## Acceptance criteria
- Founding story copy.
- Team grid.
- Workshop photo gallery.
'@ @('epic/about', 'type/feature') $null

    New-Story 'E9.2 — /workshop/visit booking' @'
Workshop tour booking.

## Acceptance criteria
- Slot picker tied to workshop calendar.
- Confirmation email.
'@ @('epic/about', 'type/feature') $null

    # ------- E10 · Legal & policies
    New-Story 'E10.1 — /legal/terms' @'
Terms of service.

## Acceptance criteria
- Reviewed by SA-licensed lawyer.
- Linked from footer + signup form.
'@ @('epic/legal', 'type/feature', 'mvp') 'Sprint 6 — Legal must-haves'

    New-Story 'E10.2 — /legal/privacy (POPIA-aligned)' @'
Privacy policy.

## Acceptance criteria
- POPIA-aligned.
- Data subject rights section.
- Linked from footer + signup form.
'@ @('epic/legal', 'type/feature', 'mvp') 'Sprint 6 — Legal must-haves'

    New-Story 'E10.3 — /legal/rules' @'
Per-competition rules + dispute process.

## Acceptance criteria
- Draw process documented.
- Dispute resolution path.
- Audit firm named.
'@ @('epic/legal', 'type/feature', 'mvp') 'Sprint 6 — Legal must-haves'

    New-Story 'E10.4 — /legal/responsible-play' @'
Self-exclusion + spend limits.

## Acceptance criteria
- Self-exclusion form.
- Spend limit settings on `/account`.
'@ @('epic/legal', 'type/feature') $null

    New-Story 'E10.5 — Cookie banner' @'
POPIA + GDPR consent.

## Acceptance criteria
- Granular consent (analytics vs essential).
- Decline option same prominence as accept.
- Choice persists.
'@ @('epic/legal', 'type/feature', 'mvp') 'Sprint 6 — Legal must-haves'

    # ------- E11 · Support & FAQ
    New-Story 'E11.1 — /faq searchable accordion' @'
Self-serve answers.

## Acceptance criteria
- Searchable accordion.
- Categorised by topic.
'@ @('epic/support', 'type/feature') $null

    New-Story 'E11.2 — Contact form' @'
Routed contact form.

## Acceptance criteria
- Category routes to the right inbox.
- Confirmation email to the user.
'@ @('epic/support', 'type/feature') $null

    New-Story 'E11.3 — In-app help bubble' @'
Live chat / help widget. Later — Crisp / Intercom.

## Acceptance criteria
- Provider chosen + integrated.
- Hidden on /skill flow (no distractions during the shot).
'@ @('epic/support', 'type/feature') $null

    # ------- E12 · Email & notifications
    New-Story 'E12.1 — Transactional templates' @'
The core lifecycle emails.

## Acceptance criteria
- Welcome, email verification, password reset, payment receipt, skill submission acknowledgement, draw result.
- Same visual system as the site (volt accent, Instrument Serif headlines where rendered).
'@ @('epic/email', 'type/feature', 'mvp') 'Sprint 4 — Checkout slice'

    New-Story 'E12.2 — Templated through provider' @'
Email delivery infrastructure.

## Acceptance criteria
- Postmark recommended (high deliverability on transactional).
- Templates managed in provider, payloads sent from backend.
'@ @('epic/email', 'type/feature') $null

    New-Story 'E12.3 — Lifecycle campaigns' @'
Re-engagement emails.

## Acceptance criteria
- Abandoned entry recovery (1h, 24h).
- "Your tier expires soon" nudges.
'@ @('epic/email', 'type/feature') $null

    # ------- E13 · Admin / operations
    New-Story 'E13.1 — Competition CRUD' @'
Back-office UI for managing competitions.

## Acceptance criteria
- Create / publish / close competitions.
- Edit spec, upload images.
- Behind admin guard.
'@ @('epic/admin', 'type/feature') $null

    New-Story 'E13.2 — Draw runner' @'
Trigger + audit the wave draw.

## Acceptance criteria
- Triggers the draw, surfaces the audit log, confirms the winner.
- Defaults to the wave''s scheduled draw date (28-day cron from a fixed epoch).
- Manual override exists for legal / operational holds but emits an audit event when used.
'@ @('epic/admin', 'type/feature') $null

    New-Story 'E13.3 — Manual cash-out / overrides' @'
Operational overrides for edge cases.

## Acceptance criteria
- Cash payouts can be triggered manually.
- Every override emits an audit event.
'@ @('epic/admin', 'type/feature') $null

    New-Story 'E13.4 — Audit log viewer' @'
Searchable audit trail.

## Acceptance criteria
- Filter by user, action, date.
- Export as CSV.
'@ @('epic/admin', 'type/feature') $null
)

Write-Host "`n== Issues ==" -ForegroundColor Yellow
$existingIssues = @(gh issue list --state all --limit 500 --json title --jq '.[].title')
Write-Host "  ($($existingIssues.Count) existing issues found; matching titles will be skipped)"

$created = 0
$skipped = 0
$failed = 0
$utf8NoBom = [Text.UTF8Encoding]::new($false)

foreach ($s in $stories) {
    if ($existingIssues -contains $s.title) {
        $skipped++
        Write-Host "  - skip (exists): $($s.title)" -ForegroundColor DarkGray
        continue
    }

    $tempBody = [IO.Path]::GetTempFileName()
    try {
        [IO.File]::WriteAllText($tempBody, $s.body, $utf8NoBom)
        $cmdArgs = @('issue', 'create', '--title', $s.title, '--body-file', $tempBody)
        foreach ($lbl in $s.labels) { $cmdArgs += @('--label', $lbl) }
        if ($s.milestone) { $cmdArgs += @('--milestone', $s.milestone) }
        & gh @cmdArgs | Out-Null
        if ($LASTEXITCODE -ne 0) {
            $failed++
            Write-Host "  x failed: $($s.title)" -ForegroundColor Red
            continue
        }
        $created++
        Write-Host "  + [$created] $($s.title)"
    }
    finally {
        if (Test-Path $tempBody) { Remove-Item $tempBody -Force -ErrorAction SilentlyContinue }
    }
}

Write-Host "`nDone. Created: $created · Skipped (exists): $skipped · Failed: $failed" -ForegroundColor Green
