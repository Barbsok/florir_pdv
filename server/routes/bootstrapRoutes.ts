import { Router } from 'express';
import { bootstrap, getLowStockProducts } from '../controllers/bootstrapController';

const router = Router();

router.get('/bootstrap', bootstrap);
router.get('/products/low-stock', getLowStockProducts);

export default router;
