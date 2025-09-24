import { pool } from '../config/db.js';

export const listClients = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, full_name AS fullName, preferred_role AS preferredRole, status, created_at AS createdAt FROM clients ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch clients', error);
    res.status(500).json({ message: 'Failed to fetch clients' });
  }
};

export const submitCv = (req, res) => {
  res.send('CV submitted');
};
