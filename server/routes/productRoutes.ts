import { Router } from 'express';
import { createProduct, toggleActive } from '../controllers/productController';

const router = Router();

router.post('/products', createProduct);
router.put('/products/:id/toggle-active', toggleActive);

export default router;
