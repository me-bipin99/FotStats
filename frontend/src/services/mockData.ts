// Mock data for testing UI without backend/database
export const mockPlayers = [
  {
    _id: '1',
    playerId: 'anjan_bista',
    name: 'Anjan Bista',
    position: 'FWD',
    stats: { goals: 13, assists: 5, caps: 74, eloRating: 1850, passAccuracy: 78 },
    roleClassification: { primaryRole: 'Striker' },
  },
  {
    _id: '2',
    playerId: 'biraj_bohora',
    name: 'Biraj Bohora',
    position: 'MID',
    stats: { goals: 5, assists: 8, caps: 52, eloRating: 1720, passAccuracy: 82 },
    roleClassification: { primaryRole: 'Central Midfielder' },
  },
  {
    _id: '3',
    playerId: 'kiran_chherung',
    name: 'Kiran Chherung',
    position: 'DEF',
    stats: { goals: 1, assists: 0, caps: 48, eloRating: 1680, passAccuracy: 75 },
    roleClassification: { primaryRole: 'Defender' },
  },
  {
    _id: '4',
    playerId: 'shunsuke_nakamura',
    name: 'Shunsuke Nakamura',
    position: 'MID',
    stats: { goals: 8, assists: 12, caps: 65, eloRating: 1800, passAccuracy: 85 },
    roleClassification: { primaryRole: 'Attacking Midfielder' },
  },
  {
    _id: '5',
    playerId: 'abhinav_bista',
    name: 'Abhinav Bista',
    position: 'FWD',
    stats: { goals: 9, assists: 3, caps: 38, eloRating: 1750, passAccuracy: 76 },
    roleClassification: { primaryRole: 'Forward' },
  },
  {
    _id: '6',
    playerId: 'gaurav_bhandari',
    name: 'Gaurav Bhandari',
    position: 'GK',
    stats: { goals: 0, assists: 0, caps: 42, eloRating: 1620, passAccuracy: 60 },
    roleClassification: { primaryRole: 'Goalkeeper' },
  },
];

export const mockMatches = [
  {
    _id: '1',
    matchId: 'nep_ind_2025',
    homeTeam: { _id: '1', teamId: 'nepal', name: 'Nepal' },
    awayTeam: { _id: '2', teamId: 'india', name: 'India' },
    date: '2025-08-15',
    status: 'scheduled',
    prediction: { homeWin: 0.25, draw: 0.30, awayWin: 0.45, confidence: 0.72 },
  },
  {
    _id: '2',
    matchId: 'nep_ban_2025',
    homeTeam: { _id: '1', teamId: 'nepal', name: 'Nepal' },
    awayTeam: { _id: '3', teamId: 'bangladesh', name: 'Bangladesh' },
    date: '2025-09-05',
    status: 'completed',
    result: { homeGoals: 2, awayGoals: 1 },
    prediction: { homeWin: 0.52, draw: 0.27, awayWin: 0.21, confidence: 0.68 },
  },
];

export const mockTeams = [
  {
    _id: '1',
    teamId: 'nepal',
    name: 'Nepal National Team',
    city: 'Kathmandu',
    squad: mockPlayers.map(p => p._id),
  },
  {
    _id: '2',
    teamId: 'india',
    name: 'India National Team',
    city: 'New Delhi',
    squad: [],
  },
  {
    _id: '3',
    teamId: 'bangladesh',
    name: 'Bangladesh National Team',
    city: 'Dhaka',
    squad: [],
  },
];
