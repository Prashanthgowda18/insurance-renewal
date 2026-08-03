import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { errorLogger, systemLogger } from '../utils/logger';

/**
 * Simplified extraction result — 12 essential CRM fields.
 */
export interface ExtractedPolicyData {
  customerName: string;
  mobileNumber: string;
  email: string;
  address: string;
  vehicleNumber: string;
  vehicleType: string;
  insuranceCompany: string;
  policyNumber: string;
  policyType: string;
  policyStartDate: string;
  policyExpiryDate: string;
  premiumAmount: string;
}

const EXTRACTION_PROMPT = `You are a dedicated vehicle insurance policy document reader for Shield Insurance CRM.

Analyze the provided insurance policy PDF and extract ONLY the following 12 fields.

Return ONLY a valid JSON object with these exact keys:

{
  "customerName": "Not Found",
  "mobileNumber": "Not Found",
  "email": "Not Found",
  "address": "Not Found",
  "vehicleNumber": "Not Found",
  "vehicleType": "Not Found",
  "insuranceCompany": "Not Found",
  "policyNumber": "Not Found",
  "policyType": "Not Found",
  "policyStartDate": "Not Found",
  "policyExpiryDate": "Not Found",
  "premiumAmount": "Not Found"
}

RULES:
1. If a field cannot be found in the document, return "Not Found".
2. Never guess or fabricate values.
3. vehicleType must be one of: "Bike", "Car", "Commercial". If unsure or missing, return "Not Found".
4. policyType must be one of: "Comprehensive", "Third Party", "Own Damage", "Package". If unsure or missing, return "Not Found".
5. All dates must be in YYYY-MM-DD format. If not found, return "Not Found".
6. mobileNumber: Extract the mobile number as shown (10 digits if full, or partial/masked if printed with asterisks/X like 9901******). If not found, return "Not Found".
7. vehicleNumber: Extract Indian registration format (e.g., KA01AB1234). If not found, return "Not Found".
8. premiumAmount: Extract numeric total premium payable value without currency symbols or commas. If not found, return "Not Found".
9. insuranceCompany: Extract CURRENT issuing insurance company (e.g. Zuno General Insurance Limited, HDFC ERGO). If not found, return "Not Found".
10. policyNumber: Extract CURRENT active policy number. If not found, return "Not Found".
11. If the PDF contains multiple pages, ALWAYS extract details from the main CURRENT Policy Schedule.

DO NOT extract any other unnecessary information.

Do not return markdown formatting (no \`\`\`json). Do not explain. Do not add comments. Return ONLY the raw JSON object.`;

/**
 * Save raw AI response to logs/gemini-response.txt
 */
function saveRawResponseToLog(rawText: string) {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, 'gemini-response.txt');
    fs.writeFileSync(logFilePath, rawText, 'utf8');
    systemLogger.info(`[AI Response] Saved raw Gemini response to ${logFilePath}`);
  } catch (err: any) {
    errorLogger.error(`[AI Response] Failed to save raw response to log file: ${err.message}`);
  }
}

/**
 * Categorize raw errors into exact standardized user-facing error messages
 */
function categorizeError(err: any): Error {
  const msg = String(err?.message || err || '');
  
  if (msg.includes('429') || msg.includes('Quota exceeded') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('Too Many Requests')) {
    return new Error('AI Service Error: Gemini API quota or rate limit exceeded (429 Too Many Requests). Please wait a moment and try again.');
  }
  if (msg.includes('404') || msg.includes('is not found for API version')) {
    return new Error('AI Service Error: Selected Gemini API model version is not available for this API key.');
  }
  if (msg.includes('Password Protected') || msg.includes('/Encrypt') || msg.includes('password') || msg.includes('encrypted')) {
    return new Error('Password Protected PDF: The uploaded PDF file is password protected and cannot be read.');
  }
  if (msg.includes('Corrupted') || msg.includes('invalid file header') || msg.includes('empty or missing')) {
    return new Error('Corrupted PDF: The uploaded document file is damaged or corrupted.');
  }
  if (msg.includes('Unsupported PDF') || msg.includes('Invalid PDF') || msg.includes('signature')) {
    return new Error(`Invalid PDF: ${msg}`);
  }
  if (msg.includes('JSON Parse Error')) {
    return new Error(msg);
  }
  if (msg.includes('ENOTFOUND') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed') || msg.includes('NetworkError')) {
    return new Error('Network Error: Unable to connect to AI extraction services. Please check network connection.');
  }

  return new Error(`AI Service Error: ${msg || 'The uploaded PDF was not successfully sent to the AI extraction service.'}`);
}

/**
 * Stateless AI Document Extraction Service.
 *
 * Every call creates a brand-new request to Gemini.
 * No caching. No reuse. No chat history.
 * Only the currently uploaded PDF is sent.
 */
export async function parsePolicyDocument(
  fileBuffer: Buffer,
  mimeType: string,
  filename: string,
): Promise<ExtractedPolicyData> {
  const uploadTime = new Date().toISOString();

  // STEP 1: PDF Validation & Integrity Checks
  if (!fileBuffer || fileBuffer.length === 0) {
    throw categorizeError(new Error('Corrupted PDF: Uploaded file buffer is empty or missing.'));
  }

  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (fileBuffer.length > maxSizeBytes) {
    throw categorizeError(new Error(`Invalid PDF: File size (${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB) exceeds 10 MB limit.`));
  }

  let resolvedMime = mimeType || 'application/pdf';
  const isPdf = resolvedMime === 'application/pdf' || filename.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    // Check for Password Protected PDF (/Encrypt dictionary in header)
    if (fileBuffer.includes('/Encrypt')) {
      throw categorizeError(new Error('Password Protected PDF: Document requires a password to open.'));
    }

    // Magic header validation: PDF files contain %PDF- within initial 1024 bytes
    const pdfOffset = fileBuffer.indexOf('%PDF-');
    if (pdfOffset !== -1 && pdfOffset < 1024) {
      if (pdfOffset > 0) {
        fileBuffer = fileBuffer.subarray(pdfOffset);
      }
    } else {
      const isPng = fileBuffer.slice(0, 4).toString('hex') === '89504e47';
      const isJpeg = fileBuffer.slice(0, 2).toString('hex') === 'ffd8';
      
      if (isPng) {
        resolvedMime = 'image/png';
      } else if (isJpeg) {
        resolvedMime = 'image/jpeg';
      } else {
        const preview = fileBuffer.slice(0, 10).toString('ascii').replace(/[^\x20-\x7E]/g, '.');
        throw categorizeError(new Error(`Corrupted PDF: Invalid file header ('${preview}'). Document does not contain valid PDF structure.`));
      }
    }
  }

  // STEP 2: Upload Logging - [PDF RECEIVED]
  systemLogger.info(`[PDF RECEIVED] File: '${filename}', Size: ${(fileBuffer.length / 1024).toFixed(2)} KB, Mime: ${resolvedMime}, Buffer: ${fileBuffer.length} bytes`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    errorLogger.error('GEMINI_API_KEY is not set in environment variables');
    throw categorizeError(new Error('AI Service Error: GEMINI_API_KEY is not configured on the backend server.'));
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const candidateModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const base64Data = fileBuffer.toString('base64');

  // STEP 3: Verify document readability with Gemini Vision
  systemLogger.info(`[PDF SENT TO GEMINI] Verifying PDF document readability...`);
  let verificationSummary = '';
  let activeModel = '';
  let lastError: any = null;
  let quotaError: any = null;

  for (const modelName of candidateModels) {
    if (verificationSummary) break;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        systemLogger.info(`[PDF SENT TO GEMINI] Model '${modelName}' verification (Attempt ${attempt}/2)...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const verifyRes = await model.generateContent([
          {
            inlineData: {
              mimeType: resolvedMime,
              data: base64Data,
            },
          },
          { text: 'Read this insurance policy PDF and summarize what document it is.' },
        ]);
        verificationSummary = verifyRes.response.text();
        activeModel = modelName;
        systemLogger.info(`[GEMINI RESPONSE] Document Verification Summary using ${modelName}: ${verificationSummary.substring(0, 150)}...`);
        lastError = null;
        quotaError = null;
        break;
      } catch (err: any) {
        lastError = err;
        const errMsg = String(err.message || '');
        systemLogger.warn(`[AI Read Verification Failed] Model ${modelName} attempt ${attempt}: ${err.message}`);
        
        if (errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          quotaError = err;
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 2000));
          }
        } else if (errMsg.includes('404') || errMsg.includes('not found')) {
          break;
        }
      }
    }
  }

  if (!verificationSummary) {
    if (quotaError) {
      systemLogger.warn(`[Quota Exceeded Fallback] Gemini API rate limit reached. Activating local PDF text fallback extraction...`);
      const fallbackData = extractFieldsFromBuffer(fileBuffer);
      const hasAnyMatch = fallbackData.vehicleNumber !== 'Not Found' || fallbackData.policyNumber !== 'Not Found' || fallbackData.mobileNumber !== 'Not Found';
      if (hasAnyMatch) {
        systemLogger.info(`[Fallback Success] Local PDF scanner extracted fields:\n${JSON.stringify(fallbackData, null, 2)}`);
        return fallbackData;
      }
    }
    const errorToReport = quotaError || lastError || new Error('The uploaded PDF was not successfully sent to the AI extraction service.');
    throw categorizeError(errorToReport);
  }

  // STEP 4: Perform Structured Field Extraction
  systemLogger.info(`[PDF SENT TO GEMINI] Sending PDF inlineData to ${activeModel} for structured field extraction...`);
  let rawText = '';
  try {
    const model = genAI.getGenerativeModel({ model: activeModel || 'gemini-2.5-flash' });
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: resolvedMime,
          data: base64Data,
        },
      },
      { text: EXTRACTION_PROMPT },
    ]);
    rawText = result.response.text();
    systemLogger.info(`[GEMINI RESPONSE] Raw AI output received (${rawText.length} chars):\n${rawText}`);
  } catch (err: any) {
    if (String(err.message).includes('429') || String(err.message).includes('Quota exceeded')) {
      systemLogger.warn(`[Quota Exceeded Fallback] Gemini API rate limit reached during extraction stage. Activating local PDF text fallback...`);
      const fallbackData = extractFieldsFromBuffer(fileBuffer);
      if (fallbackData.vehicleNumber !== 'Not Found' || fallbackData.policyNumber !== 'Not Found' || fallbackData.mobileNumber !== 'Not Found') {
        return fallbackData;
      }
    }
    throw categorizeError(new Error(`AI Service Error: Failed during field extraction stage (${err.message}).`));
  }

  saveRawResponseToLog(rawText);

  // STEP 5: JSON Parsing & Cleanup
  systemLogger.info(`[JSON Parsing] Cleaning and parsing raw AI response...`);
  let parsed: any;
  try {
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
    }
    
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }
    
    parsed = JSON.parse(cleanJson);
  } catch (parseErr: any) {
    errorLogger.error(`[JSON Parse Error] Failed to parse JSON from AI response: ${parseErr.message}`);
    throw categorizeError(new Error(`JSON Parse Error: AI output was not valid JSON. Raw output:\n${rawText}`));
  }

  if (parsed.error) {
    throw categorizeError(new Error(parsed.error));
  }

  // Helper to ensure empty or invalid strings return "Not Found"
  const sanitize = (val: any): string => {
    if (val === null || val === undefined) return 'Not Found';
    const str = String(val).trim();
    if (!str || str === '""' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null' || str.toLowerCase() === 'not found' || str.toLowerCase() === 'undefined') {
      return 'Not Found';
    }
    return str;
  };

  const rawMob = sanitize(parsed.mobileNumber || parsed.mobile || parsed.phone || parsed.mobile_number || parsed.contactNumber);
  const rawVType = sanitize(parsed.vehicleType || parsed.vehicle_type || parsed.type);
  let normalizedVType = rawVType;
  if (/bike|two|2|scooter|motorcycle/i.test(rawVType)) normalizedVType = 'Bike';
  else if (/car|four|4|private/i.test(rawVType)) normalizedVType = 'Car';
  else if (/commercial|goods|passenger/i.test(rawVType)) normalizedVType = 'Commercial';
  else if (normalizedVType !== 'Not Found') normalizedVType = rawVType;

  const rawPType = sanitize(parsed.policyType || parsed.policy_type || parsed.planType);
  let normalizedPType = rawPType;
  if (/package|comprehensive|bundled/i.test(rawPType)) normalizedPType = 'Package';
  else if (/own damage|standalone|sood/i.test(rawPType)) normalizedPType = 'Own Damage';
  else if (/third party|tp|act/i.test(rawPType)) normalizedPType = 'Third Party';
  else if (normalizedPType !== 'Not Found') normalizedPType = rawPType;

  const rawPremium = sanitize(parsed.premiumAmount || parsed.premium || parsed.renewalAmount || parsed.totalPremium);
  const cleanPremium = rawPremium !== 'Not Found' ? rawPremium.replace(/[^0-9.]/g, '').trim() : 'Not Found';

  const extracted: ExtractedPolicyData = {
    customerName: sanitize(parsed.customerName || parsed.name || parsed.customer_name || parsed.proposerName),
    mobileNumber: rawMob,
    email: sanitize(parsed.email || parsed.emailAddress || parsed.email_id),
    address: sanitize(parsed.address || parsed.communicationAddress || parsed.custAddress),
    vehicleNumber: sanitize(parsed.vehicleNumber || parsed.registrationNumber || parsed.regNo || parsed.vehicle_number).toUpperCase(),
    vehicleType: normalizedVType,
    insuranceCompany: sanitize(parsed.insuranceCompany || parsed.companyName || parsed.insurer || parsed.insurance_company),
    policyNumber: sanitize(parsed.policyNumber || parsed.policyNo || parsed.policy_number).toUpperCase(),
    policyType: normalizedPType,
    policyStartDate: sanitize(parsed.policyStartDate || parsed.startDate || parsed.start_date || parsed.fromDate),
    policyExpiryDate: sanitize(parsed.policyExpiryDate || parsed.expiryDate || parsed.expiry_date || parsed.toDate),
    premiumAmount: cleanPremium || 'Not Found',
  };

  systemLogger.info(`[JSON CREATED] Extracted JSON data:\n${JSON.stringify(extracted, null, 2)}`);

  // Check if ALL fields returned "Not Found"
  const allNotFound = Object.values(extracted).every((v) => v === 'Not Found');
  if (allNotFound) {
    throw new Error(`AI Extraction Incomplete: Gemini received the PDF document but could not locate valid fields.\n\n[RAW GEMINI RESPONSE]\n${rawText}`);
  }

  return extracted;
}

/**
 * Local regex scanner fallback when Gemini API daily quota limit (429) is reached
 */
function extractFieldsFromBuffer(buffer: Buffer): ExtractedPolicyData {
  const rawContent = buffer.toString('utf-8').replace(/[^\x20-\x7E\n]/g, ' ');

  // 1. Vehicle Number: KA01AB1234, MH02CD5678, DL10C9999, etc.
  const vehMatch = rawContent.match(/\b([A-Z]{2}\s*\d{1,2}\s*[A-Z]{1,3}\s*\d{4})\b/i);
  const vehicleNumber = vehMatch ? vehMatch[1].replace(/\s+/g, '').toUpperCase() : 'Not Found';

  // 2. Mobile Number: 10-digit number starting with 6, 7, 8, 9
  const mobMatch = rawContent.match(/\b([6-9]\d{9})\b/);
  const mobileNumber = mobMatch ? mobMatch[1] : 'Not Found';

  // 3. Policy Number: 10-22 digits/alphanumeric
  const polMatch = rawContent.match(/\b([0-9]{12,22})\b/) || rawContent.match(/\b([A-Z0-9]{10,22})\b/);
  const policyNumber = polMatch ? polMatch[1].toUpperCase() : 'Not Found';

  // 4. Insurance Company match
  const companies = [
    'HDFC ERGO', 'ICICI Lombard', 'Bajaj Allianz', 'Tata AIG', 'Reliance General',
    'SBI General', 'Cholamandalam MS', 'Go Digit', 'ACKO General', 'Star Health',
    'National Insurance', 'New India Assurance', 'Oriental Insurance', 'United India'
  ];
  let insuranceCompany = 'Not Found';
  for (const c of companies) {
    if (new RegExp(c, 'i').test(rawContent)) {
      insuranceCompany = c;
      break;
    }
  }

  // 5. Dates: dd/mm/yyyy or yyyy-mm-dd
  const dateMatches = rawContent.match(/\b(\d{2}[\/\.-]\d{2}[\/\.-]\d{4})\b/g) || [];
  const policyStartDate: string = dateMatches[0] ? dateMatches[0] : 'Not Found';
  const policyExpiryDate: string = dateMatches[1] ? dateMatches[1] : (dateMatches[0] ? dateMatches[0] : 'Not Found');

  // 6. Premium Amount
  const premMatch = rawContent.match(/(?:Premium|Total Amount|Net Premium)[^\d]*([\d,]+(?:\.\d{2})?)/i);
  const premiumAmount: string = (premMatch && premMatch[1]) ? premMatch[1].replace(/,/g, '') : 'Not Found';

  return {
    customerName: 'Not Found',
    mobileNumber,
    email: 'Not Found',
    address: 'Not Found',
    vehicleNumber,
    vehicleType: 'Car',
    insuranceCompany,
    policyNumber,
    policyType: 'Package',
    policyStartDate,
    policyExpiryDate,
    premiumAmount,
  };
}
