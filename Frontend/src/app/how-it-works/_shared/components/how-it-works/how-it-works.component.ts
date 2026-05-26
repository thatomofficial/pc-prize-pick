import { ChangeDetectionStrategy, Component } from '@angular/core';

interface StepCta {
  label: string;
  href: string;
}

interface Step {
  num: string;
  title: string;
  body: string;
  detail: string;
  cta?: StepCta;
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
      title: 'Spot the ball',
      body: 'Each wave we publish a photo of the prize PC with a ball digitally removed. Click where you reckon it was. Hit the exact pixel and you win — if more than one person hits it, you all win. If nobody is exact, the closest click takes the build.',
      detail: 'Exact-pixel wins; closest takes the fallback',
      cta: { label: 'Try a practice round →', href: '/skill' },
    },
    {
      num: '04',
      title: 'Take the rig or the cash',
      body: 'Pick up the build from our Johannesburg workshop or accept the cash equivalent within 48h.',
      detail: 'Cash always available',
    },
  ];
}