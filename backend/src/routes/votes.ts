import { Router } from 'express';
import { castVote, getMatchVotes, getLeaderboard } from '../controllers/voteController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.post('/', requireAuth, castVote as any);
router.get('/:matchId', getMatchVotes);

export default router;
