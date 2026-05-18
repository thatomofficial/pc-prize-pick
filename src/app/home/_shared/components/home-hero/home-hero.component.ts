import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';
import { CountdownComponent } from '../../../../_shared/components/countdown/countdown.component';

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, CountdownComponent],
  template: `
    <section class="hero u-grain">
      <div class="hero__bg" aria-hidden="true">
        <div class="hero__bg-grid"></div>
        <div class="hero__bg-glow"></div>
      </div>

      <div class="u-container hero__inner">
        <header class="hero__masthead">
          <span class="hero__overline t-overline t-overline--volt">
            <span class="u-live-dot"></span>
            <span>04 competitions live now</span>
          </span>
          <span class="hero__masthead-meta t-overline">
            Issue №·{{ issueNumber }} / Cape Town · {{ today | date: 'EEE dd MMM' }}
          </span>
        </header>

        <div class="hero__grid">
          <div class="hero__copy">
            <h1 class="hero__headline">
              <span class="u-reveal u-reveal--1">Win the rig</span>
              <span class="u-reveal u-reveal--2">you&rsquo;ve been</span>
              <span class="u-reveal u-reveal--3">
                <em class="hero__headline-em">building</em>
              </span>
              <span class="u-reveal u-reveal--4">in your head.</span>
            </h1>

            <p class="hero__lede u-reveal u-reveal--5">
              Skill-based competitions for handpicked PC builds &mdash; from
              first-real-rig starters to studio-grade workstations. Pick a tier,
              place your shot, take the build home or the cash equivalent.
            </p>

            <div class="hero__cta u-reveal u-reveal--6">
              <a class="btn btn--primary" href="#competitions">
                <span>View live competitions</span>
                <span class="btn__arrow" aria-hidden="true">→</span>
              </a>
              <a class="btn btn--ghost" href="#how">
                <span>How it works</span>
              </a>
            </div>

            <dl class="hero__stats u-reveal u-reveal--7">
              <div class="hero__stat">
                <dt class="t-overline">Prizes awarded</dt>
                <dd class="t-mono-lg">R12.4M</dd>
              </div>
              <div class="hero__stat">
                <dt class="t-overline">Winning builders</dt>
                <dd class="t-mono-lg">{{ 52_184 | number }}</dd>
              </div>
              <div class="hero__stat">
                <dt class="t-overline">Avg. odds vs. retail</dt>
                <dd class="t-mono-lg">280×</dd>
              </div>
            </dl>
          </div>

          <aside class="hero__sheet u-reveal u-reveal--4" aria-label="Featured competition">
            <div class="hero__sheet-header">
              <span class="t-overline t-overline--volt">Featured · Apex Tier</span>
              <span class="t-overline">№ {{ featured.id.toUpperCase() }}</span>
            </div>

            <div class="hero__sheet-art" aria-hidden="true">
              <div class="hero__sheet-tower">
                <span class="hero__sheet-bay hero__sheet-bay--gpu">GPU</span>
                <span class="hero__sheet-bay hero__sheet-bay--cpu">CPU</span>
                <span class="hero__sheet-bay hero__sheet-bay--ram">RAM</span>
                <span class="hero__sheet-bay hero__sheet-bay--ssd">SSD</span>
                <span class="hero__sheet-tower-glow"></span>
              </div>
              <span class="hero__sheet-watermark">APEX/{{ featured.id }}</span>
            </div>

            <h2 class="hero__sheet-name">{{ featured.name }}</h2>
            <p class="hero__sheet-tagline">{{ featured.buildTagline }}</p>

            <dl class="hero__sheet-specs">
              <div class="hero__sheet-spec">
                <dt>CPU</dt>
                <dd>{{ featured.specs.cpu }}</dd>
              </div>
              <div class="hero__sheet-spec">
                <dt>GPU</dt>
                <dd>{{ featured.specs.gpu }}</dd>
              </div>
              <div class="hero__sheet-spec">
                <dt>RAM</dt>
                <dd>{{ featured.specs.ram }}</dd>
              </div>
              <div class="hero__sheet-spec">
                <dt>SSD</dt>
                <dd>{{ featured.specs.storage }}</dd>
              </div>
            </dl>

            <div class="hero__sheet-meter" [style.--progress]="progress() + '%'">
              <span class="hero__sheet-meter-fill"></span>
              <span class="hero__sheet-meter-label">
                <span class="t-mono">{{ featured.entriesSold | number }}</span>
                <span> / </span>
                <span class="t-mono t-muted">{{ featured.totalEntries | number }}</span>
                <span class="t-muted"> entries</span>
              </span>
            </div>

            <div class="hero__sheet-foot">
              <div>
                <span class="t-overline">Build value</span>
                <span class="hero__sheet-value t-mono">
                  {{ featured.prizeValueCents / 100 | currency: 'ZAR' : 'symbol' : '1.0-0' : 'en-ZA' }}
                </span>
              </div>
              <div>
                <span class="t-overline">Entry</span>
                <span class="hero__sheet-value t-mono">
                  {{ featured.entryPriceCents / 100 | currency: 'ZAR' : 'symbol' : '1.2-2' : 'en-ZA' }}
                </span>
              </div>
              <div>
                <span class="t-overline">Closes in</span>
                <app-countdown class="hero__sheet-countdown" [target]="featured.closesAt" />
              </div>
            </div>

            <a class="hero__sheet-cta" [href]="'/competitions/' + featured.slug">
              <span>Take a shot &mdash; R{{ featured.entryPriceCents / 100 | number: '1.2-2' }}</span>
              <span aria-hidden="true">→</span>
            </a>
          </aside>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
      isolation: isolate;
      background: var(--ink-900);
      color: var(--cream-100);
      overflow: hidden;
    }

    .hero {
      position: relative;
      padding-block: clamp(2.5rem, 5vw, 4.5rem) clamp(4rem, 8vw, 8rem);

      &__bg {
        position: absolute;
        inset: 0;
        z-index: 0;
        pointer-events: none;

        &-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(246, 241, 231, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(246, 241, 231, 0.04) 1px, transparent 1px);
          background-size: 88px 88px;
          mask-image: radial-gradient(ellipse at 70% 30%, #000 30%, transparent 80%);
        }

        &-glow {
          position: absolute;
          top: -10%;
          right: -10%;
          width: 70%;
          height: 70%;
          background:
            radial-gradient(circle, rgba(216, 255, 58, 0.14) 0%, transparent 60%);
          filter: blur(20px);
        }
      }

      &__inner {
        position: relative;
        z-index: 1;
      }

      &__masthead {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--s-6);
        padding-block: var(--s-5);
        border-bottom: var(--hairline);
        margin-bottom: var(--s-12);

        &-meta {
          color: var(--cream-400);
          font-family: var(--font-mono);
          font-size: 0.7rem;
        }
      }

      &__overline {
        display: inline-flex;
        align-items: center;
        gap: 0.6ch;
      }

      &__grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-16);
        align-items: start;

        @media (min-width: 1080px) {
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
          gap: var(--s-24);
        }
      }

      &__copy {
        max-width: 36ch;
      }

      &__headline {
        font-family: var(--font-display);
        font-size: var(--type-display-xl);
        font-weight: 400;
        line-height: 0.92;
        letter-spacing: var(--tracking-tight);
        color: var(--cream-100);
        display: flex;
        flex-direction: column;

        & > span {
          display: block;
        }

        &-em {
          font-style: italic;
          color: var(--volt);
          position: relative;
          padding-right: 0.15em;

          &::after {
            content: '';
            position: absolute;
            left: 0.05em;
            right: 0.15em;
            bottom: 0.08em;
            height: 2px;
            background: var(--volt);
            opacity: 0.25;
          }
        }
      }

      &__lede {
        margin-top: var(--s-8);
        font-size: clamp(1rem, 1.4vw, 1.25rem);
        line-height: 1.55;
        color: var(--cream-200);
        max-width: 44ch;
      }

      &__cta {
        margin-top: var(--s-10);
        display: flex;
        flex-wrap: wrap;
        gap: var(--s-3);
      }

      &__stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: var(--s-4);
        margin-top: var(--s-16);
        padding-top: var(--s-8);
        border-top: var(--hairline);
      }

      &__stat {
        dt {
          margin-bottom: var(--s-2);
        }
        dd {
          color: var(--cream-100);
        }
      }

      // — Build-sheet card on the right
      &__sheet {
        position: relative;
        display: flex;
        flex-direction: column;
        background:
          linear-gradient(180deg, rgba(20, 17, 15, 0.94) 0%, rgba(11, 9, 7, 0.98) 100%);
        border: var(--hairline-strong);
        padding: var(--s-6);
        gap: var(--s-5);

        @media (min-width: 720px) {
          padding: var(--s-8);
        }

        &::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          width: 60px;
          height: 60px;
          border-top: 1px solid var(--volt);
          border-left: 1px solid var(--volt);
          pointer-events: none;
        }

        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 60px;
          height: 60px;
          border-bottom: 1px solid var(--volt);
          border-right: 1px solid var(--volt);
          pointer-events: none;
        }

        &-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: var(--s-4);
        }

        // The PC tower visual — pure CSS, no images
        &-art {
          position: relative;
          aspect-ratio: 1.6;
          background:
            radial-gradient(ellipse at 50% 100%, rgba(216, 255, 58, 0.08) 0%, transparent 60%),
            linear-gradient(180deg, rgba(11, 9, 7, 0.6) 0%, rgba(20, 17, 15, 0.4) 100%);
          border: var(--hairline);
          overflow: hidden;
        }

        &-tower {
          position: absolute;
          inset: 14% 30% 14% 30%;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          background: linear-gradient(180deg, #14110f 0%, #0b0907 100%);
          border: 1px solid rgba(246, 241, 231, 0.16);
          box-shadow:
            inset 0 0 0 1px rgba(246, 241, 231, 0.04),
            0 24px 60px -28px rgba(216, 255, 58, 0.4);

          &-glow {
            position: absolute;
            left: 50%;
            bottom: 6px;
            transform: translateX(-50%);
            width: 30%;
            height: 2px;
            background: var(--volt);
            box-shadow: 0 0 16px var(--volt);
          }
        }

        &-bay {
          display: flex;
          align-items: center;
          padding: 0 8px;
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.18em;
          color: var(--cream-400);
          background: rgba(246, 241, 231, 0.03);
          border-left: 2px solid var(--cream-500);

          &--gpu {
            flex: 3;
            border-left-color: var(--volt);
            color: var(--cream-200);
            background: rgba(216, 255, 58, 0.04);
          }
          &--cpu {
            flex: 1;
            border-left-color: var(--rare);
          }
          &--ram {
            flex: 1.5;
          }
          &--ssd {
            flex: 0.7;
          }
        }

        &-watermark {
          position: absolute;
          right: var(--s-3);
          top: var(--s-3);
          font-family: var(--font-mono);
          font-size: 0.6rem;
          letter-spacing: 0.16em;
          color: var(--cream-500);
          writing-mode: vertical-rl;
        }

        &-name {
          font-family: var(--font-display);
          font-size: clamp(1.5rem, 2.4vw, 2rem);
          line-height: 1.05;
          letter-spacing: var(--tracking-snug);
          color: var(--cream-100);
        }

        &-tagline {
          font-size: 0.95rem;
          color: var(--cream-300);
          line-height: 1.5;
          margin-top: var(--s-1);
        }

        &-specs {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--s-2) var(--s-5);
          padding-top: var(--s-4);
          border-top: var(--hairline);
        }

        &-spec {
          display: flex;
          align-items: baseline;
          gap: var(--s-2);
          font-family: var(--font-mono);
          font-size: 0.78rem;

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

        &-meter {
          --progress: 0%;
          position: relative;
          padding: var(--s-3) 0 var(--s-2);
          border-top: var(--hairline);

          &-fill {
            display: block;
            height: 2px;
            background: linear-gradient(90deg, var(--volt) 0%, var(--volt-dim) 100%);
            width: var(--progress);
            transition: width var(--dur-slow) var(--ease-expo);
          }

          &-label {
            display: block;
            margin-top: var(--s-2);
            font-size: 0.75rem;
            color: var(--cream-200);
          }
        }

        &-foot {
          display: grid;
          grid-template-columns: 1fr 1fr 1.4fr;
          gap: var(--s-4);
          padding-top: var(--s-4);
          border-top: var(--hairline);

          & > div {
            display: flex;
            flex-direction: column;
            gap: var(--s-1);
          }
        }

        &-value {
          font-size: 1rem;
          font-weight: 500;
          color: var(--cream-100);
        }

        &-countdown {
          font-size: 0.9rem;
        }

        &-cta {
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.95rem 1.2rem;
          background: var(--volt);
          color: var(--ink-900);
          font-weight: 600;
          font-size: 0.95rem;
          letter-spacing: -0.005em;
          margin-top: var(--s-2);
          transition: transform var(--dur-fast) var(--ease-out-quart),
            box-shadow var(--dur-med);

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 40px -16px rgba(216, 255, 58, 0.5);
          }
        }
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.7ch;
      padding: 0.9rem 1.4rem;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: -0.005em;
      transition: transform var(--dur-fast) var(--ease-out-quart),
        background var(--dur-fast),
        border-color var(--dur-fast);
      border: 1px solid transparent;

      &__arrow {
        transition: transform var(--dur-fast) var(--ease-out-quart);
      }

      &:hover &__arrow {
        transform: translateX(4px);
      }

      &--primary {
        background: var(--volt);
        color: var(--ink-900);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 36px -14px rgba(216, 255, 58, 0.45);
        }
      }

      &--ghost {
        background: transparent;
        color: var(--cream-100);
        border-color: rgba(246, 241, 231, 0.22);

        &:hover {
          border-color: var(--cream-100);
          transform: translateY(-2px);
        }
      }
    }
  `
})
export class HomeHeroComponent {
  private readonly competitions = inject(MockCompetitionsService);
  protected readonly featured = this.competitions.getFeatured()[0];
  protected readonly today = new Date();
  protected readonly issueNumber = '042';

  protected readonly progress = computed(() =>
    Math.round((this.featured.entriesSold / this.featured.totalEntries) * 100)
  );
}
