import { useEffect, useRef, useState } from 'react';
import { MailCheck, RotateCw, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import './SignupOtp.css';

// Normalises an Indian mobile number the same way the server does (drops +91 / 91 / 0).
export const cleanPhone = (v) => {
  let d = String(v || '').replace(/[\s()-]/g, '');
  if (d.startsWith('+91')) d = d.slice(3);
  else if (/^91\d{10}$/.test(d)) d = d.slice(2);
  else if (/^0\d{10}$/.test(d)) d = d.slice(1);
  return d;
};

// Quick checks before calling the server (the server repeats them and adds the abuse filter).
export const precheckSignup = ({ name, phone, password, confirm }) => {
  if (!name || name.trim().length < 2) return 'Please enter your full name.';
  if (/[0-9@#$%^*_=+<>{}[\]\\/|~`]/.test(name)) return 'Name can contain only letters, spaces, dots and hyphens.';
  const p = cleanPhone(phone);
  if (!/^\d{10}$/.test(p)) return 'Mobile number must be exactly 10 digits.';
  if (!/^[6-9]/.test(p)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  if (!password || password.length < 8) return 'Password must be at least 8 characters.';
  if (confirm !== undefined && password !== confirm) return 'Passwords do not match.';
  return '';
};

/** Two-step sign-up: send a code to the email, then create the account with that code. */
export const useSignupOtp = () => {
  const { register } = useAuth();
  const [stage, setStage] = useState('details'); // 'details' | 'otp'
  const [sent, setSent] = useState(null); // { email, devCode? }
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return undefined;
    const t = setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /** Returns the new user when no code is needed, otherwise null and moves to the code step. */
  const start = async (details) => {
    const body = { ...details, phone: cleanPhone(details.phone) };
    try {
      const r = await api('/users/register/start', { method: 'POST', body });
      if (r.otpRequired === false) return register(body);
      setSent(r);
      setStage('otp');
      setCooldown(60);
      return null;
    } catch (e) {
      if (e.status === 429 && /wait (\d+)/.test(e.message)) setCooldown(Number(e.message.match(/wait (\d+)/)[1]));
      throw e;
    }
  };
  const finish = (details, otp) => register({ ...details, phone: cleanPhone(details.phone), otp });
  const back = () => { setStage('details'); setSent(null); };
  return { stage, sent, cooldown, start, finish, back };
};

/** The code-entry screen. */
export const OtpStep = ({ sent, cooldown, onVerify, onResend, onBack, busy, error }) => {
  const [code, setCode] = useState('');
  const input = useRef(null);
  useEffect(() => { input.current?.focus(); }, []);
  const submit = (e) => { e.preventDefault(); if (code.length === 6) onVerify(code); };
  return (
    <form className="otp-step" onSubmit={submit} noValidate>
      <span className="otp-icon"><MailCheck size={26} /></span>
      <h2>Check your email</h2>
      <p>We sent a 6-digit code to <strong>{sent.email}</strong>. It is valid for 10 minutes.</p>
      {sent.devCode && <p className="otp-dev">Test mode (email not set up yet): your code is <strong>{sent.devCode}</strong></p>}
      <input
        ref={input}
        className="otp-input"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="6-digit verification code"
        placeholder="••••••"
        maxLength={6}
      />
      {error && <div className="auth-error" role="alert">{error}</div>}
      <button type="submit" className="btn btn-primary btn-lg" disabled={busy || code.length !== 6}>
        {busy ? 'Verifying…' : <><ShieldCheck size={18} /> Verify & create account</>}
      </button>
      <div className="otp-links">
        <button type="button" onClick={onBack}><ArrowLeft size={15} /> Change details</button>
        <button type="button" onClick={() => { setCode(''); onResend(); }} disabled={cooldown > 0 || busy}>
          <RotateCw size={15} /> {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
      <p className="otp-note">Didn't get it? Check the Spam/Promotions folder.</p>
    </form>
  );
};
