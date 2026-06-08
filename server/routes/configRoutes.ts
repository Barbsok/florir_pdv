import { Router } from 'express';
import { getUsers, createUser, toggleActive as toggleUserActive } from '../controllers/userController';
import { getCustomers, createCustomer, toggleActive as toggleCustomerActive } from '../controllers/customerController';

const router = Router();

router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/toggle-active', toggleUserActive);

router.get('/customers', getCustomers);
router.post('/customers', createCustomer);
router.put('/customers/:id/toggle-active', toggleCustomerActive);

export default router;
