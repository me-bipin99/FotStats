import { Router } from 'express';
import { comparePlayersProxy } from '../controllers/predictionController';

const router = Router();

router.post('/', comparePlayersProxy);

export default router;
