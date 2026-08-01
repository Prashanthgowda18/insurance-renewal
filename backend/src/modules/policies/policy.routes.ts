import { Router } from 'express';
import { listPolicies, renewPolicy, triggerReminders, getNotificationHistories, sendTestNotification, extractPolicy, importExtractedPolicy } from './policy.controller';
import { authenticateJWT } from '../../middleware/auth.middleware';

const router = Router();

// Secure policy endpoints
router.get('/', authenticateJWT as any, listPolicies as any);
router.get('/notifications', authenticateJWT as any, getNotificationHistories as any);
router.post('/extract-policy', authenticateJWT as any, extractPolicy as any);
router.post('/import-extracted', authenticateJWT as any, importExtractedPolicy as any);
router.post('/send-test-notification', authenticateJWT as any, sendTestNotification as any);
router.post('/trigger-reminders', authenticateJWT as any, triggerReminders as any);
router.post('/:id/renew', authenticateJWT as any, renewPolicy as any);

export default router;
