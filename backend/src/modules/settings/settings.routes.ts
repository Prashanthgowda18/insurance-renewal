import { Router } from 'express';
import { getSettings, updateSettings } from './settings.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// Secure configuration settings routes
router.get('/', authenticateJWT as any, getSettings as any);
router.put('/', authenticateJWT as any, updateSettings as any);

export default router;
