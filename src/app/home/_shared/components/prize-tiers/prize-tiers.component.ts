import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MockCompetitionsService } from '../../../../_shared/services/mock-competitions.service';

@Component({
  selector: 'app-prize-tiers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  templateUrl: './prize-tiers.component.html',
  styleUrl: './prize-tiers.component.scss'
})
export class PrizeTiersComponent {
  private readonly service = inject(MockCompetitionsService);
  protected readonly tiers = this.service.getTiers();
}