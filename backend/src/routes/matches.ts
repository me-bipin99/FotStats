import { Router } from 'express';
import { listMatches, getMatch, getMatchLineups, createMatch, updateMatch, resolveMatch } from '../controllers/matchController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/', listMatches);
router.post('/', requireAuth, createMatch);
router.get('/:id/lineups', getMatchLineups);
router.get('/:id', getMatch);
router.patch('/:id', requireAuth, updateMatch);
router.post('/:id/resolve', requireAuth, resolveMatch as any);

export default router;
