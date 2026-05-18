import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';
import { CompetitionCardComponent } from '../competition-card/competition-card.component';

@Component({
  selector: 'app-featured-competitions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompetitionCardComponent],
  template: `
    <section id="competitions" class="featured u-container">
      <header class="featured__header">
        <div class="featured__title">
          <span class="t-overline t-overline--volt">§ 02 · Now open</span>
          <h2 class="featured__heading">
            Four builds.
            <em class="featured__heading-em">One winner</em>
            per draw.
          </h2>
        </div>
        <p class="featured__sub">
          Every build is sourced, assembled, and stress-tested in Cape Town before
          we open entries. Cash equivalent always available if you&rsquo;d rather
          not take the parts.
        </p>
      </header>

      <div class="featured__grid">
        @for (c of competitions; track c.id) {
          <app-competition-card [competition]="c" />
        }
      </div>

      <footer class="featured__foot">
        <a class="featured__more" href="/competitions">
          <span>Browse the full archive</span>
          <span aria-hidden="true">→</span>
        </a>
      </footer>
    </section>
  `,
  styles: `
    :host {
      display: block;
      background: var(--ink-900);
      padding-block: clamp(4rem, 8vw, 7rem);
    }

    .featured {
      &__header {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-6);
        padding-bottom: var(--s-12);

        @media (min-width: 880px) {
          grid-template-columns: 1.4fr 1fr;
          gap: var(--s-16);
          align-items: end;
        }
      }

      &__title {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      &__heading {
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
        font-size: 1.05rem;
        line-height: 1.55;
        color: var(--cream-300);
        max-width: 42ch;
      }

      &__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-5);

        @media (min-width: 720px) {
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 1200px) {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      &__foot {
        margin-top: var(--s-10);
        padding-top: var(--s-8);
        border-top: var(--hairline);
        display: flex;
        justify-content: flex-end;
      }

      &__more {
        display: inline-flex;
        align-items: center;
        gap: 0.7ch;
        font-size: 0.95rem;
        color: var(--cream-100);
        padding-bottom: 2px;
        border-bottom: 1px solid rgba(246, 241, 231, 0.22);
        transition: color var(--dur-fast),
          border-color var(--dur-fast),
          gap var(--dur-fast);

        &:hover {
          color: var(--volt);
          border-color: var(--volt);
          gap: 1.2ch;
        }
      }
    }
  `
})
export class FeaturedCompetitionsComponent {
  private readonly service = inject(MockCompetitionsService);
  protected readonly competitions = this.service.getFeatured();
}
