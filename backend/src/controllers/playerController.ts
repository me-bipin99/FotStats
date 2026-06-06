import { Request, Response } from 'express';
import { Player } from '../models/Player';

export async function listPlayers(req: Request, res: Response): Promise<void> {
  const { position, search, sortBy = 'eloRating', limit = '50', offset = '0' } = req.query as Record<string, string>;
  const filter: Record<string, unknown> = {};
  if (position) filter.position = position;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const players = await Player.find(filter)
    .sort({ [sortBy]: -1 })
    .skip(Number(offset))
    .limit(Number(limit))
    .lean();

  res.json({ players, total: await Player.countDocuments(filter) });
}

export async function getPlayer(req: Request, res: Response): Promise<void> {
  const player = await Player.findById(req.params.id).populate('team').lean();
  if (!player) {
    res.status(404).json({ error: 'PLAYER_NOT_FOUND', message: 'Player not found' });
    return;
  }
  res.json(player);
}
