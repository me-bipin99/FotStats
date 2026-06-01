import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { Player } from '@models/Player';
import { ApiError } from '@middleware/errorHandler';
import mlService from '@services/mlIntegrationService';
import { cacheGet, cacheSet } from '@config/cache';
import { logger } from '@utils/logger';

export async function createPlayer(req: AuthRequest, res: Response) {
  try {
    const playerData = req.body;
    if (!playerData.playerId || !playerData.name) {
      throw new ApiError(400, 'Missing required fields');
    }

    const existingPlayer = await Player.findOne({ playerId: playerData.playerId });
    if (existingPlayer) {
      throw new ApiError(409, 'Player already exists');
    }

    const player = await Player.create(playerData);
    res.status(201).json({ status: 'success', message: 'Player created', data: player });
  } catch (error) {
    throw error;
  }
}

export async function getAllPlayers(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const position = req.query.position as string;
    const team = req.query.team as string;

    const filter: Record<string, any> = {};
    if (position) filter.position = position;
    if (team) filter.team = team;

    const skip = (page - 1) * limit;
    const players = await Player.find(filter).skip(skip).limit(limit);
    const total = await Player.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        players,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getPlayerById(req: AuthRequest, res: Response) {
  try {
    const { playerId } = req.params;

    const player = await Player.findOne({ playerId });
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    res.json({ status: 'success', data: player });
  } catch (error) {
    throw error;
  }
}

export async function getPlayerAnalytics(req: AuthRequest, res: Response) {
  try {
    const { playerId } = req.params;

    const cacheKey = `player:analytics:${playerId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info('Cache hit for player analytics', { playerId });
      return res.json({ status: 'success', data: cached });
    }

    const player = await Player.findOne({ playerId });
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    const playerObject = player.toObject();

    const [estimateData, insightsData, clusterData] = await Promise.all([
      mlService.estimatePlayerStats(playerObject),
      mlService.generateInsights(playerObject),
      mlService.clusterPlayers([playerId]),
    ]);

    const analytics = {
      xG: estimateData.xG,
      xA: estimateData.xA,
      similar_players: estimateData.similar_players,
      estimated_stats: estimateData.estimated_stats,
      insights: insightsData.insights,
      cluster: clusterData.clusters,
      role: player.roleClassification?.primaryRole || 'Unknown',
      eloRating: player.stats?.eloRating || 0,
    };

    await cacheSet(cacheKey, analytics, 300);

    return res.json({ status: 'success', data: analytics });
  } catch (error) {
    throw error;
  }
}

export async function comparePlayers(req: AuthRequest, res: Response) {
  try {
    const { playerIds } = req.body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
      throw new ApiError(400, 'playerIds array required');
    }

    const players = await Player.find({ playerId: { $in: playerIds } });
    if (players.length === 0) {
      throw new ApiError(404, 'No players found');
    }

    const clusterData = await mlService.clusterPlayers(playerIds);

    const comparison = {
      players: players.map((p) => ({
        playerId: p.playerId,
        name: p.name,
        position: p.position,
        stats: p.stats,
        role: p.roleClassification?.primaryRole,
      })),
      clusters: clusterData.clusters,
      synergy_pairs: clusterData.synergy_pairs,
      cluster_labels: clusterData.cluster_labels,
    };

    res.json({ status: 'success', data: comparison });
  } catch (error) {
    throw error;
  }
}

export async function updatePlayer(req: AuthRequest, res: Response) {
  try {
    const { playerId } = req.params;
    const updateData = req.body;

    const player = await Player.findOneAndUpdate({ playerId }, updateData, { new: true });
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    res.json({ status: 'success', message: 'Player updated', data: player });
  } catch (error) {
    throw error;
  }
}
