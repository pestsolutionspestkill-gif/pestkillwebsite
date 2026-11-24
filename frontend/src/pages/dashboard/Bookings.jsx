import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Camera, HomeIcon, X, CheckCircle2, Clock, RotateCcw, FileText, FlaskConical, Hourglass } from 'lucide-react';
import { api } from '../../lib/api';
import { safeHomePlan, kindLabel, HOUSEHOLD_OPTIONS } from '../../data/safeHome';
import './Bookings.css';

const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const toDate = (s) => (s ? new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`) : null);
const fmt = (s) => (s ? toDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtTime = (d) => d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const TONE = { new: 'info', contacted: 'warning', scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
  open: 'warning', resolved: 'success', rejected: 'danger' };
const Badge = ({ value }) => <span className={`badge badge-${TONE[value] || 'neutral'}`}>{label(value)}</span>;
const CLAIM_TEXT = { open: 'Re-treatment requested', scheduled: 'Re-treatment visit booked', resolved: 'Re-treatment done', rejected: 'Claim declined' };

const Modal = ({ title, onClose, children }) => (
  <div className="bk-modal" onMouseDown={onClose}>
    <div className="bk-modal-card" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title} data-lenis-prevent>
      <header><h3>{title}</h3><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
      {children}
    </div>
  </div>
);

// Warranty wallet: days left as a bar, and a one-tap free re-treatment request.
const WarrantyWallet = ({ b, onClaim }) => {
  const w = b.warranty_status;
  if (!w) return null;
  const claim = b.last_claim;
  const openClaim = claim && ['open', 'scheduled'].includes(claim.status);
  const pct = Math.max(0, Math.min(100, (w.days_left / w.total_days) * 100));
  return (
    <div className={`bk-wallet ${w.active ? '' : 'ended'}`}>
      <div className="bk-wallet-top">
        <span><ShieldCheck size={16} /> {w.active ? <><strong>{w.days_left} days</strong> of warranty left</> : <>Warranty ended on {fmt(w.until)}</>}</span>
        <small>{b.warranty} · until {fmt(w.until)}</small>
      </div>
      <div className="bk-wallet-bar"><span style={{ width: `${pct}%` }} /></div>
      {claim && (
        <p className={`bk-claim ${claim.status}`}>
          <RotateCcw size={14} /> {CLAIM_TEXT[claim.status]}
          {claim.status === 'scheduled' && claim.scheduled_at ? ` for ${fmtTime(toDate(claim.scheduled_at))}` : ''}
          {claim.admin_note ? ` — ${claim.admin_note}` : ''}
        </p>
      )}
      {w.active && !openClaim && (
        <button type="button" className="btn btn-sm btn-navy" onClick={onClaim}><RotateCcw size={15} /> Pests are back? Request free re-treatment</button>
      )}
    </div>
  );
};

const ClaimForm = ({ b, onDone, onClose }) => {
  const [issue, setIssue] = useState('');
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const today = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { onDone(await api('/claims', { method: 'POST', body: { ref: b.ref, issue, preferredDate: date || null } })); } catch (err) { setError(err.message); }
    setBusy(false);
  };
  return (
    <Modal title="Free re-treatment under warranty" onClose={onClose}>
      <form className="bk-form" onSubmit={submit}>
        <p className="bk-muted">{b.service} · booking {b.ref}. Your warranty covers a free visit — no charge.</p>
        <label>What's happening?<textarea rows="4" value={issue} onChange={(e) => setIssue(e.target.value)} minLength={10} maxLength={1000} required placeholder="e.g. Cockroaches seen again in the kitchen at night since last week" /></label>
        <label>Preferred date <small>(optional)</small><input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || issue.trim().length < 10}>{busy ? 'Sending…' : 'Request free visit'}</button>
      </form>
    </Modal>
  );
};

const ProofView = ({ b, onClose }) => {
  const [proof, setProof] = useState(null);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(null);
  useEffect(() => { api(`/leads/${b.ref}/proof`).then(setProof).catch((e) => setError(e.message)); }, [b.ref]);
  const group = (kind) => proof?.photos.filter((p) => p.kind === kind) || [];
  return (
    <Modal title="Service proof" onClose={onClose}>
      {!proof && !error && <p className="bk-muted">Loading…</p>}
      {error && <p className="form-error">{error}</p>}
      {proof && (
        <div className="bk-proof">
          <dl>
            <div><dt>Service</dt><dd>{proof.service}</dd></div>
            {proof.technician_name && <div><dt>Technician</dt><dd>{proof.technician_name}</dd></div>}
            <div><dt>Completed</dt><dd>{proof.completed_at ? fmtTime(toDate(proof.completed_at)) : 'Not yet'}</dd></div>
            {proof.chemicals_used && <div><dt><FlaskConical size={13} /> Products used</dt><dd>{proof.chemicals_used}</dd></div>}
          </dl>
          {proof.completion_notes && <div className="bk-report"><FileText size={15} /><p>{proof.completion_notes}</p></div>}
          {['before', 'after'].map((kind) => group(kind).length > 0 && (
            <div key={kind}>
              <h4>{kind === 'before' ? 'Before treatment' : 'After treatment'}</h4>
              <div className="bk-photos">{group(kind).map((p) => <button type="button" key={p.id} onClick={() => setZoom(p.url)}><img src={p.url} alt={`${kind} treatment`} /></button>)}</div>
            </div>
          ))}
          {!proof.photos.length && !proof.completion_notes && <p className="bk-muted">The technician adds photos and a visit report during the visit.</p>}
        </div>
      )}
      {zoom && <button type="button" className="bk-zoom" onClick={() => setZoom(null)} aria-label="Close photo"><img src={zoom} alt="" /></button>}
    </Modal>
  );
};

// Live countdown to the suggested safe re-entry time after a spray treatment.
const ReentryTimer = ({ completedAt, hours }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  const done = toDate(completedAt);
  if (!done || !hours) return null;
  const safeAt = new Date(done.getTime() + hours * 3600e3);
  const left = safeAt.getTime() - now;
  if (left <= 0 || left > 24 * 3600e3) return null;
  const h = Math.floor(left / 3600e3);
  const m = Math.ceil((left % 3600e3) / 60000);
  return <div className="bk-timer"><Hourglass size={16} /> Suggested re-entry to treated rooms in <strong>{h ? `${h} h ` : ''}{m} min</strong> (from {safeAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})</div>;
};

const SafeHome = ({ b, onClose }) => {
  const plan = safeHomePlan(b.service, b.household);
  const who = HOUSEHOLD_OPTIONS.filter((o) => b.household?.[o.key]);
  return (
    <Modal title="Your Safe Home plan" onClose={onClose}>
      <div className="bk-safe">
        <p className="bk-muted">{b.service} · {kindLabel[plan.kind]}{who.length ? ` · for a home with ${who.map((o) => o.label.toLowerCase()).join(', ')}` : ''}</p>
        <div className="bk-safe-wait">
          <Clock size={18} />
          {plan.waitHours === 0 ? <span><strong>No need to leave home</strong> for this treatment.</span>
            : plan.waitHours == null ? <span>Our team gives you a written re-entry plan for fumigation.</span>
              : <span>Suggested: stay out of treated rooms for about <strong>{plan.waitHours} hours</strong>, or until surfaces are completely dry.</span>}
        </div>
        {b.status === 'completed' && <ReentryTimer completedAt={b.completed_at} hours={plan.waitHours} />}
        <h4>Before the visit</h4>
        <ul>{plan.before.map((t) => <li key={t}><CheckCircle2 size={15} /> {t}</li>)}</ul>
        <h4>After the treatment</h4>
        <ul>{plan.after.map((t) => <li key={t}><CheckCircle2 size={15} /> {t}</li>)}</ul>
        <p className="bk-note">General guidance. Your technician confirms timings for the exact products used, and the product label always comes first.</p>
      </div>
    </Modal>
  );
};

const BookingCard = ({ b, onUpdate }) => {
  const [open, setOpen] = useState(null); // 'claim' | 'proof' | 'safe'
  const hasProof = b.photo_count > 0 || b.has_report;
  return (
    <article className="bk-card">
      <div className="bk-top">
        <div>
          <span className="dash-ref">{b.ref}</span>
          <h3>{b.service || label(b.type)}</h3>
          <p>{[b.property, b.scheduled_at ? `Visit ${fmtTime(toDate(b.scheduled_at))}` : b.preferred_date && `Preferred ${b.preferred_date}`, !b.scheduled_at && b.preferred_slot].filter(Boolean).join(' · ') || 'Inspection request'}</p>
        </div>
        <div className="bk-side">
          <Badge value={b.status} />
          {b.estimate && <strong>{b.estimate}</strong>}
          <small>{b.completed_at ? `Done ${fmt(b.completed_at)}` : `Requested ${fmt(b.created_at)}`}</small>
        </div>
      </div>
      {b.status === 'completed' && <ReentryTimer completedAt={b.completed_at} hours={safeHomePlan(b.service, b.household).waitHours} />}
      <WarrantyWallet b={b} onClaim={() => setOpen('claim')} />
      <div className="bk-actions">
        {b.type === 'booking' && <button type="button" onClick={() => setOpen('safe')}><HomeIcon size={15} /> Safe Home plan</button>}
        {hasProof && <button type="button" onClick={() => setOpen('proof')}><Camera size={15} /> Service proof{b.photo_count ? ` (${b.photo_count} photos)` : ''}</button>}
        {b.status === 'completed' && <a href={`/print/certificate/${b.ref}`} target="_blank" rel="noopener noreferrer"><Award size={15} /> Certificate</a>}
      </div>
      {open === 'claim' && <ClaimForm b={b} onClose={() => setOpen(null)} onDone={(c) => { onUpdate({ ...b, last_claim: c }); setOpen(null); }} />}
      {open === 'proof' && <ProofView b={b} onClose={() => setOpen(null)} />}
      {open === 'safe' && <SafeHome b={b} onClose={() => setOpen(null)} />}
    </article>
  );
};

const Bookings = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/leads/mine').then(setData).catch((e) => { setError(e.message); setData([]); }); }, []);
  if (!data) return <p className="dash-muted">Loading…</p>;
  if (error) return <p className="form-error">{error}</p>;
  if (!data.length) return <div className="empty-state">No bookings yet. <Link to="/book">Book a service</Link> and track it here.</div>;
  const active = data.filter((b) => b.warranty_status?.active).length;
  return (
    <>
      {active > 0 && <p className="bk-summary"><ShieldCheck size={16} /> {active} service{active > 1 ? 's' : ''} under active warranty — request a free re-treatment any time from the card.</p>}
      <div className="dash-list">
        {data.map((b) => <BookingCard key={b.ref} b={b} onUpdate={(nb) => setData((rows) => rows.map((r) => (r.ref === nb.ref ? nb : r)))} />)}
      </div>
    </>
  );
};

export default Bookings;
