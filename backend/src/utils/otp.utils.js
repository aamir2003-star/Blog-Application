import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../config/mailer.js';

const OTP_LENGTH = 6;
const OTP_SALT_ROUNDS = 10; // Lower rounds than passwords — OTPs expire fast anyway

/**
 * Generate a cryptographically secure 6-digit OTP.
 * Uses crypto.randomInt for uniform distribution (no modulo bias).
 *
 * @returns {string} Zero-padded 6-digit string e.g. "042831"
 */
export const generateOTP = () => {
  const otp = crypto.randomInt(0, 10 ** OTP_LENGTH); // 0–999999
  return otp.toString().padStart(OTP_LENGTH, '0');
};


export const hashOTP = (otp) => bcrypt.hash(otp, OTP_SALT_ROUNDS);


export const verifyOTP = (plainOTP, hash) => bcrypt.compare(plainOTP, hash);

export const getOTPExpiry = () => {
  const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
  return new Date(Date.now() + minutes * 60 * 1000);
};


export const sendOTPEmail = async (to, name, otp) => {
  const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || '10';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Verification Code</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:10px 20px;">
                <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">⚡ Engineering Blog</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1a1a2e;border:1px solid #2d2d44;border-radius:16px;padding:40px 48px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;">
                Verify your email
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.6;">
                Hi ${name}, thanks for creating an account! Enter the code below to verify your email address and complete your registration.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#1e1b4b,#1e1035);border:1px solid #4f46e5;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#818cf8;text-transform:uppercase;letter-spacing:1.5px;">
                  Your verification code
                </p>
                <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
              </div>

              <!-- Expiry notice -->
              <div style="background-color:#1f1f2e;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:32px;">
                <p style="margin:0;font-size:13px;color:#fbbf24;">
                  ⏱ This code expires in <strong>${expiryMinutes} minutes</strong>. Do not share it with anyone.
                </p>
              </div>

              <!-- Footer note -->
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                If you didn't create an account on Engineering Blog, you can safely ignore this email.
                Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4b5563;">
                © ${new Date().getFullYear()} Engineering Blog. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await sendEmail({
    to,
    subject: `${otp} is your Engineering Blog verification code`,
    html,
  });
};

/**
 * Send a secure password reset email with a 6-digit OTP code.
 *
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP code string
 */
export const sendPasswordResetOTPEmail = async (to, name, otp) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;padding:10px 20px;">
                <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">⚡ Writen</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1a1a2e;border:1px solid #2d2d44;border-radius:16px;padding:40px 48px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;">
                Reset your password
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.6;">
                Hi ${name}, we received a request to reset the password for your Writen account. Enter the code below in the password reset panel.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#1e1b4b,#1e1035);border:1px solid #4f46e5;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#818cf8;text-transform:uppercase;letter-spacing:1.5px;">
                  Your password recovery code
                </p>
                <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
              </div>

              <!-- Expiry notice -->
              <div style="background-color:#1f1f2e;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:32px;">
                <p style="margin:0;font-size:13px;color:#fbbf24;">
                  ⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.
                </p>
              </div>

              <!-- Footer note -->
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email.
                Your current password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4b5563;">
                © ${new Date().getFullYear()} Writen. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await sendEmail({
    to,
    subject: `${otp} is your Writen password recovery code`,
    html,
  });
};


/**
 * Send a secure published post deletion warning email with a 6-digit OTP code.
 *
 * @param {string} to - Recipient email
 * @param {string} name - Recipient name
 * @param {string} postTitle - Title of the post requested for deletion
 * @param {string} otp - 6-digit OTP code string
 */
export const sendPostDeletionOTPEmail = async (to, name, postTitle, otp) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm Story Deletion</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f14;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <div style="display:inline-block;background:linear-gradient(135deg,#006d38,#00ba63);border-radius:12px;padding:10px 20px;">
                <span style="color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.5px;">⚡ Writen Security</span>
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#1a1a2e;border:1px solid #2d2d44;border-radius:16px;padding:40px 48px;">

              <!-- Greeting -->
              <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;">
                Confirm Story Deletion
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#9ca3af;line-height:1.6;">
                Hi ${name || 'Author'}, we received a request to permanently delete your published story: <strong>"${postTitle}"</strong>. Enter the verification code below in the delete confirmation panel.
              </p>

              <!-- OTP Box -->
              <div style="background:linear-gradient(135deg,#1e2e1e,#103510);border:1px solid #00ba63;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#4ae084;text-transform:uppercase;letter-spacing:1.5px;">
                  Your deletion verification code
                </p>
                <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:12px;color:#ffffff;font-family:'Courier New',monospace;">
                  ${otp}
                </p>
              </div>

              <!-- Expiry notice -->
              <div style="background-color:#2a1f1f;border-left:3px solid #ba1a1a;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:32px;">
                <p style="margin:0;font-size:13px;color:#ffdad6;">
                  ⚠️ This code expires in <strong>5 minutes</strong>. If you did not initiate this deletion, your account may be compromised. Please change your password immediately.
                </p>
              </div>

              <!-- Footer note -->
              <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
                If you didn't request this action, you can safely ignore this email. Your published story will remain online and unaffected.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#4b5563;">
                © ${new Date().getFullYear()} Writen. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await sendEmail({
    to,
    subject: `Confirm deletion of "${postTitle}" — ${otp}`,
    html,
  });
};


