import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Step {
  num: string;
  title: string;
  body: string;
  detail: string;
}

@Component({
  selector: 'app-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './how-it-works.component.html',
  styleUrl: './how-it-works.component.scss',
})
export class HowItWorksComponent {
  protected readonly steps: Step[] = [
    {
      num: '01',
      title: 'Choose a build',
      body: 'Browse open competitions. Each has a vetted parts list, a price, and a hard cap on entries.',
      detail: 'No auto-rolling lotteries',
    },
    {
      num: '02',
      title: 'Pick your entries',
      body: 'Buy one or many. Bulk packs unlock 5–15% off. Your entries are time-stamped and on-chain logged.',
      detail: 'Bulk: 5% / 10% / 15%',
    },
    {
      num: '03',
      title: 'Place your shot',
      body: 'Mark the exact spot on the puzzle image. Closest pixel to the target wins. No randomness.',
      detail: 'Skill, not chance',
    },
    {
      num: '04',
      title: 'Take the rig or the cash',
      body: 'Pick up the build from our Cape Town workshop or accept the cash equivalent within 48h.',
      detail: 'Cash always available',
    },
  ];
}
