import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SiteNavComponent } from '../../home/_shared/components/site-nav/site-nav.component';
import { SiteFooterComponent } from '../../home/_shared/components/site-footer/site-footer.component';
import { PrizeTiersComponent } from '../_shared/components/prize-tiers/prize-tiers.component';

@Component({
  selector: 'app-tiers-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteNavComponent, SiteFooterComponent, PrizeTiersComponent],
  templateUrl: './tiers-page.component.html',
  styleUrl: './tiers-page.component.scss',
})
export class TiersPageComponent {}