import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SiteNavComponent } from '../_shared/components/site-nav/site-nav.component';
import { HomeHeroComponent } from '../_shared/components/home-hero/home-hero.component';
import { WinnersTickerComponent } from '../_shared/components/winners-ticker/winners-ticker.component';
import { FeaturedCompetitionsComponent } from '../_shared/components/featured-competitions/featured-competitions.component';
import { PrizeTiersComponent } from '../_shared/components/prize-tiers/prize-tiers.component';
import { HowItWorksComponent } from '../_shared/components/how-it-works/how-it-works.component';
import { SocialProofComponent } from '../_shared/components/social-proof/social-proof.component';
import { SiteFooterComponent } from '../_shared/components/site-footer/site-footer.component';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SiteNavComponent,
    HomeHeroComponent,
    WinnersTickerComponent,
    FeaturedCompetitionsComponent,
    PrizeTiersComponent,
    HowItWorksComponent,
    SocialProofComponent,
    SiteFooterComponent
  ],
  template: `
    <app-site-nav />
    <main>
      <app-home-hero />
      <app-winners-ticker />
      <app-featured-competitions />
      <app-prize-tiers />
      <app-how-it-works />
      <app-social-proof />
    </main>
    <app-site-footer />
  `,
  styles: `
    :host {
      display: block;
      background: var(--ink-900);
      color: var(--cream-100);
    }
  `
})
export class HomePageComponent {}
