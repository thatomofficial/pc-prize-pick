export type CompetitionStatus = 'live' | 'closing-soon' | 'sold-out' | 'upcoming';

export interface CompetitionTier {
  id: string;
  label: string;
  entryPriceCents: number;
  prizeValueCents: number;
  description: string;
}

export interface Competition {
  id: string;
  slug: string;
  name: string;
  buildTagline: string;
  status: CompetitionStatus;
  prizeValueCents: number;
  entryPriceCents: number;
  cashAlternativeCents: number;
  totalEntries: number;
  entriesSold: number;
  closesAt: string;
  specs: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
  };
  accentHue: number;
}

export interface RecentWinner {
  initials: string;
  surname: string;
  city: string;
  prizeName: string;
  awardedAt: string;
}
