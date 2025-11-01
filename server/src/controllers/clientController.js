import { pool } from '../config/db.js';

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

export const createClient = async (req, res) => {
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
    candidate.fullName,
    candidate.email,
    candidate.phoneNumber,
    candidate.location,
    candidate.skills,
    candidate.preferredRole,
    candidate.education,
    candidate.linkedinUrl || null,
    candidate.experience,
  ];

  try {
    const [insertResult] = await pool.query(
      `INSERT INTO clients (
        full_name,
        email,
        phone_number,
        location,
        skills,
        preferred_role,
        education,
        linkedin_url,
        experience
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      insertValues
    );

    const insertedId = insertResult.insertId;

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
      [insertedId]
    );

    if (Array.isArray(rows) && rows.length > 0) {
      return res.status(201).json(rows[0]);
    }

    return res.status(201).json({
      id: insertedId,
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

