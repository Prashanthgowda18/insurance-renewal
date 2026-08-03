import api from './api';

/**
 * Calls the new backend AI Document Reader endpoint.
 * Returns the extracted JSON payload (no extra metadata).
 */
export const extractDocument = async (fileBase64: string, filename: string) => {
  const response = await api.post('/document-reader/extract', {
    fileBase64,
    filename,
  });
  return response.data; // Expected shape as per specification
};
