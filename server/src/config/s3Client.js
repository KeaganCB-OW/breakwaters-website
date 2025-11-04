import dotenv from 'dotenv';
import { S3Client } from '@aws-sdk/client-s3';

dotenv.config();

const {
  S3_ACCOUNT_ID: accountId,
  S3_ACCESS_KEY_ID: accessKeyId,
  S3_SECRET_ACCESS_KEY: secretAccessKey,
  S3_REGION: region = 'auto',
} = process.env;

const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined;

export const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: false,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
});

export const s3Bucket = process.env.S3_BUCKET;
export const s3PublicBaseUrl = process.env.S3_PUBLIC_BASE_URL || '';
