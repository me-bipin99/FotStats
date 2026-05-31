import express from 'express';
import { authenticateToken } from '@middleware/auth';
import {
  generatePlayerInsights,
  generateMatchNarrative,
  getAllInsights,
  getInsightById,
} from '@controllers/insightController';

export const insightRoutes = express.Router();

insightRoutes.post('/player/:playerId', authenticateToken, generatePlayerInsights);
insightRoutes.post('/match/:matchId', authenticateToken, generateMatchNarrative);
insightRoutes.get('/', authenticateToken, getAllInsights);
insightRoutes.get('/:insightId', authenticateToken, getInsightById);
