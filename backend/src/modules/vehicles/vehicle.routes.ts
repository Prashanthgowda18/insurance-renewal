import { Router } from 'express';
import { listVehicles, getVehicleDetail } from './vehicle.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// Secure vehicle endpoints
router.get('/', authenticateJWT as any, listVehicles as any);
router.get('/:id', authenticateJWT as any, getVehicleDetail as any);

export default router;
