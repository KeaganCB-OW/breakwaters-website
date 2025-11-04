import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Bucket, s3Client, s3PublicBaseUrl } from '../config/s3Client.js';

export const keyLooksLikeUrl = (key) => /^https?:\/\//i.test(key || '');

const encodeObjectKey = (key) =>
  key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const resolveCvViewUrl = async (key) => {
  if (!key) {
    return { exists: false, url: null, isSigned: false };
  }

  if (keyLooksLikeUrl(key)) {
    return { exists: true, url: key, isSigned: false };
  }

  if (!s3Bucket) {
    return { exists: false, url: null, isSigned: false };
  }

  const trimmedBase = (s3PublicBaseUrl || '').trim();

  if (trimmedBase) {
    const base = trimmedBase.endsWith('/') ? trimmedBase.slice(0, -1) : trimmedBase;
    return {
      exists: true,
      url: `${base}/${encodeObjectKey(key)}`,
      isSigned: false,
    };
  }

  const command = new GetObjectCommand({
    Bucket: s3Bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, {
    expiresIn: Number(process.env.CV_SIGNED_URL_TTL || 900),
  });

  return { exists: true, url, isSigned: true };
};

