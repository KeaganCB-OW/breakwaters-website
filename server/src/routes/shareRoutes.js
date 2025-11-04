import { Router } from 'express';
import { getSharedClientDetails } from '../controllers/shareController.js';

const router = Router();

router.get('/clients/:clientId', getSharedClientDetails);

export default router;

