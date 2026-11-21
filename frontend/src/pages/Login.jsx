import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => { e.preventDefault(); setError(''); setLoading(true); try { await login(formData.email, formData.password); navigate('/dashboard'); } catch (err) { setError(err.message); } setLoading(false); };
  return (
    <div className="auth-page"><div className="auth-container"><div className="auth-card">
      <div className="auth-header"><h1>Welcome Back</h1><p>Login to your account</p></div>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group"><label className="form-label">Email</label><input type="email" name="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Password</label><input type="password" name="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required /></div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <div className="auth-footer"><p>Don't have an account? <Link to="/register">Register</Link></p></div>
    </div></div></div>
  );
};
export default Login;