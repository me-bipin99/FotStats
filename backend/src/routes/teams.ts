import { Router } from 'express';
import { listTeams, getTeam, getTeamLineup } from '../controllers/teamController';

const router = Router();

router.get('/', listTeams);
router.get('/:id/lineup', getTeamLineup);
router.get('/:id', getTeam);

export default router;
