import { Router } from 'express';
import { listPlayers, getPlayer } from '../controllers/playerController';

const router = Router();

router.get('/', listPlayers);
router.get('/:id', getPlayer);

export default router;
