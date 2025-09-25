import { pool } from '../config/db.js';

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

