import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Match } from '../models/Match';
import { Vote } from '../models/Vote';
import type { AuthRequest } from '../middleware/authMiddleware';

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
    .populate('homeLineup.playerId')
    .populate('awayLineup.playerId')
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

export async function createMatch(req: AuthRequest, res: Response): Promise<void> {
  const { homeTeam, awayTeam, date, competition, venue, homeFormation, awayFormation } = req.body;

  if (!homeTeam || !awayTeam || !date || !competition) {
    res.status(400).json({
      error: 'MISSING_FIELDS',
      message: 'homeTeam, awayTeam, date, and competition are required',
    });
    return;
  }

  if (homeTeam === awayTeam) {
    res.status(400).json({ error: 'INVALID_TEAMS', message: 'Home and away team must be different' });
    return;
  }

  const match = await Match.create({
    homeTeam,
    awayTeam,
    date: new Date(date),
    competition,
    venue: venue ?? '',
    homeFormation: homeFormation ?? '4-3-3',
    awayFormation: awayFormation ?? '4-3-3',
    status: 'upcoming',
    homeLineup: [],
    awayLineup: [],
  });

  const populated = await match.populate(['homeTeam', 'awayTeam']);
  res.status(201).json({ match: populated });
}

export async function updateMatch(req: AuthRequest, res: Response): Promise<void> {
  const allowed = ['date', 'competition', 'venue', 'status', 'homeFormation', 'awayFormation', 'result'];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'NO_UPDATES', message: 'No valid fields provided to update' });
    return;
  }

  if (updates.date) updates.date = new Date(updates.date as string);

  const match = await Match.findByIdAndUpdate(req.params.id, updates, { new: true })
    .populate('homeTeam')
    .populate('awayTeam')
    .lean();

  if (!match) {
    res.status(404).json({ error: 'MATCH_NOT_FOUND', message: 'Match not found' });
    return;
  }

  res.json({ match });
}
