import express from 'express';
import {
  updateMatchDetails,
  submitMatchScore,
  saveMatchPoint,
  undoMatchPoint,
  disputeMatch,
} from '../controllers/matchController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.put('/:id', protect, updateMatchDetails);
router.post('/:id/score', protect, submitMatchScore);
router.post('/:id/save-point', protect, saveMatchPoint);
router.post('/:id/undo-point', protect, undoMatchPoint);
router.post('/:id/dispute', protect, disputeMatch);

export default router;
