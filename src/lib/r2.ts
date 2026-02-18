
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  console.warn('R2 credentials are not fully configured in .env');
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export async function listFilesFromR2(prefix?: string): Promise<{ key: string, url: string, size: number, lastModified: Date }[]> {
    if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME not configured');

    const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix
    });

    try {
        const response = await r2.send(command);
        if (!response.Contents) return [];

        return response.Contents.map(item => {
            const fileName = item.Key || '';
            const publicUrl = R2_PUBLIC_URL 
                ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`
                : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileName}`;
            
            return {
                key: fileName,
                url: publicUrl,
                size: item.Size || 0,
                lastModified: item.LastModified || new Date()
            };
        });
    } catch (error) {
        console.error('Error listing files from R2:', error);
        return [];
    }
}

export async function getFileFromR2(urlOrKey: string): Promise<string> {
  if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME not configured');

  // Extract key from URL if needed
  let key = urlOrKey;
  if (urlOrKey.startsWith('http')) {
      const parts = urlOrKey.split('/');
      key = parts[parts.length - 1];
  }

  const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
  });

  try {
      const response = await r2.send(command);
      if (!response.Body) throw new Error('Empty body');
      return await response.Body.transformToString();
  } catch (error) {
      console.error('Error reading from R2:', error);
      throw error;
  }
}

export async function deleteFileFromR2(urlOrKey: string): Promise<void> {
  if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME not configured');

  let key = urlOrKey;
  if (urlOrKey.startsWith('http')) {
      const parts = urlOrKey.split('/');
      key = parts[parts.length - 1];
  }
  // Also handle encoded URLs (spaces as %20)
  key = decodeURIComponent(key);

  const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
  });

  try {
      await r2.send(command);
      console.log(`Deleted file from R2: ${key}`);
  } catch (error) {
      console.error('Error deleting from R2:', error);
      // We don't throw here to avoid blocking the main flow if deletion fails (e.g. file not found)
  }
}

export async function uploadFileToR2(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string
): Promise<string> {
  if (!R2_BUCKET_NAME) throw new Error('R2_BUCKET_NAME not configured');

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  });

  try {
    await r2.send(command);
    // Construct public URL
    // If R2_PUBLIC_URL is set, use it. Otherwise, we might need a custom domain or the r2.dev domain if enabled.
    // The user provided credentials implied usage of a public R2 dev URL in the previous code.
    const publicUrl = R2_PUBLIC_URL 
        ? `${R2_PUBLIC_URL.replace(/\/$/, '')}/${fileName}`
        : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${fileName}`; // Fallback (usually private)
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw error;
  }
}
