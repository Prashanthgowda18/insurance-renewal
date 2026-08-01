import { Router } from 'express';
import { login, register, forgotPassword, changePassword } from './auth.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// Public auth endpoints
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);

// Secured auth endpoints (requires valid JWT authorization headers)
router.post('/change-password', authenticateJWT as any, changePassword as any);

export default router;
