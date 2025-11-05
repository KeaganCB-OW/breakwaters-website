import { pool } from '../config/db.js';
import { sendMail } from '../utils/email.js';
import {
  buildClientStatusChangedEmail,
  buildClientSuggestedEmail,
} from '../utils/emailTemplates.js';
import { createShareToken } from '../utils/shareTokens.js';
import {
  fetchLatestCvUrl,
  normaliseEmail,
  normaliseStatusValue,
} from '../utils/notificationUtils.js';

const APP_BASE_URL = (process.env.APP_URL || 'https://breakwatersrecruitment.co.za').replace(/\/$/, '');

const triggerAssignmentNotifications = async ({
  client,
  company,
  assignment,
  previousStatus,
  updatedStatus,
}) => {
  if (!client?.id) {
    return;
  }

  const clientEmail = normaliseEmail(client.email);
  const previousNormalised = normaliseStatusValue(previousStatus);
  const updatedNormalised = normaliseStatusValue(updatedStatus);

  if (
    clientEmail &&
    updatedNormalised &&
    (!previousNormalised || previousNormalised !== updatedNormalised)
  ) {
    try {
      const message = buildClientStatusChangedEmail({
        client,
        statusOld: previousStatus,
        statusNew: updatedStatus,
      });
      await sendMail({
        to: clientEmail,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });
    } catch (error) {
      console.error('Failed to send client status update email', {
        clientId: client.id,
        error,
      });
    }
  }

  const companyEmail = normaliseEmail(company?.email);

  if (!companyEmail) {
    return;
  }

  let cvUrl = null;
  try {
    cvUrl = await fetchLatestCvUrl(client.id, client.cvFilePath);
  } catch (error) {
    console.error('Failed to fetch CV URL for assignment notification', {
      clientId: client.id,
      error,
    });
  }

  let shareLink = null;

  try {
    const token = createShareToken({
      type: 'client-share',
      clientId: client.id,
      companyId: company?.id,
      assignmentId: assignment?.id,
    });

    shareLink = `${APP_BASE_URL}/share/clients/${client.id}?token=${encodeURIComponent(token)}`;
  } catch (error) {
    console.error('Failed to generate share link token', {
      clientId: client.id,
      companyId: company?.id,
      assignmentId: assignment?.id,
      error,
    });
  }

  try {
    const message = buildClientSuggestedEmail({
      client,
      company,
      cvUrl,
      candidateDetailsUrl: shareLink,
    });

    await sendMail({
      to: companyEmail,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  } catch (error) {
    console.error('Failed to send company assignment notification email', {
      clientId: client.id,
      companyId: company?.id,
      assignmentId: assignment?.id,
      error,
    });
  }
};

export const listAssignments = async (req, res) => {
  try {
    const { limit: rawLimit } = req.query ?? {};
    const limit = Number.parseInt(rawLimit, 10);

    let query = `SELECT a.id,
              a.client_id AS clientId,
              a.company_id AS companyId,
              a.assigned_by AS assignedBy,
              a.status,
              a.assigned_at AS assignedAt,
              c.full_name AS clientName,
              co.company_name AS companyName
         FROM assignments a
         JOIN clients c ON c.id = a.client_id
         JOIN companies co ON co.id = a.company_id
         ORDER BY a.assigned_at DESC`;

    const params = [];

    if (Number.isFinite(limit) && limit > 0) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch assignments', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
};

export const assignCandidate = (req, res) => {
  res.send('Candidate assigned');
};

export const suggestAssignment = async (req, res) => {
  const { clientId, companyId } = req.body ?? {};

  const numericClientId = Number(clientId);
  const numericCompanyId = Number(companyId);
  const assignedByUserId = Number(req.user?.id);

  if (!Number.isFinite(numericClientId) || !Number.isFinite(numericCompanyId)) {
    return res.status(400).json({ message: 'clientId and companyId are required' });
  }

  if (!Number.isFinite(assignedByUserId) || assignedByUserId <= 0) {
    return res.status(403).json({ message: 'Authenticated user context is required.' });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [[assigner]] = await connection.query(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [assignedByUserId]
    );

    if (!assigner) {
      await connection.rollback();
      return res.status(403).json({ message: 'User record not found for assignment.' });
    }

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
        status,
        cv_file_path AS cvFilePath
      FROM clients
      WHERE id = ?
      LIMIT 1`,
      [numericClientId]
    );

    if (!client) {
      await connection.rollback();
      return res.status(404).json({ message: 'Client not found' });
    }

    const [[company]] = await connection.query(
      `SELECT
        id,
        company_name AS companyName,
        email,
        phone_number AS phoneNumber
      FROM companies
      WHERE id = ?
      LIMIT 1`,
      [numericCompanyId]
    );

    if (!company) {
      await connection.rollback();
      return res.status(404).json({ message: 'Company not found' });
    }

    const [[existingAssignment]] = await connection.query(
      'SELECT id FROM assignments WHERE client_id = ? AND company_id = ? LIMIT 1',
      [numericClientId, numericCompanyId]
    );

    if (existingAssignment) {
      await connection.rollback();
      return res.status(409).json({
        message: 'Client already suggested to this company',
        alreadySuggested: true,
      });
    }

    const previousClientStatus = client?.status;
    let updatedClientStatus = client.status;
    const normalizedClientStatus =
      typeof client.status === 'string' ? client.status.trim().toLowerCase() : '';

    if (normalizedClientStatus === 'pending' || normalizedClientStatus === 'in progress') {
      await connection.query(
        'UPDATE clients SET status = ? WHERE id = ?',
        ['suggested', numericClientId]
      );
      updatedClientStatus = 'suggested';
    }

    const [insertResult] = await connection.query(
      'INSERT INTO assignments (client_id, company_id, assigned_by, status, assigned_at) VALUES (?, ?, ?, ?, NOW())',
      [numericClientId, numericCompanyId, assignedByUserId, 'suggested']
    );

    const assignmentId = insertResult.insertId;

    const [assignmentRows] = await connection.query(
      `SELECT a.id,
              a.client_id AS clientId,
              a.company_id AS companyId,
              a.assigned_by AS assignedBy,
              a.status,
              a.assigned_at AS assignedAt,
              c.full_name AS clientName,
              c.status AS clientStatus,
              co.company_name AS companyName
         FROM assignments a
         JOIN clients c ON c.id = a.client_id
         JOIN companies co ON co.id = a.company_id
         WHERE a.id = ?
         LIMIT 1`,
      [assignmentId]
    );

    await connection.commit();

    const assignment = Array.isArray(assignmentRows) && assignmentRows.length > 0 ? assignmentRows[0] : null;

    client.status = updatedClientStatus;

    const responsePayload = {
      assignment,
      clientStatus: updatedClientStatus,
    };

    res.status(201).json(responsePayload);

    triggerAssignmentNotifications({
      client,
      company,
      assignment,
      previousStatus: previousClientStatus,
      updatedStatus: updatedClientStatus,
    }).catch((error) => {
      console.error('Unexpected failure in assignment notifications', {
        clientId: client?.id,
        assignmentId: assignment?.id,
        error,
      });
    });

    return;
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Failed to rollback suggest assignment transaction', rollbackError);
      }
    }

    console.error('Failed to suggest assignment', error);
    return res.status(500).json({ message: 'Failed to suggest assignment' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
