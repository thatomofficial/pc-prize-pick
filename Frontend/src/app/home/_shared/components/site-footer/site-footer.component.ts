import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  protected readonly year = new Date();
  protected readonly build = 'r0.1.0-2026.05';
}
