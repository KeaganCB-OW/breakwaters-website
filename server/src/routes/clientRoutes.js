import { Router } from 'express';
import { listClients, submitCv } from '../controllers/clientController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', listClients);
router.post('/cv', authenticate, upload.single('cv'), submitCv);

export default router;
