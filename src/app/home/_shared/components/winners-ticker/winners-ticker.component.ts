import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';
import { RecentWinner } from '../../../../_shared/models/competition.model';

@Component({
  selector: 'app-winners-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="ticker" aria-label="Recent winners">
      <span class="ticker__label t-overline">
        <span class="u-live-dot"></span>
        <span>Live · winners feed</span>
      </span>
      <div class="ticker__viewport">
        <ul class="ticker__track" role="list">
          @for (w of doubled; track $index) {
            <li class="ticker__item">
              <span class="ticker__name">{{ w.initials }}. {{ w.surname }}</span>
              <span class="ticker__sep">·</span>
              <span class="ticker__city">{{ w.city }}</span>
              <span class="ticker__sep">→</span>
              <span class="ticker__prize">{{ w.prizeName }}</span>
              <span class="ticker__sep">·</span>
              <span class="ticker__time t-mono">{{ formatAgo(w.awardedAt) }}</span>
            </li>
          }
        </ul>
      </div>
    </aside>
  `,
  styles: `
    :host {
      display: block;
      background: var(--ink-1000);
      border-block: var(--hairline);
      overflow: hidden;
    }

    .ticker {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: var(--s-6);
      align-items: center;
      padding-inline: var(--gutter);
      padding-block: var(--s-3);
      max-width: var(--page-max);
      margin: 0 auto;

      &__label {
        display: inline-flex;
        align-items: center;
        gap: 0.6ch;
        color: var(--cream-200);
        white-space: nowrap;

        @media (max-width: 600px) {
          display: none;
        }
      }

      &__viewport {
        position: relative;
        overflow: hidden;
        mask-image: linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%);
      }

      &__track {
        display: inline-flex;
        gap: var(--s-10);
        list-style: none;
        padding: 0;
        margin: 0;
        white-space: nowrap;
        animation: ticker-slide 56s linear infinite;
      }

      &__item {
        display: inline-flex;
        align-items: center;
        gap: 0.8ch;
        font-size: 0.85rem;
        color: var(--cream-200);
      }

      &__name {
        color: var(--cream-100);
        font-weight: 600;
      }

      &__sep {
        color: var(--cream-500);
      }

      &__prize {
        color: var(--cream-200);
      }

      &__city {
        color: var(--cream-300);
      }

      &__time {
        color: var(--volt);
        font-size: 0.75rem;
        letter-spacing: -0.02em;
      }
    }

    @keyframes ticker-slide {
      from {
        transform: translateX(0);
      }
      to {
        transform: translateX(-50%);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ticker__track {
        animation: none;
      }
    }
  `
})
export class WinnersTickerComponent {
  private readonly competitions = inject(MockCompetitionsService);
  private readonly winners = this.competitions.getRecentWinners();
  protected readonly doubled: RecentWinner[] = [...this.winners, ...this.winners];

  protected formatAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diffMs / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
