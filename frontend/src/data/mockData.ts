import { Team, Player, Match } from '../types';

// Nepalese Football Teams
export const mockTeams: Record<string, Team> = {
  nepal: {
    id: 'nepal',
    name: 'Nepal National Team',
    shorthand: 'NPL',
    color: '#DC2626', // Red
    secondaryColor: '#1E3A8A', // Blue (Flags colors)
    rating: 7.2,
    fifaRank: 176,
    coach: 'Vincenzo Alberto Annese',
    stadium: 'Dashrath Rangasala',
    stadiumCapacity: '25,000',
  },
  india: {
    id: 'india',
    name: 'India National Team',
    shorthand: 'IND',
    color: '#1D4ED8', // Blue
    secondaryColor: '#F59E0B', // Saffron
    rating: 7.5,
    fifaRank: 121,
    coach: 'Manolo Márquez',
    stadium: 'Salt Lake Stadium',
    stadiumCapacity: '85,000',
  },
  machhindra: {
    id: 'machhindra',
    name: 'Machhindra FC',
    shorthand: 'MFC',
    color: '#047857', // Emerald Green
    secondaryColor: '#FBBF24', // Gold
    rating: 7.1,
    coach: 'Kishore Kumar',
    stadium: 'Dashrath Rangasala',
    stadiumCapacity: '25,000',
  },
  manang: {
    id: 'manang',
    name: 'Manang Marshyangdi MMC',
    shorthand: 'MMC',
    color: '#1E3A8A', // Dark Blue
    secondaryColor: '#EF4444', // Red
    rating: 6.9,
    coach: 'Tope Ayodeji Fuja',
    stadium: 'Halchowk Stadium',
    stadiumCapacity: '3,500',
  },
  threeStar: {
    id: 'threeStar',
    name: 'Three Star Club',
    shorthand: 'TSC',
    color: '#3B82F6', // Sky Blue
    secondaryColor: '#FFFFFF', // White
    rating: 6.8,
    coach: 'Meghraj KC',
    stadium: 'Chyasal Stadium',
    stadiumCapacity: '10,000',
  },
  churchboys: {
    id: 'churchboys',
    name: 'Church Boys United',
    shorthand: 'CBU',
    color: '#7C3AED', // Violet
    secondaryColor: '#F3E8FF',
    rating: 7.0,
    coach: 'Bal Gopal Maharjan',
    stadium: 'Chyasal Stadium',
    stadiumCapacity: '10,000',
  },
  nepal_women: {
    id: 'nepal_women',
    name: 'Nepal Womens National Team',
    shorthand: 'NPL W',
    color: '#DC2626', // Crimson Red
    secondaryColor: '#1E3A8A', // Blue
    rating: 7.5,
    fifaRank: 101,
    coach: 'Rajendra Tamang',
    stadium: 'Dashrath Rangasala',
    stadiumCapacity: '25,000',
  },
  india_women: {
    id: 'india_women',
    name: 'India Womens National Team',
    shorthand: 'IND W',
    color: '#1D4ED8', // Royal Blue
    secondaryColor: '#F59E0B', // Saffron
    rating: 7.6,
    fifaRank: 66,
    coach: 'Santosh Kashyap',
    stadium: 'Salt Lake Stadium',
    stadiumCapacity: '85,000',
  }
};

// Nepalese Players Details
export const mockPlayers: Record<string, Player> = {
  kiran: {
    id: 'kiran',
    name: 'Kiran Chemjong',
    number: 16,
    position: 'GK',
    positionDetail: 'Goalkeeper (Captain)',
    rating: 7.8,
    age: 36,
    height: '1.88 m',
    weight: '82 kg',
    marketValue: '€125k',
    goals: 0,
    assists: 0,
    matchesPlayed: 98,
    yellowCards: 3,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Maziya S&RC',
    attributes: {
      pace: 48,
      shooting: 20,
      passing: 62,
      dribbling: 35,
      defending: 82, // mapped to GK positioning/handling
      physical: 76,
      gkSaving: 84,
      gkHandling: 80,
    }
  },
  ananta: {
    id: 'ananta',
    name: 'Ananta Tamang',
    number: 4,
    position: 'DF',
    positionDetail: 'Center Back',
    rating: 7.5,
    age: 28,
    height: '1.81 m',
    weight: '75 kg',
    marketValue: '€150k',
    goals: 4,
    assists: 1,
    matchesPlayed: 64,
    yellowCards: 8,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Church Boys United',
    attributes: {
      pace: 71,
      shooting: 45,
      passing: 65,
      dribbling: 55,
      defending: 81,
      physical: 84,
    }
  },
  rohit: {
    id: 'rohit',
    name: 'Rohit Chand',
    number: 5,
    position: 'DF',
    positionDetail: 'Defensive Midfielder / CB',
    rating: 8.1,
    age: 34,
    height: '1.80 m',
    weight: '77 kg',
    marketValue: '€275k',
    goals: 1,
    assists: 6,
    matchesPlayed: 92,
    yellowCards: 11,
    redCards: 1,
    preferredFoot: 'Right',
    club: 'Persik Kediri (Indonesia)',
    attributes: {
      pace: 68,
      shooting: 54,
      passing: 81,
      dribbling: 72,
      defending: 85,
      physical: 82,
    }
  },
  devendra: {
    id: 'devendra',
    name: 'Devendra Tamang',
    number: 6,
    position: 'DF',
    positionDetail: 'Center Back',
    rating: 6.9,
    age: 32,
    height: '1.78 m',
    weight: '73 kg',
    marketValue: '€75k',
    goals: 1,
    assists: 0,
    matchesPlayed: 32,
    yellowCards: 4,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Machhindra FC',
    attributes: {
      pace: 60,
      shooting: 30,
      passing: 58,
      dribbling: 45,
      defending: 72,
      physical: 74,
    }
  },
  sanisch: {
    id: 'sanisch',
    name: 'Sanisch Shrestha',
    number: 2,
    position: 'DF',
    positionDetail: 'Right Back',
    rating: 7.0,
    age: 25,
    height: '1.74 m',
    weight: '68 kg',
    marketValue: '€50k',
    goals: 0,
    assists: 2,
    matchesPlayed: 14,
    yellowCards: 2,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Church Boys United',
    attributes: {
      pace: 82,
      shooting: 38,
      passing: 64,
      dribbling: 66,
      defending: 69,
      physical: 70,
    }
  },
  laken: {
    id: 'laken',
    name: 'Laken Limbu',
    number: 14,
    position: 'MF',
    positionDetail: 'Central Midfielder',
    rating: 7.4,
    age: 23,
    height: '1.72 m',
    weight: '65 kg',
    marketValue: '€100k',
    goals: 2,
    assists: 4,
    matchesPlayed: 18,
    yellowCards: 1,
    redCards: 0,
    preferredFoot: 'Both',
    club: 'Delhi FC (India)',
    attributes: {
      pace: 76,
      shooting: 63,
      passing: 75,
      dribbling: 78,
      defending: 65,
      physical: 68,
    }
  },
  arik: {
    id: 'arik',
    name: 'Arik Bista',
    number: 8,
    position: 'MF',
    positionDetail: 'Box-to-Box Midfielder',
    rating: 7.1,
    age: 26,
    height: '1.75 m',
    weight: '70 kg',
    marketValue: '€75k',
    goals: 1,
    assists: 3,
    matchesPlayed: 24,
    yellowCards: 4,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Church Boys United',
    attributes: {
      pace: 69,
      shooting: 58,
      passing: 72,
      dribbling: 68,
      defending: 70,
      physical: 73,
    }
  },
  ayush: {
    id: 'ayush',
    name: 'Ayush Ghalan',
    number: 11,
    position: 'FW',
    positionDetail: 'Left Winger / Midfielder',
    rating: 7.7,
    age: 22,
    height: '1.70 m',
    weight: '63 kg',
    marketValue: '€150k',
    goals: 3,
    assists: 7,
    matchesPlayed: 34,
    yellowCards: 1,
    redCards: 0,
    preferredFoot: 'Left',
    club: 'Three Star Club',
    attributes: {
      pace: 88,
      shooting: 68,
      passing: 78,
      dribbling: 82,
      defending: 40,
      physical: 62,
    }
  },
  anjan: {
    id: 'anjan',
    name: 'Anjan Bista',
    number: 10,
    position: 'FW',
    positionDetail: 'Second Striker / Winger',
    rating: 8.0,
    age: 28,
    height: '1.75 m',
    weight: '71 kg',
    marketValue: '€200k',
    goals: 14, // Nepal national record equalling goals
    assists: 9,
    matchesPlayed: 72,
    yellowCards: 5,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Fortis FC (Bangladesh)',
    attributes: {
      pace: 84,
      shooting: 82,
      passing: 74,
      dribbling: 80,
      defending: 45,
      physical: 75,
    }
  },
  manish: {
    id: 'manish',
    name: 'Manish Dangi',
    number: 19,
    position: 'FW',
    positionDetail: 'Right Winger',
    rating: 7.5,
    age: 24,
    height: '1.73 m',
    weight: '66 kg',
    marketValue: '€125k',
    goals: 5,
    assists: 5,
    matchesPlayed: 29,
    yellowCards: 2,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Sankata Club',
    attributes: {
      pace: 91,
      shooting: 71,
      passing: 68,
      dribbling: 83,
      defending: 35,
      physical: 60,
    }
  },
  bimal: {
    id: 'bimal',
    name: 'Bimal Gharti Magar',
    number: 9,
    position: 'FW',
    positionDetail: 'Striker',
    rating: 7.3,
    age: 28,
    height: '1.78 m',
    weight: '74 kg',
    marketValue: '€100k',
    goals: 9,
    assists: 4,
    matchesPlayed: 44,
    yellowCards: 3,
    redCards: 0,
    preferredFoot: 'Left',
    club: 'Maziya S&RC',
    attributes: {
      pace: 80,
      shooting: 78,
      passing: 66,
      dribbling: 77,
      defending: 30,
      physical: 78,
    }
  },
  // Indian national players to fill up opponent lineup in match NPL vs IND
  sunil: {
    id: 'sunil',
    name: 'Sunil Chhetri',
    number: 11,
    position: 'FW',
    positionDetail: 'Striker',
    rating: 7.9,
    age: 41,
    height: '1.70 m',
    weight: '69 kg',
    marketValue: '€50k',
    goals: 94,
    assists: 15,
    matchesPlayed: 150,
    yellowCards: 12,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Bengaluru FC',
    attributes: {
      pace: 70,
      shooting: 86,
      passing: 75,
      dribbling: 79,
      defending: 38,
      physical: 72,
    }
  },
  gurpreet: {
    id: 'gurpreet',
    name: 'Gurpreet Singh Sandhu',
    number: 1,
    position: 'GK',
    positionDetail: 'Goalkeeper',
    rating: 7.6,
    age: 34,
    height: '1.98 m',
    weight: '90 kg',
    marketValue: '€175k',
    goals: 0,
    assists: 0,
    matchesPlayed: 75,
    yellowCards: 4,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Bengaluru FC',
    attributes: {
      pace: 45,
      shooting: 15,
      passing: 68,
      dribbling: 30,
      defending: 81,
      physical: 85,
      gkSaving: 82,
      gkHandling: 79,
    }
  },
  sandesh: {
    id: 'sandesh',
    name: 'Sandesh Jhingan',
    number: 5,
    position: 'DF',
    positionDetail: 'Center Back',
    rating: 7.5,
    age: 32,
    height: '1.88 m',
    weight: '84 kg',
    marketValue: '€200k',
    goals: 5,
    assists: 1,
    matchesPlayed: 62,
    yellowCards: 14,
    redCards: 1,
    preferredFoot: 'Right',
    club: 'FC Goa',
    attributes: {
      pace: 63,
      shooting: 40,
      passing: 58,
      dribbling: 48,
      defending: 83,
      physical: 88,
    }
  },
  subhasish: {
    id: 'subhasish',
    name: 'Subhasish Bose',
    number: 3,
    position: 'DF',
    positionDetail: 'Left Back',
    rating: 7.1,
    age: 30,
    height: '1.80 m',
    weight: '76 kg',
    marketValue: '€150k',
    goals: 2,
    assists: 3,
    matchesPlayed: 38,
    yellowCards: 6,
    redCards: 0,
    preferredFoot: 'Left',
    club: 'Mohun Bagan SG',
    attributes: {
      pace: 75,
      shooting: 48,
      passing: 68,
      dribbling: 62,
      defending: 74,
      physical: 79,
    }
  },
  bipin: {
    id: 'bipin',
    name: 'Bipin Singh',
    number: 17,
    position: 'FW',
    positionDetail: 'Left Winger',
    rating: 7.3,
    age: 31,
    height: '1.74 m',
    weight: '68 kg',
    marketValue: '€125k',
    goals: 3,
    assists: 8,
    matchesPlayed: 24,
    yellowCards: 2,
    redCards: 0,
    preferredFoot: 'Left',
    club: 'Mumbai City FC',
    attributes: {
      pace: 86,
      shooting: 72,
      passing: 70,
      dribbling: 78,
      defending: 38,
      physical: 68,
    }
  },
  apuia: {
    id: 'apuia',
    name: 'Lalengmawia Apuia',
    number: 45,
    position: 'MF',
    positionDetail: 'Defensive Midfielder',
    rating: 7.6,
    age: 25,
    height: '1.73 m',
    weight: '67 kg',
    marketValue: '€275k',
    goals: 1,
    assists: 2,
    matchesPlayed: 21,
    yellowCards: 3,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Mohun Bagan SG',
    attributes: {
      pace: 72,
      shooting: 55,
      passing: 82,
      dribbling: 79,
      defending: 76,
      physical: 72,
    }
  },
  samba: {
    id: 'samba',
    name: 'Sabitra Bhandari (Samba)',
    number: 9,
    position: 'FW',
    positionDetail: 'Striker',
    rating: 8.6,
    age: 29,
    height: '1.74 m',
    weight: '62 kg',
    marketValue: '€180k',
    goals: 53,
    assists: 14,
    matchesPlayed: 46,
    yellowCards: 2,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'En Avant Guingamp (France)',
    attributes: {
      pace: 92,
      shooting: 89,
      passing: 73,
      dribbling: 84,
      defending: 32,
      physical: 79
    }
  },
  preeti: {
    id: 'preeti',
    name: 'Preeti Rai',
    number: 10,
    position: 'MF',
    positionDetail: 'Central Playmaker',
    rating: 8.1,
    age: 21,
    height: '1.63 m',
    weight: '52 kg',
    marketValue: '€90k',
    goals: 6,
    assists: 15,
    matchesPlayed: 25,
    yellowCards: 1,
    redCards: 0,
    preferredFoot: 'Both',
    club: 'Kickstart FC (India)',
    attributes: {
      pace: 81,
      shooting: 75,
      passing: 84,
      dribbling: 82,
      defending: 60,
      physical: 66
    }
  },
  angela: {
    id: 'angela',
    name: 'Angela Tumbapo Subba',
    number: 16,
    position: 'GK',
    positionDetail: 'Goalkeeper (Captain)',
    rating: 8.0,
    age: 28,
    height: '1.75 m',
    weight: '65 kg',
    marketValue: '€100k',
    goals: 0,
    assists: 0,
    matchesPlayed: 39,
    yellowCards: 0,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Kickstart FC (India)',
    attributes: {
      pace: 52,
      shooting: 21,
      passing: 68,
      dribbling: 40,
      defending: 83,
      physical: 74,
      gkSaving: 85,
      gkHandling: 81
    }
  },
  gita: {
    id: 'gita',
    name: 'Gita Rana',
    number: 4,
    position: 'DF',
    positionDetail: 'Center Back',
    rating: 7.6,
    age: 28,
    height: '1.69 m',
    weight: '58 kg',
    marketValue: '€75k',
    goals: 2,
    assists: 1,
    matchesPlayed: 35,
    yellowCards: 3,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Sethu FC (India)',
    attributes: {
      pace: 72,
      shooting: 41,
      passing: 65,
      dribbling: 54,
      defending: 80,
      physical: 75
    }
  },
  amisha: {
    id: 'amisha',
    name: 'Amisha Karki',
    number: 11,
    position: 'FW',
    positionDetail: 'Winger / Forward',
    rating: 7.7,
    age: 22,
    height: '1.67 m',
    weight: '54 kg',
    marketValue: '€60k',
    goals: 8,
    assists: 6,
    matchesPlayed: 19,
    yellowCards: 1,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'APF Football Club',
    attributes: {
      pace: 86,
      shooting: 76,
      passing: 70,
      dribbling: 78,
      defending: 35,
      physical: 62
    }
  }
};

// Simple additional players to construct the lineups completely
export const fillerPlayers: Record<string, Player> = {
  npl_df2: {
    id: 'npl_df2',
    name: 'Chhiring Lopsang',
    number: 3,
    position: 'DF',
    positionDetail: 'Left Back',
    rating: 7.1,
    age: 26,
    height: '1.76 m',
    weight: '70 kg',
    marketValue: '€75k',
    goals: 0,
    assists: 1,
    matchesPlayed: 19,
    yellowCards: 3,
    redCards: 0,
    preferredFoot: 'Left',
    club: 'Manang Marshyangdi Club',
    attributes: { pace: 78, shooting: 40, passing: 66, dribbling: 64, defending: 72, physical: 72 }
  },
  npl_df3: {
    id: 'npl_df3',
    name: 'Ajit Bhandari',
    number: 12,
    position: 'DF',
    positionDetail: 'Right Back',
    rating: 6.8,
    age: 31,
    height: '1.72 m',
    weight: '69 kg',
    marketValue: '€50k',
    goals: 0,
    assists: 0,
    matchesPlayed: 22,
    yellowCards: 4,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Nepal Police Club',
    attributes: { pace: 74, shooting: 32, passing: 60, dribbling: 59, defending: 68, physical: 73 }
  },
  npl_mf1: {
    id: 'npl_mf1',
    name: 'Pujan Uperkoti',
    number: 18,
    position: 'MF',
    positionDetail: 'Holding Midfielder',
    rating: 7.0,
    age: 29,
    height: '1.76 m',
    weight: '72 kg',
    marketValue: '€95k',
    goals: 1,
    assists: 2,
    matchesPlayed: 41,
    yellowCards: 7,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Machhindra FC',
    attributes: { pace: 65, shooting: 52, passing: 70, dribbling: 65, defending: 72, physical: 78 }
  },
  npl_mf2: {
    id: 'npl_mf2',
    name: 'Mani Kumar Lama',
    number: 7,
    position: 'MF',
    positionDetail: 'Attacking Midfielder',
    rating: 7.2,
    age: 26,
    height: '1.69 m',
    weight: '62 kg',
    marketValue: '€80k',
    goals: 2,
    assists: 3,
    matchesPlayed: 11,
    yellowCards: 1,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'APF Football Club',
    attributes: { pace: 78, shooting: 64, passing: 72, dribbling: 75, defending: 45, physical: 60 }
  },
  ind_df1: {
    id: 'ind_df1',
    name: 'Rahul Bheke',
    number: 2,
    position: 'DF',
    positionDetail: 'Right Back',
    rating: 7.2,
    age: 35,
    height: '1.79 m',
    weight: '75 kg',
    marketValue: '€100k',
    goals: 1,
    assists: 4,
    matchesPlayed: 28,
    yellowCards: 5,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Bengaluru FC',
    attributes: { pace: 72, shooting: 44, passing: 65, dribbling: 60, defending: 73, physical: 78 }
  },
  ind_df2: {
    id: 'ind_df2',
    name: 'Mehtab Singh',
    number: 4,
    position: 'DF',
    positionDetail: 'Center Back',
    rating: 7.1,
    age: 28,
    height: '1.83 m',
    weight: '78 kg',
    marketValue: '€150k',
    goals: 1,
    assists: 0,
    matchesPlayed: 11,
    yellowCards: 2,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Mumbai City FC',
    attributes: { pace: 68, shooting: 35, passing: 60, dribbling: 50, defending: 74, physical: 80 }
  },
  ind_mf1: {
    id: 'ind_mf1',
    name: 'Anirudh Thapa',
    number: 7,
    position: 'MF',
    positionDetail: 'Central Midfielder',
    rating: 7.4,
    age: 28,
    height: '1.69 m',
    weight: '64 kg',
    marketValue: '€225k',
    goals: 4,
    assists: 8,
    matchesPlayed: 55,
    yellowCards: 4,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Mohun Bagan SG',
    attributes: { pace: 78, shooting: 65, passing: 80, dribbling: 76, defending: 62, physical: 65 }
  },
  ind_mf2: {
    id: 'ind_mf2',
    name: 'Sahal Abdul Samad',
    number: 10,
    position: 'MF',
    positionDetail: 'Attacking Midfielder',
    rating: 7.7,
    age: 29,
    height: '1.76 m',
    weight: '70 kg',
    marketValue: '€250k',
    goals: 4,
    assists: 10,
    matchesPlayed: 36,
    yellowCards: 3,
    redCards: 0,
    preferredFoot: 'Right',
    club: 'Mohun Bagan SG',
    attributes: { pace: 80, shooting: 70, passing: 78, dribbling: 84, defending: 48, physical: 68 }
  },
  ind_fw1: {
    id: 'ind_fw1',
    name: 'Lallianzuala Chhangte',
    number: 12,
    position: 'FW',
    positionDetail: 'Right Winger',
    rating: 7.8,
    age: 28,
    height: '1.67 m',
    weight: '62 kg',
    marketValue: '€300k',
    goals: 8,
    assists: 12,
    matchesPlayed: 34,
    yellowCards: 1,
    redCards: 0,
    preferredFoot: 'Left',
    club: 'Mumbai City FC',
    attributes: { pace: 92, shooting: 76, passing: 74, dribbling: 83, defending: 42, physical: 63 }
  }
};

// Formations & coordinates mapping (for horizontal 0-100 pitch representation)
// Left half is Home Team (x scale 5 to 45, y scale 10 to 90)
// Right half is Away Team (x scale 55 to 95, y scale 10 to 90)
export const nepalLineup: { formation: string; starters: any[]; substitutes: Player[] } = {
  formation: '4-3-3',
  starters: [
    { player: mockPlayers.kiran, x: 7, y: 50 }, // GK
    { player: mockPlayers.sanisch, x: 20, y: 15 }, // RB
    { player: mockPlayers.ananta, x: 18, y: 38 }, // CB
    { player: mockPlayers.devendra, x: 18, y: 62 }, // CB
    { player: fillerPlayers.npl_df2, x: 20, y: 85 }, // LB
    { player: mockPlayers.arik, x: 30, y: 25 }, // LCM
    { player: fillerPlayers.npl_mf1, x: 28, y: 50 }, // CM
    { player: mockPlayers.laken, x: 30, y: 75 }, // RCM
    { player: mockPlayers.manish, x: 41, y: 20 }, // RW
    { player: mockPlayers.bimal, x: 42, y: 50 }, // ST
    { player: mockPlayers.ayush, x: 41, y: 80 }, // LW
  ],
  substitutes: [
    mockPlayers.anjan,
    fillerPlayers.npl_df3,
    fillerPlayers.npl_mf2
  ]
};

export const indiaLineup: { formation: string; starters: any[]; substitutes: Player[] } = {
  formation: '4-3-3',
  starters: [
    { player: mockPlayers.gurpreet, x: 93, y: 50 }, // GK (Right Side)
    { player: fillerPlayers.ind_df1, x: 80, y: 85 }, // RB
    { player: mockPlayers.sandesh, x: 82, y: 62 }, // CB
    { player: fillerPlayers.ind_df2, x: 82, y: 38 }, // CB
    { player: mockPlayers.subhasish, x: 80, y: 15 }, // LB
    { player: fillerPlayers.ind_mf1, x: 70, y: 75 }, // RCM
    { player: mockPlayers.apuia, x: 72, y: 50 }, // CM / DM
    { player: fillerPlayers.ind_mf2, x: 70, y: 25 }, // LCM
    { player: fillerPlayers.ind_fw1, x: 59, y: 80 }, // RW
    { player: mockPlayers.sunil, x: 58, y: 50 }, // ST
    { player: mockPlayers.bipin, x: 59, y: 20 }, // LW
  ],
  substitutes: [
    mockPlayers.anjan, // can also sub in mock matches
    mockPlayers.rohit,
  ]
};

// Women National Lineups
export const nepalWomenLineup = {
  formation: '4-3-3',
  starters: [
    { player: mockPlayers.angela, x: 7, y: 50 }, // GK
    { player: mockPlayers.gita, x: 18, y: 38 }, // CB
    { player: mockPlayers.ananta, x: 18, y: 62 }, // CB (reuse CB)
    { player: fillerPlayers.npl_df2, x: 20, y: 85 }, // LB
    { player: mockPlayers.sanisch, x: 20, y: 15 }, // RB
    { player: mockPlayers.preeti, x: 30, y: 50 }, // CM
    { player: mockPlayers.arik, x: 30, y: 25 }, // LCM
    { player: mockPlayers.laken, x: 30, y: 75 }, // RCM
    { player: mockPlayers.samba, x: 42, y: 50 }, // ST
    { player: mockPlayers.amisha, x: 41, y: 20 }, // LW
    { player: mockPlayers.ayush, x: 41, y: 80 } // RW
  ],
  substitutes: [
    mockPlayers.manish,
    fillerPlayers.npl_df3
  ]
};

export const indiaWomenLineup = {
  formation: '4-4-2',
  starters: [
    { player: mockPlayers.gurpreet, x: 93, y: 50 }, // GK
    { player: mockPlayers.sandesh, x: 82, y: 62 }, // CB
    { player: fillerPlayers.ind_df2, x: 82, y: 38 }, // CB
    { player: mockPlayers.subhasish, x: 80, y: 15 }, // LB
    { player: fillerPlayers.ind_df1, x: 80, y: 85 }, // RB
    { player: mockPlayers.apuia, x: 72, y: 50 }, // CM
    { player: fillerPlayers.ind_mf1, x: 70, y: 75 }, // RM
    { player: fillerPlayers.ind_mf2, x: 70, y: 25 }, // LM
    { player: fillerPlayers.ind_fw1, x: 59, y: 80 }, // RW
    { player: mockPlayers.sunil, x: 58, y: 50 }, // ST
    { player: mockPlayers.bipin, x: 59, y: 20 } // LW
  ],
  substitutes: []
};

// Real historical / near future fixtures of Nepal
export const mockMatches: Match[] = [
  {
    id: 'm1',
    category: 'MEN',
    competition: 'SAFF Championship - Final',
    date: 'Jun 2, 2026',
    time: '19:00',
    status: 'LIVE',
    minute: 74,
    venue: 'Dashrath Rangasala, Kathmandu',
    homeTeam: mockTeams.nepal,
    awayTeam: mockTeams.india,
    homeScore: 1,
    awayScore: 0,
    stats: {
      possession: [52, 48],
      shots: [11, 8],
      shotsOnTarget: [5, 3],
      corners: [4, 5],
      fouls: [12, 14],
      yellowCards: [2, 3],
      redCards: [0, 0]
    },
    homeLineup: nepalLineup,
    awayLineup: indiaLineup,
    predictionVotes: {
      home: 2450,
      draw: 840,
      away: 1980
    }
  },
  {
    id: 'm2',
    category: 'MEN',
    competition: 'FIFA World Cup Qualifiers',
    date: 'Mar 31, 2026',
    time: '17:30',
    status: 'FINISHED',
    venue: 'Dashrath Rangasala, Kathmandu',
    homeTeam: mockTeams.nepal,
    awayTeam: mockTeams.india, // national showcase
    homeScore: 3,
    awayScore: 1,
    stats: {
      possession: [58, 42],
      shots: [15, 6],
      shotsOnTarget: [8, 2],
      corners: [6, 2],
      fouls: [9, 11],
      yellowCards: [1, 2],
      redCards: [0, 0]
    },
    homeLineup: nepalLineup,
    awayLineup: indiaLineup,
    predictionVotes: {
      home: 1200,
      draw: 200,
      away: 400
    }
  },
  {
    id: 'm3',
    category: 'MEN',
    competition: 'Asian Cup Qualifiers',
    date: 'Nov 18, 2025',
    time: '20:15',
    status: 'FINISHED',
    venue: 'National Bukit Jalil, Malaysia',
    homeTeam: mockTeams.india, // subbed as demo friendly
    awayTeam: mockTeams.nepal,
    homeScore: 0,
    awayScore: 1,
    stats: {
      possession: [46, 54],
      shots: [7, 12],
      shotsOnTarget: [2, 6],
      corners: [5, 4],
      fouls: [15, 12],
      yellowCards: [3, 1],
      redCards: [0, 0]
    },
    predictionVotes: {
      home: 500,
      draw: 350,
      away: 900
    }
  },
  {
    id: 'm4',
    category: 'MEN',
    competition: 'SAFF Championship - Warm up',
    date: 'Jun 12, 2026',
    time: '18:15',
    status: 'UPCOMING',
    venue: 'Dashrath Rangasala, Kathmandu',
    homeTeam: mockTeams.nepal,
    awayTeam: mockTeams.india,
    homeLineup: nepalLineup,
    awayLineup: indiaLineup,
    predictionVotes: {
      home: 3100,
      draw: 450,
      away: 700
    }
  },
  {
    id: 'w1',
    category: 'WOMEN',
    competition: 'SAFF Womens Championship - Final',
    date: 'Jun 4, 2026',
    time: '18:30',
    status: 'LIVE',
    minute: 65,
    venue: 'Dashrath Rangasala, Kathmandu',
    homeTeam: mockTeams.nepal_women,
    awayTeam: mockTeams.india_women,
    homeScore: 2,
    awayScore: 1,
    stats: {
      possession: [55, 45],
      shots: [14, 9],
      shotsOnTarget: [7, 4],
      corners: [5, 3],
      fouls: [10, 11],
      yellowCards: [1, 2],
      redCards: [0, 0]
    },
    homeLineup: nepalWomenLineup,
    awayLineup: indiaWomenLineup,
    predictionVotes: {
      home: 3420,
      draw: 530,
      away: 1200
    }
  },
  {
    id: 'w2',
    category: 'WOMEN',
    competition: 'International Cup - Group Stage',
    date: 'Apr 12, 2026',
    time: '15:15',
    status: 'FINISHED',
    venue: 'Changlimithang Stadium, Bhutan',
    homeTeam: mockTeams.nepal_women,
    awayTeam: mockTeams.india_women,
    homeScore: 3,
    awayScore: 0,
    stats: {
      possession: [60, 40],
      shots: [18, 5],
      shotsOnTarget: [10, 1],
      corners: [8, 1],
      fouls: [8, 9],
      yellowCards: [0, 1],
      redCards: [0, 0]
    },
    homeLineup: nepalWomenLineup,
    awayLineup: indiaWomenLineup,
    predictionVotes: {
      home: 2100,
      draw: 300,
      away: 800
    }
  },
  {
    id: 'w3',
    category: 'WOMEN',
    competition: 'Olympic Football Qualifiers',
    date: 'Sep 15, 2026',
    time: '19:00',
    status: 'UPCOMING',
    venue: 'Dashrath Rangasala, Kathmandu',
    homeTeam: mockTeams.nepal_women,
    awayTeam: mockTeams.india_women,
    homeLineup: nepalWomenLineup,
    awayLineup: indiaWomenLineup,
    predictionVotes: {
      home: 4050,
      draw: 620,
      away: 1100
    }
  },
  {
    id: 'd1',
    category: 'DOMESTIC',
    competition: 'Nepal Super League Clash',
    date: 'Jun 1, 2026',
    time: '17:30',
    status: 'LIVE',
    minute: 45,
    venue: 'Chyasal Stadium, Lalitpur',
    homeTeam: mockTeams.churchboys,
    awayTeam: mockTeams.machhindra,
    homeScore: 0,
    awayScore: 0,
    stats: {
      possession: [50, 50],
      shots: [4, 4],
      shotsOnTarget: [1, 2],
      corners: [2, 3],
      fouls: [8, 7],
      yellowCards: [1, 1],
      redCards: [0, 0]
    },
    predictionVotes: {
      home: 1550,
      draw: 1100,
      away: 1400
    }
  },
  {
    id: 'd2',
    category: 'DOMESTIC',
    competition: 'Nepal Super League - Round 4',
    date: 'May 20, 2026',
    time: '15:30',
    status: 'FINISHED',
    venue: 'Dashrath Rangasala, Kathmandu',
    homeTeam: mockTeams.manang,
    awayTeam: mockTeams.threeStar,
    homeScore: 2,
    awayScore: 1,
    stats: {
      possession: [51, 49],
      shots: [12, 10],
      shotsOnTarget: [6, 4],
      corners: [4, 6],
      fouls: [14, 15],
      yellowCards: [3, 2],
      redCards: [0, 0]
    },
    predictionVotes: {
      home: 1800,
      draw: 700,
      away: 1500
    }
  },
  {
    id: 'd3',
    category: 'DOMESTIC',
    competition: 'Nepal Super League - Round 5',
    date: 'Jun 30, 2026',
    time: '17:00',
    status: 'UPCOMING',
    venue: 'Pokhara Rangasala, Pokhara',
    homeTeam: mockTeams.manang,
    awayTeam: mockTeams.threeStar,
    homeLineup: nepalLineup,
    awayLineup: indiaLineup,
    predictionVotes: {
      home: 1200,
      draw: 850,
      away: 1300
    }
  }
];
