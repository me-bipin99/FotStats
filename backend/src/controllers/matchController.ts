import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Match } from '../models/Match';
import { Vote } from '../models/Vote';

export async function listMatches(req: Request, res: Response): Promise<void> {
  const { status, search, limit = '50', offset = '0' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (search) filter.competition = { $regex: search, $options: 'i' };

  const [matches, total] = await Promise.all([
    Match.find(filter)
      .populate('homeTeam')
      .populate('awayTeam')
      .sort({ date: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .lean(),
    Match.countDocuments(filter),
  ]);

  res.json({ matches, total });
}

export async function getMatch(req: Request, res: Response): Promise<void> {
  const match = await Match.findById(req.params.id)
    .populate('homeTeam')
    .populate('awayTeam')
    .lean();
  if (!match) {
    res.status(404).json({ error: 'MATCH_NOT_FOUND', message: 'Match not found' });
    return;
  }

  const matchObjectId = new mongoose.Types.ObjectId(req.params.id);
  const voteCounts = await Vote.aggregate([
    { $match: { matchId: matchObjectId } },
    { $group: { _id: '$outcome', count: { $sum: 1 } } },
  ]);
  const votes: Record<string, number> = { home_win: 0, draw: 0, away_win: 0 };
  for (const v of voteCounts) votes[v._id as string] = v.count;

  res.json({ ...match, voteCounts: votes });
}

export async function getMatchLineups(req: Request, res: Response): Promise<void> {
  const match = await Match.findById(req.params.id)
    .populate('homeLineup.playerId')
    .populate('awayLineup.playerId')
    .lean();
  if (!match) {
    res.status(404).json({ error: 'MATCH_NOT_FOUND', message: 'Match not found' });
    return;
  }
  res.json({
    homeFormation: match.homeFormation,
    awayFormation: match.awayFormation,
    homeLineup: match.homeLineup,
    awayLineup: match.awayLineup,
  });
}
