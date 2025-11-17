import { pool } from '../config/db.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const PHONE_REGEX = /^[0-9+\-\s()]{7,}$/;
const LINKEDIN_REGEX = /^(https?:\/\/)?([\w]+\.)?linkedin\.com\/.*$/i;

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

const parseAvailableRolesList = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((role) => sanitizeString(role)).filter((role) => role.length > 0);
  }

  return String(value)
    .split(',')
    .map((role) => sanitizeString(role))
    .filter((role) => role.length > 0);
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
    linkedin_url,
    linkedinUrl: camelLinkedinUrl,
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
  const linkedinInput = linkedin_url ?? camelLinkedinUrl ?? '';
  const linkedinUrl = sanitizeString(linkedinInput);
  const userId = req.user?.id;

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

  if (linkedinUrl && !LINKEDIN_REGEX.test(linkedinUrl)) {
    errors.linkedin_url = 'Please provide a valid LinkedIn URL.';
  }

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required.' });
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

    const [[existingCompany]] = await connection.query(
      'SELECT id FROM companies WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [userId]
    );

    if (existingCompany) {
      await connection.rollback();
      return res.status(409).json({
        message: 'Company already registered for this user.',
      });
    }

    if (emailValue) {
      const [[emailConflict]] = await connection.query(
        'SELECT id FROM companies WHERE email = ? AND user_id <> ? LIMIT 1 FOR UPDATE',
        [emailValue, userId]
      );

      if (emailConflict) {
        await connection.rollback();
        return res.status(409).json({
          message: 'A company has already been submitted with this email.',
          errors: {
            email: 'A company has already been submitted with this email.',
          },
        });
      }
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
        linkedinUrl || null,
      ]
    );

    if (req.user?.role !== 'company_rep') {
      await connection.query(
        'UPDATE users SET role = ? WHERE id = ? AND role <> ?',
        ['company_rep', userId, 'company_rep']
      );
    }

    await connection.commit();

    return res.status(201).json({
      id: companyResult.insertId,
      company_name: companyName,
      industry: industryValue,
      phone_number: phoneNumber,
      email: emailValue,
      workforce_size: workforceSizeValue,
      location: locationValue,
      available_roles: parseAvailableRolesList(availableRolesValue),
      specifications: specificationsValue,
      linkedin_url: linkedinUrl || null,
      status: 'unverified',
    });
  } catch (error) {
    await connection.rollback();

    if (error?.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Company already registered for this user.',
      });
    }

    console.error('Failed to create company intake', error);
    return res.status(500).json({ message: 'Failed to submit company information.' });
  } finally {
    connection.release();
  }
};

export const getCurrentCompany = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        user_id AS userId,
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
      WHERE user_id = ?
      LIMIT 1`,
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({
        message: 'No company registration found for this user.',
      });
    }

    const company = rows[0];

    return res.json({
      id: company.id,
      user_id: company.userId,
      company_name: company.companyName,
      industry: company.industry,
      phone_number: company.phoneNumber,
      email: company.email,
      workforce_size: company.workforceSize,
      location: company.location,
      available_roles: parseAvailableRolesList(company.availableRoles),
      specifications: company.specifications,
      linkedin_url: company.linkedinUrl,
      status: company.status,
    });
  } catch (error) {
    console.error('Failed to load current company', error);
    return res.status(500).json({ message: 'Failed to load company profile.' });
  }
};

export const checkCompanyExists = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id FROM companies WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.json({ exists: false });
    }

    const company = rows[0];
    return res.json({ exists: true, companyId: company.id });
  } catch (error) {
    console.error('Failed to check company registration', error);
    return res.status(500).json({ message: 'Failed to check company registration.' });
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

