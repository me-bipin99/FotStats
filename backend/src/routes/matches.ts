import { Router } from 'express';
import { listMatches, getMatch, getMatchLineups } from '../controllers/matchController';

const router = Router();

router.get('/', listMatches);
router.get('/:id/lineups', getMatchLineups);
router.get('/:id', getMatch);

export default router;
