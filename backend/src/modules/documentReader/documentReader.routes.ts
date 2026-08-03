import { Router } from 'express';
import { extractDocument } from './documentReader.controller';

const router = Router();

// POST /api/document-reader/extract
router.post('/extract', extractDocument);

export default router;
