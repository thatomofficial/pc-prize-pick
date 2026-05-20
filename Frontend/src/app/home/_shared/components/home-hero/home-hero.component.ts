import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';

@Component({
  selector: 'app-home-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './home-hero.component.html',
  styleUrl: './home-hero.component.scss',
})
export class HomeHeroComponent {
  private readonly competitions = inject(MockCompetitionsService);
  protected readonly featured = this.competitions.getFeatured()[0];
  protected readonly today = new Date();
  protected readonly issueNumber = '042';

  protected readonly progress = computed(() =>
    Math.round((this.featured.entriesSold / this.featured.totalEntries) * 100),
  );
}
