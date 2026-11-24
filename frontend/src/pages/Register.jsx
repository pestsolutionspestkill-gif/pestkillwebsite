import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth, homeFor } from '../context/AuthContext';
import { useSignupOtp, OtpStep, precheckSignup } from '../components/SignupOtp';
import { AuthAside } from './Login';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { user, loading } = useAuth();
  const otp = useSignupOtp();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to={homeFor(user)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const details = () => ({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });

  const sendCode = async (e) => {
    e?.preventDefault();
    setError('');
    const problem = precheckSignup(form);
    if (problem) return setError(problem);
    setBusy(true);
    try {
      const created = await otp.start(details());
      if (created) navigate('/dashboard', { replace: true });
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  const verify = async (code) => {
    setError('');
    setBusy(true);
    try {
      await otp.finish(details(), code);
      navigate('/dashboard', { replace: true });
    } catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-container split">
        <AuthAside />
        <div className="auth-card">
          {otp.stage === 'otp' ? (
            <OtpStep sent={otp.sent} cooldown={otp.cooldown} busy={busy} error={error}
              onVerify={verify} onResend={sendCode} onBack={() => { setError(''); otp.back(); }} />
          ) : (
            <>
              <div className="auth-header">
                <span className="auth-icon"><UserPlus size={24} /></span>
                <h1>Create your account</h1>
                <p>Book faster and track every service in one place.</p>
              </div>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <form onSubmit={sendCode} className="auth-form" noValidate>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Full name</label>
                  <input id="name" className="form-input" autoComplete="name" value={form.name} onChange={set('name')} maxLength={60} required />
                  <p className="field-hint">As on your ID — letters only.</p>
                </div>
                <div className="auth-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">Email</label>
                    <input id="email" type="email" className="form-input" autoComplete="email" value={form.email} onChange={set('email')} required />
                    <p className="field-hint">We'll send a code to verify it.</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="phone">Mobile</label>
                    <input id="phone" type="tel" inputMode="numeric" className="form-input" autoComplete="tel" placeholder="10-digit number" value={form.phone} onChange={set('phone')} maxLength={14} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">Password</label>
                  <div className="pw-field">
                    <input id="password" type={show ? 'text' : 'password'} className="form-input" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required />
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm">Confirm password</label>
                  <input id="confirm" type={show ? 'text' : 'password'} className="form-input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                  {busy ? 'Sending code…' : <>Continue <ArrowRight size={18} /></>}
                </button>
              </form>
              <div className="auth-footer">
                <p>Already have an account? <Link to="/login">Sign in</Link></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
