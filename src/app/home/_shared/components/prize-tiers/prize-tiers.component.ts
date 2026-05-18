import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';

@Component({
  selector: 'app-prize-tiers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  template: `
    <section id="tiers" class="tiers">
      <div class="u-container">
        <header class="tiers__header">
          <span class="t-overline t-overline--volt">§ 03 · The ladder</span>
          <h2 class="tiers__heading">
            Pick your <em class="tiers__heading-em">tier</em>.<br />
            Pick your <em class="tiers__heading-em">build</em>.
          </h2>
          <p class="tiers__sub">
            Four ladders, four price points. Entry scales with the parts list,
            never the odds &mdash; every tier caps total entries so your shot
            stays honest.
          </p>
        </header>

        <ol class="tiers__list" role="list">
          @for (t of tiers; track t.id; let i = $index) {
            <li class="tiers__row">
              <span class="tiers__number t-mono">{{ '0' + (i + 1) }}</span>
              <div class="tiers__label">
                <h3 class="tiers__name">{{ t.label }}</h3>
                <p class="tiers__desc">{{ t.description }}</p>
              </div>
              <div class="tiers__price">
                <span class="t-overline">From</span>
                <span class="tiers__price-val t-mono">
                  {{ t.entryPriceCents / 100 | currency: 'ZAR' : 'symbol' : '1.0-0' : 'en-ZA' }}
                </span>
              </div>
              <div class="tiers__value">
                <span class="t-overline">Up to</span>
                <span class="tiers__value-val t-mono">
                  {{ t.prizeValueCents / 100 | currency: 'ZAR' : 'symbol' : '1.0-0' : 'en-ZA' }}
                </span>
              </div>
              <a class="tiers__cta" [href]="'#competitions'" [attr.aria-label]="'Browse ' + t.label">
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          }
        </ol>
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

    .tiers {
      &__header {
        max-width: 64ch;
        margin-bottom: var(--s-12);
      }

      &__heading {
        margin-top: var(--s-4);
        font-family: var(--font-display);
        font-size: var(--type-display-lg);
        line-height: 0.98;
        letter-spacing: var(--tracking-tight);
        color: var(--cream-100);

        &-em {
          font-style: italic;
          color: var(--volt);
        }
      }

      &__sub {
        margin-top: var(--s-6);
        font-size: 1.05rem;
        line-height: 1.55;
        color: var(--cream-300);
        max-width: 52ch;
      }

      &__list {
        list-style: none;
        padding: 0;
        margin: 0;
        border-top: var(--hairline);
      }

      &__row {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: var(--s-3) var(--s-6);
        padding-block: var(--s-6);
        border-bottom: var(--hairline);
        transition: background var(--dur-med) var(--ease-out-quart);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--volt);
          transform: scaleY(0);
          transform-origin: top;
          transition: transform var(--dur-med) var(--ease-out-quart);
        }

        &:hover {
          background: rgba(246, 241, 231, 0.025);
        }

        &:hover::before {
          transform: scaleY(1);
        }

        @media (min-width: 900px) {
          grid-template-columns: auto 1.4fr auto auto auto;
          gap: var(--s-8);
        }
      }

      &__number {
        font-size: clamp(2.25rem, 4vw, 3.5rem);
        font-weight: 300;
        color: var(--cream-500);
        letter-spacing: -0.03em;
        font-feature-settings: 'tnum' 1;
        align-self: start;
        padding-left: var(--s-3);
      }

      &__label {
        display: flex;
        flex-direction: column;
        gap: var(--s-2);
      }

      &__name {
        font-family: var(--font-display);
        font-size: clamp(1.4rem, 2vw, 1.9rem);
        line-height: 1.05;
        letter-spacing: var(--tracking-snug);
        color: var(--cream-100);
      }

      &__desc {
        font-size: 0.95rem;
        line-height: 1.55;
        color: var(--cream-300);
        max-width: 38ch;
      }

      &__price,
      &__value {
        display: flex;
        flex-direction: column;
        gap: var(--s-1);

        @media (max-width: 899px) {
          grid-column: 1 / -1;
          flex-direction: row;
          align-items: baseline;
          gap: var(--s-3);
        }
      }

      &__price-val {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--volt);
        letter-spacing: -0.02em;
      }

      &__value-val {
        font-size: 1.25rem;
        font-weight: 500;
        color: var(--cream-100);
        letter-spacing: -0.02em;
      }

      &__cta {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        color: var(--cream-200);
        border: 1px solid rgba(246, 241, 231, 0.16);
        font-size: 1.1rem;
        transition: background var(--dur-fast),
          color var(--dur-fast),
          border-color var(--dur-fast),
          transform var(--dur-fast);

        &:hover {
          background: var(--volt);
          color: var(--ink-900);
          border-color: var(--volt);
          transform: translate(2px, -2px);
        }

        @media (max-width: 899px) {
          justify-self: start;
        }
      }
    }
  `
})
export class PrizeTiersComponent {
  private readonly service = inject(MockCompetitionsService);
  protected readonly tiers = this.service.getTiers();
}
