import express from 'express';
import auth from '../helpers/auth';
import authRoutes from './auth/auth';
import venueRoutes from './venue/venue';

const router = express.Router();	// eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount auth routes at /auth
router.use('/auth', authRoutes);

// mount auth routes at /auth
router.use('/venues', auth.authenticate, venueRoutes);

export default router;
