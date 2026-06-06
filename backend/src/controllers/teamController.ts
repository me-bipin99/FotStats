import { Request, Response } from 'express';
import { Team } from '../models/Team';

export async function listTeams(_req: Request, res: Response): Promise<void> {
  const teams = await Team.find().populate('players').lean();
  res.json({ teams });
}

export async function getTeam(req: Request, res: Response): Promise<void> {
  const team = await Team.findById(req.params.id).populate('players').lean();
  if (!team) {
    res.status(404).json({ error: 'TEAM_NOT_FOUND', message: 'Team not found' });
    return;
  }
  res.json(team);
}

export async function getTeamLineup(req: Request, res: Response): Promise<void> {
  const team = await Team.findById(req.params.id).populate('players').lean();
  if (!team) {
    res.status(404).json({ error: 'TEAM_NOT_FOUND', message: 'Team not found' });
    return;
  }
  res.json({ formation: team.formation, players: team.players });
}
