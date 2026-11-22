import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth, homeFor } from '../context/AuthContext';
import { AuthAside } from './Login';
import './Auth.css';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && user) return <Navigate to={homeFor(user)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone, password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container split">
        <AuthAside />
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon"><UserPlus size={24} /></span>
            <h1>Create your account</h1>
            <p>Book faster and track every service in one place.</p>
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <form onSubmit={submit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full name</label>
              <input id="name" className="form-input" autoComplete="name" value={form.name} onChange={set('name')} required />
            </div>
            <div className="auth-row">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" type="email" className="form-input" autoComplete="email" value={form.email} onChange={set('email')} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Mobile</label>
                <input id="phone" type="tel" inputMode="numeric" className="form-input" autoComplete="tel" placeholder="10 digits" value={form.phone} onChange={set('phone')} required />
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
              {busy ? 'Creating account…' : <>Create account <ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
