import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => { e.preventDefault(); setError(''); if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; } setLoading(true); try { await register({ name: formData.name, email: formData.email, phone: formData.phone, password: formData.password }); navigate('/dashboard'); } catch (err) { setError(err.message); } setLoading(false); };
  return (
    <div className="auth-page"><div className="auth-container"><div className="auth-card">
      <div className="auth-header"><h1>Create Account</h1><p>Register to get started</p></div>
      {error && <div className="auth-error">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group"><label className="form-label">Name</label><input type="text" name="name" className="form-input" value={formData.name} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Email</label><input type="email" name="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Phone</label><input type="tel" name="phone" className="form-input" value={formData.phone} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Password</label><input type="password" name="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required minLength="6" /></div>
        <div className="form-group"><label className="form-label">Confirm Password</label><input type="password" name="confirmPassword" className="form-input" value={formData.confirmPassword} onChange={e => setFormData({...formData, [e.target.name]: e.target.value})} required /></div>
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Register'}</button>
      </form>
      <div className="auth-footer"><p>Already have an account? <Link to="/login">Login</Link></p></div>
    </div></div></div>
  );
};
export default Register;