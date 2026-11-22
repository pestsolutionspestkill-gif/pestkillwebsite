import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useLocation } from 'react-router-dom';
import { Printer, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import businessConfig from '../../data/businessConfig';
import { founder } from '../../components/Founder';
import './PrintDocs.css';

const SAC_PEST_CONTROL = '998531';
const inr = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (s) => (s ? new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// Indian-system amount in words, e.g. 1770 -> "One Thousand Seven Hundred Seventy Rupees Only"
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const three = (n) => `${n >= 100 ? `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? ' ' : ''}` : ''}${n % 100 ? two(n % 100) : ''}`;
export const inWords = (amount) => {
  let n = Math.floor(amount);
  const paise = Math.round((amount - n) * 100);
  if (n === 0 && !paise) return 'Zero Rupees Only';
  const parts = [];
  [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']].forEach(([v, w]) => { if (n >= v) { parts.push(`${two(Math.floor(n / v))} ${w}`); n %= v; } });
  if (n) parts.push(three(n));
  return `${parts.join(' ')} Rupees${paise ? ` and ${two(paise)} Paise` : ''} Only`;
};

const useDoc = (path) => {
  const [state, setState] = useState({ data: null, error: '' });
  useEffect(() => { api(path).then((data) => setState({ data, error: '' })).catch((e) => setState({ data: null, error: e.message })); }, [path]);
  return state;
};

const Toolbar = ({ back }) => (
  <div className="doc-toolbar">
    <Link to={back} className="doc-back"><ArrowLeft size={16} /> Back</Link>
    <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer size={16} /> Print / Save as PDF</button>
  </div>
);

const Letterhead = ({ title, number, date }) => {
  const { businessName, officeAddress, phoneNumber, email, gstin, licenceNumber } = businessConfig;
  return (
    <header className="doc-head">
      <div className="doc-brand">
        <span className="doc-mark"><ShieldCheck size={22} /></span>
        <div>
          <strong>{businessName}</strong>
          <span>{officeAddress}</span>
          <span>{phoneNumber} · {email}</span>
          {gstin && <span>GSTIN: {gstin}</span>}
          {licenceNumber && <span>Pest Control Licence: {licenceNumber}</span>}
        </div>
      </div>
      <div className="doc-title">
        <h1>{title}</h1>
        <span>No. <strong>{number}</strong></span>
        <span>Date: <strong>{date}</strong></span>
      </div>
    </header>
  );
};

const Guard = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="doc-state">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
};

export const PrintInvoice = () => {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const { data: inv, error } = useDoc(`/invoices/${id}`);
  const back = isStaff ? '/admin' : '/dashboard';
  const half = inv ? inv.gst_rate / 2 : 0;

  return (
    <Guard>
      <div className="doc-page">
        <Toolbar back={back} />
        {error && <div className="doc-state">{error}</div>}
        {inv && (
          <article className="doc a4">
            {inv.status === 'paid' && <span className="doc-stamp paid">PAID</span>}
            {inv.status === 'void' && <span className="doc-stamp void">VOID</span>}
            <Letterhead title={businessConfig.gstin ? 'Tax Invoice' : 'Invoice'} number={inv.number} date={day(inv.issued_at)} />
            <section className="doc-parties">
              <div>
                <h4>Bill to</h4>
                <strong>{inv.customer_name}</strong>
                {inv.customer_address && <span>{inv.customer_address}</span>}
                <span>{inv.customer_phone}{inv.customer_email ? ` · ${inv.customer_email}` : ''}</span>
                {inv.customer_gstin && <span>GSTIN: {inv.customer_gstin}</span>}
              </div>
              <div>
                <h4>Payment</h4>
                <span>Status: <strong>{inv.status.toUpperCase()}</strong></span>
                {inv.paid_at && <span>Paid on {day(inv.paid_at)}</span>}
                <span>Place of supply: Rajasthan</span>
              </div>
            </section>
            <table className="doc-table">
              <thead><tr><th>#</th><th>Description</th><th>SAC</th><th className="num">Qty</th><th>Unit</th><th className="num">Rate</th><th className="num">Amount</th></tr></thead>
              <tbody>
                {inv.items.map((it, i) => (
                  <tr key={i}><td>{i + 1}</td><td>{it.description}</td><td>{SAC_PEST_CONTROL}</td><td className="num">{it.qty}</td><td>{it.unit}</td><td className="num">{inr(it.rate)}</td><td className="num">{inr(it.amount)}</td></tr>
                ))}
              </tbody>
            </table>
            <section className="doc-sum">
              <p className="doc-words"><span>Amount in words</span>{inWords(inv.total)}</p>
              <dl>
                <div><dt>Subtotal</dt><dd>{inr(inv.subtotal)}</dd></div>
                {inv.gst_rate > 0 && <div><dt>CGST @ {half}%</dt><dd>{inr(inv.gst_amount / 2)}</dd></div>}
                {inv.gst_rate > 0 && <div><dt>SGST @ {half}%</dt><dd>{inr(inv.gst_amount / 2)}</dd></div>}
                <div className="grand"><dt>Total</dt><dd>{inr(inv.total)}</dd></div>
              </dl>
            </section>
            {inv.notes && <p className="doc-notes"><strong>Notes:</strong> {inv.notes}</p>}
            <footer className="doc-foot">
              <span>This is a computer-generated invoice.</span>
              <div className="doc-sign"><span>For {businessConfig.businessName}</span><strong>{founder.name}</strong><span>{founder.title}</span></div>
            </footer>
          </article>
        )}
      </div>
    </Guard>
  );
};

export const PrintCertificate = () => {
  const { ref } = useParams();
  const { isStaff } = useAuth();
  const { data: c, error } = useDoc(`/leads/${ref}/certificate`);
  return (
    <Guard>
      <div className="doc-page">
        <Toolbar back={isStaff ? '/admin' : '/dashboard'} />
        {error && <div className="doc-state">{error}</div>}
        {c && (
          <article className="doc a4 cert">
            <div className="cert-border">
              <Letterhead title="Certificate of Treatment" number={c.number} date={day(c.completed_at)} />
              <p className="cert-lead">This is to certify that professional <strong>{c.service || 'pest control treatment'}</strong> was carried out by {businessConfig.businessName} at the premises below, using approved products applied by trained technicians.</p>
              <dl className="cert-grid">
                <div><dt>Customer</dt><dd>{c.name}</dd></div>
                <div><dt>Premises</dt><dd>{[c.address, c.city].filter(Boolean).join(', ') || '—'}</dd></div>
                <div><dt>Property</dt><dd>{c.property || '—'}{c.area_sqft ? ` · ${c.area_sqft} sq.ft.` : ''}</dd></div>
                <div><dt>Date of treatment</dt><dd>{day(c.completed_at)}</dd></div>
                <div><dt>Products used</dt><dd>{c.chemicals_used || '—'}</dd></div>
                <div><dt>Technician</dt><dd>{c.technician || '—'}</dd></div>
                <div className="warranty"><dt>Warranty</dt><dd>{c.warranty || 'As per service agreement'}</dd></div>
                <div><dt>Booking reference</dt><dd>{c.ref}</dd></div>
              </dl>
              {c.notes && <p className="cert-notes"><strong>Treatment report:</strong> {c.notes}</p>}
              <p className="cert-terms">The warranty is valid when the treated areas are not structurally altered and the customer reports any recurrence promptly. Free re-treatment is provided within the warranty period after inspection.</p>
              <footer className="cert-foot">
                <img src={founder.portrait} alt="" className="cert-photo" />
                <div className="doc-sign"><span>Authorised signatory</span><strong>{founder.name}</strong><span>{founder.title}, {founder.company}</span></div>
              </footer>
            </div>
          </article>
        )}
      </div>
    </Guard>
  );
};
