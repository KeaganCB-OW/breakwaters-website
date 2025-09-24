import { pool } from '../config/db.js';

export const listAssignments = async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT a.id,
              a.status,
              a.assigned_at AS assignedAt,
              c.full_name AS clientName,
              co.company_name AS companyName
         FROM assignments a
         JOIN clients c ON c.id = a.client_id
         JOIN companies co ON co.id = a.company_id
         ORDER BY a.assigned_at DESC`);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch assignments', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

export const assignCandidate = (req, res) => {
  res.send('Candidate assigned');
};
