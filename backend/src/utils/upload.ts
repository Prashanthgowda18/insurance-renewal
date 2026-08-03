import * as fs from 'fs';
import * as path from 'path';


interface SavedFile {
  url: string;
  filename: string;
}

// Maximum upload file size configuration: 10MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const saveBase64File = async (
  base64String: string,
  subfolder: string,
  allowedMimeTypes: string[]
): Promise<SavedFile> => {
  if (!base64String || typeof base64String !== 'string') {
    throw new Error('Invalid file payload.');
  }

  const cleanBase64 = base64String.trim();
  let mimeType = 'application/pdf';
  let rawBase64 = cleanBase64;

  if (cleanBase64.startsWith('data:')) {
    const commaIdx = cleanBase64.indexOf(',');
    if (commaIdx !== -1) {
      const header = cleanBase64.substring(0, commaIdx);
      const mimeMatch = header.match(/^data:([a-zA-Z0-9-+\/.]+);/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      rawBase64 = cleanBase64.substring(commaIdx + 1);
    }
  }

  // Remove white spaces / newlines from base64 string
  rawBase64 = rawBase64.replace(/\s+/g, '');

  if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
    if (mimeType === 'application/octet-stream' || mimeType.includes('pdf')) {
      mimeType = 'application/pdf';
    } else {
      throw new Error(`Invalid file type (${mimeType}). Allowed formats: ${allowedMimeTypes.join(', ')}`);
    }
  }

  const buffer = Buffer.from(rawBase64, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the maximum size limit of 10MB.');
  }

  let extension = '.pdf';
  if (mimeType === 'image/png') {
    extension = '.png';
  } else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) {
    extension = '.jpg';
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;

  try {
    const targetDir = path.join(process.cwd(), 'uploads', subfolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, buffer);

    return {
      url: `/uploads/${subfolder}/${filename}`,
      filename,
    };
  } catch (fsErr) {
    // Serverless cloud fallback (Vercel read-only filesystem)
    const dataUrl = `data:${mimeType};base64,${rawBase64}`;
    return {
      url: dataUrl,
      filename,
    };
  }
};
