import { Router } from 'express';
import { listMatches, getMatch, getMatchLineups, createMatch, updateMatch } from '../controllers/matchController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', listMatches);
router.post('/', requireAuth, createMatch);
router.get('/:id/lineups', getMatchLineups);
router.get('/:id', getMatch);
router.patch('/:id', requireAuth, updateMatch);

export default router;
