import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Clock, XCircle, ShieldCheck, ArrowRight, Store, FileCheck2, Upload, AlertTriangle } from 'lucide-react';
import { api, fileToDataUrl } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useBuyer } from '../hooks/useBuyer';
import { useSignupOtp, OtpStep, precheckSignup } from '../components/SignupOtp';
import './Shop.css';

const STATES = ['Rajasthan', 'Delhi', 'Haryana', 'Uttar Pradesh', 'Madhya Pradesh', 'Gujarat', 'Punjab', 'Maharashtra', 'Other'];
const EMPTY = { firmName: '', licenceNo: '', licenceValidTill: '', gstin: '', address: '', city: '', state: 'Rajasthan', pincode: '' };

const StatusCard = ({ buyer }) => {
  const map = {
    approved: [BadgeCheck, 'ok', 'Approved — you can order', 'Your PCO buyer account is verified. Browse the shop and order online.'],
    pending: [Clock, 'wait', 'Under review', 'We are checking your licence details. This usually takes one working day; we may call you.'],
    rejected: [XCircle, 'no', 'Needs changes', buyer.admin_note || 'Please correct your details and submit again.'],
  };
  if (buyer.licence_expired) map.approved = map.pending = [AlertTriangle, 'no', 'Licence expired', 'Ordering is paused. Upload your renewed licence and its new validity date below.'];
  const [Icon, tone, title, text] = map[buyer.status];
  return (
    <div className={`pco-status ${tone}`}>
      <Icon size={28} />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        <small>{buyer.firm_name} · Licence {buyer.licence_no}{buyer.licence_valid_till ? ` · valid till ${new Date(`${buyer.licence_valid_till}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}</small>
        {buyer.status === 'approved' && !buyer.licence_expired && buyer.licence_days_left != null && buyer.licence_days_left <= 30 && (
          <p className="pco-renew"><AlertTriangle size={14} /> Your licence expires in {buyer.licence_days_left} day{buyer.licence_days_left === 1 ? '' : 's'}. Renew it to keep ordering.</p>
        )}
      </div>
      {buyer.status === 'approved' && !buyer.licence_expired && <Link to="/shop" className="btn btn-primary btn-sm">Go to shop <ArrowRight size={15} /></Link>}
    </div>
  );
};

// File picker for licence / GST copies. Shows what is already on file.
const FileField = ({ label, hint, file, uploaded, required, onChange }) => (
  <label className="pco-file">
    {label}{!required && <small> (optional)</small>}
    <span className={`pco-file-box ${file || uploaded ? 'done' : ''}`}>
      {file ? <FileCheck2 size={18} /> : <Upload size={18} />}
      <span>{file ? file.name : uploaded ? 'Uploaded — choose a file to replace' : hint}</span>
    </span>
    <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" hidden onChange={(e) => onChange(e.target.files[0] || null)} />
  </label>
);

const PcoAccount = () => {
  const { user, loading } = useAuth();
  const { buyer: loaded } = useBuyer();
  // Keep the application just submitted, even if an earlier status request answers later.
  const [submitted, setSubmitted] = useState(null);
  const buyer = submitted || loaded;
  const [acct, setAcct] = useState({ name: '', email: '', phone: '', password: '' });
  const [firm, setFirm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [files, setFiles] = useState({ licence: null, gst: null });
  const hasDoc = (k) => (buyer?.documents || []).some((d) => d.kind === k);

  useEffect(() => {
    if (buyer) setFirm({ firmName: buyer.firm_name || '', licenceNo: buyer.licence_no || '', licenceValidTill: buyer.licence_valid_till || '', gstin: buyer.gstin || '', address: buyer.address || '', city: buyer.city || '', state: buyer.state || 'Rajasthan', pincode: buyer.pincode || '' });
  }, [buyer]);

  const otp = useSignupOtp();
  const acctDetails = () => ({ ...acct, name: acct.name.trim(), email: acct.email.trim() });

  const apply = async () => {
    // Upload the licence (and GST certificate) copies first, then send the application.
    for (const kind of ['licence', 'gst']) {
      if (files[kind]) await api(`/buyers/documents/${kind}`, { method: 'POST', body: { dataUrl: await fileToDataUrl(files[kind]) } });
    }
    const b = await api('/buyers/apply', { method: 'POST', body: firm });
    setFiles({ licence: null, gst: null });
    setSubmitted(b);
    setEditing(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // New visitors: first verify the email with a code, then the account is created and the application sent.
  const submit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!files.licence && !hasDoc('licence')) { setError('Upload a copy of your pest control licence (PDF or photo).'); return; }
    if (!user) {
      const problem = precheckSignup(acct);
      if (problem) { setError(problem); return; }
    }
    setBusy(true);
    try {
      if (!user) {
        const created = await otp.start(acctDetails());
        if (!created) { setBusy(false); return; } // waiting for the email code
      }
      await apply();
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  const verify = async (code) => {
    setBusy(true); setError('');
    try {
      await otp.finish(acctDetails(), code);
      await apply();
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  if (loading) return <div className="container pd-state"><span className="spinner" /></div>;
  const isStaff = user && user.role !== 'client';
  const showForm = !isStaff && (!buyer || buyer.status === 'rejected' || buyer.licence_expired || (buyer.status === 'pending' && editing));
  const f = (k) => ({ value: firm[k], onChange: (e) => setFirm({ ...firm, [k]: e.target.value }) });
  const a = (k) => ({ value: acct[k], onChange: (e) => setAcct({ ...acct, [k]: e.target.value }) });

  return (
    <div className="pco-page">
      <div className="container pco-grid">
        <div className="pco-intro">
          <span className="eyebrow"><Store size={14} /> PCO Buyer Account</span>
          <h1>Buy professional chemicals<br /><span className="text-gradient">as a verified PCO.</span></h1>
          <p>Insecticides for pest control are sold only to licensed operators. Register your firm once — after we verify your licence, you can order genuine Envu, Syngenta, Heranba, Arbuda and Kalyani products online.</p>
          <ol className="pco-steps">
            <li><strong>Apply</strong><span>Firm name, licence number and validity, a copy of the licence, and your delivery address.</span></li>
            <li><strong>Verification</strong><span>We check the licence copy and your GSTIN, usually within one working day.</span></li>
            <li><strong>Order</strong><span>Add to cart and order at MRP or your PCO price, with an invoice for every order.</span></li>
          </ol>
          <p className="pco-note"><ShieldCheck size={16} /> Your licence details are used only to verify your account.</p>
        </div>

        <div className="pco-card">
          {isStaff && <p>You are signed in as staff. Use a separate customer account to buy as a PCO.</p>}
          {buyer && <StatusCard buyer={buyer} />}
          {buyer?.status === 'pending' && !editing && <button type="button" className="text-link" onClick={() => setEditing(true)}>Edit application</button>}

          {showForm && !user && otp.stage === 'otp' && (
            <OtpStep sent={otp.sent} cooldown={otp.cooldown} busy={busy} error={error} onVerify={verify} onResend={submit} onBack={() => { setError(''); otp.back(); }} />
          )}
          {showForm && !(!user && otp.stage === 'otp') && (
            <form className="pco-form" onSubmit={submit}>
              {!user && (
                <>
                  <h3>Your login</h3>
                  <p className="pco-login">Already registered? <Link to="/login" state={{ from: '/pco-account' }}>Log in first</Link></p>
                  <div className="pco-row">
                    <label>Your name<input {...a('name')} required minLength={2} autoComplete="name" /></label>
                    <label>Mobile<input {...a('phone')} required inputMode="tel" autoComplete="tel" /></label>
                  </div>
                  <div className="pco-row">
                    <label>Email<input type="email" {...a('email')} required autoComplete="email" /></label>
                    <label>Password<input type="password" {...a('password')} required minLength={8} autoComplete="new-password" placeholder="At least 8 characters" /></label>
                  </div>
                </>
              )}
              <h3>Firm & licence</h3>
              <label>Firm / company name<input {...f('firmName')} required minLength={2} /></label>
              <div className="pco-row">
                <label>Pest control licence no.<input {...f('licenceNo')} required minLength={3} placeholder="As on your licence" /></label>
                <label>Licence valid till<input type="date" {...f('licenceValidTill')} required min={new Date().toISOString().slice(0, 10)} /></label>
              </div>
              <div className="pco-row">
                <FileField label="Licence copy" hint="PDF or photo, max 5 MB" file={files.licence} uploaded={hasDoc('licence')} required
                  onChange={(file) => setFiles({ ...files, licence: file })} />
                <FileField label="GST certificate" hint="Optional" file={files.gst} uploaded={hasDoc('gst')}
                  onChange={(file) => setFiles({ ...files, gst: file })} />
              </div>
              <label>GSTIN <small>(optional, for GST invoice)</small><input {...f('gstin')} maxLength={15} placeholder="08ABCDE1234F1Z5" /></label>
              <h3>Delivery address</h3>
              <label>Address<textarea rows="2" {...f('address')} required minLength={6} /></label>
              <div className="pco-row three">
                <label>City<input {...f('city')} required /></label>
                <label>State<select {...f('state')}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label>PIN code<input {...f('pincode')} inputMode="numeric" maxLength={6} /></label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? (user ? 'Submitting…' : 'Sending code…') : buyer ? 'Submit again for review' : user ? 'Submit application' : 'Continue — verify email'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PcoAccount;
