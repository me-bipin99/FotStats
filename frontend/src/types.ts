export interface Team {
  id: string;
  name: string;
  shorthand: string;
  logoUrl?: string; // We'll render beautiful vector/initial circles if empty
  color: string; // Hex color for pitch representation
  secondaryColor: string;
  rating: number; // e.g. 7.1
  fifaRank?: number;
  coach: string;
  stadium: string;
  stadiumCapacity: string;
  formation: string; // e.g. '4-3-3'
}

export interface PlayerAttributes {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  gkSaving?: number; // conditional for GKs
  gkHandling?: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  positionDetail: string; // e.g. 'Center Back', 'Striker', 'Central Midfielder'
  nationality?: string; // raw string from DB e.g. "Nepali", "us USA", "fr FRA"
  rating: number; // standard Match rating out of 10, e.g. 7.4
  age: number;
  height: string;
  weight: string;
  marketValue: string;
  goals: number;
  assists: number;
  matchesPlayed: number;
  yellowCards: number;
  redCards: number;
  preferredFoot: 'Right' | 'Left' | 'Both';
  club: string;
  photoUrl?: string;
  attributes: PlayerAttributes;
}

export interface LineupPosition {
  player: Player;
  x: number; // percentage of half pitch width (0-100) or full pitch grid
  y: number; // percentage of pitch height (0-100)
}

export interface TeamLineup {
  formation: string;
  starters: LineupPosition[];
  substitutes: Player[];
}

export interface MatchStats {
  possession: [number, number]; // [home, away] e.g. [54, 46]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export interface Match {
  id: string;
  category: 'MEN' | 'WOMEN' | 'DOMESTIC';
  competition: string;
  competitionLogo?: string;
  date: string; // e.g., 'May 31, 2026'
  time: string; // e.g., '19:45'
  status: 'LIVE' | 'FINISHED' | 'UPCOMING';
  minute?: number; // for LIVE status
  venue: string;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  homeFormation: string; // e.g. '4-3-3'
  awayFormation: string;
  stats?: MatchStats;
  homeLineup?: TeamLineup;
  awayLineup?: TeamLineup;
  predictionVotes: {
    home: number;
    draw: number;
    away: number;
  };
}
