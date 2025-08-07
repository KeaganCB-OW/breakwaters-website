import { Router } from 'express';
import { assignCandidate } from '../controllers/assignmentController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
router.post('/', authenticate, authorize('recruitment_officer'), assignCandidate);

export default router;
