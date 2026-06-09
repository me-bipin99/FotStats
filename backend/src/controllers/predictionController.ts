import { Request, Response } from 'express';
import { Prediction } from '../models/Prediction';
import { Vote } from '../models/Vote';
import { User } from '../models/User';
import { predictMatch, comparePlayers, optimizeSquad, VotePayload } from '../services/mlIntegration';

function mlError(err: unknown): { status: number; error: string; message: string } {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.startsWith('ML:')) return { status: 400, error: 'ML_ERROR', message: msg.slice(3) };
  return { status: 503, error: 'ML_UNAVAILABLE', message: 'ML service is unavailable' };
}

export async function triggerPrediction(req: Request, res: Response): Promise<void> {
  const { matchId } = req.body;

  const votes = await Vote.find({ matchId }).lean();

  if (votes.length === 0) {
    res.status(400).json({ error: 'NO_VOTES', message: 'No votes found for this match. Cast a vote first.' });
    return;
  }

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
  } catch (err) {
    const { status, error, message } = mlError(err);
    res.status(status).json({ error, message });
    return;
  }

  const { prediction: pred, confidence, voteBreakdown } = result as {
    prediction: { homeWinProb: number; drawProb: number; awayWinProb: number };
    confidence: number;
    voteBreakdown: { homeWin: number; draw: number; awayWin: number };
  };
  const prediction = await Prediction.findOneAndUpdate(
    { matchId },
    { prediction: pred, confidence, voteBreakdown, timestamp: new Date() },
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
  } catch (err) {
    const { status, error, message } = mlError(err);
    res.status(status).json({ error, message });
    return;
  }
  res.json(result);
}

export async function optimizeSquadProxy(req: Request, res: Response): Promise<void> {
  const { teamId, availablePlayerIds, formationPreference, constraints } = req.body;
  let result: unknown;
  try {
    result = await optimizeSquad(teamId, availablePlayerIds, formationPreference, constraints ?? { injured: [], suspended: [] });
  } catch (err) {
    const { status, error, message } = mlError(err);
    res.status(status).json({ error, message });
    return;
  }
  res.json(result);
}
