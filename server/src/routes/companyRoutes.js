import { Router } from 'express';
import { getCandidates, getCompanyStats, listCompanies } from '../controllers/companyController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = Router();
router.get('/', listCompanies);
router.get('/stats', getCompanyStats);
router.get('/candidates', authenticate, authorize('company_rep'), getCandidates);

export default router;

