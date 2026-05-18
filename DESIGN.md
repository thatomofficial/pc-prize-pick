# DESIGN.md

The visual system for PC Prize Pick. Read this before changing tokens, adding
sections, or introducing new components — every page of the site is built on
the same vocabulary set here.

## Aesthetic position

**Editorial darkroom, premium PC hardware press kit.** Closer to *Hodinkee* or
*Monocle*'s gear features than to a casino or generic cyberpunk gaming site.
The goal is for serious PC builders to feel respected by the design, not
hustled.

Three commitments hold this together:

1. **One sharp accent.** A single chartreuse (`--volt`, `#d8ff3a`) carries
   every CTA, live indicator, and highlight word. It only earns weight by
   being rare.
2. **Type-led layouts.** Editorial display serif (Instrument Serif) does the
   shouting; the body grotesque (Hanken Grotesk) does the talking; monospace
   (JetBrains Mono) does the counting. Layout supports type, not the other way
   around.
3. **No round corners, no soft shadows.** Sharp rectangles, hairline borders,
   and corner-tick accents. Depth comes from hue and contrast, not blur.

## Token map

All tokens live in [`src/assets/scss/_tokens.scss`](src/assets/scss/_tokens.scss)
as CSS custom properties on `:root`. Components reference them directly via
`var(--name)`.

### Colour

| Token         | Value     | Used for                                           |
| ------------- | --------- | -------------------------------------------------- |
| `--ink-1000`  | `#050403` | Deepest backgrounds (footer, ticker)               |
| `--ink-900`   | `#0b0907` | Page base                                          |
| `--ink-800`   | `#14110f` | Elevated cards                                     |
| `--ink-700`   | `#1c1815` | Borders / fills one step up                        |
| `--ink-600`   | `#2a2420` | Subtle dividers                                    |
| `--ink-500`   | `#3d3631` | Disabled / very low-emphasis                       |
| `--cream-100` | `#f6f1e7` | Primary text, headlines                            |
| `--cream-200` | `#e8e2d4` | Body text                                          |
| `--cream-300` | `#b8b0a3` | Muted body / meta                                  |
| `--cream-400` | `#807870` | Low-emphasis labels                                |
| `--cream-500` | `#4a443e` | Watermarks, deep mutes                             |
| `--volt`      | `#d8ff3a` | Single accent — CTAs, live dots, accent italics    |
| `--volt-dim`  | `#9bbc1e` | Gradient stops, hover variants                     |
| `--signal`    | `#ff5a36` | Urgency — closing-soon states only                 |
| `--rare`      | `#6aa8ff` | Info dots in spec art, never CTAs                  |

**Rule of thumb:** if you find yourself adding a new colour, the answer is
almost always a new tint of `--cream-` or `--ink-`, not a new hue. Per-card
accent hues use the `--hue` CSS custom property pattern (see
`CompetitionCardComponent`) to vary one card from the next without expanding
the global palette.

### Typography

| Family            | Stack                                       | Use                                  |
| ----------------- | ------------------------------------------- | ------------------------------------ |
| `--font-display`  | Instrument Serif → Cormorant Garamond → serif | Headlines, accent italics, card titles |
| `--font-body`     | Hanken Grotesk → Helvetica Neue → system-ui | All running text, UI labels          |
| `--font-mono`     | JetBrains Mono → SF Mono → Menlo            | Prices, countdowns, IDs, build codes |

Type scale tokens are responsive via `clamp()`:

- `--type-display-xl` — hero headline (`clamp(3.25rem, 9.5vw, 8.5rem)`)
- `--type-display-lg` — section headlines
- `--type-display-md` — card titles, secondary headlines
- `--type-heading-lg / md` — subsection labels
- `--type-body-lg / body / sm` — paragraph text
- `--type-overline` (`0.6875rem`, uppercase, wider tracking) — section markers
  and labels.

Helper classes in [`_typography.scss`](src/assets/scss/_typography.scss):
`.t-display-xl`, `.t-display-lg`, `.t-display-md`, `.t-heading-lg`,
`.t-heading-md`, `.t-body-lg`, `.t-body`, `.t-body-sm`, `.t-overline`,
`.t-overline--volt`, `.t-mono`, `.t-mono-lg`, `.t-mono-xl`. These are intended
for in-template use when a one-off element needs typographic treatment without
its own component scope.

### Spacing

A scaled token system: `--s-1` (0.25rem) → `--s-40` (10rem). The named scale
intentionally skips uncommon values; if a component needs `--s-7`, the answer
is usually `--s-6` plus a `padding-inline` tweak, not a new token.

Page-level container: `.u-container` with `max-width: var(--page-max)` (1440px)
and responsive gutter `var(--gutter)` (`clamp(1.25rem, 4vw, 4rem)`).

### Borders

| Token                | Value                                       |
| -------------------- | ------------------------------------------- |
| `--hairline`         | `1px solid rgba(246, 241, 231, 0.08)`       |
| `--hairline-strong`  | `1px solid rgba(246, 241, 231, 0.18)`       |
| `--hairline-volt`    | `1px solid rgba(216, 255, 58, 0.4)`         |

These are the **only** borders used on shared surfaces. Cards never get rounded
corners; emphasis comes from corner-tick decorations (see `home-hero__sheet`
`::before` / `::after`) rather than radius.

### Motion

| Token                 | Value                                |
| --------------------- | ------------------------------------ |
| `--ease-out-quart`    | `cubic-bezier(0.25, 1, 0.5, 1)`      |
| `--ease-in-out-quart` | `cubic-bezier(0.76, 0, 0.24, 1)`     |
| `--ease-expo`         | `cubic-bezier(0.16, 1, 0.3, 1)`      |
| `--dur-fast`          | `180ms` — hovers, micro-interactions |
| `--dur-med`           | `360ms` — card lifts, transforms     |
| `--dur-slow`          | `720ms` — page reveals, progress bars|

The hero uses staggered `u-reveal` utility classes (`.u-reveal--1` …
`.u-reveal--12`) that delay an `opacity + translateY` rise by 80ms increments.
`prefers-reduced-motion: reduce` neutralises all animations site-wide via the
rule in [`_utilities.scss`](src/assets/scss/_utilities.scss).

## BEM patterns

Every section component declares its own block. Element selectors nest under
the block selector in SCSS to keep specificity flat and avoid leaks:

```scss
.card {
  // block styles

  &__header { … }
  &__name { … }
  &--closing { … }
}
```

Modifier classes describe state (`--closing`, `--critical`, `--volt`), never
size or position. Layout is parent-driven via CSS grid / flex, not via modifier
classes on the child.

## Component shapes

A few patterns repeat across the homepage and should be the first choice for
new sections:

- **Section header.** Overline + display headline + (optional) sub-paragraph.
  Section headlines may use one italic-volt `<em>` for accent — exactly one
  per headline, never two.
- **Build-sheet card.** Hairline-strong border, corner-tick `::before` /
  `::after`, dense spec grid with monospace values, gradient meter, volt CTA.
  See `HomeHeroComponent`.
- **Metric block.** Mono-XL number stacked over an overline label, separated
  from siblings by hairline rules drawn with `::before` / `::after` (not by
  borders on the cell — keeps the grid edges clean). See
  `SocialProofComponent`.
- **Editorial list row.** Big mono index number + label + price columns + arrow
  CTA, with a left-edge volt line that scales in on hover. See
  `PrizeTiersComponent`.

When in doubt, copy the closest existing pattern and modify; new shapes need a
strong reason.

## Currency, dates, numerics

- Prices store as cents on the model, render as `currency:'ZAR':'symbol':...:
  'en-ZA'`. The `en-ZA` argument is required even though it's also the global
  `LOCALE_ID` — see `CLAUDE.md`.
- All numerics that flank text or sit in a column use `var(--font-mono)` with
  `font-feature-settings: 'tnum' 1, 'zero' 1` so digits align.
- Dates passed to display layers are ISO strings; format with the `date` pipe
  at the template boundary.

## Decisions, with reasons

- **No images yet.** The PC artwork is constructed from CSS layers (component
  bays, glow line, monospace watermarks) because (a) we don't have rendered
  build photography, (b) the abstract treatment reinforces the engineering /
  spec-sheet metaphor, and (c) it costs no bytes. When real photography
  arrives, the `&__art` block in `CompetitionCardComponent` is the swap point.
- **`en-ZA` everywhere.** ZAR symbol and grouping (`R 99,60`) only render
  correctly with the locale registered and explicitly passed. Tests will need
  the same setup if they assert currency strings.
- **`Instrument Serif` over `Fraunces` / common serifs.** Less common, has the
  right amount of editorial attitude (especially in italic), and pairs cleanly
  with grotesque body text.
- **Volt over neon purple.** Avoids the standard "AI dashboard" aesthetic
  entirely. Chartreuse reads premium, plays well against warm dark surfaces,
  and remains legible on cream when used as a foreground colour.

## When to extend vs deviate

Adding a new section to the homepage or a new page anywhere in the app:

1. Start by reusing the patterns above. The aesthetic depends on consistency
   to feel intentional.
2. New tokens enter through `_tokens.scss` only — never inline raw hex values
   in component styles.
3. If the section needs a colour that isn't in the palette, propose it in a PR
   description with the use case before adding it. The accent set is
   deliberately tight.
4. If a section breaks the "no round corners, no soft shadows" rule, it had
   better be deliberate and confined to one block — and you should write a
   note in the component about why.
