import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ShieldCheck, ShieldX, QrCode, Search, CalendarDays, MapPin, FlaskConical, BadgeCheck } from 'lucide-react';
import { api } from '../lib/api';
import businessConfig from '../data/businessConfig';
import './Verify.css';

const day = (s) => (s ? new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

// Public page behind the QR code on every certificate.
const Verify = () => {
  const { ref } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(ref || '');
  const [state, setState] = useState({ loading: Boolean(ref), data: null, error: '' });

  useEffect(() => {
    if (!ref) return;
    setState({ loading: true, data: null, error: '' });
    api(`/verify/${encodeURIComponent(ref)}`)
      .then((data) => setState({ loading: false, data, error: '' }))
      .catch((e) => setState({ loading: false, data: null, error: e.status === 404 ? 'No certificate exists with this number. It may be fake — please contact us.' : e.message }));
  }, [ref]);

  const d = state.data;
  return (
    <div className="verify-page">
      <div className="verify-card">
        <span className="verify-badge"><QrCode size={15} /> Certificate verification</span>
        <h1>Is this PestKill certificate genuine?</h1>
        <form className="verify-search" onSubmit={(e) => { e.preventDefault(); if (input.trim()) navigate(`/verify/${encodeURIComponent(input.trim())}`); }}>
          <Search size={18} />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Certificate number, e.g. PK-CERT-PK1AB23CD" aria-label="Certificate number" />
          <button type="submit" className="btn btn-primary btn-sm">Verify</button>
        </form>

        {state.loading && <p className="verify-muted">Checking…</p>}
        {state.error && <div className="verify-result bad"><ShieldX size={34} /><div><h2>Not verified</h2><p>{state.error}</p></div></div>}
        {d && !d.valid && <div className="verify-result bad"><ShieldX size={34} /><div><h2>Not issued</h2><p>{d.error}</p></div></div>}
        {d?.valid && (
          <>
            <div className="verify-result ok">
              <ShieldCheck size={38} />
              <div>
                <h2>Genuine certificate</h2>
                <p>Issued by {businessConfig.businessName} · <strong>{d.number}</strong></p>
              </div>
            </div>
            <dl className="verify-grid">
              <div><dt>Customer</dt><dd>{d.customer}</dd></div>
              <div><dt><MapPin size={14} /> City</dt><dd>{d.city || '—'}</dd></div>
              <div><dt>Service</dt><dd>{d.service || 'Pest control'}</dd></div>
              <div><dt>Property</dt><dd>{d.property || '—'}{d.area_sqft ? ` · ${d.area_sqft} sq.ft.` : ''}</dd></div>
              <div><dt><CalendarDays size={14} /> Treated on</dt><dd>{day(d.treated_on)}</dd></div>
              <div><dt><FlaskConical size={14} /> Products</dt><dd>{d.products || '—'}</dd></div>
              <div className={`span-2 warranty ${d.warranty_status?.active ? 'on' : ''}`}>
                <dt><BadgeCheck size={14} /> Warranty</dt>
                <dd>{d.warranty_status
                  ? d.warranty_status.active
                    ? `${d.warranty} — active until ${day(d.warranty_status.until)} (${d.warranty_status.days_left} days left)`
                    : `${d.warranty} — ended on ${day(d.warranty_status.until)}`
                  : d.warranty || 'As per service agreement'}</dd>
              </div>
            </dl>
            <p className="verify-muted">For privacy, the customer name is partly hidden and the address is not shown.</p>
          </>
        )}
        {!ref && <p className="verify-muted">Scan the QR code on a PestKill treatment certificate, or type the certificate number above.</p>}
        <p className="verify-foot">Questions? Call <a href={`tel:${businessConfig.phoneNumber}`}>{businessConfig.phoneNumber}</a> · <Link to="/">pestkill home</Link></p>
      </div>
    </div>
  );
};

export default Verify;
