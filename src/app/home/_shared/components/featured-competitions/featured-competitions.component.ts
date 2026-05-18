import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';
import { CompetitionCardComponent } from '../competition-card/competition-card.component';

@Component({
  selector: 'app-featured-competitions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CompetitionCardComponent],
  templateUrl: './featured-competitions.component.html',
  styleUrl: './featured-competitions.component.scss'
})
export class FeaturedCompetitionsComponent {
  private readonly service = inject(MockCompetitionsService);
  protected readonly competitions = this.service.getFeatured();
}
