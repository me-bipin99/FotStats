import { Request, Response } from 'express';
import { Prediction } from '../models/Prediction';
import { Vote } from '../models/Vote';
import { User } from '../models/User';
import { predictMatch, comparePlayers, optimizeSquad, VotePayload } from '../services/mlIntegration';

export async function triggerPrediction(req: Request, res: Response): Promise<void> {
  const { matchId } = req.body;

  const votes = await Vote.find({ matchId }).lean();
  const userIds = votes.map((v) => v.userId);
  const users = await User.find({ _id: { $in: userIds } }).select('reputation').lean();
  const repMap: Record<string, number> = {};
  for (const u of users) repMap[u._id.toString()] = u.reputation;

  const votePayload: VotePayload[] = votes.map((v) => ({
    userId: v.userId.toString(),
    outcome: v.outcome,
    reputation: repMap[v.userId.toString()] ?? 50,
  }));

  let result: unknown;
  try {
    result = await predictMatch(matchId, votePayload);
  } catch {
    res.status(503).json({ error: 'ML_UNAVAILABLE', message: 'ML service is unavailable' });
    return;
  }

  const prediction = await Prediction.findOneAndUpdate(
    { matchId },
    { ...(result as object), timestamp: new Date() },
    { upsert: true, new: true }
  );

  res.json(prediction);
}

export async function getPrediction(req: Request, res: Response): Promise<void> {
  const prediction = await Prediction.findOne({ matchId: req.params.matchId })
    .sort({ timestamp: -1 })
    .lean();
  if (!prediction) {
    res.status(404).json({ error: 'PREDICTION_NOT_FOUND', message: 'No prediction found for this match' });
    return;
  }
  res.json(prediction);
}

export async function comparePlayersProxy(req: Request, res: Response): Promise<void> {
  const { playerAId, playerBId } = req.body;
  let result: unknown;
  try {
    result = await comparePlayers(playerAId, playerBId);
  } catch {
    res.status(503).json({ error: 'ML_UNAVAILABLE', message: 'ML service is unavailable' });
    return;
  }
  res.json(result);
}

export async function optimizeSquadProxy(req: Request, res: Response): Promise<void> {
  const { teamId, availablePlayerIds, formationPreference, constraints } = req.body;
  let result: unknown;
  try {
    result = await optimizeSquad(teamId, availablePlayerIds, formationPreference, constraints ?? { injured: [], suspended: [] });
  } catch {
    res.status(503).json({ error: 'ML_UNAVAILABLE', message: 'ML service is unavailable' });
    return;
  }
  res.json(result);
}
