import { emailButton, emailFooter, emailFooterText } from './email.js';

const humaniseStatus = (value) => {
  if (!value) {
    return '';
  }

  return String(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

const transitionMessages = new Map([
  ['pending|in progress', 'A recruitment officer is actively looking for suitable opportunities for you.'],
  ['pending|in-progress', 'A recruitment officer is actively looking for suitable opportunities for you.'],
  ['in progress|suggested', 'You’ve been suggested to a company. We’ll keep you updated on their feedback.'],
  ['in-progress|suggested', 'You’ve been suggested to a company. We’ll keep you updated on their feedback.'],
  ['suggested|interview pending', 'We’re arranging an interview; details will follow shortly.'],
  ['suggested|interview-pending', 'We’re arranging an interview; details will follow shortly.'],
]);

const STATUS_GUIDANCE = {
  pending: 'We are reviewing your information. We’ll reach out if anything else is needed.',
  'in progress': 'Your recruitment officer is matching you with the right opportunities.',
  suggested: 'We have presented your profile to a company partner. Keep an eye on your inbox for updates.',
  'interview pending': 'Prepare for your upcoming interview. We will share the confirmed schedule soon.',
  interviewed: 'Thank you for interviewing. We are awaiting feedback from the company.',
  assigned: 'Congratulations! We will coordinate next steps with you shortly.',
  rejected: 'We were not able to progress this application. We will continue searching for other roles.',
};

const normaliseStatus = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .trim();

const safeString = (value) => {
  if (value == null) {
    return '';
  }
  return String(value).trim();
};

const buildPrimarySection = (content) => `
  <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.1);">
    ${content}
  </div>
`;

const buildMetaRow = (label, value) => `
  <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
    <span style="color: #475569;">${label}</span>
    <span style="font-weight: 600; color: #0f172a;">${value}</span>
  </div>
`;

export const buildClientStatusChangedEmail = ({ client, statusOld, statusNew }) => {
  const appUrl = process.env.APP_URL || 'https://breakwatersrecruitment.co.za';
  const clientId = client?.id;
  const clientName = safeString(client?.full_name || client?.fullName);
  const currentStatus = humaniseStatus(statusNew) || 'Updated';
  const previousStatus = humaniseStatus(statusOld) || 'Previous';
  const normalizedNew = normaliseStatus(statusNew);
  const normalizedOld = normaliseStatus(statusOld);
  const transitionKey = `${normalizedOld}|${normalizedNew}`;

  const transitionMessage =
    transitionMessages.get(transitionKey) ||
    STATUS_GUIDANCE[normalizedNew] ||
    'We have updated the status of your application. You will receive further updates as they happen.';

  const nextSteps =
    STATUS_GUIDANCE[normalizedNew] ||
    'Our recruitment team will keep you informed about the next steps.';

  const applicationUrl = clientId ? `${appUrl.replace(/\/$/, '')}/client/${clientId}` : appUrl;

  const subject = `Your application status is now: ${currentStatus}`;

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 32px;">
      <div style="max-width: 640px; margin: 0 auto;">
        ${buildPrimarySection(`
          <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">Hi ${clientName || 'there'},</p>
          <p style="margin: 0 0 16px 0; color: #334155;">
            ${transitionMessage}
          </p>
          <div style="margin: 24px 0;">
            ${emailButton('View your application', applicationUrl)}
          </div>
          <div style="background-color: #f1f5f9; border-radius: 10px; padding: 16px;">
            ${buildMetaRow('Previous status', previousStatus)}
            ${buildMetaRow('Current status', currentStatus)}
            ${buildMetaRow('Next steps', nextSteps)}
          </div>
          <p style="margin: 24px 0 0 0; color: #334155;">
            If you have any questions, reply to this email or contact your Breakwaters recruitment officer.
          </p>
        `)}
        ${emailFooter()}
      </div>
    </div>
  `;

  const text = [
    `Hi ${clientName || 'there'},`,
    '',
    transitionMessage,
    '',
    `Previous status: ${previousStatus}`,
    `Current status: ${currentStatus}`,
    `Next steps: ${nextSteps}`,
    '',
    `View your application: ${applicationUrl}`,
    '',
    'If you have any questions, reply to this email or contact your Breakwaters recruitment officer.',
    '',
    emailFooterText(),
  ].join('\n');

  return { subject, html, text };
};

const formatList = (value) => {
  if (!value) {
    return '';
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => safeString(item))
      .filter(Boolean)
      .join(', ');
  }

  return safeString(value)
    .split(/[,/|;]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
};

const truncateSkills = (skills) => {
  const formatted = formatList(skills);
  if (!formatted) {
    return '';
  }

  const parts = formatted.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 5) {
    return parts.join(', ');
  }

  return `${parts.slice(0, 5).join(', ')} (+${parts.length - 5} more)`;
};

const detailRow = (label, value) => `
  <tr>
    <td style="padding: 8px 12px; border: 1px solid #e2e8f0; background-color: #f8fafc; width: 35%; font-weight: 600; color: #0f172a;">
      ${label}
    </td>
    <td style="padding: 8px 12px; border: 1px solid #e2e8f0; color: #334155;">
      ${value || '<span style="color: #94a3b8;">Not provided</span>'}
    </td>
  </tr>
`;

export const buildClientSuggestedEmail = ({
  client,
  company,
  cvUrl,
  candidateDetailsUrl,
}) => {
  const appUrl = process.env.APP_URL || 'https://breakwatersrecruitment.co.za';
  const clientName = safeString(client?.full_name || client?.fullName);
  const companyName = safeString(company?.company_name || company?.companyName || company?.name) || 'your';
  const subject = `New client suggested: ${clientName || 'Breakwaters candidate'}`;

  const emailAddress = safeString(client?.email);
  const phoneNumber = safeString(client?.phone_number || client?.phoneNumber);
  const location = safeString(client?.location);
  const preferredRole = safeString(client?.preferred_role || client?.preferredRole);
  const education = safeString(client?.education);
  const linkedin = safeString(client?.linkedin_url || client?.linkedinUrl);
  const skills = truncateSkills(client?.skills);

  const trimmedCandidateLink =
    typeof candidateDetailsUrl === 'string' ? candidateDetailsUrl.trim() : '';
  const candidateUrl = trimmedCandidateLink || '';
  const fallbackPage = '';

  const actionButtons = [];

  if (cvUrl) {
    actionButtons.push(emailButton('Open CV (PDF)', cvUrl));
  }

  if (candidateUrl) {
    actionButtons.push(emailButton('View candidate details', candidateUrl));
  }

  const actions = actionButtons.join('<span style="display:inline-block;width:16px;"></span>');

  const detailsTable = `
    <table style="width:100%; border-collapse: collapse; margin: 16px 0;">
      <tbody>
        ${detailRow('Name', clientName || null)}
        ${detailRow('Email', emailAddress)}
        ${detailRow('Phone', phoneNumber)}
        ${detailRow('Location', location)}
        ${detailRow('Preferred role', preferredRole)}
        ${detailRow('Top skills', skills)}
        ${detailRow('Education', education)}
        ${detailRow(
          'LinkedIn',
          linkedin
            ? `<a href="${linkedin}" target="_blank" rel="noopener noreferrer" style="color: #0d6efd;">${linkedin}</a>`
            : null
        )}
      </tbody>
    </table>
  `;

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 32px;">
      <div style="max-width: 680px; margin: 0 auto;">
        ${buildPrimarySection(`
          <p style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">Hello ${companyName} team,</p>
          <p style="margin: 0 0 16px 0; color: #334155;">
            We have identified a Breakwaters candidate that aligns with your hiring needs. The key details are summarised below.
          </p>
          ${detailsTable}
          ${
            actionButtons.length > 0
              ? `<div style="margin: 24px 0;">${actions}</div>`
              : '<p style="margin: 24px 0; color: #94a3b8;">CV link currently unavailable.</p>'
          }
          <p style="margin: 24px 0 0 0; color: #334155;">
            Reach out if you need more information or would like to arrange next steps with the candidate.
          </p>
        `)}
        ${emailFooter()}
      </div>
    </div>
  `;

  const textLines = [
    `Hello ${companyName} team,`,
    '',
    'We have identified a Breakwaters candidate that aligns with your hiring needs. The key details are below:',
    '',
    `Name: ${clientName || 'Not provided'}`,
    `Email: ${emailAddress || 'Not provided'}`,
    `Phone: ${phoneNumber || 'Not provided'}`,
    `Location: ${location || 'Not provided'}`,
    `Preferred role: ${preferredRole || 'Not provided'}`,
    `Top skills: ${skills || 'Not provided'}`,
    `Education: ${education || 'Not provided'}`,
    `LinkedIn: ${linkedin || 'Not provided'}`,
    '',
    `Open CV (PDF): ${cvUrl || 'Not available'}`,
    `View candidate details: ${candidateUrl || fallbackPage || 'Contact your Breakwaters partner for access.'}`,
    '',
    'Reach out if you need more information or would like to arrange next steps with the candidate.',
    '',
    emailFooterText(),
  ];

  const text = textLines.join('\n');

  return { subject, html, text };
};
