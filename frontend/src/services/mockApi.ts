import { mockPlayers, mockMatches, mockTeams } from './mockData';

// Simulated API responses using mock data
export const mockAuthAPI = {
  login: async (email: string, password: string) => ({
    data: {
      status: 'success',
      token: 'mock_jwt_token_' + Date.now(),
      data: { userId: 'mock_user_1', email, role: 'admin' },
    },
  }),
};

export const mockPlayerAPI = {
  getAll: async (page = 1, limit = 20) => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      data: {
        status: 'success',
        data: {
          players: mockPlayers.slice(start, end),
          pagination: {
            page,
            limit,
            total: mockPlayers.length,
            pages: Math.ceil(mockPlayers.length / limit),
          },
        },
      },
    };
  },
  getById: async (id: string) => ({
    data: {
      status: 'success',
      data: mockPlayers.find(p => p.playerId === id) || mockPlayers[0],
    },
  }),
  getAnalytics: async (id: string) => {
    const player = mockPlayers.find(p => p.playerId === id) || mockPlayers[0];
    return {
      data: {
        status: 'success',
        data: {
          xG: Math.random() * 15,
          xA: Math.random() * 8,
          similar_players: mockPlayers.filter(p => p.position === player.position).slice(1, 4),
          insights: [
            { title: 'Strong Performer', description: 'Above average for position', icon: '⭐', color: 'text-nepal-red' },
            { title: 'Team Player', description: 'Good assist numbers', icon: '🎯', color: 'text-nepal-blue' },
          ],
          cluster: { 0: [player.name], 1: [mockPlayers[1].name] },
          role: player.roleClassification.primaryRole,
          eloRating: player.stats.eloRating,
        },
      },
    };
  },
  compare: async (playerIds: string[]) => ({
    data: {
      status: 'success',
      data: {
        players: mockPlayers.filter(p => playerIds.includes(p.playerId)),
        clusters: {
          0: playerIds.slice(0, 2),
          1: playerIds.slice(2),
        },
        synergy_pairs: [
          [playerIds[0], playerIds[1]],
          [playerIds[1], playerIds[2]],
        ],
        cluster_labels: { 0: 'Attackers', 1: 'Midfielders' },
      },
    },
  }),
};

export const mockTeamAPI = {
  getAll: async () => ({
    data: {
      status: 'success',
      data: { teams: mockTeams },
    },
  }),
  getById: async (id: string) => ({
    data: {
      status: 'success',
      data: mockTeams.find(t => t.teamId === id) || mockTeams[0],
    },
  }),
  getSquad: async (id: string) => ({
    data: {
      status: 'success',
      data: { squad: mockPlayers },
    },
  }),
};

export const mockMatchAPI = {
  getAll: async (page = 1, limit = 20) => ({
    data: {
      status: 'success',
      data: {
        matches: mockMatches,
        pagination: { page, limit, total: mockMatches.length, pages: 1 },
      },
    },
  }),
  getById: async (id: string) => ({
    data: {
      status: 'success',
      data: mockMatches.find(m => m.matchId === id) || mockMatches[0],
    },
  }),
  getPrediction: async (id: string) => ({
    data: {
      status: 'success',
      data: {
        lineup: {
          starters: mockPlayers.slice(0, 11),
          formation: '4-3-3',
        },
        match_outcome: {
          home_win: 0.52,
          draw: 0.27,
          away_win: 0.21,
          confidence: 0.68,
          narrative: 'Nepal favoured on home turf with strong midfield presence.',
        },
      },
    },
  }),
};
