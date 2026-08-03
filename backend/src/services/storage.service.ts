import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { errorLogger } from '../utils/logger';

// Supabase configuration – read from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  errorLogger.error('Supabase configuration missing.');
  throw new Error('Supabase environment variables are not set');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Uploads a file buffer to Supabase storage and returns the public URL.
 * The bucket name is taken from env SUPABASE_BUCKET (default: "insurance-docs").
 * Generates a unique filename using timestamp and UUID to avoid collisions.
 */
export async function uploadFile(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
): Promise<string> {
  const bucket = process.env.SUPABASE_BUCKET || 'insurance-docs';
  const uuid = crypto.randomUUID();
  const timestamp = Date.now();
  const extension = originalFilename.split('.').pop() || 'pdf';
  const path = `${timestamp}-${uuid}.${extension}`;

  const { data, error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
    contentType: mimeType,
    upsert: false,
  });

  if (error) {
    errorLogger.error('Supabase upload failed', error);
    throw error;
  }

  // Generate a public URL
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}
