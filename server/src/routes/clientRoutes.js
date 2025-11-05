import { Router } from 'express';
import {
  listClients,
  createClient,
  submitCv,
  updateClient,
  deleteClient,
  getCurrentClient,
  getClientById,
  updateClientStatus,
} from '../controllers/clientController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';
import { handleCvUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', authenticate, authorize('recruitment_officer'), listClients);
router.get('/me', authenticate, getCurrentClient);
router.get('/:id', authenticate, authorize('recruitment_officer'), getClientById);
router.post('/', authenticate, createClient);
router.patch('/:id/status', authenticate, authorize('recruitment_officer'), updateClientStatus);
router.patch('/:id', authenticate, authorize('recruitment_officer'), updateClient);
router.delete('/:id', authenticate, authorize('recruitment_officer'), deleteClient);
router.post('/cv', authenticate, handleCvUpload, submitCv);

export default router;
