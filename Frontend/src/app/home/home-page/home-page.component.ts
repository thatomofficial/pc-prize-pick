import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SiteNavComponent } from '../_shared/components/site-nav/site-nav.component';
import { HomeHeroComponent } from '../_shared/components/home-hero/home-hero.component';
import { WaveClockComponent } from '../_shared/components/wave-clock/wave-clock.component';
import { WinnersTickerComponent } from '../_shared/components/winners-ticker/winners-ticker.component';
import { FeaturedCompetitionsComponent } from '../_shared/components/featured-competitions/featured-competitions.component';
import { PrizeTiersComponent } from '../_shared/components/prize-tiers/prize-tiers.component';
import { HowItWorksComponent } from '../_shared/components/how-it-works/how-it-works.component';
import { SiteFooterComponent } from '../_shared/components/site-footer/site-footer.component';
import { MockCompetitionsService } from '../../_shared/services/mock-competitions.service';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SiteNavComponent,
    HomeHeroComponent,
    WaveClockComponent,
    WinnersTickerComponent,
    FeaturedCompetitionsComponent,
    PrizeTiersComponent,
    HowItWorksComponent,
    SiteFooterComponent,
  ],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  private readonly competitions = inject(MockCompetitionsService);
  protected readonly waveCloseAt = this.competitions.getWaveCloseAt();
  protected readonly waveCode = this.competitions.getWaveCode();
}
