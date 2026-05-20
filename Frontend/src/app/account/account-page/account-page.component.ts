import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../_shared/services/auth.service';
import { SiteNavComponent } from '../../home/_shared/components/site-nav/site-nav.component';
import { SiteFooterComponent } from '../../home/_shared/components/site-footer/site-footer.component';

@Component({
  selector: 'app-account-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SiteNavComponent, SiteFooterComponent],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly user = this.auth.currentUser;
  protected readonly initials = this.auth.initials;

  protected async onSignOut(): Promise<void> {
    this.auth.signOut();
    await this.router.navigateByUrl('/');
  }
}
