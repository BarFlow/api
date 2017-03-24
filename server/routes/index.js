import express from 'express';
import auth from '../helpers/auth';
import authRoutes from './auth/auth';
import typeRoutes from './type/type';
import supplierRoutes from './supplier/supplier';
import productRoutes from './product/product';
import inventoryRoutes from './inventory/inventory';
import venueRoutes from './venue/venue';
import areaRoutes from './area/area';
import sectionRoutes from './section/section';
import placementRoutes from './placement/placement';
import reportRoutes from './report/report';
import orderRoutes from './order/order';
import leadRoutes from './lead/lead';
import { upload, s3upload } from '../controllers/imageUpload';

const router = express.Router();  // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send(`OK - ${process.env.HOSTNAME || 'development'}`)
);

router.use('/auth', authRoutes);

router.use('/types', auth.authenticate, typeRoutes);

router.use('/suppliers', auth.authenticate, supplierRoutes);

router.use('/products', auth.authenticate, productRoutes);

router.use('/venues', auth.authenticate, venueRoutes);

router.use('/inventory', auth.authenticate, inventoryRoutes);

router.use('/areas', auth.authenticate, areaRoutes);

router.use('/sections', auth.authenticate, sectionRoutes);

router.use('/placements', auth.authenticate, placementRoutes);

router.use('/reports', auth.authenticate, reportRoutes);

router.use('/orders', auth.authenticate, orderRoutes);

router.use('/leads', leadRoutes);

router.post('/uploads', auth.authenticate, upload, s3upload);


export default router;
