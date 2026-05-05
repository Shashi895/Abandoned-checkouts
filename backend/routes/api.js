import express from 'express';
const router = express.Router();
import { getAbandonedCheckouts, getStats } from '../controllers/dashboardController.js';

// Dashboard routes
router.get('/abandoned', getAbandonedCheckouts);
router.get('/stats', getStats);

export default router;
