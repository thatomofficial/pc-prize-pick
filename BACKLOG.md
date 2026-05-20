# BACKLOG.md

The full product backlog for PC Prize Pick. Grouped by epic. Each story is
sized to be implementable in one to three days by a single developer; bigger
stories should be split before they're picked up. Acceptance criteria are the
minimum a story must satisfy to be considered done — anything beyond is a
follow-up story, not scope creep on the current one.

## Status legend

- `[ ]` not started
- `[~]` in progress
- `[x]` done
- `[—]` deferred / out of scope for now

## What's done

- `[x]` Project scaffolded — Angular 21, SCSS, routing, multi-env config.
- `[x]` Branch model — `main`, `dev`, `qa`, `local_env`.
- `[x]` Design system tokens, typography, BEM patterns. See `DESIGN.md`.
- `[x]` Homepage built against mock data — hero, ticker, featured grid,
  tiers, how-it-works, social proof, footer.
- `[x]` `CountdownComponent` (signal-based, accessible).
- `[x]` Mock data service for competitions, tiers, winners.

## Cadence

Competitions run on **fully synchronized 4-week (28-day) waves**, mirroring
Dream Drive. Every 4 weeks a new wave opens and the previous wave's builds
close at the same moment for a single draw. There is one wave clock per
page — `app-wave-clock` on the homepage — not per build. Loyalty point
resets, tier reviews, and admin operations align to the 4-week boundary.

**Wave-close moment is always Sunday 23:59:59.999 SAST** (= Sunday
21:59:59.999 UTC). The 28-day cadence advances Sunday → Sunday → Sunday
cleanly. Backend scheduler, admin draw runner, mock data, and any new
copy must respect this anchor.

## MVP definition

The smallest thing that lets a real South African buyer pay for an entry,
take the skill shot, and learn whether they won:

1. Land on the homepage → click a featured competition. (done — page exists)
2. View the competition detail and see specs, entries, countdown.
3. Sign up / sign in.
4. Pick entry count, see ZAR total, accept the discount tier, pay.
5. After payment, take the Spot-the-Ball skill shot.
6. Receive an email confirming entry + skill submission.
7. After the draw closes, receive an email with the result.
8. See entries and outcomes on the account dashboard.

Everything else (admin, loyalty, archive, blog) is post-MVP. Use the section
below labelled **MVP** on each epic to find the stories that land that flow.

---

## Foundations (cross-cutting)

These exist because every product epic depends on them. None ship a feature
alone; they all unblock something downstream.

### F1 · API client + HTTP infrastructure

- `[ ]` **F1.1 — Define `ApiClientService` wrapper.** MVP.
  - Centralised `HttpClient` wrapper with typed `get<T>` / `post<T>` /
    `put<T>` / `delete<T>` helpers.
  - Reads base URL from `environment.apiEndpoint`.
  - Adds correlation id header (`x-request-id`) per request.
  - Unit tests covering URL composition, header injection, and error mapping.
- `[ ]` **F1.2 — `authInterceptor` for bearer tokens.** MVP.
  - Attaches `Authorization: Bearer <jwt>` when a token is present in
    `AuthService`.
  - Skips public endpoints (login, register, password reset).
  - Refreshes silently on 401 once, then logs out on the second 401.
- `[ ]` **F1.3 — Global error mapping.**
  - Maps API error shape `{ code, message, fields }` to a typed
    `ApiError` and rethrows.
  - Converts 5xx + network errors to a user-readable copy through the
    `ToastService` (see F3.1).
  - Logs unmapped errors to Sentry (see F7.2).
- `[ ]` **F1.4 — Replace `MockCompetitionsService`.**
  - Implement `CompetitionsApiService` against `GET /api/competitions`,
    `GET /api/competitions/:slug`, `GET /api/competitions/recent-winners`.
  - Behind a `provideMocks` feature flag so demos still work without backend.

### F2 · Authentication

- `[ ]` **F2.1 — `AuthService` with signal-backed `currentUser` state.** MVP.
  - Stores JWT in `localStorage` under a namespaced key.
  - Exposes `currentUser = signal<User | null>(null)`, `isAuthed = computed(...)`.
  - On boot, rehydrates from storage and verifies token still valid.
- `[ ]` **F2.2 — `authGuard` and `guestGuard`.** MVP.
  - `authGuard` redirects to `/login?returnUrl=...` when unauthed.
  - `guestGuard` redirects authed users away from login/register pages.
- `[ ]` **F2.3 — Token refresh.**
  - Background refresh ~60s before expiry.
  - On tab focus, re-check expiry.
- `[ ]` **F2.4 — Social login (Google, Microsoft).**
  - Reuse `@abacritt/angularx-social-login` or equivalent.
  - Client IDs sourced from `environment.socialLoginConfig`.

### F3 · Error handling, loading & toasts

- `[ ]` **F3.1 — `ToastService` + `<app-toast-host>`.** MVP.
  - Methods `success`, `error`, `info`. Auto-dismiss after 5s.
  - Honors `prefers-reduced-motion`.
  - Stack max 4 toasts; older drop.
- `[ ]` **F3.2 — `LoadingState` pattern.** MVP.
  - Standard shape `{ status: 'idle'|'loading'|'ready'|'error', data?, error? }`
    exposed via signal.
  - `<app-loading-state>` renders skeleton / spinner / error block / content
    based on the signal.
- `[ ]` **F3.3 — Empty state component.**
  - Reusable block with illustration slot, headline, CTA.
  - Used by archive, my entries, search-no-results.

### F4 · Forms & validation conventions

- `[ ]` **F4.1 — Reactive form helpers.** MVP.
  - `<app-form-field>` wrapping label / control / error message with consistent
    styles.
  - `<app-form-error>` reads control validity, renders message from a typed
    `ValidationCopy` map.
- `[ ]` **F4.2 — Common validators.**
  - SA mobile (`+27` or `0` prefix), SA ID number (Luhn check), strong
    password (min 10 chars, mixed case + number).

### F5 · Routing & page transitions

- `[ ]` **F5.1 — Routes restructure.** MVP.
  - Split `app.routes.ts` into `home.routes.ts`, `auth.routes.ts`,
    `competitions.routes.ts`, `account.routes.ts`, `support.routes.ts`,
    `legal.routes.ts`. Wire as flat children in `app.routes.ts`.
- `[ ]` **F5.2 — Scroll restoration + reset on navigate.**
- `[ ]` **F5.3 — Page transition.**
  - Subtle 200ms fade on route change. Skipped under
    `prefers-reduced-motion`.

### F6 · Testing strategy

- `[ ]` **F6.1 — Vitest baseline + coverage target.**
  - Add `vitest.config.ts` with `@analogjs/vitest-angular` or built-in
    Angular runner.
  - Coverage target ≥ 70% on `_shared/services` and `_shared/components`.
  - CI fails below threshold.
- `[ ]` **F6.2 — Playwright E2E setup.**
  - Headless Chromium + headed local mode.
  - One smoke test: load homepage, see hero, ticker scrolls, click first
    competition CTA.
- `[ ]` **F6.3 — Visual regression baseline.**
  - Chromatic or Percy on the homepage, competition detail, checkout.
  - Run on every PR to `dev`.
- `[ ]` **F6.4 — Story-level component tests.**
  - For each shipped component, a Vitest spec covering the input matrix
    and OnPush change-detection behaviour.

### F7 · Observability

- `[ ]` **F7.1 — Analytics (Plausible or PostHog).**
  - Page views auto-tracked.
  - Custom events: `entry_started`, `entry_completed`, `skill_submitted`,
    `payment_failed`.
- `[ ]` **F7.2 — Error reporting (Sentry).**
  - DSN per environment from `environment.ts`.
  - Source maps uploaded on prod builds.
  - PII scrubbing on breadcrumbs.

### F8 · Accessibility baseline

- `[ ]` **F8.1 — Audit current homepage.**
  - Run axe-core; resolve all critical / serious issues.
  - Manual keyboard sweep — every interactive element reachable + visible
    focus ring.
- `[ ]` **F8.2 — Skip-link, landmark roles, heading hierarchy.**
- `[ ]` **F8.3 — Live region for countdowns and ticker** (aria-live polite
  with throttle so screen readers don't get hammered).

### F9 · SEO & meta

- `[ ]` **F9.1 — `<title>`, `<meta description>`, OG tags per route.**
- `[ ]` **F9.2 — Sitemap.xml + robots.txt** (generated at build time).
- `[ ]` **F9.3 — Structured data.**
  - `Product`-ish JSON-LD on competition detail (with caveats — these aren't
    products, but Google understands the schema).

### F10 · Performance budgets

- `[ ]` **F10.1 — Tighten `angular.json` budgets** — current `1MB` initial
  is generous; target `350kB` gzipped.
- `[ ]` **F10.2 — Self-host fonts** to eliminate Google Fonts blocking
  request.
- `[ ]` **F10.3 — Image strategy** — `<picture>` with AVIF + WebP, sizes
  per breakpoint, eager only on the hero.

---

## Product epics

### E1 · Landing & marketing

- `[x]` **E1.1 — Homepage v1.** Done.
- `[ ]` **E1.2 — Replace stub PC art with real photography.**
  - Sourced from the workshop, 1 hero image per featured build.
  - AVIF + WebP + JPEG fallback, art-directed crops per breakpoint.
- `[ ]` **E1.3 — Marketing landing variant.**
  - `/welcome` route for paid acquisition with a single CTA and no nav.
  - A/B tested headline copy via the analytics service.
- `[ ]` **E1.4 — Press / Brand page.**
  - Downloadable logo pack, brand guidelines snippet, press contact.
- `[ ]` **E1.5 — Blog / News index** (optional, post-MVP).

### E2 · Browse competitions

- `[ ]` **E2.1 — `/competitions` listing.** MVP.
  - Server-paginated grid, same card shape as homepage.
  - Sort by closing soonest / newest / lowest entry / highest value.
  - Filter by tier and by build type (gaming / studio / mini).
- `[ ]` **E2.2 — Search.**
  - Client-side fuzzy search over loaded page; server-side once index grows
    beyond 500 entries.
- `[ ]` **E2.3 — Archive / past competitions.**
  - `/competitions/archive` — same layout as listing but read-only with
    "drawn on" + winner attribution.

### E3 · Competition detail

- `[ ]` **E3.1 — `/competitions/:slug` page.** MVP.
  - Hero with image gallery, build name, status, countdown.
  - Full spec list (CPU, GPU, RAM, storage, PSU, case, cooling, peripherals
    if any).
  - Entries meter (sold / cap), cash alternative, entry price.
  - Primary CTA: "Take a shot — R XX,XX".
  - Countdown reflects the 4-week cycle — copy reads "this wave closes…" not
    "this competition closes…"; once a wave closes, the page must surface
    the wave's draw outcome and link to the next wave's competition in the
    same tier.
- `[ ]` **E3.2 — Spec card "build sheet" downloadable PDF.**
- `[ ]` **E3.3 — Related competitions row.**
- `[ ]` **E3.4 — Share menu.**
  - Twitter / WhatsApp / copy-link with prefilled copy that includes the
    countdown.

### E4 · Skill mechanic — Spot-the-Ball

Spot-the-Ball with a twist. Each wave's challenge is a single still photo
— typically the prize PC staged with a tennis-ball / ping-pong-ball
placed somewhere in frame — with the ball digitally removed before
publication. The player clicks where they think the ball was.

**Win rule** (deliberate divergence from Dream Drive — see
`memory/project_skill_mechanic.md`):

1. **Exact-pixel hit wins.** Every submission whose `(x, y)` exactly
   matches the stored target `(bx, by)` is a winner — 0, 1, or many.
   No tie-breaking among exact hits.
2. **Closest-pixel fallback** when nobody is exact. The single submission
   closest by Euclidean distance wins; ties broken by server-received
   timestamp.

**Supply model.** Prize PCs are pre-builts procured from the entry-money
pool. Workshop buys **one unit per winner** after the wave closes.
Margin discipline depends on keeping exact-pixel winners rare — image
selection + ball placement matter.

- `[ ]` **E4.1 — `SkillChallengeService` API contract.** MVP.
  - `GET /api/competitions/:slug/challenge` returns `{ imageUrl,
challengeId, expiresAt, imageWidth, imageHeight }`.
  - `POST /api/skill-submissions` accepts `{ challengeId, x, y, submittedAt }`
    and returns a receipt id. `x` / `y` are integer pixel coordinates in
    the natural image space (not the rendered viewport).
  - `expiresAt` is bound by the competition's wave close, which itself sits
    on the 28-day cycle — challenges cannot be submitted after wave close.
- `[ ]` **E4.2 — Skill UI.** MVP.
  - Full-bleed challenge image with a click / tap target that places a
    crosshair at the cursor.
  - Pinch-zoom support on touch; arrow-key nudge on keyboard for fine
    placement.
  - Submit confirms the coordinate; the choice cannot be changed once
    submitted.
- `[ ]` **E4.3 — Practice mode.**
  - Reduced-stakes practice round against a sample image, no entry
    burned. Used to teach the mechanic to first-time entrants.
- `[ ]` **E4.4 — Audit log + winner selection.**
  - Every submission writes an immutable record with the client
    timestamp and the server-received timestamp.
  - The original (un-edited) image and target `(bx, by)` are stored
    alongside the challenge so any draw can be re-verified.
  - Winner-selection job implements the two-stage rule above, emits one
    audit event per winner, and persists both stages' inputs + outputs
    (exact-hit count + fallback distances) even when zero or many
    winners result.

### E5 · Entry purchase & checkout

- `[ ]` **E5.1 — Cart-less single-competition entry.** MVP.
  - Quantity stepper with tier discount preview (5% / 10% / 15%).
  - Order summary on the right (or below on mobile).
  - Payment provider button row.
- `[ ]` **E5.2 — Payment integration — primary provider.** MVP.
  - **Yoco** is the recommended primary — strong SA card support, simple
    redirect flow, no PCI scope for us.
  - Webhook receipt handling on backend; client polls for confirmation.
- `[ ]` **E5.3 — Payment fallback — alternative provider.**
  - Peach Payments or PayFast as fallback. Driven by a feature flag.
- `[ ]` **E5.4 — Failure & retry.**
  - Clear copy on declined cards, lost network during redirect, abandoned
    flows.
  - Resume entry from email link within 30 minutes.
- `[ ]` **E5.5 — Confirmation page.**
  - Receipt id, entry count, link to take skill shot now or later.
- `[ ]` **E5.6 — Bulk packs.**
  - Predefined 5 / 10 / 25 packs with displayed discount.

### E6 · Account & profile

- `[~]` **E6.1 — Sign up.** MVP.
  - UI shipped against mock `AuthService.signUp()` at `/register` (email +
    optional display name + password + confirm, password-match validator,
    error path via `wrong@test.com`).
  - **Still open:** email verification flow, social login parity (see F2.4),
    real backend wiring (see F1.4 + F2.1).
- `[~]` **E6.2 — Sign in / forgot password / reset.** MVP.
  - UI shipped: `/login` against mock `AuthService.signIn()`, `/forgot-password`
    against `AuthService.requestPasswordReset()` (always succeeds, security
    pattern). `authGuard` captures `?returnUrl=` so the post-login redirect
    works.
  - **Still open:** real backend, actual reset email (E12.1), token refresh
    (F2.3).
- `[~]` **E6.3 — `/account` dashboard.** MVP.
  - Skeleton shipped: identity card (initials, displayName, email),
    sign-out button, placeholder panels for Open entries / Skill submissions
    / Loyalty tier, "Up next" list pointing at remaining backlog items.
  - **Still open:** real entry data once Competitions API lands; real
    submission history once E4.2 ships; loyalty integration (E8).
- `[ ]` **E6.4 — Profile settings.**
  - Display name, mobile, address (for prize delivery), comms preferences.
- `[ ]` **E6.5 — Wallet / cash-out alternative.**
  - When the user wins and elects cash, bank account capture + payout
    status.
- `[ ]` **E6.6 — KYC for prizes over R25 000.**
  - SA ID upload + selfie verification before payout.

### E7 · Winners & social proof

- `[ ]` **E7.1 — `/winners` page.**
  - Reverse-chronological list of past winners with prize, build, and a
    quote where available.
- `[ ]` **E7.2 — Winner intake.**
  - Authenticated form for winners to submit a photo + short quote post-pickup.
- `[ ]` **E7.3 — Workshop visit booking** (see also E9).

### E8 · Loyalty — Rising Stars

- `[ ]` **E8.1 — Tier definitions.**
  - Stars / Lead Builder / Apex etc. with point thresholds, perks per tier
    (early access window, free entries on birthday, etc.).
- `[ ]` **E8.2 — Point accrual.**
  - 1 point per ZAR spent on entries; bonus on streaks.
- `[ ]` **E8.3 — Tier dashboard card** on `/account`.

### E9 · Workshop & about

- `[ ]` **E9.1 — `/about` page.**
  - Story, team, photos of the Cape Town workshop.
- `[ ]` **E9.2 — `/workshop/visit` booking.**
  - Pick a slot to tour the workshop and see the build before entering.

### E10 · Legal & policies

- `[ ]` **E10.1 — `/legal/terms`.** MVP.
- `[ ]` **E10.2 — `/legal/privacy`.** MVP — POPIA-aligned.
- `[ ]` **E10.3 — `/legal/rules`.** MVP.
  - Per-competition rules, draw process, dispute resolution, audit firm.
- `[ ]` **E10.4 — `/legal/responsible-play`.**
  - Self-exclusion form, spend limits.
- `[ ]` **E10.5 — Cookie banner.**
  - POPIA + GDPR-tolerant, granular consent for analytics vs essential.

### E11 · Support & FAQ

- `[ ]` **E11.1 — `/faq` searchable accordion.**
- `[ ]` **E11.2 — Contact form** with category routing to inboxes.
- `[ ]` **E11.3 — In-app help bubble** (later — Crisp / Intercom).

### E12 · Email & notifications

- `[ ]` **E12.1 — Transactional templates.** MVP.
  - Welcome, email verification, password reset, payment receipt, skill
    submission acknowledgement, draw result.
- `[ ]` **E12.2 — Templated through provider.** SendGrid or Postmark
  (Postmark recommended for high deliverability on transactional).
- `[ ]` **E12.3 — Lifecycle campaigns.**
  - Abandoned entry recovery (1h, 24h).
  - "Your tier expires soon" nudges.

### E13 · Admin / operations

Back-office UI for the workshop team. Could be a separate Angular workspace
or a section in the same app behind admin guard.

- `[ ]` **E13.1 — Competition CRUD.**
  - Create / publish / close competitions, edit spec, upload images.
- `[ ]` **E13.2 — Draw runner.**
  - Trigger the draw, see the audit log, confirm winners.
  - Defaults to the wave's scheduled draw date (28-day cron from a fixed
    epoch). Manual override exists for legal / operational holds but emits
    an audit event when used.
  - Calls the E4.4 winner-selection job (exact-pixel first, closest-pixel
    fallback). Surfaces the **winner list** (may be 1 or many) plus
    fallback distances in a reviewable preview before publication.
  - Triggers downstream **procurement workflow** (BACKLOG E13.3): one
    pre-built PC per winner, paid from the wave's entry-money pool.
  - Per-winner outcome flag captures whether they elected the PC or the
    cash equivalent.
- `[ ]` **E13.3 — Manual cash-out / overrides.**
- `[ ]` **E13.4 — Audit log viewer.**

---

## Definition of done (per story)

- Acceptance criteria verified in a browser at the relevant breakpoints
  (375px, 768px, 1280px).
- Unit tests cover the new logic (F6.1 thresholds).
- E2E touched if the story is on a critical flow (auth, checkout, skill).
- Accessibility: keyboard reachable, focus visible, axe-core clean.
- Copy reviewed (no Lorem, no stub URLs in committed code).
- Telemetry events fire where applicable.
- Story committed on `dev` and the homepage / affected page builds clean.

## Suggested sprint slicing

If you want to ship the MVP flow end-to-end without wasted scaffolding, do
roughly this order. Each numbered group is ~1–2 weeks for one developer.

1. **Foundations 1.** F1.1, F1.2, F1.3, F2.1, F2.2, F3.1, F3.2, F4.1, F5.1.
2. **Browse & detail.** E2.1, E3.1, then plug F1.4 to replace the mock
   service.
3. **Auth UX.** E6.1, E6.2, E6.3 (read-only first).
4. **Checkout slice.** E5.1, E5.2, E5.4, E5.5, E12.1.
5. **Skill mechanic.** E4.1, E4.2.
6. **Legal must-haves.** E10.1, E10.2, E10.3, E10.5.
7. **Soft launch.** F6.2 (E2E on the full flow), F7.1, F8.1, F10.1.

Everything else — archive, loyalty, admin, marketing variants, blog — is
post-launch.
