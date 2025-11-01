import { Router } from 'express';
import {
  listClients,
  submitCv,
  updateClient,
  deleteClient,
  createClient,
  getCurrentClient,
} from '../controllers/clientController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', listClients);
router.get('/me', authenticate, authorize('client'), getCurrentClient);
router.post('/', authenticate, authorize('client'), createClient);
router.patch('/:id', authenticate, authorize('recruitment_officer'), updateClient);
router.delete('/:id', authenticate, authorize('recruitment_officer'), deleteClient);
router.post('/cv', authenticate, upload.single('cv'), submitCv);

export default router;
