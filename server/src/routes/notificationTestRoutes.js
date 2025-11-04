import { Router } from 'express';
import {
  triggerClientStatusTestEmail,
  triggerClientSuggestedTestEmail,
} from '../controllers/notificationTestController.js';

const router = Router();

const guardTestEndpoint = (req, res, next) => {
  const token = (process.env.TEST_ENDPOINT_TOKEN || '').trim();

  if (!token) {
    return res.status(404).json({ message: 'Test endpoints are not enabled.' });
  }

  const provided =
    req.headers['x-test-token'] ||
    req.headers['x-test-token'.toLowerCase()] ||
    req.query.token ||
    req.body?.token;

  if (provided !== token) {
    return res.status(403).json({ message: 'Invalid test endpoint token.' });
  }

  return next();
};

router.post('/emails/client-status', guardTestEndpoint, triggerClientStatusTestEmail);
router.post('/emails/client-suggested', guardTestEndpoint, triggerClientSuggestedTestEmail);

export default router;

