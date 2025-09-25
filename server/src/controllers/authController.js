import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const MIN_PASSWORD_LENGTH = 8;
const JWT_EXPIRY = '12h';
const ALLOWED_ROLES = new Set(['client', 'company_rep', 'recruitment_officer']);

const { JWT_SECRET } = process.env;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not configured.');
}

const normaliseEmail = (value = '') => String(value).trim().toLowerCase();

const isValidEmail = (email) => {
  if (!email) {
    return false;
  }

  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [local, domain] = parts;

  if (!local || !domain) {
    return false;
  }

  if (domain.startsWith('.') || domain.endsWith('.')) {
    return false;
  }

  return domain.includes('.');
};

const buildAuthResponse = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
  return { token, user: payload };
};

export const register = async (req, res) => {
  const { email, password, confirmPassword, role } = req.body ?? {};

  const normalisedEmail = normaliseEmail(email);

  if (!isValidEmail(normalisedEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address.', field: 'email' });
  }

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({
      message: 'Password must be at least characters long.',
      field: 'password',
    });
  }

  if (confirmPassword != null && password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match.', field: 'confirmPassword' });
  }

  try {
    const [existingRows] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalisedEmail]);

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered.', field: 'email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRole = ALLOWED_ROLES.has(role) ? role : 'recruitment_officer';

    const [insertResult] = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [normalisedEmail, passwordHash, userRole]
    );

    const user = { id: insertResult.insertId, email: normalisedEmail, role: userRole };
    const auth = buildAuthResponse(user);

    return res.status(201).json(auth);
  } catch (error) {
    console.error('Failed to register user', error);
    return res.status(500).json({ message: 'Failed to register user. Please try again later.' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  const normalisedEmail = normaliseEmail(email);

  if (!isValidEmail(normalisedEmail)) {
    return res.status(400).json({ message: 'Please provide a valid email address.', field: 'email' });
  }

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Password is required.', field: 'password' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, email, password_hash AS passwordHash, role FROM users WHERE email = ? LIMIT 1',
      [normalisedEmail]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.', field: 'password' });
    }

    const userRecord = rows[0];
    const passwordMatches = await bcrypt.compare(password, userRecord.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.', field: 'password' });
    }

    const user = { id: userRecord.id, email: userRecord.email, role: userRecord.role };
    const auth = buildAuthResponse(user);

    return res.json(auth);
  } catch (error) {
    console.error('Failed to log in user', error);
    return res.status(500).json({ message: 'Failed to log in. Please try again later.' });
  }
};
