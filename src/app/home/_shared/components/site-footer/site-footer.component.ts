import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <footer class="footer">
      <div class="u-container footer__inner">
        <div class="footer__brand">
          <a class="footer__logo" href="/">
            <span class="footer__logo-mark">PC/</span>
            <span>Prize Pick</span>
          </a>
          <p class="footer__tagline">
            Skill-based PC competitions, built &amp; drawn in Cape Town. Operating
            under SA competition law &mdash; entries cap, draws audit, cash-out
            always available.
          </p>
        </div>

        <nav class="footer__cols" aria-label="Footer">
          <div class="footer__col">
            <span class="t-overline">Build</span>
            <a href="#competitions">Live competitions</a>
            <a href="#tiers">Prize tiers</a>
            <a href="/archive">Archive</a>
            <a href="/loyalty">Rising Stars</a>
          </div>
          <div class="footer__col">
            <span class="t-overline">Trust</span>
            <a href="#how">How it works</a>
            <a href="/audits">Independent audits</a>
            <a href="/legal/terms">Terms &amp; rules</a>
            <a href="/legal/privacy">Privacy</a>
          </div>
          <div class="footer__col">
            <span class="t-overline">Support</span>
            <a href="mailto:help&commat;pcprizepick.example">help&commat;pcprizepick</a>
            <a href="/faq">FAQ</a>
            <a href="/workshop">Workshop visit</a>
          </div>
        </nav>
      </div>

      <div class="footer__strip">
        <div class="u-container footer__strip-inner">
          <span class="t-mono">©  {{ year | date: 'yyyy' }} · PC Prize Pick (Pty) Ltd</span>
          <span class="t-mono footer__strip-meta">Issued from Cape Town · ZA · 18&deg;25&prime; S</span>
          <span class="t-overline">Build {{ build }}</span>
        </div>
      </div>
    </footer>
  `,
  styles: `
    :host {
      display: block;
      background: var(--ink-1000);
      color: var(--cream-200);
      border-top: var(--hairline);
    }

    .footer {
      &__inner {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-10);
        padding-block: clamp(3rem, 6vw, 5rem);

        @media (min-width: 880px) {
          grid-template-columns: 1.2fr 2fr;
          gap: var(--s-16);
        }
      }

      &__brand {
        max-width: 36ch;
      }

      &__logo {
        display: inline-flex;
        align-items: baseline;
        gap: 0.4ch;
        font-family: var(--font-display);
        font-size: 1.5rem;
        color: var(--cream-100);

        &-mark {
          color: var(--volt);
          font-style: italic;
        }
      }

      &__tagline {
        margin-top: var(--s-4);
        font-size: 0.92rem;
        line-height: 1.55;
        color: var(--cream-300);
      }

      &__cols {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--s-8) var(--s-6);

        @media (min-width: 600px) {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      &__col {
        display: flex;
        flex-direction: column;
        gap: var(--s-3);

        a {
          font-size: 0.92rem;
          color: var(--cream-200);
          transition: color var(--dur-fast);

          &:hover {
            color: var(--volt);
          }
        }

        .t-overline {
          margin-bottom: var(--s-1);
        }
      }

      &__strip {
        border-top: var(--hairline);
      }

      &__strip-inner {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--s-3);
        padding-block: var(--s-5);
        font-size: 0.78rem;
        color: var(--cream-400);

        @media (min-width: 720px) {
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: var(--s-8);
        }
      }

      &__strip-meta {
        @media (min-width: 720px) {
          text-align: center;
        }
      }
    }
  `
})
export class SiteFooterComponent {
  protected readonly year = new Date();
  protected readonly build = 'r0.1.0-2026.05';
}
