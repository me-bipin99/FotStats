import axios, { AxiosInstance } from 'axios';
import { logger } from '@utils/logger';

interface EstimateResponse {
  xG: number;
  xA: number;
  similar_players: Array<{ name: string; position: string; goals: number; assists: number }>;
  estimated_stats: Record<string, any>;
}

interface PredictResponse {
  lineup: { starters: Array<{ playerId: string; name: string; position: string }>; formation: string };
  match_outcome: {
    home_win: number;
    draw: number;
    away_win: number;
    confidence: number;
    narrative: string;
  };
}

interface ClusterResponse {
  clusters: Record<number, string[]>;
  synergy_pairs: Array<[string, string]>;
  cluster_labels: Record<number, string>;
}

interface OptimizeResponse {
  bestXI: Array<{ playerId: string; name: string; position: string }>;
  formation: string;
  fitness_score: number;
  composition: Record<string, number>;
}

interface InsightResponse {
  insights: Array<{ title: string; description: string; icon: string; color: string }>;
}

interface NarrativeResponse {
  narrative: string;
}

class MLIntegrationService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async estimatePlayerStats(playerData: Record<string, any>): Promise<EstimateResponse> {
    try {
      logger.info('Calling ML service: estimatePlayerStats', { playerData });
      const response = await this.client.post<EstimateResponse>('/api/v1/estimate-stats', {
        player: playerData,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service error in estimatePlayerStats:', error);
      throw error;
    }
  }

  async predictMatch(
    homeTeam: Record<string, any>,
    awayTeam: Record<string, any>,
    formation: string = '4-3-3'
  ): Promise<PredictResponse> {
    try {
      logger.info('Calling ML service: predictMatch', { homeTeam: homeTeam.teamId, awayTeam: awayTeam.teamId, formation });
      const response = await this.client.post<PredictResponse>('/api/v1/predict-match', {
        home_team: homeTeam,
        away_team: awayTeam,
        formation,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service error in predictMatch:', error);
      throw error;
    }
  }

  async clusterPlayers(playerIds: string[]): Promise<ClusterResponse> {
    try {
      logger.info('Calling ML service: clusterPlayers', { count: playerIds.length });
      const response = await this.client.post<ClusterResponse>('/api/v1/cluster-players', {
        player_ids: playerIds,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service error in clusterPlayers:', error);
      throw error;
    }
  }

  async optimizeSquad(
    players: Array<Record<string, any>>,
    formation: string = '4-3-3'
  ): Promise<OptimizeResponse> {
    try {
      logger.info('Calling ML service: optimizeSquad', { count: players.length, formation });
      const response = await this.client.post<OptimizeResponse>('/api/v1/optimize-squad', {
        players,
        formation,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service error in optimizeSquad:', error);
      throw error;
    }
  }

  async generateInsights(playerData: Record<string, any>): Promise<InsightResponse> {
    try {
      logger.info('Calling ML service: generateInsights', { playerName: playerData.name });
      const response = await this.client.post<InsightResponse>('/api/v1/generate-insights', {
        player: playerData,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service error in generateInsights:', error);
      throw error;
    }
  }

  async generateNarrative(
    prediction: Record<string, any>,
    homeTeam: Record<string, any>,
    awayTeam: Record<string, any>
  ): Promise<NarrativeResponse> {
    try {
      logger.info('Calling ML service: generateNarrative');
      const response = await this.client.post<NarrativeResponse>('/api/v1/generate-narrative', {
        prediction,
        home_team: homeTeam,
        away_team: awayTeam,
      });
      return response.data;
    } catch (error) {
      logger.error('ML service error in generateNarrative:', error);
      throw error;
    }
  }
}

export default new MLIntegrationService();
