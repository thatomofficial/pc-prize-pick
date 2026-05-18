import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Competition } from '../../../../_shared/models/competition.model';
import { CountdownComponent } from '../../../../_shared/components/countdown/countdown.component';

@Component({
  selector: 'app-competition-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe, CountdownComponent],
  template: `
    <article class="card"
      [class.card--closing]="competition().status === 'closing-soon'"
      [style.--hue]="competition().accentHue">

      <header class="card__header">
        <span class="card__status t-overline">
          @if (competition().status === 'closing-soon') {
            <span class="u-live-dot card__status-dot card__status-dot--signal"></span>
            <span>Closing soon</span>
          } @else if (competition().status === 'live') {
            <span class="u-live-dot card__status-dot"></span>
            <span>Live</span>
          } @else {
            <span>{{ competition().status }}</span>
          }
        </span>
        <span class="card__id t-mono">№ {{ competition().id }}</span>
      </header>

      <div class="card__art" aria-hidden="true">
        <div class="card__art-frame">
          <span class="card__art-band card__art-band--1"></span>
          <span class="card__art-band card__art-band--2"></span>
          <span class="card__art-band card__art-band--3"></span>
          <span class="card__art-mark t-mono">{{ shortName() }}</span>
        </div>
      </div>

      <h3 class="card__name">{{ competition().name }}</h3>
      <p class="card__tagline">{{ competition().buildTagline }}</p>

      <dl class="card__specs">
        <div>
          <dt>GPU</dt>
          <dd>{{ competition().specs.gpu }}</dd>
        </div>
        <div>
          <dt>CPU</dt>
          <dd>{{ competition().specs.cpu }}</dd>
        </div>
        <div>
          <dt>RAM</dt>
          <dd>{{ competition().specs.ram }}</dd>
        </div>
        <div>
          <dt>SSD</dt>
          <dd>{{ competition().specs.storage }}</dd>
        </div>
      </dl>

      <div class="card__meter" [style.--progress]="progress() + '%'">
        <span class="card__meter-track">
          <span class="card__meter-fill"></span>
        </span>
        <span class="card__meter-text">
          <span class="t-mono">{{ competition().entriesSold | number }}</span>
          <span class="t-muted"> of {{ competition().totalEntries | number }} entries</span>
        </span>
      </div>

      <footer class="card__foot">
        <div class="card__foot-left">
          <div class="card__money">
            <span class="t-overline">Value</span>
            <span class="card__money-val">
              {{ competition().prizeValueCents / 100 | currency: 'ZAR' : 'symbol' : '1.0-0' : 'en-ZA' }}
            </span>
          </div>
          <div class="card__money">
            <span class="t-overline">Entry</span>
            <span class="card__money-val card__money-val--volt">
              {{ competition().entryPriceCents / 100 | currency: 'ZAR' : 'symbol' : '1.2-2' : 'en-ZA' }}
            </span>
          </div>
        </div>
        <div class="card__foot-right">
          <span class="t-overline">Closes</span>
          <app-countdown class="card__countdown" [target]="competition().closesAt" />
        </div>
      </footer>

      <a class="card__cta" [href]="'/competitions/' + competition().slug">
        <span>Enter from R{{ competition().entryPriceCents / 100 | number: '1.2-2' }}</span>
        <span class="card__cta-arrow" aria-hidden="true">→</span>
      </a>
    </article>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .card {
      --hue: 80;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: var(--s-4);
      height: 100%;
      padding: var(--s-6);
      background: var(--ink-800);
      border: var(--hairline);
      transition: transform var(--dur-med) var(--ease-out-quart),
        border-color var(--dur-med),
        box-shadow var(--dur-med);

      &:hover {
        transform: translateY(-4px);
        border-color: rgba(246, 241, 231, 0.22);
        box-shadow: 0 28px 64px -32px hsla(var(--hue), 80%, 50%, 0.35),
          0 0 0 1px hsla(var(--hue), 80%, 60%, 0.12);
      }

      &--closing {
        border-color: rgba(255, 90, 54, 0.35);
        background: linear-gradient(180deg, rgba(255, 90, 54, 0.05) 0%, var(--ink-800) 100%);
      }

      &__header {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--s-3);
      }

      &__status {
        display: inline-flex;
        align-items: center;
        gap: 0.6ch;
        color: var(--cream-100);

        &-dot {
          background: var(--volt);

          &--signal {
            background: var(--signal);
            box-shadow: 0 0 0 0 rgba(255, 90, 54, 0.55);
          }
        }
      }

      &__id {
        font-size: 0.65rem;
        color: var(--cream-400);
        letter-spacing: 0.1em;
      }

      &__art {
        aspect-ratio: 1.7;
        position: relative;
        background:
          radial-gradient(ellipse at 50% 100%, hsla(var(--hue), 80%, 50%, 0.18) 0%, transparent 60%),
          linear-gradient(135deg, hsla(var(--hue), 30%, 12%, 0.6) 0%, var(--ink-900) 100%);
        border: var(--hairline);
        overflow: hidden;

        &-frame {
          position: absolute;
          inset: 12% 24%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          background: linear-gradient(180deg, var(--ink-800) 0%, var(--ink-900) 100%);
          border: 1px solid rgba(246, 241, 231, 0.14);
        }

        &-band {
          height: 6px;
          background: rgba(246, 241, 231, 0.06);
          border-radius: 0;

          &--1 {
            background: hsla(var(--hue), 70%, 50%, 0.5);
            height: 10px;
          }
          &--2 {
            background: rgba(246, 241, 231, 0.1);
          }
          &--3 {
            background: rgba(246, 241, 231, 0.06);
            width: 60%;
          }
        }

        &-mark {
          position: absolute;
          bottom: var(--s-2);
          right: var(--s-3);
          font-size: 0.55rem;
          letter-spacing: 0.18em;
          color: hsla(var(--hue), 60%, 70%, 0.7);
        }
      }

      &__name {
        font-family: var(--font-display);
        font-size: clamp(1.4rem, 1.8vw, 1.8rem);
        line-height: 1.05;
        color: var(--cream-100);
        letter-spacing: var(--tracking-snug);
      }

      &__tagline {
        color: var(--cream-300);
        font-size: 0.92rem;
        line-height: 1.5;
        margin-top: calc(var(--s-2) * -1);
      }

      &__specs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-2) var(--s-4);
        padding-block: var(--s-3);
        border-top: var(--hairline);
        border-bottom: var(--hairline);

        & > div {
          display: flex;
          align-items: baseline;
          gap: var(--s-2);
          font-family: var(--font-mono);
          font-size: 0.72rem;
        }

        dt {
          color: var(--cream-400);
          min-width: 2.4em;
        }

        dd {
          color: var(--cream-100);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      &__meter {
        --progress: 0%;

        &-track {
          display: block;
          height: 2px;
          background: rgba(246, 241, 231, 0.1);
          position: relative;
        }

        &-fill {
          position: absolute;
          inset: 0;
          width: var(--progress);
          background: linear-gradient(90deg, var(--volt) 0%, hsl(var(--hue), 80%, 60%) 100%);
          transition: width var(--dur-slow) var(--ease-expo);
        }

        &-text {
          display: block;
          margin-top: var(--s-2);
          font-size: 0.78rem;
          color: var(--cream-200);
        }
      }

      &__foot {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--s-4);
        align-items: end;
        padding-top: var(--s-3);
      }

      &__foot-left {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-3);
      }

      &__foot-right {
        display: flex;
        flex-direction: column;
        gap: var(--s-1);
        text-align: right;
      }

      &__money {
        display: flex;
        flex-direction: column;
        gap: 2px;

        &-val {
          font-family: var(--font-mono);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--cream-100);
          letter-spacing: -0.01em;

          &--volt {
            color: var(--volt);
          }
        }
      }

      &__countdown {
        font-size: 0.85rem;
      }

      &__cta {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.85rem 1.1rem;
        background: transparent;
        color: var(--cream-100);
        font-size: 0.9rem;
        font-weight: 600;
        border: 1px solid rgba(246, 241, 231, 0.22);
        margin-top: auto;
        transition: background var(--dur-fast),
          color var(--dur-fast),
          border-color var(--dur-fast);

        &-arrow {
          transition: transform var(--dur-fast) var(--ease-out-quart);
        }

        &:hover {
          background: var(--volt);
          color: var(--ink-900);
          border-color: var(--volt);

          .card__cta-arrow {
            transform: translateX(4px);
          }
        }
      }
    }
  `
})
export class CompetitionCardComponent {
  readonly competition = input.required<Competition>();

  protected readonly progress = computed(() => {
    const c = this.competition();
    return Math.round((c.entriesSold / c.totalEntries) * 100);
  });

  protected readonly shortName = computed(() =>
    this.competition().id.toUpperCase()
  );
}
