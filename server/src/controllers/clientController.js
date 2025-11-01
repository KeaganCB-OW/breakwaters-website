import { pool } from '../config/db.js';

const CLIENT_SELECT = `
  SELECT
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
`;

const normaliseString = (value = '') => String(value ?? '').trim();

const isValidEmail = (value) => {
  const email = normaliseString(value).toLowerCase();
  if (!email) {
    return false;
  }

  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
};

const isValidPhoneNumber = (value) => {
  const digits = normaliseString(value).replace(/[^0-9]/g, '');
  return digits.length >= 7;
};

const isValidLinkedInUrl = (value) => {
  const urlCandidate = normaliseString(value);
  if (!urlCandidate) {
    return true;
  }

  try {
    const parsed = new URL(urlCandidate.startsWith('http') ? urlCandidate : `https://${urlCandidate}`);
    return parsed.hostname.includes('linkedin.');
  } catch (error) {
    return false;
  }
};

export const listClients = async (req, res) => {
  try {
    const [rows] = await pool.query(`${CLIENT_SELECT} ORDER BY created_at DESC;`);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch clients', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
};

export const getCurrentClient = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const [rows] = await pool.query(`${CLIENT_SELECT} WHERE user_id = ? LIMIT 1`, [userId]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Failed to fetch client for user', error);
    return res.status(500).json({ message: 'Failed to load client profile' });
  }
};

export const createClient = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const {
    fullName,
    email,
    phoneNumber,
    location,
    skills,
    preferredRole,
    education,
    linkedinUrl,
    experience,
  } = req.body ?? {};

  const trimmedFullName = normaliseString(fullName);
  const normalisedEmail = normaliseString(email).toLowerCase();
  const trimmedPhoneNumber = normaliseString(phoneNumber);
  const trimmedLocation = normaliseString(location);
  const trimmedSkills = normaliseString(skills);
  const trimmedPreferredRole = normaliseString(preferredRole);
  const trimmedEducation = normaliseString(education);
  const trimmedExperience = normaliseString(experience);
  const trimmedLinkedIn = normaliseString(linkedinUrl);

  if (!trimmedFullName) {
    return res.status(400).json({ message: 'Full name is required.', field: 'fullName' });
  }

  if (!isValidEmail(normalisedEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address.', field: 'email' });
  }

  if (!isValidPhoneNumber(trimmedPhoneNumber)) {
    return res.status(400).json({ message: 'Please provide a valid phone number.', field: 'phoneNumber' });
  }

  if (!trimmedLocation) {
    return res.status(400).json({ message: 'Location is required.', field: 'location' });
  }

  if (!trimmedSkills) {
    return res.status(400).json({ message: 'Please share at least one key skill.', field: 'skills' });
  }

  if (!trimmedPreferredRole) {
    return res.status(400).json({ message: 'Preferred role is required.', field: 'preferredRole' });
  }

  if (!trimmedEducation) {
    return res.status(400).json({ message: 'Education details are required.', field: 'education' });
  }

  if (!trimmedExperience) {
    return res.status(400).json({ message: 'Experience summary is required.', field: 'experience' });
  }

  if (!isValidLinkedInUrl(trimmedLinkedIn)) {
    return res.status(400).json({ message: 'Please provide a valid LinkedIn profile link.', field: 'linkedinUrl' });
  }

  try {
    const [[existingClient]] = await pool.query('SELECT id FROM clients WHERE user_id = ? LIMIT 1', [userId]);

    if (existingClient) {
      return res.status(409).json({ message: 'You have already submitted your resume.' });
    }

    const [[emailConflict]] = await pool.query('SELECT id FROM clients WHERE email = ? LIMIT 1', [normalisedEmail]);

    if (emailConflict) {
      return res.status(409).json({ message: 'A client with this email already exists.', field: 'email' });
    }

    const [insertResult] = await pool.query(
      `INSERT INTO clients
        (user_id, full_name, email, phone_number, location, skills, preferred_role, education, linkedin_url, experience, status)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        userId,
        trimmedFullName,
        normalisedEmail,
        trimmedPhoneNumber,
        trimmedLocation,
        trimmedSkills,
        trimmedPreferredRole,
        trimmedEducation,
        trimmedLinkedIn || null,
        trimmedExperience,
      ]
    );

    const [rows] = await pool.query(`${CLIENT_SELECT} WHERE id = ? LIMIT 1`, [insertResult.insertId]);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(201).json({
        id: insertResult.insertId,
        fullName: trimmedFullName,
        email: normalisedEmail,
        phoneNumber: trimmedPhoneNumber,
        location: trimmedLocation,
        skills: trimmedSkills,
        preferredRole: trimmedPreferredRole,
        education: trimmedEducation,
        linkedinUrl: trimmedLinkedIn || null,
        experience: trimmedExperience,
        status: 'pending',
      });
    }

    return res.status(201).json(rows[0]);
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'A client with these details already exists.' });
    }

    console.error('Failed to create client', error);
    return res.status(500).json({ message: 'Failed to submit client profile.' });
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
