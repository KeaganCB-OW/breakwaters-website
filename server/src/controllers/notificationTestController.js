import { pool } from '../config/db.js';
import { sendMail } from '../utils/email.js';
import {
  buildClientStatusChangedEmail,
  buildClientSuggestedEmail,
} from '../utils/emailTemplates.js';
import {
  fetchLatestCvUrl,
  normaliseEmail,
} from '../utils/notificationUtils.js';
import { createShareToken } from '../utils/shareTokens.js';

const APP_BASE_URL = (process.env.APP_URL || 'https://breakwatersrecruitment.co.za').replace(/\/$/, '');

const loadClientById = async (clientId) => {
  const [[client]] = await pool.query(
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
    [clientId]
  );
  return client || null;
};

const loadCompanyById = async (companyId) => {
  const [[company]] = await pool.query(
    `SELECT
      id,
      company_name AS companyName,
      email,
      phone_number AS phoneNumber
    FROM companies
    WHERE id = ?
    LIMIT 1`,
    [companyId]
  );
  return company || null;
};

const loadAssignmentById = async (assignmentId) => {
  const [[assignment]] = await pool.query(
    `SELECT
      id,
      client_id AS clientId,
      company_id AS companyId,
      status,
      assigned_at AS assignedAt
    FROM assignments
    WHERE id = ?
    LIMIT 1`,
    [assignmentId]
  );
  return assignment || null;
};

export const triggerClientStatusTestEmail = async (req, res) => {
  const clientId = Number(req.body?.clientId);
  const targetStatus = req.body?.statusNew;
  const overrideRecipient = normaliseEmail(req.body?.to);

  if (!Number.isFinite(clientId) || clientId <= 0) {
    return res.status(400).json({ message: 'Provide a valid clientId' });
  }

  if (typeof targetStatus !== 'string' || !targetStatus.trim()) {
    return res.status(400).json({ message: 'Provide statusNew to simulate the update.' });
  }

  try {
    const client = await loadClientById(clientId);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const recipient = overrideRecipient || normaliseEmail(client.email);

    if (!recipient) {
      return res.status(400).json({ message: 'Client has no email on record. Provide a test "to" address.' });
    }

    const message = buildClientStatusChangedEmail({
      client,
      statusOld: client.status,
      statusNew: targetStatus,
    });

    await sendMail({
      to: recipient,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    return res.json({
      sent: true,
      to: recipient,
      subject: message.subject,
      previousStatus: client.status,
      newStatus: targetStatus,
    });
  } catch (error) {
    console.error('Failed to trigger client status test email', error);
    return res.status(500).json({ message: 'Failed to send test email.' });
  }
};

export const triggerClientSuggestedTestEmail = async (req, res) => {
  const assignmentId = Number(req.body?.assignmentId);
  const clientId = Number(req.body?.clientId);
  const companyId = Number(req.body?.companyId);
  const overrideRecipient = normaliseEmail(req.body?.to);

  const resolvedIds = {
    assignmentId: Number.isFinite(assignmentId) ? assignmentId : null,
    clientId: Number.isFinite(clientId) ? clientId : null,
    companyId: Number.isFinite(companyId) ? companyId : null,
  };

  if (!resolvedIds.assignmentId && (!resolvedIds.clientId || !resolvedIds.companyId)) {
    return res.status(400).json({
      message: 'Provide assignmentId or both clientId and companyId.',
    });
  }

  try {
    let assignment = null;
    let client = null;
    let company = null;

    if (resolvedIds.assignmentId) {
      assignment = await loadAssignmentById(resolvedIds.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found.' });
      }
      resolvedIds.clientId = assignment.clientId;
      resolvedIds.companyId = assignment.companyId;
    }

    client = await loadClientById(resolvedIds.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    company = await loadCompanyById(resolvedIds.companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    const recipient = overrideRecipient || normaliseEmail(company.email);
    if (!recipient) {
      return res.status(400).json({ message: 'Company has no email on record. Provide a test "to" address.' });
    }

    const cvUrl = await fetchLatestCvUrl(client.id, client.cvFilePath);

    let shareLink = null;
    try {
      const token = createShareToken({
        type: 'client-share',
        assignmentId: assignment?.id,
        clientId: client.id,
        companyId: company.id,
      });
      shareLink = `${APP_BASE_URL}/share/clients/${client.id}?token=${encodeURIComponent(token)}`;
    } catch (error) {
      console.error('Failed to generate share token for test email', error);
    }

    const message = buildClientSuggestedEmail({
      client,
      company,
      cvUrl,
      candidateDetailsUrl: shareLink,
    });

    await sendMail({
      to: recipient,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    return res.json({
      sent: true,
      to: recipient,
      subject: message.subject,
      clientId: client.id,
      companyId: company.id,
      assignmentId: assignment?.id || null,
    });
  } catch (error) {
    console.error('Failed to trigger client suggested test email', error);
    return res.status(500).json({ message: 'Failed to send test email.' });
  }
};
