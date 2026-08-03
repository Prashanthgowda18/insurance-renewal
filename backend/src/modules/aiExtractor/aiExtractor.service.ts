import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { uploadFile } from '../../services/storage.service';
import { validateExtraction } from './extract.validator';

interface ExtractionResult {
  requestId: string;
  data: Record<string, string>;
  verificationNeeded: boolean;
  message?: string;
  pdfUrl?: string;
}

export class AiExtractorService {
  private static readonly extractionPrompt = `You are an AI assistant that extracts insurance policy information from the provided PDF. Return ONLY a JSON object with the following fields (empty string if not present):
customerName, mobile, email, address, vehicleNumber, vehicleType, manufacturer, model, manufacturingYear, registrationDate, engineNumber, chassisNumber, insuranceCompany, policyNumber, policyType, policyStartDate, policyExpiryDate, premiumAmount, idv, ncb, fuelType, seatingCapacity, nominee`;

  static async processDocument(
    fileBuffer: Buffer,
    originalFilename: string,
    customPrompt?: string,
  ): Promise<ExtractionResult> {
    const requestId = uuidv4();

    // PDF Magic Header validation
    const pdfOffset = fileBuffer.indexOf('%PDF-');
    if (pdfOffset !== -1 && pdfOffset < 1024) {
      if (pdfOffset > 0) {
        fileBuffer = fileBuffer.subarray(pdfOffset);
      }
    } else {
      const isPng = fileBuffer.slice(0, 4).toString('hex') === '89504e47';
      const isJpeg = fileBuffer.slice(0, 2).toString('hex') === 'ffd8';
      if (!isPng && !isJpeg && originalFilename.toLowerCase().endsWith('.pdf')) {
        const preview = fileBuffer.slice(0, 10).toString('ascii').replace(/[^\x20-\x7E]/g, '.');
        throw new Error(`Unsupported PDF: Invalid file header ('${preview}'). File does not contain a valid PDF structure.`);
      }
    }

    // 1. Upload PDF to Supabase (permanent storage)
    const pdfUrl = await uploadFile(fileBuffer, originalFilename, 'application/pdf');

    // 2. Prepare Gemini Vision request
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_VISION_API_KEY || '';
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    const base64Data = fileBuffer.toString('base64');
    const prompt = customPrompt ?? this.extractionPrompt;

    let rawText = '';
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Data,
            },
          },
          { text: prompt },
        ]);
        rawText = result.response.text();
        lastError = null;
        break;
      } catch (err: any) {
        lastError = err;
        if (String(err.message).includes('429') || String(err.message).includes('Quota exceeded')) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (lastError || !rawText) {
      throw new Error(lastError?.message || 'Gemini API error');
    }

    // Save raw response
    try {
      const logsDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      fs.writeFileSync(path.join(logsDir, 'gemini-response.txt'), rawText, 'utf8');
    } catch {}

    // Extract JSON block from raw text (in case of stray markup)
    let extractedJson: Record<string, string> = {};
    try {
      const firstBrace = rawText.indexOf('{');
      const lastBrace = rawText.lastIndexOf('}');
      const jsonString = rawText.substring(firstBrace, lastBrace + 1);
      extractedJson = JSON.parse(jsonString);
    } catch (e) {
      // If parsing fails, return empty fields
      extractedJson = {};
    }

    // Ensure all expected fields exist (empty string if missing)
    const allFields = [
      'customerName',
      'mobile',
      'email',
      'address',
      'vehicleNumber',
      'vehicleType',
      'manufacturer',
      'model',
      'manufacturingYear',
      'registrationDate',
      'engineNumber',
      'chassisNumber',
      'insuranceCompany',
      'policyNumber',
      'policyType',
      'policyStartDate',
      'policyExpiryDate',
      'premiumAmount',
      'idv',
      'ncb',
      'fuelType',
      'seatingCapacity',
      'nominee',
    ];
    const normalized: Record<string, string> = {};
    for (const f of allFields) {
      normalized[f] = extractedJson[f] ?? '';
    }

    // 3. Validate fields
    const { isValid, errors, verificationNeeded } = await validateExtraction(normalized);

    // 4. Return result (no DB write here)
    return {
      requestId,
      data: normalized,
      verificationNeeded,
      message: verificationNeeded ? 'Please verify extracted information.' : undefined,
      pdfUrl,
    };
  }
}
