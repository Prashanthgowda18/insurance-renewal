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
  // 1. Validate base64 structure
  const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid file format. Must be a valid base64 data URL.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  // 2. Validate MIME Type
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Invalid file type. Allowed formats: ${allowedMimeTypes.join(', ')}`);
  }

  // 3. Validate size
  const buffer = Buffer.from(base64Data, 'base64');
  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the maximum size limit of 10MB.');
  }

  // 4. Resolve file extension
  let extension = '';
  if (mimeType === 'application/pdf') {
    extension = '.pdf';
  } else if (mimeType === 'image/png') {
    extension = '.png';
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    extension = '.jpg';
  } else {
    throw new Error('Unsupported file extension.');
  }

  // 5. Establish uploads directories
  const targetDir = path.join(process.cwd(), 'uploads', subfolder);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 6. Generate path and write to disk
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
  const filePath = path.join(targetDir, filename);
  fs.writeFileSync(filePath, buffer);

  // Return the web-accessible url path
  return {
    url: `/uploads/${subfolder}/${filename}`,
    filename,
  };
};
