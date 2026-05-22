import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SiteNavComponent } from '../../home/_shared/components/site-nav/site-nav.component';
import { SiteFooterComponent } from '../../home/_shared/components/site-footer/site-footer.component';
import { HowItWorksComponent } from '../_shared/components/how-it-works/how-it-works.component';

@Component({
  selector: 'app-how-it-works-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteNavComponent, SiteFooterComponent, HowItWorksComponent],
  templateUrl: './how-it-works-page.component.html',
  styleUrl: './how-it-works-page.component.scss',
})
export class HowItWorksPageComponent {}
