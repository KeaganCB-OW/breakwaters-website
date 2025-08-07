import { Router } from 'express';
import { listPendingCvs } from '../controllers/recruitmentOfficerController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/pending', authenticate, authorize('recruitment_officer'), listPendingCvs);

export default router;
