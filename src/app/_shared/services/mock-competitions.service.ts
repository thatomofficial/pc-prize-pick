import { Injectable } from '@angular/core';
import { Competition, CompetitionTier, RecentWinner } from '../models/competition.model';

// Competitions run on synchronized 4-week (28-day) cycles. Tracks are offset
// by ~1 week so a "closing soon" and a "just opened" build always coexist on
// the homepage.
const DAY_HOURS = 24;
const daysFromNow = (d: number): string =>
  new Date(Date.now() + d * DAY_HOURS * 3_600_000).toISOString();
const hoursAgo = (h: number): string => new Date(Date.now() - h * 3_600_000).toISOString();

@Injectable({ providedIn: 'root' })
export class MockCompetitionsService {
  getFeatured(): Competition[] {
    return [
      {
        id: 'c-001',
        slug: 'apex-build-rtx-5090',
        name: 'Apex Build · RTX 5090',
        buildTagline: 'A no-compromise 4K/240Hz tower forged for tournament play.',
        status: 'closing-soon',
        prizeValueCents: 8_500_000,
        entryPriceCents: 9_960,
        cashAlternativeCents: 7_500_000,
        totalEntries: 12_000,
        entriesSold: 11_284,
        closesAt: daysFromNow(2),
        specs: {
          cpu: 'Ryzen 9 9950X',
          gpu: 'RTX 5090 Founders',
          ram: '64 GB DDR5-6400',
          storage: '4 TB NVMe Gen5'
        },
        accentHue: 78
      },
      {
        id: 'c-002',
        slug: 'studio-build-threadripper',
        name: 'Studio Build · Threadripper 7980X',
        buildTagline: 'Editorial-grade workstation for colourists, modellers, and ML hobbyists.',
        status: 'live',
        prizeValueCents: 12_400_000,
        entryPriceCents: 14_960,
        cashAlternativeCents: 10_500_000,
        totalEntries: 9_500,
        entriesSold: 4_122,
        closesAt: daysFromNow(10),
        specs: {
          cpu: 'Threadripper 7980X',
          gpu: 'RTX 5080 Pro',
          ram: '128 GB DDR5 ECC',
          storage: '8 TB NVMe Gen5'
        },
        accentHue: 200
      },
      {
        id: 'c-003',
        slug: 'starter-rig-rx9070',
        name: 'Starter Rig · RX 9070 XT',
        buildTagline: 'Your first real build. 1440p high-refresh, quiet by design.',
        status: 'live',
        prizeValueCents: 3_200_000,
        entryPriceCents: 2_960,
        cashAlternativeCents: 2_800_000,
        totalEntries: 18_000,
        entriesSold: 9_204,
        closesAt: daysFromNow(17),
        specs: {
          cpu: 'Ryzen 7 9700X',
          gpu: 'RX 9070 XT',
          ram: '32 GB DDR5-6000',
          storage: '2 TB NVMe Gen4'
        },
        accentHue: 18
      },
      {
        id: 'c-004',
        slug: 'silent-mini-itx',
        name: 'Silent Mini ITX · Form 2',
        buildTagline: 'A bookshelf supercar. Sub-30dB at full tilt.',
        status: 'live',
        prizeValueCents: 5_100_000,
        entryPriceCents: 4_960,
        cashAlternativeCents: 4_500_000,
        totalEntries: 14_000,
        entriesSold: 2_104,
        closesAt: daysFromNow(25),
        specs: {
          cpu: 'Ryzen 9 9900X',
          gpu: 'RTX 5070 Ti',
          ram: '64 GB DDR5-6400',
          storage: '4 TB NVMe Gen5'
        },
        accentHue: 280
      }
    ];
  }

  getTiers(): CompetitionTier[] {
    return [
      {
        id: 't-01',
        label: 'Tier 01 · Starter',
        entryPriceCents: 1_000,
        prizeValueCents: 1_500_000,
        description: 'Entry-level builds. Capable 1080p / esports rigs.'
      },
      {
        id: 't-02',
        label: 'Tier 02 · Mid',
        entryPriceCents: 2_500,
        prizeValueCents: 3_500_000,
        description: '1440p high-refresh. The sweet spot most builders chase.'
      },
      {
        id: 't-03',
        label: 'Tier 03 · Enthusiast',
        entryPriceCents: 5_000,
        prizeValueCents: 6_000_000,
        description: 'Premium components, RGB-optional, balanced thermals.'
      },
      {
        id: 't-04',
        label: 'Tier 04 · Apex',
        entryPriceCents: 10_000,
        prizeValueCents: 12_500_000,
        description: '4K/240Hz, workstation-class, no compromises.'
      }
    ];
  }

  getRecentWinners(): RecentWinner[] {
    return [
      { initials: 'M', surname: 'Naidoo', city: 'Durban', prizeName: 'ROG Strix G16', awardedAt: hoursAgo(2) },
      { initials: 'J', surname: 'Botha', city: 'Pretoria', prizeName: 'Apex Build · RTX 5080', awardedAt: hoursAgo(11) },
      { initials: 'S', surname: 'Khumalo', city: 'Johannesburg', prizeName: 'Starter Rig · RX 7800', awardedAt: hoursAgo(26) },
      { initials: 'A', surname: 'van der Merwe', city: 'Cape Town', prizeName: 'Silent Mini ITX', awardedAt: hoursAgo(48) },
      { initials: 'T', surname: 'Mokoena', city: 'Bloemfontein', prizeName: 'Studio Workstation', awardedAt: hoursAgo(72) },
      { initials: 'R', surname: 'Pillay', city: 'Pietermaritzburg', prizeName: 'Apex Build · RTX 5090', awardedAt: hoursAgo(96) }
    ];
  }
}
