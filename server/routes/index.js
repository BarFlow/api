import express from 'express';
import auth from '../helpers/auth';
import authRoutes from './auth/auth';
import venueRoutes from './venue/venue';
import areaRoutes from './area/area';
import sectionRoutes from './section/section';

const router = express.Router();	// eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

router.use('/auth', authRoutes);

router.use('/venues', auth.authenticate, venueRoutes);

router.use('/areas', auth.authenticate, areaRoutes);

router.use('/sections', auth.authenticate, sectionRoutes);

export default router;
