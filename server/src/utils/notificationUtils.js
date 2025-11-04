import { pool } from '../config/db.js';
import { resolveCvViewUrl } from './cvUrls.js';

export const normaliseEmail = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed || !trimmed.includes('@')) {
    return '';
  }
  return trimmed;
};

export const normaliseStatusValue = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim();

export const fetchLatestCvUrl = async (clientId, existingKey) => {
  let key = existingKey;

  if (!key) {
    const [rows] = await pool.query(
      `SELECT file_path AS filePath
       FROM cvs
       WHERE client_id = ?
       ORDER BY uploaded_at DESC
       LIMIT 1`,
      [clientId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      key = rows[0].filePath;
    }
  }

  if (!key) {
    return null;
  }

  try {
    const { exists, url } = await resolveCvViewUrl(key);
    if (exists && url) {
      return url;
    }
  } catch (error) {
    console.error('Failed to resolve CV view URL', { clientId, error });
  }

  return null;
};

