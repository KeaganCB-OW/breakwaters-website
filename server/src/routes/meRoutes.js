import { Router } from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { checkCompanyExists } from '../controllers/companyController.js';

const router = Router();

router.get('/company-exists', authenticate, checkCompanyExists);

export default router;
