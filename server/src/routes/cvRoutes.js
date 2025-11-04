import { Router } from 'express';
import { uploadClientCv, getLatestClientCv } from '../controllers/cvController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { handleCvUploadInMemory } from '../middleware/cvUploadMiddleware.js';

const router = Router();

router.post('/upload', authenticate, handleCvUploadInMemory, uploadClientCv);
router.get('/latest/:clientId', authenticate, getLatestClientCv);

export default router;
