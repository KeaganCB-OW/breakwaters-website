import { Router } from 'express';
import {
  listClients,
  createClient,
  submitCv,
  updateClient,
  deleteClient,
  getCurrentClient,
} from '../controllers/clientController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', listClients);
router.get('/me', authenticate, getCurrentClient);
router.post('/', authenticate, createClient);
router.patch('/:id', authenticate, authorize('recruitment_officer'), updateClient);
router.delete('/:id', authenticate, authorize('recruitment_officer'), deleteClient);
router.post('/cv', authenticate, upload.single('cv'), submitCv);

export default router;
