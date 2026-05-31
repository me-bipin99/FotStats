import express from 'express';
import { authenticateToken } from '@middleware/auth';
import {
  getAllTeams,
  getTeamById,
  getTeamAnalytics,
  createTeam,
  updateTeam,
  getTeamSquad,
} from '@controllers/teamController';

export const teamRoutes = express.Router();

teamRoutes.post('/', authenticateToken, createTeam);
teamRoutes.get('/', authenticateToken, getAllTeams);
teamRoutes.get('/:teamId', authenticateToken, getTeamById);
teamRoutes.get('/:teamId/analytics', authenticateToken, getTeamAnalytics);
teamRoutes.get('/:teamId/squad', authenticateToken, getTeamSquad);
teamRoutes.put('/:teamId', authenticateToken, updateTeam);
