import nodemailer from 'nodemailer';

const transientErrorCodes = new Set([
  'ETIMEDOUT',
  'ESOCKETTIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EAI_AGAIN',
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normaliseRecipient = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
  }

  if (typeof value === 'object' && value.address) {
    const address = normaliseRecipient(value.address);
    if (!address) {
      return null;
    }

    const name = typeof value.name === 'string' ? value.name.trim() : '';
    return name ? { name, address } : { address };
  }

  return null;
};

const normaliseRecipients = (recipients) => {
  if (!recipients) {
    return [];
  }

  if (Array.isArray(recipients)) {
    return recipients
      .map((entry) => normaliseRecipient(entry))
      .filter(Boolean);
  }

  const single = normaliseRecipient(recipients);
  return single ? [single] : [];
};

const resolvePort = () => {
  const value = Number(process.env.MAIL_PORT || 587);
  return Number.isFinite(value) && value > 0 ? value : 587;
};

const buildTransporter = () => {
  const host = process.env.MAIL_HOST;
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error('Mail transport is not fully configured. Please set MAIL_HOST, MAIL_USER and MAIL_PASS.');
  }

  const port = resolvePort();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
};

let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  cachedTransporter = buildTransporter();
  return cachedTransporter;
};

const isTransientError = (error) => {
  if (!error) {
    return false;
  }

  if (error.code && transientErrorCodes.has(error.code)) {
    return true;
  }

  const responseCode = Number(error.responseCode);
  return Number.isInteger(responseCode) && responseCode >= 500 && responseCode < 600;
};

const logFailure = (error, meta) => {
  const base = {
    to: meta?.to,
    subject: meta?.subject,
    code: error?.code,
    responseCode: error?.responseCode,
    command: error?.command,
    message: error?.message,
  };
  console.error('[mailer] Failed to send email', base);
};

const logSuccess = (result, meta) => {
  console.info('[mailer] Sent email', {
    to: meta?.to,
    subject: meta?.subject,
    messageId: result?.messageId,
  });
};

export const emailButton = (label, href) => {
  const safeLabel = typeof label === 'string' ? label.trim() : '';
  const safeHref = typeof href === 'string' ? href.trim() : '';

  if (!safeLabel || !safeHref) {
    return '';
  }

  return `
    <a
      href="${safeHref}"
      target="_blank"
      rel="noopener noreferrer"
      style="
        display: inline-block;
        padding: 12px 20px;
        background-color: #0d6efd;
        color: #ffffff;
        text-decoration: none;
        border-radius: 6px;
        font-weight: 600;
      "
    >
      ${safeLabel}
    </a>
  `;
};

export const emailFooter = () => {
  const appUrl = process.env.APP_URL || '#';
  return `
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px;">
      Do not reply to this email. For more information, visit
      <a href="${appUrl}" target="_blank" rel="noopener noreferrer" style="color: #0d6efd;">
        ${appUrl}
      </a>.
    </p>
  `;
};

export const emailFooterText = () => {
  const appUrl = process.env.APP_URL || '#';
  return `Do not reply to this email. Learn more at ${appUrl}`;
};

export const sendMail = async ({ to, subject, html, text, attachments, from, replyTo }) => {
  const recipients = normaliseRecipients(to);

  if (!recipients.length) {
    console.warn('[mailer] No valid recipients provided, email skipped', { subject });
    return;
  }

  if (!subject) {
    console.warn('[mailer] No subject provided, email skipped', { to: recipients });
    return;
  }

  const transporter = getTransporter();
  const mailOptions = {
    to: recipients,
    subject,
    html,
    text,
    from: from || process.env.MAIL_FROM || process.env.MAIL_USER,
    replyTo,
    attachments,
  };

  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await transporter.sendMail(mailOptions);
      logSuccess(result, { to: recipients, subject });
      return result;
    } catch (error) {
      lastError = error;
      logFailure(error, { to: recipients, subject });

      if (attempt === 0 && isTransientError(error)) {
        cachedTransporter = null;
        continue;
      }

      break;
    }
  }

  if (lastError) {
    throw lastError;
  }
};
