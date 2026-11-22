import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck, Crown, Briefcase, Wrench, UserRound } from 'lucide-react';
import { useAuth, homeFor } from '../context/AuthContext';
import './Auth.css';

const ROLE_TOUR = [
  { icon: Crown, role: 'Owner', text: 'Analytics, revenue, team and permissions.' },
  { icon: Briefcase, role: 'Manager', text: 'Bookings, schedule, invoices, complaints.' },
  { icon: Wrench, role: 'Technician', text: 'Today\'s jobs, directions and visit reports.' },
  { icon: UserRound, role: 'Customer', text: 'Bookings, invoices and treatment certificates.' },
];

export const AuthAside = () => (
  <aside className="auth-aside">
    <span className="auth-aside-kicker">PestKill Account</span>
    <h2>One sign-in.<br />The right tools for every role.</h2>
    <ul>
      {ROLE_TOUR.map(({ icon: Icon, role, text }) => (
        <li key={role}><span><Icon size={18} /></span><div><strong>{role}</strong><small>{text}</small></div></li>
      ))}
    </ul>
    <p className="auth-aside-note"><ShieldCheck size={15} /> Encrypted passwords, role-based access and a full audit trail.</p>
  </aside>
);

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const from = useLocation().state?.from;

  if (!loading && user) return <Navigate to={homeFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password);
      navigate(from && !from.startsWith('/login') ? from : homeFor(u), { replace: true });
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
            <span className="auth-icon"><ShieldCheck size={24} /></span>
            <h1>Welcome back</h1>
            <p>Sign in to your PestKill account.</p>
          </div>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <form onSubmit={submit} className="auth-form" noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input id="email" type="email" className="form-input" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="pw-field">
                <input id="password" type={show ? 'text' : 'password'} className="form-input" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy || !form.email || !form.password}>
              {busy ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="auth-footer">
            <p>New to PestKill? <Link to="/register">Create an account</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
