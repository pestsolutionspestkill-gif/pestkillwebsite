import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CalendarCheck, MessageSquareWarning, Package, UserRound, LogOut, Plus, ArrowRight, CheckCircle, ReceiptText, Printer, Store, RotateCcw } from 'lucide-react';
import { useBuyer } from '../hooks/useBuyer';
import Bookings from './dashboard/Bookings';
import ReplacementForm, { ReplacementRequests } from './dashboard/Replacement';
import { useAuth } from '../context/AuthContext';
import { api, tokenStore } from '../lib/api';
import './Dashboard.css';

const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const fmt = (s) => (s ? new Date(`${s.replace(' ', 'T')}Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const TONE = { new: 'info', contacted: 'warning', scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger', pending: 'warning', resolved: 'success', closed: 'neutral', confirmed: 'info', processing: 'warning', shipped: 'info', delivered: 'success', unpaid: 'warning', paid: 'success', void: 'neutral' };
const Badge = ({ value }) => <span className={`badge badge-${TONE[value] || 'neutral'}`}>{label(value)}</span>;

const useList = (path) => {
  const [state, setState] = useState({ data: null, error: '' });
  const load = () => api(path).then((data) => setState({ data, error: '' })).catch((e) => setState({ data: [], error: e.message }));
  useEffect(() => { load(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, setState, reload: load };
};


const Complaints = () => {
  const { data, error, reload } = useList('/complaints/my-complaints');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', description: '' });
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ error: '', ok: '' });
    try {
      await api('/complaints', { method: 'POST', body: form });
      setForm({ subject: '', description: '' });
      setOpen(false);
      setMsg({ error: '', ok: 'Complaint registered. Our team will respond shortly.' });
      reload();
    } catch (err) { setMsg({ error: err.message, ok: '' }); }
    setBusy(false);
  };

  return (
    <>
      {msg.ok && <p className="dash-ok"><CheckCircle size={16} /> {msg.ok}</p>}
      {!open ? (
        <button type="button" className="btn btn-primary btn-sm dash-new" onClick={() => setOpen(true)}><Plus size={16} /> Register a complaint</button>
      ) : (
        <form className="dash-form" onSubmit={submit}>
          <input className="form-input" placeholder="Subject, e.g. Cockroaches seen again" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required minLength={3} />
          <textarea className="form-input" rows="4" placeholder="Describe the problem, where and since when" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={10} />
          {msg.error && <p className="form-error">{msg.error}</p>}
          <div className="dash-form-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</button>
          </div>
        </form>
      )}
      {!data ? <p className="dash-muted">Loading…</p> : error ? <p className="form-error">{error}</p> : !data.length ? (
        <div className="empty-state">You have no complaints. We hope it stays that way.</div>
      ) : (
        <div className="dash-list">
          {data.map((c) => (
            <article key={c.id} className="dash-card column">
              <div className="dash-card-row"><h3>{c.subject}</h3><Badge value={c.status} /></div>
              <p>{c.description}</p>
              {c.response && <div className="dash-reply"><strong>PestKill team</strong><p>{c.response}</p></div>}
              <small>Filed {fmt(c.created_at)}</small>
            </article>
          ))}
        </div>
      )}
    </>
  );
};

const PAY = { cod: 'cash on delivery', upi: 'UPI', bank: 'bank transfer' };

const Orders = () => {
  const { data, setState, error } = useList('/orders/my-orders');
  const reps = useList('/replacements/mine');
  const { buyer } = useBuyer();
  const [busy, setBusy] = useState(null);
  const [reporting, setReporting] = useState(null);
  const { add } = useCart();
  const navigate = useNavigate();
  // Puts the same products and quantities back in the cart (current prices apply).
  const reorder = (o) => { o.items.forEach((i) => add(i.product_id, i.quantity)); navigate('/cart'); };
  const cancel = async (o) => {
    if (!window.confirm(`Cancel order #${o.id}?`)) return;
    setBusy(o.id);
    try {
      const updated = await api(`/orders/${o.id}/cancel`, { method: 'POST' });
      setState((s) => ({ ...s, data: s.data.map((x) => (x.id === o.id ? updated : x)) }));
    } catch (e) { window.alert(e.message); }
    setBusy(null);
  };
  return (
    <>
      <div className={`dash-pco ${buyer?.status || 'none'}`}>
        <Store size={20} />
        <div>
          <strong>{buyer ? `PCO buyer account: ${label(buyer.status)}` : 'Buy professional chemicals'}</strong>
          <span>{buyer?.status === 'approved' ? `${buyer.firm_name} · Licence ${buyer.licence_no}` : buyer?.status === 'pending' ? 'We are verifying your licence details.' : buyer?.status === 'rejected' ? (buyer.admin_note || 'Please update your application.') : 'Licensed pest control operators can order Envu, Syngenta, Heranba, Arbuda and Kalyani products online.'}</span>
        </div>
        <Link to={buyer?.status === 'approved' ? '/shop' : '/pco-account'} className="btn btn-primary btn-sm">{buyer?.status === 'approved' ? 'Shop now' : buyer ? 'View application' : 'Apply'}</Link>
      </div>
      {!data ? <p className="dash-muted">Loading…</p> : error ? <p className="form-error">{error}</p> : !data.length ? (
        <div className="empty-state">No orders yet. <Link to="/shop">Visit the PCO shop</Link>.</div>
      ) : (
        <div className="dash-list">
          {data.map((o) => (
            <article key={o.id} className="dash-card column">
              <div className="dash-card-row">
                <div><span className="dash-ref">Order #{o.id} · {fmt(o.created_at)}</span><h3>₹{Number(o.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })} <small className="dash-muted">· {o.item_count || o.items?.length} items</small></h3></div>
                <Badge value={o.status} />
              </div>
              {o.items?.length > 0 && (
                <ul className="dash-items">
                  {o.items.map((i) => <li key={`${i.product_id}-${i.pack_size}`}><span>{i.brand} {i.name} · {i.pack_size} × {i.quantity}</span><span>₹{(i.price * i.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></li>)}
                </ul>
              )}
              <p>{[o.address, o.city, o.pincode].filter(Boolean).join(', ')}</p>
              <p className="dash-pay">Payment ({PAY[o.payment_method] || 'to be confirmed'}): {o.payment_status === 'paid' ? <strong>received{o.payment_ref ? ` · ref ${o.payment_ref}` : ''}</strong> : 'awaiting confirmation by our team'}</p>
              <ReplacementRequests requests={(reps.data || []).filter((r) => r.order_id === o.id)} />
              {reporting === o.id
                ? <ReplacementForm order={o} onDone={(r) => { setReporting(null); if (r) reps.reload(); }} />
                : ['shipped', 'delivered'].includes(o.status) && o.items?.length > 0 && <button type="button" className="text-btn" onClick={() => setReporting(o.id)}>Received an expired product? Request a replacement</button>}
              {o.admin_note && <div className="dash-reply"><strong>PestKill team</strong><p>{o.admin_note}</p></div>}
              {o.items?.length > 0 && o.status !== 'pending' && <button type="button" className="btn btn-outline btn-sm dash-cancel" onClick={() => reorder(o)}><RotateCcw size={14} /> Order again</button>}
              {o.status === 'pending' && <button type="button" className="btn btn-outline btn-sm dash-cancel" disabled={busy === o.id} onClick={() => cancel(o)}>{busy === o.id ? 'Cancelling…' : 'Cancel order'}</button>}
            </article>
          ))}
        </div>
      )}
    </>
  );
};

const Invoices = () => {
  const { data, error } = useList('/invoices/mine');
  if (!data) return <p className="dash-muted">Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!data.length) return <div className="empty-state">No invoices yet. Invoices for completed services appear here.</div>;
  return (
    <div className="dash-list">
      {data.map((i) => (
        <article key={i.id} className="dash-card">
          <div className="dash-card-main"><span className="dash-ref">{i.number}</span><h3>₹{Number(i.total).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</h3><p>Issued {fmt(i.issued_at)} · incl. GST {i.gst_rate}%</p></div>
          <div className="dash-card-side">
            <Badge value={i.status} />
            <a className="dash-doc-link" href={`/print/invoice/${i.id}`} target="_blank" rel="noopener noreferrer"><Printer size={14} /> View / download</a>
          </div>
        </article>
      ))}
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', address: user.address || '', city: user.city || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({});

  const saveProfile = async (e) => {
    e.preventDefault();
    try { setUser(await api('/users/profile', { method: 'PUT', body: form })); setMsg({ profile: 'Profile saved.' }); } catch (err) { setMsg({ profileError: err.message }); }
  };
  const savePassword = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/users/password', { method: 'PUT', body: pw });
      if (r?.token) tokenStore.set(r.token); // keep this device signed in; other devices are signed out
      setPw({ currentPassword: '', newPassword: '' }); setMsg({ password: r?.message || 'Password updated.' });
    } catch (err) { setMsg({ passwordError: err.message }); }
  };

  return (
    <div className="dash-profile">
      <form className="dash-panel" onSubmit={saveProfile}>
        <h3>Personal details</h3>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={user.email} disabled /></div>
        <div className="dash-grid">
          <div className="form-group"><label className="form-label">Full name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label className="form-label">Mobile</label><input className="form-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></div>
        </div>
        <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Used to pre-fill bookings" /></div>
        <div className="form-group"><label className="form-label">City</label><input className="form-input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
        {msg.profile && <p className="dash-ok"><CheckCircle size={16} /> {msg.profile}</p>}
        {msg.profileError && <p className="form-error">{msg.profileError}</p>}
        <button type="submit" className="btn btn-primary btn-sm">Save details</button>
      </form>
      <form className="dash-panel" onSubmit={savePassword}>
        <h3>Change password</h3>
        <div className="form-group"><label className="form-label">Current password</label><input type="password" className="form-input" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} required /></div>
        <div className="form-group"><label className="form-label">New password</label><input type="password" className="form-input" autoComplete="new-password" minLength={8} value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} required /></div>
        {msg.password && <p className="dash-ok"><CheckCircle size={16} /> {msg.password}</p>}
        {msg.passwordError && <p className="form-error">{msg.passwordError}</p>}
        <button type="submit" className="btn btn-navy btn-sm">Update password</button>
      </form>
    </div>
  );
};

const TABS = [
  { id: 'bookings', label: 'My bookings', icon: CalendarCheck, el: Bookings },
  { id: 'invoices', label: 'Invoices', icon: ReceiptText, el: Invoices },
  { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning, el: Complaints },
  { id: 'orders', label: 'Shop orders', icon: Package, el: Orders },
  { id: 'profile', label: 'Profile', icon: UserRound, el: Profile },
];

const Dashboard = () => {
  const { user, loading, logout, isStaff } = useAuth();
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab || 'bookings');

  if (loading) return <div className="dashboard-loading"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (isStaff) return <Navigate to="/admin" replace />;

  const Current = TABS.find((t) => t.id === tab).el;
  return (
    <div className="dashboard-page">
      <section className="dash-hero">
        <div className="container dash-hero-inner">
          <div>
            <span className="eyebrow light">My Account</span>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
            <p>Bookings, visit schedule, invoices and treatment certificates, all in one place.</p>
          </div>
          <Link to="/book" className="btn btn-primary">Book a service <ArrowRight size={16} /></Link>
        </div>
      </section>
      <div className="container dash-layout">
        <nav className="dash-tabs" aria-label="Account sections">
          {TABS.map(({ id, label: l, icon: Icon }) => (
            <button key={id} type="button" className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={17} /> {l}</button>
          ))}
          <button type="button" className="dash-logout" onClick={logout}><LogOut size={17} /> Sign out</button>
        </nav>
        <div className="dash-content"><Current /></div>
      </div>
    </div>
  );
};

export default Dashboard;
