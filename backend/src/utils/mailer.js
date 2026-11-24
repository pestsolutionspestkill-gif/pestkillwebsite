// Outgoing email. Free option: a Gmail account with an App Password
// (Google Account → Security → 2-Step Verification → App passwords), set as
//   GMAIL_USER=you@gmail.com  GMAIL_APP_PASSWORD=abcd efgh ijkl mnop
// Any other SMTP server works with SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS.
import nodemailer from 'nodemailer';

const config = () => {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || '';
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  return { user, pass, host, port };
};

export const mailConfigured = () => {
  const { user, pass } = config();
  return Boolean(user && pass);
};

// Live hosting (Render) or an explicit production flag.
export const isProduction = () => process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

let transporter;
const getTransporter = () => {
  if (!transporter) {
    const { user, pass, host, port } = config();
    transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, connectionTimeout: 15000 });
  }
  return transporter;
};

export const sendMail = async ({ to, subject, text, html }) => {
  const { user } = config();
  const from = process.env.MAIL_FROM || `"PestKill Pest Solutions" <${user}>`;
  return getTransporter().sendMail({ from, to, subject, text, html });
};

export const otpEmail = (code, name, purpose = 'register') => {
  const reset = purpose === 'reset';
  const first = String(name || '').split(' ')[0] || 'there';
  return {
    subject: reset ? `${code} is your PestKill password reset code` : `${code} is your PestKill verification code`,
    text: `Hello ${first},\n\nYour PestKill ${reset ? 'password reset' : 'verification'} code is ${code}. It is valid for 10 minutes.\n\nIf you did not request this, you can ignore this email.\n\nPestKill Pest Solutions, Jaipur`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:460px;margin:0 auto;padding:28px;color:#1d1d1f">
      <p style="margin:0 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#0b8a5f;font-weight:700">PestKill Pest Solutions</p>
      <h1 style="margin:0 0 16px;font-size:22px">${reset ? 'Reset your password' : 'Verify your email'}</h1>
      <p style="margin:0 0 18px;font-size:15px;color:#424245">Hello ${first.replace(/[<>&"]/g, '')}, use this code to ${reset ? 'set a new password' : 'finish creating your account'}:</p>
      <p style="margin:0 0 18px;font-size:34px;font-weight:700;letter-spacing:10px;background:#f5f5f7;border-radius:12px;padding:16px;text-align:center">${code}</p>
      <p style="margin:0 0 6px;font-size:13px;color:#6e6e73">The code is valid for 10 minutes. Never share it with anyone — PestKill staff will never ask for it.</p>
      <p style="margin:0;font-size:13px;color:#6e6e73">If you did not request this, you can ignore this email.</p>
    </div>`,
  };
};
