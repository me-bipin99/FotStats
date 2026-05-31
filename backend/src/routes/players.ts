import express from 'express';
import { authenticateToken } from '@middleware/auth';
import {
  getAllPlayers,
  getPlayerById,
  getPlayerAnalytics,
  comparePlayers,
  updatePlayer,
  createPlayer,
} from '@controllers/playerController';

export const playerRoutes = express.Router();

playerRoutes.post('/', authenticateToken, createPlayer);
playerRoutes.get('/', authenticateToken, getAllPlayers);
playerRoutes.get('/:playerId', authenticateToken, getPlayerById);
playerRoutes.get('/:playerId/analytics', authenticateToken, getPlayerAnalytics);
playerRoutes.post('/compare', authenticateToken, comparePlayers);
playerRoutes.put('/:playerId', authenticateToken, updatePlayer);
