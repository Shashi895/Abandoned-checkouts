import express from 'express';
const router = express.Router();
import { handleCheckoutWebhook } from '../controllers/webhookController.js';
import { getAbandonedCheckouts, getStats } from '../controllers/dashboardController.js';

// Webhook route
router.post('/webhooks/shopify-checkout', handleCheckoutWebhook);

// Dashboard routes
router.get('/abandoned', getAbandonedCheckouts);
router.get('/stats', getStats);

export default router;
