import { Router } from 'express';
import { triggerPrediction, getPrediction } from '../controllers/predictionController';

const router = Router();

router.post('/', triggerPrediction);
router.get('/:matchId', getPrediction);

export default router;
