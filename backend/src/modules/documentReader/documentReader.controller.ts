import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { parsePolicyDocument } from '../../services/policyExtractor.service';
import { errorLogger } from '../../utils/logger';
import { saveBase64File } from '../../utils/upload';

/**
 * Stateless AI Document Reader endpoint
 * Accepts base64 PDF and returns ONLY the extracted JSON.
 */
export const extractDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { fileBase64, filename } = req.body as { fileBase64: string; filename?: string };
    if (!fileBase64) {
      res.status(400).json({ error: { message: 'Document file (fileBase64) is required.' } });
      return;
    }

    // Parse the document – the service is completely stateless.
    const savedFile = await saveBase64File(fileBase64, 'policies', []); // No mime validation needed here

    const base64Data = fileBase64.replace(/^data:[a-zA-Z0-9-+\/]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const mimeType = fileBase64.match(/^data:([a-zA-Z0-9-+\/]+);base64,/)?.[1] || 'application/pdf';

    const extractedData = await parsePolicyDocument(buffer, mimeType, filename || savedFile.filename);

    // Return ONLY the JSON payload in the exact shape requested.
    const jsonResponse = {
      customerName: extractedData.customerName || '',
      mobile: extractedData.mobileNumber || '',
      email: extractedData.email || '',
      address: extractedData.address || '',
      vehicleNumber: extractedData.vehicleNumber || '',
      vehicleType: extractedData.vehicleType || '',
      manufacturer: '',
      model: '',
      manufacturingYear: '',
      engineNumber: '',
      chassisNumber: '',
      insuranceCompany: extractedData.insuranceCompany || '',
      policyNumber: extractedData.policyNumber || '',
      policyType: extractedData.policyType || '',
      startDate: extractedData.policyStartDate || '',
      expiryDate: extractedData.policyExpiryDate || '',
      premiumAmount: extractedData.premiumAmount || '',
      idv: '',
      ncb: '',
    };

    res.status(200).json(jsonResponse);
  } catch (error: any) {
    errorLogger.error('Document extraction controller failed', error);
    res.status(500).json({ error: { message: error.message || 'Internal server error' } });
  }
};
