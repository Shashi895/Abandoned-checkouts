import express from 'express';
const router = express.Router();
import { getAbandonedCheckouts, getStats } from '../controllers/dashboardController.js';
import { createNewLead } from '../controllers/leadController.js';

// Dashboard routes
router.get('/abandoned', getAbandonedCheckouts);
router.get('/stats', getStats);

// Lead routes
router.post('/new-lead', createNewLead);

export default router;
