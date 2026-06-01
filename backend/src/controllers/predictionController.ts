import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { Match } from '@models/Match';
import { Team } from '@models/Team';
import { ApiError } from '@middleware/errorHandler';
import mlService from '@services/mlIntegrationService';
import { cacheGet, cacheSet } from '@config/cache';
import { logger } from '@utils/logger';

export async function predictMatch(req: AuthRequest, res: Response) {
  try {
    const { homeTeamId, awayTeamId, date } = req.body;

    if (!homeTeamId || !awayTeamId || !date) {
      throw new ApiError(400, 'Missing required fields');
    }

    const homeTeam = await Team.findOne({ teamId: homeTeamId }).populate('squad');
    const awayTeam = await Team.findOne({ teamId: awayTeamId }).populate('squad');

    if (!homeTeam || !awayTeam) {
      throw new ApiError(404, 'One or both teams not found');
    }

    const prediction = await mlService.predictMatch(homeTeam.toObject(), awayTeam.toObject(), '4-3-3');

    res.status(201).json({ status: 'success', data: prediction });
  } catch (error) {
    throw error;
  }
}

export async function getAllPredictions(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const skip = (page - 1) * limit;
    const predictions = await Match.find({ prediction: { $exists: true, $ne: null } })
      .skip(skip)
      .limit(limit)
      .populate('homeTeam')
      .populate('awayTeam');
    const total = await Match.countDocuments({ prediction: { $exists: true, $ne: null } });

    res.json({
      status: 'success',
      data: {
        predictions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getPredictionById(req: AuthRequest, res: Response) {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({ matchId })
      .populate('homeTeam')
      .populate('awayTeam');

    if (!match || !match.prediction) {
      throw new ApiError(404, 'Prediction not found');
    }

    res.json({
      status: 'success',
      data: {
        matchId: match.matchId,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        date: match.date,
        prediction: match.prediction,
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getPredictionAccuracy(req: AuthRequest, res: Response) {
  try {
    const cacheKey = 'prediction:accuracy:all';
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info('Cache hit for prediction accuracy');
      return res.json({ status: 'success', data: cached });
    }

    const completedMatches = await Match.find({
      status: 'completed',
      prediction: { $exists: true, $ne: null },
      'result.homeGoals': { $exists: true },
    });

    if (completedMatches.length === 0) {
      return res.json({
        status: 'success',
        data: {
          accuracy: 0,
          correct: 0,
          totalMatches: 0,
          message: 'No completed matches with predictions',
        },
      });
    }

    let correct = 0;

    for (const match of completedMatches) {
      const prediction = match.prediction;
      const result = match.result;

      const predictedWinner =
        prediction.homeWin > prediction.awayWin && prediction.homeWin > prediction.draw
          ? 'home'
          : prediction.awayWin > prediction.draw
            ? 'away'
            : 'draw';

      const actualWinner =
        result.homeGoals > result.awayGoals ? 'home' : result.homeGoals < result.awayGoals ? 'away' : 'draw';

      if (predictedWinner === actualWinner) {
        correct++;
      }
    }

    const accuracy = Math.round((correct / completedMatches.length) * 100);

    const accuracyData = {
      accuracy,
      correct,
      totalMatches: completedMatches.length,
    };

    await cacheSet(cacheKey, accuracyData, 3600);

    return res.json({ status: 'success', data: accuracyData });
  } catch (error) {
    throw error;
  }
}
