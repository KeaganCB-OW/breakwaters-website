import path from 'path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { pool } from '../config/db.js';
import { s3Bucket, s3Client, s3PublicBaseUrl } from '../config/s3Client.js';

const buildSafeName = (filename) => {
  const parsed = path.parse(filename || 'cv.pdf');
  const base = parsed.name || 'cv';

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'cv';
};

const isRecruitmentOfficer = (user) =>
  Boolean(user?.role && user.role === 'recruitment_officer');

const keyLooksLikeUrl = (key) => /^https?:\/\//i.test(key || '');

const encodeObjectKey = (key) =>
  key
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

export const uploadClientCv = async (req, res) => {
  if (!s3Bucket) {
    return res
      .status(500)
      .json({ message: 'S3 bucket is not configured for CV uploads.' });
  }

  const userId = req.user?.id;
  const rawClientId = req.body?.client_id ?? req.body?.clientId;
  const clientId = Number(rawClientId);

  if (!Number.isFinite(clientId) || clientId <= 0) {
    return res.status(400).json({ message: 'A valid client identifier is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Attach a PDF file before submitting.' });
  }

  try {
    const [[client]] = await pool.query(
      'SELECT id, user_id AS userId FROM clients WHERE id = ? LIMIT 1',
      [clientId]
    );

    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    const isOwner = client.userId != null && Number(client.userId) === Number(userId);

    if (!isOwner && !isRecruitmentOfficer(req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to upload a CV for this client.',
      });
    }

    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const safeName = buildSafeName(req.file.originalname);
    const objectKey = `cvs/client_${client.id}_${timestamp}_${safeName}.pdf`;

    const putCommand = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: objectKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype || 'application/pdf',
    });

    await s3Client.send(putCommand);

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      await connection.query(
        `
          INSERT INTO cvs (client_id, file_path, uploaded_at, file_type, file_size)
          VALUES (?, ?, NOW(), ?, ?)
        `,
        [client.id, objectKey, req.file.mimetype || 'application/pdf', req.file.size]
      );

      await connection.query('UPDATE clients SET cv_file_path = ? WHERE id = ?', [
        objectKey,
        client.id,
      ]);

      await connection.commit();
    } catch (dbError) {
      if (connection) {
        try {
          await connection.rollback();
        } catch (rollbackError) {
          console.error('Failed to rollback CV upload transaction', rollbackError);
        }
      }

      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: s3Bucket,
            Key: objectKey,
          })
        );
      } catch (cleanupError) {
        console.error('Failed to remove orphaned CV object after DB error', cleanupError);
      }

      console.error('Failed to persist CV metadata', dbError);
      return res.status(500).json({ message: 'Failed to save CV details.' });
    } finally {
      if (connection) {
        connection.release();
      }
    }

    return res.json({ success: true, key: objectKey });
  } catch (error) {
    console.error('Failed to upload client CV', error);
    return res.status(500).json({ message: 'Failed to upload CV.' });
  }
};

export const getLatestClientCv = async (req, res) => {
  const rawClientId = req.params?.clientId;
  const clientId = Number(rawClientId);

  if (!Number.isFinite(clientId) || clientId <= 0) {
    return res.status(400).json({ message: 'A valid client identifier is required.' });
  }

  try {
    const [[client]] = await pool.query(
      'SELECT id, user_id AS userId, cv_file_path AS cvFilePath FROM clients WHERE id = ? LIMIT 1',
      [clientId]
    );

    if (!client) {
      return res.json({ exists: false });
    }

    const isOwner = client.userId != null && Number(client.userId) === Number(req.user?.id);

    if (!isOwner && !isRecruitmentOfficer(req.user)) {
      return res.status(403).json({
        message: 'You do not have permission to view this CV.',
      });
    }

    const [rows] = await pool.query(
      `
        SELECT
          id,
          file_path AS filePath,
          uploaded_at AS uploadedAt,
          file_type AS fileType,
          file_size AS fileSize
        FROM cvs
        WHERE client_id = ?
        ORDER BY uploaded_at DESC
        LIMIT 1
      `,
      [clientId]
    );

    const latest = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

    if (!latest || !latest.filePath) {
      return res.json({ exists: false });
    }

    const key = latest.filePath;

    if (keyLooksLikeUrl(key)) {
      return res.json({
        exists: true,
        key,
        viewUrl: key,
        uploadedAt: latest.uploadedAt instanceof Date ? latest.uploadedAt.toISOString() : latest.uploadedAt,
        fileType: latest.fileType,
        fileSize: latest.fileSize,
        isSigned: false,
      });
    }

    if (!s3Bucket) {
      return res.json({ exists: false });
    }

    const trimmedBase = s3PublicBaseUrl?.trim();
    let viewUrl = null;
    let isSigned = false;

    if (trimmedBase) {
      const strippedBase = trimmedBase.endsWith('/')
        ? trimmedBase.slice(0, -1)
        : trimmedBase;
      viewUrl = `${strippedBase}/${encodeObjectKey(key)}`;
    } else {
      const command = new GetObjectCommand({
        Bucket: s3Bucket,
        Key: key,
      });

      viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
      isSigned = true;
    }

    return res.json({
      exists: true,
      key,
      viewUrl,
      uploadedAt: latest.uploadedAt instanceof Date ? latest.uploadedAt.toISOString() : latest.uploadedAt,
      fileType: latest.fileType,
      fileSize: latest.fileSize,
      isSigned,
    });
  } catch (error) {
    console.error('Failed to resolve client CV', error);
    return res.status(500).json({ message: 'Failed to load CV.' });
  }
};
