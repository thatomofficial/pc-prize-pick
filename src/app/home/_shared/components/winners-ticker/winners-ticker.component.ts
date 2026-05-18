import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';
import { RecentWinner } from '../../../../_shared/models/competition.model';

@Component({
  selector: 'app-winners-ticker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './winners-ticker.component.html',
  styleUrl: './winners-ticker.component.scss'
})
export class WinnersTickerComponent {
  private readonly competitions = inject(MockCompetitionsService);
  private readonly winners = this.competitions.getRecentWinners();
  protected readonly doubled: RecentWinner[] = [...this.winners, ...this.winners];

  protected formatAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diffMs / 3_600_000);
    if (hours < 1) return 'just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
