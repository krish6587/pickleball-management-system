import express from 'express';
import {
  createTournament,
  getTournaments,
  getTournamentById,
  setupTeamsAndGroups,
  assignEditor,
  verifyEditor,
  updateTournament,
  deleteTournament,
  removeEditor,
} from '../controllers/tournamentController.js';
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .post(protect, adminOnly, createTournament)
  .get(optionalAuth, getTournaments);

router.route('/:id')
  .get(optionalAuth, getTournamentById)
  .put(protect, adminOnly, updateTournament)
  .delete(protect, adminOnly, deleteTournament);

router.post('/:id/setup-teams', protect, setupTeamsAndGroups);
router.post('/:id/assign-editor', protect, adminOnly, assignEditor);
router.post('/:id/verify-editor', protect, adminOnly, verifyEditor);
router.delete('/:id/editors/:editorId', protect, adminOnly, removeEditor);

export default router;
