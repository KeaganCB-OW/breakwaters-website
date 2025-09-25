import { Router } from 'express';
import { listClients, submitCv, updateClient } from '../controllers/clientController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', listClients);
router.patch('/:id', updateClient);
router.post('/cv', authenticate, upload.single('cv'), submitCv);

export default router;
