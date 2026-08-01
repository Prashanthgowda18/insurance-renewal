import { Router } from 'express';
import { 
  createCustomer, 
  listCustomers, 
  getCustomerDetail, 
  updateCustomer, 
  deleteCustomer,
  getCustomerTimeline
} from './customer.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// Secure customer endpoints
router.post('/', authenticateJWT as any, createCustomer as any);
router.get('/', authenticateJWT as any, listCustomers as any);
router.get('/:id', authenticateJWT as any, getCustomerDetail as any);
router.put('/:id', authenticateJWT as any, updateCustomer as any);
router.delete('/:id', authenticateJWT as any, deleteCustomer as any);
router.get('/:id/timeline', authenticateJWT as any, getCustomerTimeline as any);

export default router;
