import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { Player } from '@models/Player';
import { Match } from '@models/Match';
import { ApiError } from '@middleware/errorHandler';
import mlService from '@services/mlIntegrationService';
import { cacheGet, cacheSet } from '@config/cache';
import { logger } from '@utils/logger';

export async function generatePlayerInsights(req: AuthRequest, res: Response) {
  try {
    const { playerId } = req.params;

    const cacheKey = `insights:player:${playerId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info('Cache hit for player insights', { playerId });
      return res.json({ status: 'success', data: cached });
    }

    const player = await Player.findOne({ playerId });
    if (!player) {
      throw new ApiError(404, 'Player not found');
    }

    const insightsData = await mlService.generateInsights(player.toObject());

    await cacheSet(cacheKey, insightsData, 300);

    return res.json({ status: 'success', data: insightsData });
  } catch (error) {
    throw error;
  }
}

export async function generateMatchNarrative(req: AuthRequest, res: Response) {
  try {
    const { matchId } = req.params;

    const cacheKey = `insights:match:${matchId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info('Cache hit for match narrative', { matchId });
      return res.json({ status: 'success', data: cached });
    }

    const match = await Match.findOne({ matchId })
      .populate('homeTeam')
      .populate('awayTeam');

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    if (!match.prediction) {
      throw new ApiError(400, 'Match prediction not available');
    }

    const homeTeam = match.homeTeam as any;
    const awayTeam = match.awayTeam as any;

    const narrative = await mlService.generateNarrative(match.prediction, homeTeam.toObject(), awayTeam.toObject());

    await cacheSet(cacheKey, narrative, 600);

    return res.json({ status: 'success', data: narrative });
  } catch (error) {
    throw error;
  }
}

export async function getAllInsights(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const skip = (page - 1) * limit;
    const players = await Player.find({
      'roleClassification.primaryRole': { $exists: true },
    })
      .skip(skip)
      .limit(limit);
    const total = await Player.countDocuments({
      'roleClassification.primaryRole': { $exists: true },
    });

    const insights = players.map((player) => ({
      playerId: player.playerId,
      name: player.name,
      position: player.position,
      role: player.roleClassification?.primaryRole,
      eloRating: player.stats?.eloRating || 0,
    }));

    res.json({
      status: 'success',
      data: {
        insights,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getInsightById(req: AuthRequest, res: Response) {
  try {
    const { insightId } = req.params;

    const player = await Player.findOne({ playerId: insightId });
    if (!player) {
      throw new ApiError(404, 'Insight not found');
    }

    const insightData = {
      playerId: player.playerId,
      name: player.name,
      position: player.position,
      role: player.roleClassification?.primaryRole,
      eloRating: player.stats?.eloRating || 0,
      estimatedStats: player.estimatedStats,
      formHistory: player.formHistory,
    };

    res.json({ status: 'success', data: insightData });
  } catch (error) {
    throw error;
  }
}
