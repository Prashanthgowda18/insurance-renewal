import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AiExtractorService } from './aiExtractor.service';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// POST /api/ai-extractor
router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'PDF file is required' });
      return;
    }
    const prompt = (req.body.prompt as string) || undefined;
    const result = await AiExtractorService.processDocument(req.file.buffer, req.file.originalname, prompt);
    res.json(result);
  } catch (err: any) {
    console.error('AI Extractor error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

export default router;
