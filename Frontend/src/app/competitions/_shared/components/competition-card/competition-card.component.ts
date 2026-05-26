import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Competition } from '../../../../_shared/models/competition.model';

@Component({
  selector: 'app-competition-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './competition-card.component.html',
  styleUrl: './competition-card.component.scss',
})
export class CompetitionCardComponent {
  readonly competition = input.required<Competition>();

  protected readonly progress = computed(() => {
    const c = this.competition();
    return Math.round((c.entriesSold / c.totalEntries) * 100);
  });

  protected readonly shortName = computed(() => this.competition().id.toUpperCase());
}