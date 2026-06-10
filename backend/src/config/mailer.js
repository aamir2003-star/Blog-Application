import nodemailer from 'nodemailer';

/**
 * Nodemailer transporter — configured from environment variables.
 *
 * Supports any SMTP provider. Default config is Gmail with App Password.
 *
 * Gmail setup (one-time):
 *   1. Enable 2-Step Verification on your Google account
 *   2. Visit: myaccount.google.com/apppasswords
 *   3. Generate an App Password for "Mail" → paste in SMTP_PASS
 *
 * Other providers (just change the SMTP_* vars in .env):
 *   - Outlook / Hotmail: smtp-mail.outlook.com : 587
 *   - SendGrid:          smtp.sendgrid.net      : 465
 *   - Mailgun:           smtp.mailgun.org       : 587
 */

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465');
  const secure = process.env.SMTP_SECURE === 'true'; // true = TLS (port 465), false = STARTTLS (port 587)

  const user = process.env.SMTP_USER || '';
  const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');

  // Detect unconfigured / placeholder credentials
  const isPlaceholder =
    !host ||
    !user ||
    !pass ||
    user.includes('your_gmail') ||
    pass.includes('your_16char');

  if (isPlaceholder) {
    console.warn(
      '⚠️  Email (SMTP) not configured — OTP codes will be printed to the console.\n' +
      '   To enable real email: set SMTP_HOST, SMTP_USER, SMTP_PASS in .env'
    );
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

const transporter = createTransporter();

/**
 * Send an email.
 * Falls back to console.log if SMTP is not configured (development convenience).
 *
 * @param {Object} options - { to, subject, html }
 */
export const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) {
    // Dev fallback — print the email content to the console
    console.log('\n📧 ─── EMAIL (no SMTP configured) ───────────────────────');
    console.log(`   To      : ${to}`);
    console.log(`   Subject : ${subject}`);
    // Extract OTP from HTML for quick reading
    const otpMatch = html.match(/\b\d{6}\b/);
    if (otpMatch) console.log(`   OTP     : ${otpMatch[0]}`);
    console.log('─────────────────────────────────────────────────────────\n');
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"Engineering Blog" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

export default transporter;
