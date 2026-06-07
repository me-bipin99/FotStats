import { Router, RequestHandler } from 'express';
import { castVote, getMatchVotes, getLeaderboard } from '../controllers/voteController';
import { requireAuth, softAuth } from '../middleware/authMiddleware';

const router = Router();

router.get('/leaderboard', getLeaderboard);
router.post('/', requireAuth, castVote as unknown as RequestHandler);
router.get('/:matchId', softAuth, getMatchVotes as unknown as RequestHandler);

export default router;
