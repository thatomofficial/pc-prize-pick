import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-site-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-nav.component.html',
  styleUrl: './site-nav.component.scss',
})
export class SiteNavComponent {}
