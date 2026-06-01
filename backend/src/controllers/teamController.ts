import { Response } from 'express';
import { AuthRequest } from '@middleware/auth';
import { Team } from '@models/Team';
import { ApiError } from '@middleware/errorHandler';
import mlService from '@services/mlIntegrationService';
import { cacheGet, cacheSet } from '@config/cache';
import { logger } from '@utils/logger';

export async function createTeam(req: AuthRequest, res: Response) {
  try {
    const { teamId, name, city } = req.body;

    if (!teamId || !name) {
      throw new ApiError(400, 'Missing required fields');
    }

    const existingTeam = await Team.findOne({ teamId });
    if (existingTeam) {
      throw new ApiError(409, 'Team already exists');
    }

    const team = await Team.create({
      teamId,
      name,
      city,
      squad: [],
    });

    res.status(201).json({ status: 'success', message: 'Team created', data: team });
  } catch (error) {
    throw error;
  }
}

export async function getAllTeams(req: AuthRequest, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const teams = await Team.find().skip(skip).limit(limit).populate('squad');
    const total = await Team.countDocuments();

    res.json({
      status: 'success',
      data: {
        teams,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    throw error;
  }
}

export async function getTeamById(req: AuthRequest, res: Response) {
  try {
    const { teamId } = req.params;

    const team = await Team.findOne({ teamId }).populate('squad');
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    res.json({ status: 'success', data: team });
  } catch (error) {
    throw error;
  }
}

export async function getTeamAnalytics(req: AuthRequest, res: Response) {
  try {
    const { teamId } = req.params;

    const cacheKey = `team:analytics:${teamId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info('Cache hit for team analytics', { teamId });
      return res.json({ status: 'success', data: cached });
    }

    const team = await Team.findOne({ teamId }).populate('squad');
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    const squadIds = team.squad.map((p: any) => p.playerId);

    const [clusterData, optimizeData] = await Promise.all([
      mlService.clusterPlayers(squadIds),
      mlService.optimizeSquad(
        team.squad.map((p: any) => p.toObject()),
        '4-3-3'
      ),
    ]);

    const analytics = {
      squad: team.squad,
      synergy: clusterData.synergy_pairs,
      cluster_labels: clusterData.cluster_labels,
      optimizedLineup: optimizeData,
    };

    await cacheSet(cacheKey, analytics, 600);

    return res.json({ status: 'success', data: analytics });
  } catch (error) {
    throw error;
  }
}

export async function getTeamSquad(req: AuthRequest, res: Response) {
  try {
    const { teamId } = req.params;

    const team = await Team.findOne({ teamId }).populate('squad');
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    res.json({ status: 'success', data: { squad: team.squad } });
  } catch (error) {
    throw error;
  }
}

export async function updateTeam(req: AuthRequest, res: Response) {
  try {
    const { teamId } = req.params;
    const updateData = req.body;

    const team = await Team.findOneAndUpdate({ teamId }, updateData, { new: true }).populate('squad');
    if (!team) {
      throw new ApiError(404, 'Team not found');
    }

    res.json({ status: 'success', message: 'Team updated', data: team });
  } catch (error) {
    throw error;
  }
}
