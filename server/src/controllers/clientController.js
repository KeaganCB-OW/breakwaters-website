import { pool } from '../config/db.js';
import { sendMail } from '../utils/email.js';
import { buildClientStatusChangedEmail } from '../utils/emailTemplates.js';
import { normaliseEmail, normaliseStatusValue } from '../utils/notificationUtils.js';

const VALID_CLIENT_STATUSES = new Set([
  'pending',
  'in progress',
  'suggested',
  'interview pending',
  'interviewed',
  'assigned',
  'rejected',
]);

export const listClients = async (req, res) => {
  try {
    const { search: rawSearch, status: rawStatus, page: rawPage, pageSize: rawPageSize, limit: rawLimit } =
      req.query ?? {};

    const filters = [];
    const values = [];

    if (typeof rawStatus === 'string' && rawStatus.trim()) {
      const normalisedStatus = normaliseStatusValue(rawStatus);

      if (!VALID_CLIENT_STATUSES.has(normalisedStatus)) {
        return res.status(400).json({ message: 'Invalid status filter provided.' });
      }

      filters.push('LOWER(status) = ?');
      values.push(normalisedStatus);
    }

    if (typeof rawSearch === 'string' && rawSearch.trim()) {
      const search = rawSearch.trim().toLowerCase();
      const likeTerm = `%${search}%`;
      filters.push(`(
        LOWER(full_name) LIKE ? OR
        LOWER(email) LIKE ? OR
        LOWER(COALESCE(skills, '')) LIKE ? OR
        LOWER(COALESCE(preferred_role, '')) LIKE ?
      )`);
      values.push(likeTerm, likeTerm, likeTerm, likeTerm);
    }

    let query = `
      SELECT
        id,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        location,
        skills,
        preferred_role AS preferredRole,
        education,
        linkedin_url AS linkedinUrl,
        experience,
        status,
        created_at AS createdAt
      FROM clients
    `;

    if (filters.length > 0) {
      query += ` WHERE ${filters.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    const page = Number.parseInt(rawPage, 10);
    const pageSize = Number.parseInt(rawPageSize, 10);
    const limit = Number.parseInt(rawLimit, 10);

    if (Number.isFinite(page) && page > 0 && Number.isFinite(pageSize) && pageSize > 0) {
      const offset = (page - 1) * pageSize;
      query += ' LIMIT ? OFFSET ?';
      values.push(pageSize, offset);
    } else if (Number.isFinite(limit) && limit > 0) {
      query += ' LIMIT ?';
      values.push(limit);
    }

    const [rows] = await pool.query(query, values);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch clients', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
};

export const createClient = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const payload = req.body ?? {};

  const getTrimmed = (key) =>
    typeof payload[key] === 'string' ? payload[key].trim() : '';

  const candidate = {
    fullName: getTrimmed('fullName'),
    email: getTrimmed('email'),
    phoneNumber: getTrimmed('phoneNumber'),
    location: getTrimmed('location'),
    skills: getTrimmed('skills'),
    preferredRole: getTrimmed('preferredRole'),
    education: getTrimmed('education'),
    linkedinUrl: getTrimmed('linkedinUrl'),
    experience: getTrimmed('experience'),
  };

  const errors = {};

  if (!candidate.fullName) {
    errors.fullName = 'Full name is required.';
  }

  if (!candidate.email) {
    errors.email = 'Email is required.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!candidate.phoneNumber) {
    errors.phoneNumber = 'Phone number is required.';
  }

  if (!candidate.location) {
    errors.location = 'Location is required.';
  }

  if (!candidate.skills) {
    errors.skills = 'Skills are required.';
  }

  if (!candidate.preferredRole) {
    errors.preferredRole = 'Preferred role is required.';
  }

  if (!candidate.education) {
    errors.education = 'Education is required.';
  }

  if (!candidate.experience) {
    errors.experience = 'Experience is required.';
  }

  if (candidate.linkedinUrl) {
    const linkedinPattern = /^(https?:\/\/)?([\w]+\.)?linkedin\.com\/.*$/i;
    if (!linkedinPattern.test(candidate.linkedinUrl)) {
      errors.linkedinUrl = 'Enter a valid LinkedIn URL.';
    }
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: 'Validation failed',
      errors,
    });
  }

  const insertValues = [
    userId,
    candidate.fullName,
    candidate.email,
    candidate.phoneNumber,
    candidate.location,
    candidate.skills,
    candidate.preferredRole,
    candidate.education,
    candidate.linkedinUrl || null,
    candidate.experience,
    'pending',
  ];

  try {
    const [[existing]] = await pool.query(
      'SELECT id, status FROM clients WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (existing) {
      return res.status(409).json({
        message:
          'You have already submitted your information. Please contact support if you need to make changes.',
        client: existing,
      });
    }

    const [insertResult] = await pool.query(
      `INSERT INTO clients (
        user_id,
        full_name,
        email,
        phone_number,
        location,
        skills,
        preferred_role,
        education,
        linkedin_url,
        experience,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertValues
    );

    const insertedId = insertResult.insertId;

    const [rows] = await pool.query(
      `SELECT
        id,
        user_id AS userId,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        location,
        skills,
        preferred_role AS preferredRole,
        education,
        linkedin_url AS linkedinUrl,
        experience,
        status,
        created_at AS createdAt
      FROM clients
      WHERE id = ?
      LIMIT 1`,
      [insertedId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(201).json(rows[0]);
    }

    return res.status(201).json({
      id: insertedId,
      userId,
      fullName: candidate.fullName,
      email: candidate.email,
      phoneNumber: candidate.phoneNumber,
      location: candidate.location,
      skills: candidate.skills,
      preferredRole: candidate.preferredRole,
      education: candidate.education,
      linkedinUrl: candidate.linkedinUrl || null,
      experience: candidate.experience,
      status: 'pending',
    });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res
        .status(409)
        .json({ message: 'A client with this email already exists.' });
    }

    console.error('Failed to create client', error);
    return res.status(500).json({ message: 'Failed to create client' });
  }
};

export const getCurrentClient = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        user_id AS userId,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        location,
        skills,
        preferred_role AS preferredRole,
        education,
        linkedin_url AS linkedinUrl,
        experience,
        status,
        created_at AS createdAt
      FROM clients
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res
        .status(404)
        .json({ message: 'No client intake submission found for this user.' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Failed to load current client submission', error);
    return res
      .status(500)
      .json({ message: 'Failed to load client submission' });
  }
};

export const getClientById = async (req, res) => {
  const { id } = req.params;
  const clientId = Number(id);

  if (!Number.isFinite(clientId) || clientId <= 0) {
    return res.status(400).json({ message: 'Invalid client id' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        user_id AS userId,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        location,
        skills,
        preferred_role AS preferredRole,
        education,
        linkedin_url AS linkedinUrl,
        experience,
        status,
        created_at AS createdAt
      FROM clients
      WHERE id = ?
      LIMIT 1`,
      [clientId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch client details', error);
    return res.status(500).json({ message: 'Failed to fetch client details' });
  }
};

export const updateClient = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return res.status(400).json({ message: 'Invalid client id' });
  }

  const fieldColumnMap = {
    fullName: 'full_name',
    phoneNumber: 'phone_number',
    email: 'email',
    location: 'location',
    preferredRole: 'preferred_role',
    skills: 'skills',
    education: 'education',
    experience: 'experience',
    linkedinUrl: 'linkedin_url',
  };

  const updates = [];
  const values = [];

  const payload = req.body ?? {};

  Object.entries(fieldColumnMap).forEach(([bodyKey, column]) => {
    if (Object.prototype.hasOwnProperty.call(payload, bodyKey)) {
      const rawValue = payload[bodyKey];
      const sanitisedValue = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
      updates.push(`${column} = ?`);
      values.push(sanitisedValue);
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No valid fields provided' });
  }

  values.push(numericId);

  try {
    const [updateResult] = await pool.query(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const [rows] = await pool.query(
      `SELECT
        id,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        location,
        skills,
        preferred_role AS preferredRole,
        education,
        linkedin_url AS linkedinUrl,
        experience,
        status,
        created_at AS createdAt
      FROM clients
      WHERE id = ?
      LIMIT 1`,
      [numericId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Failed to update client', error);
    return res.status(500).json({ message: 'Failed to update client' });
  }
};

export const updateClientStatus = async (req, res) => {
  const { id } = req.params;
  const rawStatus = req.body?.status;

  const clientId = Number(id);

  if (!Number.isFinite(clientId) || clientId <= 0) {
    return res.status(400).json({ message: 'Invalid client id' });
  }

  if (typeof rawStatus !== 'string' || !rawStatus.trim()) {
    return res.status(400).json({ message: 'A status value is required.' });
  }

  const normalisedStatus = normaliseStatusValue(rawStatus);

  if (!VALID_CLIENT_STATUSES.has(normalisedStatus)) {
    return res.status(400).json({ message: 'Invalid status value provided.' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[client]] = await connection.query(
      `SELECT
        id,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        location,
        skills,
        preferred_role AS preferredRole,
        education,
        linkedin_url AS linkedinUrl,
        experience,
        status
      FROM clients
      WHERE id = ?
      LIMIT 1`,
      [clientId]
    );

    if (!client) {
      await connection.rollback();
      return res.status(404).json({ message: 'Client not found' });
    }

    const previousStatus = client.status;
    const normalisedPrevious = normaliseStatusValue(previousStatus);

    if (normalisedPrevious === normalisedStatus) {
      await connection.commit();
      return res.json({ client, statusUnchanged: true });
    }

    await connection.query('UPDATE clients SET status = ? WHERE id = ?', [
      normalisedStatus,
      clientId,
    ]);

    const [rows] = await connection.query(
      `SELECT
        id,
        full_name AS fullName,
        email,
        phone_number AS phoneNumber,
        location,
        skills,
        preferred_role AS preferredRole,
        education,
        linkedin_url AS linkedinUrl,
        experience,
        status
      FROM clients
      WHERE id = ?
      LIMIT 1`,
      [clientId]
    );

    const updatedClient =
      Array.isArray(rows) && rows.length > 0 ? rows[0] : { ...client, status: normalisedStatus };

    await connection.commit();

    res.json({ client: updatedClient, statusUpdated: true });

    const recipientEmail = normaliseEmail(updatedClient.email);

    if (recipientEmail) {
      const message = buildClientStatusChangedEmail({
        client: updatedClient,
        statusOld: previousStatus,
        statusNew: updatedClient.status,
      });

      sendMail({
        to: recipientEmail,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }).catch((error) => {
        console.error('Failed to send client status update email', {
          clientId,
          error,
        });
      });
    }

    return;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback status update', rollbackError);
      }
    }

    console.error('Failed to update client status', error);
    return res.status(500).json({ message: 'Failed to update client status' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const deleteClient = async (req, res) => {
  const { id } = req.params;
  const numericId = Number(id);

  if (!Number.isFinite(numericId)) {
    return res.status(400).json({ message: 'Invalid client id' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[client]] = await connection.query(
      'SELECT id FROM clients WHERE id = ? LIMIT 1',
      [numericId]
    );

    if (!client) {
      await connection.rollback();
      return res.status(404).json({ message: 'Client not found' });
    }

    await connection.query('DELETE FROM assignments WHERE client_id = ?', [numericId]);
    await connection.query('DELETE FROM clients WHERE id = ?', [numericId]);

    await connection.commit();

    return res.json({ deletedClientId: numericId });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback client deletion', rollbackError);
      }
    }

    console.error('Failed to delete client', error);
    return res.status(500).json({ message: 'Failed to delete client' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


export const submitCv = (req, res) => {
  res.send('CV submitted');
};

