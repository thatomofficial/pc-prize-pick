import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SiteNavComponent } from '../../home/_shared/components/site-nav/site-nav.component';
import { SiteFooterComponent } from '../../home/_shared/components/site-footer/site-footer.component';
import { FeaturedCompetitionsComponent } from '../_shared/components/featured-competitions/featured-competitions.component';

@Component({
  selector: 'app-competitions-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteNavComponent, SiteFooterComponent, FeaturedCompetitionsComponent],
  templateUrl: './competitions-page.component.html',
  styleUrl: './competitions-page.component.scss',
})
export class CompetitionsPageComponent {}