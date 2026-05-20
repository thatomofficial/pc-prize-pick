import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SiteNavComponent } from '../../home/_shared/components/site-nav/site-nav.component';
import { SiteFooterComponent } from '../../home/_shared/components/site-footer/site-footer.component';
import { SocialProofComponent } from '../_shared/components/social-proof/social-proof.component';

@Component({
  selector: 'app-winners-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteNavComponent, SiteFooterComponent, SocialProofComponent],
  templateUrl: './winners-page.component.html',
  styleUrl: './winners-page.component.scss',
})
export class WinnersPageComponent {}
