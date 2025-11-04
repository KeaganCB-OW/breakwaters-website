import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { pool } from '../config/db.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_REGEX = /^[0-9+\-\s()]{7,}$/;

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const normaliseEmail = (value) => sanitizeString(String(value || '').toLowerCase());

const parseWorkforceSize = (value) => {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(String(value).trim(), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const formatAvailableRoles = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const roles = value
      .map((role) => sanitizeString(role))
      .filter((role) => role.length > 0);
    return roles.length > 0 ? roles.join(', ') : null;
  }

  if (typeof value === 'string') {
    const roles = value
      .split(',')
      .map((role) => sanitizeString(role))
      .filter((role) => role.length > 0);
    return roles.length > 0 ? roles.join(', ') : null;
  }

  return null;
};

export const createCompany = async (req, res) => {
  const {
    company_name,
    industry,
    phone_number,
    email,
    workforce_size,
    location,
    available_roles,
    specifications,
  } = req.body ?? {};

  const errors = {};

  const companyName = sanitizeString(company_name);
  const industryValue = sanitizeString(industry);
  const phoneNumber = sanitizeString(phone_number);
  const emailValue = normaliseEmail(email);
  const locationValue = sanitizeString(location);
  const specificationsValue = sanitizeString(specifications);
  const workforceSizeValue = parseWorkforceSize(workforce_size);
  const availableRolesValue = formatAvailableRoles(available_roles);

  if (!companyName) {
    errors.company_name = 'Company name is required.';
  }

  if (!industryValue) {
    errors.industry = 'Industry is required.';
  }

  if (!phoneNumber || !PHONE_REGEX.test(phoneNumber)) {
    errors.phone_number = 'Please provide a valid phone number.';
  }

  if (!emailValue || !EMAIL_REGEX.test(emailValue)) {
    errors.email = 'Please provide a valid company email.';
  }

  if (workforce_size && workforceSizeValue == null) {
    errors.workforce_size = 'Workforce size must be a whole number.';
  }

  if (!locationValue) {
    errors.location = 'Primary location is required.';
  }

  if (!availableRolesValue) {
    errors.available_roles = 'Please select at least one role you are hiring for.';
  }

  if (!specificationsValue) {
    errors.specifications = 'Please share a short description of the roles you need.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(422).json({
      message: 'Please correct the highlighted fields.',
      errors,
    });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let userId;

    const [existingUsers] = await connection.query(
      'SELECT id, role FROM users WHERE email = ? LIMIT 1 FOR UPDATE',
      [emailValue]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      const existingUser = existingUsers[0];

      if (existingUser.role !== 'company_rep') {
        await connection.rollback();
        return res.status(409).json({
          message: 'This email is already registered. Please sign in or use a different company email.',
          errors: { email: 'This email is already registered. Please sign in or use a different company email.' },
        });
      }

      const [existingCompanies] = await connection.query(
        'SELECT id FROM companies WHERE user_id = ? LIMIT 1',
        [existingUser.id]
      );

      if (Array.isArray(existingCompanies) && existingCompanies.length > 0) {
        await connection.rollback();
        return res.status(409).json({
          message: 'A company has already been submitted for this account.',
          errors: { email: 'A company has already been submitted with this email.' },
        });
      }

      userId = existingUser.id;
    } else {
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const [userResult] = await connection.query(
        'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
        [emailValue, passwordHash, 'company_rep']
      );

      userId = userResult.insertId;
    }

    const [companyResult] = await connection.query(
      `INSERT INTO companies (
        user_id,
        company_name,
        industry,
        phone_number,
        email,
        workforce_size,
        location,
        available_roles,
        specifications,
        linkedin_url,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified')`,
      [
        userId,
        companyName,
        industryValue || null,
        phoneNumber,
        emailValue,
        workforceSizeValue,
        locationValue,
        availableRolesValue,
        specificationsValue,
        null,
      ]
    );

    await connection.commit();

    return res.status(201).json({
      id: companyResult.insertId,
      company_name: companyName,
      industry: industryValue,
      phone_number: phoneNumber,
      email: emailValue,
      workforce_size: workforceSizeValue,
      location: locationValue,
      available_roles: availableRolesValue ? availableRolesValue.split(',').map((role) => role.trim()) : [],
      specifications: specificationsValue,
      status: 'unverified',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Failed to create company intake', error);
    return res.status(500).json({ message: 'Failed to submit company information.' });
  } finally {
    connection.release();
  }
};

export const getCompanyStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        COUNT(*) AS totalCompanies,
        SUM(CASE WHEN created_at IS NOT NULL AND created_at >= DATE_SUB(DATE(NOW()), INTERVAL WEEKDAY(NOW()) DAY) THEN 1 ELSE 0 END) AS newThisWeek,
        SUM(CASE WHEN status = 'unverified' THEN 1 ELSE 0 END) AS unverifiedCompanies
      FROM companies`
    );
    const stats = Array.isArray(rows) && rows.length > 0 ? rows[0] : {};
    const total = Number(stats.totalCompanies ?? 0);
    const newThisWeek = Number(stats.newThisWeek ?? 0);
    const unverified = Number(stats.unverifiedCompanies ?? 0);

    res.json({
      total: Number.isNaN(total) ? 0 : total,
      newThisWeek: Number.isNaN(newThisWeek) ? 0 : newThisWeek,
      unverified: Number.isNaN(unverified) ? 0 : unverified,
    });
  } catch (error) {
    console.error('Failed to fetch company stats', error);
    res.status(500).json({ message: 'Failed to fetch company stats' });
  }
};

export const listCompanies = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        company_name AS companyName,
        industry,
        phone_number AS phoneNumber,
        email,
        workforce_size AS workforceSize,
        location,
        available_roles AS availableRoles,
        specifications,
        linkedin_url AS linkedinUrl,
        status
      FROM companies
      ORDER BY company_name ASC`
    );

    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch companies', error);
    res.status(500).json({ message: 'Failed to fetch companies' });
  }
};

export const getCandidates = (req, res) => {
  res.send('List of assigned candidates');
};

