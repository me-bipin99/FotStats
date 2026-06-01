import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { Match } from '@models/Match';
import { Team } from '@models/Team';
import { ApiError } from '@middleware/errorHandler';
import mlService from '@services/mlIntegrationService';
import { cacheGet, cacheSet } from '@config/cache';
import { logger } from '@utils/logger';

export async function createMatch(req: AuthRequest, res: Response) {
  try {
    const { matchId, homeTeamId, awayTeamId, date } = req.body;

    if (!matchId || !homeTeamId || !awayTeamId || !date) {
      throw new ApiError(400, 'Missing required fields');
    }

    const homeTeam = await Team.findOne({ teamId: homeTeamId });
    const awayTeam = await Team.findOne({ teamId: awayTeamId });

    if (!homeTeam || !awayTeam) {
      throw new ApiError(404, 'One or both teams not found');
    }

    const match = await Match.create({
      matchId,
      homeTeam: homeTeam._id,
      awayTeam: awayTeam._id,
      date,
    });

    res.status(201).json({ status: 'success', message: 'Match created', data: match });
  } catch (error) {
    throw error;
  }
}

export async function getAllMatches(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const filter: Record<string, any> = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const matches = await Match.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('homeTeam')
      .populate('awayTeam');
    const total = await Match.countDocuments(filter);

    res.json({
      status: 'success',
      data: {
        matches,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getMatchById(req: AuthRequest, res: Response) {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({ matchId })
      .populate('homeTeam')
      .populate('awayTeam')
      .populate('lineups.home')
      .populate('lineups.away');

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    res.json({ status: 'success', data: match });
  } catch (error) {
    throw error;
  }
}

export async function getMatchPrediction(req: AuthRequest, res: Response) {
  try {
    const { matchId } = req.params;
    const formation = req.query.formation as string || '4-3-3';

    const cacheKey = `match:prediction:${matchId}:${formation}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info('Cache hit for match prediction', { matchId, formation });
      return res.json({ status: 'success', data: cached });
    }

    const match = await Match.findOne({ matchId })
      .populate({
        path: 'homeTeam',
        populate: { path: 'squad' },
      })
      .populate({
        path: 'awayTeam',
        populate: { path: 'squad' },
      });

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    const homeTeam = match.homeTeam as any;
    const awayTeam = match.awayTeam as any;

    const prediction = await mlService.predictMatch(homeTeam.toObject(), awayTeam.toObject(), formation);

    const matchUpdate = {
      prediction: {
        homeWin: prediction.match_outcome.home_win,
        draw: prediction.match_outcome.draw,
        awayWin: prediction.match_outcome.away_win,
        confidence: prediction.match_outcome.confidence,
      },
    };

    await Match.updateOne({ _id: match._id }, matchUpdate);

    const result = {
      ...prediction,
      matchId: match.matchId,
      date: match.date,
      status: match.status,
    };

    await cacheSet(cacheKey, result, 600);

    return res.json({ status: 'success', data: result });
  } catch (error) {
    throw error;
  }
}

export async function getMatchAnalysis(req: AuthRequest, res: Response) {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({ matchId })
      .populate({
        path: 'homeTeam',
        populate: { path: 'squad' },
      })
      .populate({
        path: 'awayTeam',
        populate: { path: 'squad' },
      });

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    const analysis = {
      match: match,
      prediction: match.prediction,
      result: match.status === 'completed' ? match.result : null,
    };

    res.json({ status: 'success', data: analysis });
  } catch (error) {
    throw error;
  }
}

export async function updateMatch(req: AuthRequest, res: Response) {
  try {
    const { matchId } = req.params;
    const updateData = req.body;

    const match = await Match.findOneAndUpdate({ matchId }, updateData, { new: true })
      .populate('homeTeam')
      .populate('awayTeam');

    if (!match) {
      throw new ApiError(404, 'Match not found');
    }

    res.json({ status: 'success', message: 'Match updated', data: match });
  } catch (error) {
    throw error;
  }
}
