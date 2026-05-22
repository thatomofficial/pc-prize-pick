import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Testimonial {
  quote: string;
  name: string;
  rig: string;
  city: string;
}

@Component({
  selector: 'app-social-proof',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-proof.component.html',
  styleUrl: './social-proof.component.scss',
})
export class SocialProofComponent {
  protected readonly featured: Testimonial = {
    quote: '',
    name: 'Sipho Khumalo',
    rig: 'Studio Build · Threadripper 7980X',
    city: 'Johannesburg',
  };

  protected readonly more: Testimonial[] = [
    {
      quote:
        'Bought ten entries on the Mini ITX. Picked up the case from the workshop a week later. Genuinely felt like cheating.',
      name: 'L. van Wyk',
      rig: 'Silent Mini ITX',
      city: 'Stellenbosch',
    },
    {
      quote:
        'Took the cash. Used it to fund a renovation. My wife thinks PC Prize Pick is now legally an investment vehicle.',
      name: 'D. Naidoo',
      rig: 'Apex Build · cash',
      city: 'Durban',
    },
    {
      quote:
        'The Spot-the-Ball thing is harder than it looks. Lost the first three. Got smarter, won the fourth. Real skill, real prize.',
      name: 'A. Mthembu',
      rig: 'Starter Rig',
      city: 'Pretoria',
    },
  ];
}