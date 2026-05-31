import express from 'express';
import { authenticateToken } from '@middleware/auth';
import {
  predictMatch,
  getAllPredictions,
  getPredictionById,
  getPredictionAccuracy,
} from '@controllers/predictionController';

export const predictionRoutes = express.Router();

predictionRoutes.post('/', authenticateToken, predictMatch);
predictionRoutes.get('/', authenticateToken, getAllPredictions);
predictionRoutes.get('/:predictionId', authenticateToken, getPredictionById);
predictionRoutes.get('/accuracy/:predictionId', authenticateToken, getPredictionAccuracy);
