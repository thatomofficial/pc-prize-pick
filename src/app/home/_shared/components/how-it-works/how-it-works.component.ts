import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Step {
  num: string;
  title: string;
  body: string;
  detail: string;
}

@Component({
  selector: 'app-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="how" class="how">
      <div class="u-container">
        <header class="how__header">
          <span class="t-overline t-overline--volt">§ 04 · The mechanism</span>
          <h2 class="how__heading">
            Skill-based.<br />
            <em class="how__heading-em">No luck</em> in the loop.
          </h2>
        </header>

        <ol class="how__steps" role="list">
          @for (s of steps; track s.num) {
            <li class="how__step">
              <span class="how__step-num t-mono">{{ s.num }}</span>
              <div class="how__step-body">
                <h3 class="how__step-title">{{ s.title }}</h3>
                <p class="how__step-text">{{ s.body }}</p>
                <p class="how__step-detail t-overline">{{ s.detail }}</p>
              </div>
            </li>
          }
        </ol>

        <aside class="how__guarantee">
          <div class="how__guarantee-mark" aria-hidden="true">
            <span class="t-mono">SA · §17</span>
          </div>
          <div>
            <h3 class="how__guarantee-title">Operating under SA competition law.</h3>
            <p class="how__guarantee-body">
              Every draw is governed by South African competition statutes,
              audited by an independent firm, and resolved in SA courts. The
              skill mechanic is a <em>Spot-the-Pixel</em> precision task &mdash;
              the closest answer wins, ties are settled by entry timestamp.
            </p>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      background: var(--ink-900);
      padding-block: clamp(4rem, 8vw, 7rem);
    }

    .how {
      &__header {
        max-width: 56ch;
        margin-bottom: var(--s-16);
      }

      &__heading {
        margin-top: var(--s-4);
        font-family: var(--font-display);
        font-size: var(--type-display-lg);
        line-height: 0.98;
        letter-spacing: var(--tracking-tight);

        &-em {
          font-style: italic;
          color: var(--volt);
        }
      }

      &__steps {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: 0;
        counter-reset: step;
        border-top: var(--hairline);

        @media (min-width: 880px) {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      &__step {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
        padding: var(--s-8) var(--s-4) var(--s-8) 0;
        border-bottom: var(--hairline);

        @media (min-width: 880px) {
          padding-block: var(--s-10);
          padding-right: var(--s-6);
          border-bottom: 0;

          &:not(:last-child)::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            width: 1px;
            background: rgba(246, 241, 231, 0.08);
          }
        }

        &-num {
          font-size: clamp(2.25rem, 4vw, 3.25rem);
          color: var(--volt);
          letter-spacing: -0.04em;
          font-weight: 300;
          line-height: 1;
        }

        &-title {
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 1.8vw, 1.7rem);
          line-height: 1.1;
          letter-spacing: var(--tracking-snug);
          color: var(--cream-100);
        }

        &-text {
          font-size: 0.98rem;
          line-height: 1.55;
          color: var(--cream-200);
        }

        &-detail {
          margin-top: auto;
          padding-top: var(--s-4);
          color: var(--cream-400);
        }
      }

      &__guarantee {
        margin-top: var(--s-16);
        padding: var(--s-8);
        background:
          linear-gradient(135deg, rgba(216, 255, 58, 0.06) 0%, transparent 60%),
          var(--ink-800);
        border: var(--hairline-strong);
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-6);

        @media (min-width: 720px) {
          grid-template-columns: auto 1fr;
          align-items: start;
          gap: var(--s-10);
          padding: var(--s-10);
        }

        &-mark {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 96px;
          height: 96px;
          background: var(--ink-900);
          border: 1px solid var(--volt);
          color: var(--volt);
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          flex-shrink: 0;
        }

        &-title {
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 2vw, 1.85rem);
          line-height: 1.1;
          color: var(--cream-100);
          margin-bottom: var(--s-3);
        }

        &-body {
          font-size: 1rem;
          line-height: 1.6;
          color: var(--cream-300);
          max-width: 64ch;

          em {
            color: var(--volt);
            font-style: italic;
          }
        }
      }
    }
  `
})
export class HowItWorksComponent {
  protected readonly steps: Step[] = [
    {
      num: '01',
      title: 'Choose a build',
      body: 'Browse open competitions. Each has a vetted parts list, a price, and a hard cap on entries.',
      detail: 'No auto-rolling lotteries'
    },
    {
      num: '02',
      title: 'Pick your entries',
      body: 'Buy one or many. Bulk packs unlock 5–15% off. Your entries are time-stamped and on-chain logged.',
      detail: 'Bulk: 5% / 10% / 15%'
    },
    {
      num: '03',
      title: 'Place your shot',
      body: 'Mark the exact spot on the puzzle image. Closest pixel to the target wins. No randomness.',
      detail: 'Skill, not chance'
    },
    {
      num: '04',
      title: 'Take the rig or the cash',
      body: 'Pick up the build from our Cape Town workshop or accept the cash equivalent within 48h.',
      detail: 'Cash always available'
    }
  ];
}
