import { Router } from 'express';
import { createStockEntry } from '../controllers/stockEntryController';

const router = Router();

router.post('/stock-entries', createStockEntry);

export default router;
