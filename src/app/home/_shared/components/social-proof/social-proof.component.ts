import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Testimonial {
  quote: string;
  name: string;
  rig: string;
  city: string;
}

@Component({
  selector: 'app-social-proof',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="winners" class="proof">
      <div class="u-container">
        <header class="proof__header">
          <span class="t-overline t-overline--volt">§ 05 · The receipts</span>
          <h2 class="proof__heading">
            52 184 builders.<br />
            <em class="proof__heading-em">R12.4M</em> in parts.
          </h2>
        </header>

        <div class="proof__grid">
          <article class="proof__quote">
            <span class="proof__mark" aria-hidden="true">&ldquo;</span>
            <blockquote class="proof__quote-text">
              I&rsquo;d been pricing the build for six months. Won the
              Threadripper rig on entry three. They&rsquo;d shipped the box
              before I&rsquo;d finished cancelling my saved cart.
            </blockquote>
            <footer class="proof__quote-foot">
              <div>
                <span class="proof__quote-name">{{ featured.name }}</span>
                <span class="proof__quote-meta">
                  <span>{{ featured.rig }}</span>
                  <span class="proof__quote-sep">·</span>
                  <span>{{ featured.city }}</span>
                </span>
              </div>
              <div class="proof__quote-rating">
                <span class="t-mono">4.9</span>
                <span class="proof__quote-stars" aria-label="4.9 of 5">
                  <span></span><span></span><span></span><span></span><span class="proof__quote-stars-half"></span>
                </span>
                <span class="t-overline">4 218 reviews</span>
              </div>
            </footer>
          </article>

          <div class="proof__metrics">
            <div class="proof__metric">
              <span class="proof__metric-val t-mono-xl">R12.4M</span>
              <span class="proof__metric-label">Prizes awarded</span>
            </div>
            <div class="proof__metric">
              <span class="proof__metric-val t-mono-xl">52 184</span>
              <span class="proof__metric-label">Winning entries</span>
            </div>
            <div class="proof__metric">
              <span class="proof__metric-val t-mono-xl">0.0%</span>
              <span class="proof__metric-label">Cash-out delay (avg 18h)</span>
            </div>
            <div class="proof__metric">
              <span class="proof__metric-val t-mono-xl">98%</span>
              <span class="proof__metric-label">Would enter again</span>
            </div>
          </div>
        </div>

        <ul class="proof__row" role="list">
          @for (t of more; track t.name) {
            <li class="proof__card">
              <p class="proof__card-quote">{{ t.quote }}</p>
              <footer class="proof__card-foot">
                <span class="proof__card-name">{{ t.name }}</span>
                <span class="proof__card-meta">{{ t.rig }} · {{ t.city }}</span>
              </footer>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      background: var(--ink-1000);
      padding-block: clamp(4rem, 8vw, 7rem);
      border-top: var(--hairline);
    }

    .proof {
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

      &__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-8);

        @media (min-width: 960px) {
          grid-template-columns: 1.4fr 1fr;
          gap: var(--s-12);
        }
      }

      // — Big editorial quote card
      &__quote {
        position: relative;
        padding: var(--s-12) var(--s-8) var(--s-8);
        background:
          linear-gradient(180deg, var(--ink-800) 0%, var(--ink-900) 100%);
        border: var(--hairline-strong);
        overflow: hidden;

        @media (min-width: 720px) {
          padding: var(--s-16) var(--s-12) var(--s-10);
        }
      }

      &__mark {
        position: absolute;
        top: -0.35em;
        left: 0.15em;
        font-family: var(--font-display);
        font-style: italic;
        font-size: clamp(14rem, 24vw, 22rem);
        line-height: 1;
        color: var(--volt);
        opacity: 0.1;
        pointer-events: none;
      }

      &__quote-text {
        font-family: var(--font-display);
        font-size: clamp(1.4rem, 2.2vw, 1.85rem);
        line-height: 1.3;
        color: var(--cream-100);
        letter-spacing: var(--tracking-snug);
        position: relative;
        z-index: 1;
      }

      &__quote-foot {
        margin-top: var(--s-10);
        padding-top: var(--s-5);
        border-top: var(--hairline);
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-4);

        @media (min-width: 600px) {
          grid-template-columns: 1fr auto;
          align-items: end;
        }
      }

      &__quote-name {
        display: block;
        font-weight: 600;
        color: var(--cream-100);
      }

      &__quote-meta {
        display: inline-flex;
        gap: 0.6ch;
        margin-top: 2px;
        font-size: 0.85rem;
        color: var(--cream-300);
      }

      &__quote-sep {
        color: var(--cream-500);
      }

      &__quote-rating {
        display: inline-flex;
        align-items: center;
        gap: var(--s-3);
        font-size: 0.95rem;
        color: var(--cream-100);
      }

      &__quote-stars {
        display: inline-flex;
        gap: 2px;

        & > span {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: var(--volt);
          clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }

        &-half {
          background: linear-gradient(90deg, var(--volt) 50%, rgba(216, 255, 58, 0.25) 50%) !important;
        }
      }

      // — Metrics column
      &__metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        align-self: stretch;
        border: var(--hairline);

        @media (min-width: 600px) and (max-width: 959px) {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      &__metric {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
        padding: var(--s-6);
        position: relative;

        &:not(:nth-child(2n))::after {
          content: '';
          position: absolute;
          top: 12%;
          bottom: 12%;
          right: 0;
          width: 1px;
          background: rgba(246, 241, 231, 0.08);
        }

        &:nth-child(-n+2)::before {
          content: '';
          position: absolute;
          left: 12%;
          right: 12%;
          bottom: 0;
          height: 1px;
          background: rgba(246, 241, 231, 0.08);
        }

        @media (min-width: 600px) and (max-width: 959px) {
          &:not(:last-child)::after {
            content: '';
            top: 12%;
            bottom: 12%;
            right: 0;
            width: 1px;
            display: block !important;
          }
          &::before {
            display: none !important;
          }
        }

        &-val {
          color: var(--cream-100);
        }

        &-label {
          font-size: 0.8rem;
          color: var(--cream-300);
          letter-spacing: -0.005em;
        }
      }

      // — Smaller testimonial row
      &__row {
        list-style: none;
        padding: 0;
        margin: var(--s-12) 0 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-4);

        @media (min-width: 720px) {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      &__card {
        padding: var(--s-6);
        background: var(--ink-800);
        border: var(--hairline);
        display: flex;
        flex-direction: column;
        gap: var(--s-5);
        transition: border-color var(--dur-fast);

        &:hover {
          border-color: rgba(216, 255, 58, 0.3);
        }
      }

      &__card-quote {
        font-size: 0.98rem;
        line-height: 1.55;
        color: var(--cream-200);
      }

      &__card-foot {
        padding-top: var(--s-4);
        border-top: var(--hairline);
      }

      &__card-name {
        display: block;
        font-weight: 600;
        color: var(--cream-100);
        font-size: 0.95rem;
      }

      &__card-meta {
        display: block;
        margin-top: 2px;
        font-size: 0.8rem;
        color: var(--cream-300);
      }
    }
  `
})
export class SocialProofComponent {
  protected readonly featured: Testimonial = {
    quote: '',
    name: 'Sipho Khumalo',
    rig: 'Studio Build · Threadripper 7980X',
    city: 'Johannesburg'
  };

  protected readonly more: Testimonial[] = [
    {
      quote: 'Bought ten entries on the Mini ITX. Picked up the case from the workshop a week later. Genuinely felt like cheating.',
      name: 'L. van Wyk',
      rig: 'Silent Mini ITX',
      city: 'Stellenbosch'
    },
    {
      quote: 'Took the cash. Used it to fund a renovation. My wife thinks PC Prize Pick is now legally an investment vehicle.',
      name: 'D. Naidoo',
      rig: 'Apex Build · cash',
      city: 'Durban'
    },
    {
      quote: 'The Spot-the-Pixel thing is harder than it looks. Lost the first three. Got smarter, won the fourth. Real skill, real prize.',
      name: 'A. Mthembu',
      rig: 'Starter Rig',
      city: 'Pretoria'
    }
  ];
}
