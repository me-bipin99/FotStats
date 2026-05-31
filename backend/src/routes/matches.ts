import express from 'express';
import { authenticateToken } from '@middleware/auth';
import {
  getAllMatches,
  getMatchById,
  createMatch,
  updateMatch,
  getMatchPrediction,
  getMatchAnalysis,
} from '@controllers/matchController';

export const matchRoutes = express.Router();

matchRoutes.post('/', authenticateToken, createMatch);
matchRoutes.get('/', authenticateToken, getAllMatches);
matchRoutes.get('/:matchId', authenticateToken, getMatchById);
matchRoutes.get('/:matchId/prediction', authenticateToken, getMatchPrediction);
matchRoutes.get('/:matchId/analysis', authenticateToken, getMatchAnalysis);
matchRoutes.put('/:matchId', authenticateToken, updateMatch);
