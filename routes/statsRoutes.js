// routes/statsRoutes.js
import express from 'express';
import { getDashboardStats } from '../controllers/statsController.js';

const router = express.Router();

router.get('/dashboard-stats', getDashboardStats);

export default router;