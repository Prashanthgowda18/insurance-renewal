import { Router } from 'express';
import aiExtractorController from './aiExtractor.controller';

const router = Router();

// POST /api/ai-extractor (handled in controller)
router.post('/', aiExtractorController);

export default router;
