import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowRight, Eye, EyeOff, MailCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth, homeFor } from '../context/AuthContext';
import { AuthAside } from './Login';
import './Auth.css';

/** Forgot password: email a 6-digit code, then set a new password with it. */
const ForgotPassword = () => {
  const { user, loading, startSession } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState('email');
  const [mail, setMail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  if (!loading && user) return <Navigate to={homeFor(user)} replace />;

  const requestCode = async (e) => {
    e?.preventDefault();
    setError(''); setBusy(true);
    try {
      const r = await api('/users/password/forgot', { method: 'POST', body: { email: mail.trim() } });
      setNote(r.devCode ? `${r.message} (Development code: ${r.devCode})` : r.message);
      setStage('code');
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  const reset = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const r = await api('/users/password/reset', { method: 'POST', body: { email: mail.trim(), otp, newPassword } });
      const u = startSession(r);
      navigate(homeFor(u), { replace: true });
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-container split">
        <AuthAside />
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">{stage === 'email' ? <KeyRound size={24} /> : <MailCheck size={24} />}</span>
            <h1>{stage === 'email' ? 'Reset your password' : 'Check your email'}</h1>
            <p>{stage === 'email' ? 'Enter the email you registered with. We will send you a 6-digit code.' : note}</p>
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}

          {stage === 'email' ? (
            <form onSubmit={requestCode} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-email">Email</label>
                <input id="fp-email" type="email" className="form-input" autoComplete="email" value={mail} onChange={(e) => setMail(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={busy || !mail.trim()}>
                {busy ? 'Sending…' : <>Send code <ArrowRight size={18} /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={reset} className="auth-form" noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-otp">6-digit code</label>
                <input id="fp-otp" className="form-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fp-pass">New password</label>
                <div className="pw-field">
                  <input id="fp-pass" type={show ? 'text' : 'password'} className="form-input" autoComplete="new-password" minLength={8}
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" required />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={busy || otp.length !== 6 || newPassword.length < 8}>
                {busy ? 'Saving…' : <>Set new password <ArrowRight size={18} /></>}
              </button>
              <button type="button" className="text-link" onClick={() => requestCode()} disabled={busy}>Send a new code</button>
            </form>
          )}
          <div className="auth-footer">
            <p>Remembered it? <Link to="/login">Back to log in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
