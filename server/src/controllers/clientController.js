import { pool } from '../config/db.js';

const normaliseString = (value) => (typeof value === 'string' ? value.trim() : '');

const isValidEmail = (email) => {
  if (!email) {
    return false;
  }

  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
};

const isValidPhoneNumber = (phone) => {
  if (!phone) {
    return false;
  }

  const cleaned = phone.replace(/[^0-9+]/g, '');
  return cleaned.length >= 7;
};

const mapClientRow = (row) => ({
  id: row.id,
  fullName: row.fullName,
  email: row.email,
  phoneNumber: row.phoneNumber,
  location: row.location,
  skills: row.skills,
  preferredRole: row.preferredRole,
  education: row.education,
  linkedinUrl: row.linkedinUrl,
  experience: row.experience,
  status: row.status,
  createdAt: row.createdAt,
});

export const listClients = async (req, res) => {
  try {
    const query = `
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
      ORDER BY created_at DESC;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch clients', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
};

export const getCurrentClient = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
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
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: 'Client profile not found' });
    }

    return res.json(mapClientRow(rows[0]));
  } catch (error) {
    console.error('Failed to fetch client profile', error);
    return res.status(500).json({ message: 'Failed to fetch client profile' });
  }
};

export const createClient = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const payload = req.body ?? {};

  const fullName = normaliseString(payload.fullName);
  const email = normaliseString(payload.email).toLowerCase();
  const phoneNumber = normaliseString(payload.phoneNumber);
  const location = normaliseString(payload.location);
  const skills = normaliseString(payload.skills);
  const preferredRole = normaliseString(payload.preferredRole);
  const education = normaliseString(payload.education);
  const linkedinUrl = normaliseString(payload.linkedinUrl);
  const experience = normaliseString(payload.experience);

  const validationErrors = [];

  if (!fullName || fullName.length < 4 || !fullName.includes(' ')) {
    validationErrors.push({ field: 'fullName', message: 'Please provide your full name.' });
  }

  if (!isValidEmail(email)) {
    validationErrors.push({ field: 'email', message: 'Please provide a valid email address.' });
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    validationErrors.push({ field: 'phoneNumber', message: 'Please provide a valid phone number.' });
  }

  if (!location) {
    validationErrors.push({ field: 'location', message: 'Location is required.' });
  }

  if (!skills) {
    validationErrors.push({ field: 'skills', message: 'Skills are required.' });
  }

  if (!preferredRole) {
    validationErrors.push({ field: 'preferredRole', message: 'Preferred role is required.' });
  }

  if (!education) {
    validationErrors.push({ field: 'education', message: 'Education is required.' });
  }

  if (!experience) {
    validationErrors.push({ field: 'experience', message: 'Experience summary is required.' });
  }

  if (linkedinUrl) {
    try {
      const url = new URL(linkedinUrl.startsWith('http') ? linkedinUrl : `https://${linkedinUrl}`);
      if (!url.hostname.includes('linkedin.com')) {
        validationErrors.push({ field: 'linkedinUrl', message: 'LinkedIn URL must point to linkedin.com.' });
      }
    } catch (error) {
      validationErrors.push({ field: 'linkedinUrl', message: 'LinkedIn URL is invalid.' });
    }
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
  }

  try {
    const [[existing]] = await pool.query(
      'SELECT id, full_name AS fullName, email, phone_number AS phoneNumber, location, skills, preferred_role AS preferredRole, education, linkedin_url AS linkedinUrl, experience, status, created_at AS createdAt FROM clients WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (existing) {
      return res.status(409).json({ message: 'Resume already submitted for this user.', client: mapClientRow(existing) });
    }

    const [result] = await pool.query(
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
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        userId,
        fullName,
        email,
        phoneNumber,
        location,
        skills,
        preferredRole,
        education,
        linkedinUrl || null,
        experience,
      ]
    );

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
      [result.insertId]
    );

    const client = rows?.[0];

    if (!client) {
      return res.status(201).json({});
    }

    return res.status(201).json(mapClientRow(client));
  } catch (error) {
    console.error('Failed to create client', error);
    return res.status(500).json({ message: 'Failed to create client profile' });
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

