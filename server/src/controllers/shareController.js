import { pool } from '../config/db.js';
import { verifyShareToken } from '../utils/shareTokens.js';
import { resolveCvViewUrl } from '../utils/cvUrls.js';

const pickClientFields = (record) => ({
  id: record?.id,
  fullName: record?.fullName || record?.full_name,
  email: record?.email,
  phoneNumber: record?.phoneNumber || record?.phone_number,
  location: record?.location,
  skills: record?.skills,
  preferredRole: record?.preferredRole || record?.preferred_role,
  education: record?.education,
  linkedinUrl: record?.linkedinUrl || record?.linkedin_url,
  experience: record?.experience,
  status: record?.status,
  createdAt: record?.createdAt || record?.created_at,
});

export const getSharedClientDetails = async (req, res) => {
  const token = req.query?.token;
  const rawClientId = req.params?.clientId;
  const clientId = Number(rawClientId);

  if (!Number.isFinite(clientId) || clientId <= 0) {
    return res.status(400).json({ message: 'Invalid client identifier.' });
  }

  let payload;

  try {
    payload = verifyShareToken(token);
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired share link.' });
  }

  if (Number(payload?.clientId) !== clientId) {
    return res.status(403).json({ message: 'Share link does not match this client.' });
  }

  const shareType = payload?.type;

  if (shareType && shareType !== 'client-share') {
    return res.status(400).json({ message: 'Unsupported share link type.' });
  }

  try {
    const [[assignment]] = await pool.query(
      `SELECT
        id,
        client_id AS clientId,
        company_id AS companyId,
        status,
        assigned_at AS assignedAt
      FROM assignments
      WHERE id = ? AND client_id = ?
      LIMIT 1`,
      [payload.assignmentId, clientId]
    );

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment no longer exists.' });
    }

    if (
      payload.companyId != null &&
      Number(payload.companyId) !== Number(assignment.companyId)
    ) {
      return res.status(403).json({ message: 'Share link is not valid for this company.' });
    }

    const [[clientRecord]] = await pool.query(
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
        created_at AS createdAt,
        cv_file_path AS cvFilePath
      FROM clients
      WHERE id = ?
      LIMIT 1`,
      [clientId]
    );

    if (!clientRecord) {
      return res.status(404).json({ message: 'Client not found.' });
    }

    let cv = { exists: false, url: null, isSigned: false };

    if (clientRecord.cvFilePath) {
      try {
        const { exists, url, isSigned } = await resolveCvViewUrl(clientRecord.cvFilePath);

        if (exists && url) {
          cv = { exists: true, url, isSigned };
        }
      } catch (error) {
        console.error('Failed to resolve CV for shared client view', { clientId, error });
      }
    }

    const response = {
      client: pickClientFields(clientRecord),
      assignment: {
        id: assignment.id,
        status: assignment.status,
        assignedAt: assignment.assignedAt,
      },
      cv,
      tokenExpiresAt: payload?.exp ? new Date(payload.exp * 1000).toISOString() : null,
    };

    return res.json(response);
  } catch (error) {
    console.error('Failed to load shared client details', error);
    return res.status(500).json({ message: 'Failed to load client details.' });
  }
};

