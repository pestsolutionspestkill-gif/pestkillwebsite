// One-time codes sent by email. Codes are stored only as a salted hash, expire after 10 minutes,
// allow 5 wrong attempts, and can be re-sent once a minute and at most 5 times an hour per email.
import crypto from 'crypto';
import db, { NOW } from '../db.js';

const TTL_MIN = 10;
const MAX_ATTEMPTS = 5;
const RESEND_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;

const fail = (message, status = 400, extra = {}) => Object.assign(new Error(message), { status, ...extra });
const hash = (salt, code) => crypto.createHash('sha256').update(`${salt}:${code}`).digest('hex');

/** Creates a fresh code for (email, purpose) and returns it. Enforces resend limits. */
export const issueOtp = async (email, purpose) => {
  const row = await db.get(`SELECT EXTRACT(EPOCH FROM (${NOW} - last_sent))::int AS since, sends,
      (window_start > ${NOW} - interval '1 hour') AS in_window
    FROM email_otps WHERE email = ? AND purpose = ?`, email, purpose);
  if (row && row.since < RESEND_SECONDS) throw fail(`Please wait ${RESEND_SECONDS - row.since} seconds before requesting another code.`, 429, { retryAfter: RESEND_SECONDS - row.since });
  if (row && row.in_window && row.sends >= MAX_SENDS_PER_HOUR) throw fail('Too many codes requested for this email. Please try again in an hour.', 429);

  const code = String(crypto.randomInt(100000, 1000000));
  const salt = crypto.randomBytes(12).toString('hex');
  const newWindow = !row || !row.in_window;
  await db.run(`INSERT INTO email_otps (email, purpose, salt, code_hash, attempts, sends, window_start, last_sent, expires_at)
      VALUES (?, ?, ?, ?, 0, 1, ${NOW}, ${NOW}, ${NOW} + interval '${TTL_MIN} minutes')
    ON CONFLICT (email, purpose) DO UPDATE SET salt = EXCLUDED.salt, code_hash = EXCLUDED.code_hash, attempts = 0,
      sends = ${newWindow ? '1' : 'email_otps.sends + 1'}, window_start = ${newWindow ? NOW : 'email_otps.window_start'},
      last_sent = EXCLUDED.last_sent, expires_at = EXCLUDED.expires_at`, email, purpose, salt, hash(salt, code));
  return code;
};

/** Checks a code; on success the code is used up. Throws a friendly error otherwise. */
export const verifyOtp = async (email, purpose, code) => {
  const input = String(code ?? '').replace(/\D/g, '');
  if (input.length !== 6) throw fail('Enter the 6-digit code sent to your email.');
  const row = await db.get(`SELECT salt, code_hash, attempts, (expires_at > ${NOW}) AS live FROM email_otps WHERE email = ? AND purpose = ?`, email, purpose);
  if (!row) throw fail('Please request a verification code first.');
  if (!row.live) throw fail('This code has expired. Please request a new one.');
  if (row.attempts >= MAX_ATTEMPTS) throw fail('Too many wrong attempts. Please request a new code.');
  const ok = crypto.timingSafeEqual(Buffer.from(hash(row.salt, input)), Buffer.from(row.code_hash));
  if (!ok) {
    await db.run('UPDATE email_otps SET attempts = attempts + 1 WHERE email = ? AND purpose = ?', email, purpose);
    const left = MAX_ATTEMPTS - row.attempts - 1;
    throw fail(left > 0 ? `Wrong code. ${left} ${left === 1 ? 'try' : 'tries'} left.` : 'Too many wrong attempts. Please request a new code.');
  }
  await db.run('DELETE FROM email_otps WHERE email = ? AND purpose = ?', email, purpose);
  return true;
};
