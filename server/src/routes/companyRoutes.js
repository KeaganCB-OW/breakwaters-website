import { Router } from 'express';
import {
  createCompany,
  getCandidates,
  getCompanyStats,
  getCurrentCompany,
  listCompanies,
} from '../controllers/companyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
router.post('/', authenticate, createCompany);
router.get('/me', authenticate, getCurrentCompany);
router.get('/', authenticate, authorize('recruitment_officer'), listCompanies);
router.get('/stats', authenticate, authorize('recruitment_officer'), getCompanyStats);
router.get('/candidates', authenticate, authorize('company_rep'), getCandidates);

export default router;

