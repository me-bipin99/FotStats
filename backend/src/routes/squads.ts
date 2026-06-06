import { Router } from 'express';
import { optimizeSquadProxy } from '../controllers/predictionController';

const router = Router();

router.post('/', optimizeSquadProxy);

export default router;
