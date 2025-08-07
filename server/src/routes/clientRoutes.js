import { Router } from 'express';
import { submitCv } from '../controllers/clientController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();
router.post('/cv', authenticate, upload.single('cv'), submitCv);

export default router;
