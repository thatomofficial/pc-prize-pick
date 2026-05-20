import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CountdownComponent } from '../../_shared/components/countdown/countdown.component';
import { SiteNavComponent } from '../../home/_shared/components/site-nav/site-nav.component';
import { SiteFooterComponent } from '../../home/_shared/components/site-footer/site-footer.component';
import { MockCompetitionsService } from '../../_shared/services/mock-competitions.service';
import {
  BallPickerComponent,
  PickerCoordinate,
} from '../_shared/components/ball-picker/ball-picker.component';

interface DemoChallenge {
  id: string;
  title: string;
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Hidden answer — kept client-side only for the demo. */
  ballX: number;
  ballY: number;
}

interface DemoReceipt {
  id: string;
  x: number;
  y: number;
  distancePx: number;
  rank: string;
}

@Component({
  selector: 'app-skill-demo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SiteNavComponent, SiteFooterComponent, CountdownComponent, BallPickerComponent],
  templateUrl: './skill-demo-page.component.html',
  styleUrl: './skill-demo-page.component.scss',
})
export class SkillDemoPageComponent {
  private readonly competitions = inject(MockCompetitionsService);

  protected readonly waveCloseAt = this.competitions.getWaveCloseAt();

  protected readonly challenge: DemoChallenge = {
    id: 'demo-001',
    title: 'Apex Build · workshop bench',
    imageUrl: '/spot-the-ball-demo.svg',
    naturalWidth: 1200,
    naturalHeight: 800,
    ballX: 560,
    ballY: 410,
  };

  protected readonly receipt = signal<DemoReceipt | null>(null);
  protected readonly submitted = signal<boolean>(false);

  protected onLockIn(coord: PickerCoordinate): void {
    const dx = coord.x - this.challenge.ballX;
    const dy = coord.y - this.challenge.ballY;
    const distance = Math.round(Math.sqrt(dx * dx + dy * dy));

    const receipt: DemoReceipt = {
      id: `demo-${Date.now().toString(36)}`,
      x: coord.x,
      y: coord.y,
      distancePx: distance,
      rank: this.hypotheticalRank(distance),
    };

    this.receipt.set(receipt);
    this.submitted.set(true);
    // eslint-disable-next-line no-console
    console.log('[Spot-the-Ball demo] submission', receipt);
  }

  private hypotheticalRank(distancePx: number): string {
    if (distancePx === 0) return 'exact pixel — you win';
    if (distancePx <= 12)
      return 'one pixel off, but only exact hits win — fallback territory if nobody is exact';
    if (distancePx <= 40) return 'closest-fallback territory if nobody is exact';
    if (distancePx <= 120) return 'somewhere in the right neighbourhood; aim sharper';
    return 'way off — the ball is on the bench somewhere';
  }
}
