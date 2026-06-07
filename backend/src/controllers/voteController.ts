import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authMiddleware';
import { Vote } from '../models/Vote';
import { User } from '../models/User';

export async function castVote(req: AuthRequest, res: Response): Promise<void> {
  const { matchId, outcome } = req.body;
  const userId = req.userId!;

  const existing = await Vote.findOne({ userId, matchId });
  await Vote.findOneAndUpdate(
    { userId, matchId },
    { outcome, timestamp: new Date() },
    { upsert: true, new: true }
  );

  if (!existing) {
    await User.findByIdAndUpdate(userId, { $inc: { predictionsTotal: 1 } });
  }

  res.json({ success: true });
}

export async function getMatchVotes(req: AuthRequest, res: Response): Promise<void> {
  const matchObjectId = new mongoose.Types.ObjectId(req.params.matchId);
  const counts = await Vote.aggregate([
    { $match: { matchId: matchObjectId } },
    { $group: { _id: '$outcome', count: { $sum: 1 } } },
  ]);
  const votes: Record<string, number> = { home_win: 0, draw: 0, away_win: 0 };
  for (const c of counts) votes[c._id as string] = c.count;

  let userVote: string | null = null;
  if (req.userId) {
    const myVote = await Vote.findOne({ matchId: matchObjectId, userId: req.userId }).lean();
    userVote = myVote?.outcome ?? null;
  }

  res.json({ ...votes, userVote });
}

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const limit = Number(req.query.limit ?? 10);
  const users = await User.find()
    .sort({ reputation: -1 })
    .limit(limit)
    .select('name reputation predictionsCorrect predictionsTotal')
    .lean();
  res.json({ leaderboard: users });
}
