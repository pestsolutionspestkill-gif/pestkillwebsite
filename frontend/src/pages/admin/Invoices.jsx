import { useEffect, useState } from 'react';
import { Plus, Search, X, Printer, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useLoad, State, Badge, fmtDay, inr } from './shared';

const emptyItem = { description: '', qty: 1, unit: 'nos', rate: '' };

export const InvoiceForm = ({ lead, onClose, onCreated, notify }) => {
  const [form, setForm] = useState({
    customerName: lead?.name || '', customerPhone: lead?.phone || '', customerEmail: lead?.email || '',
    customerAddress: [lead?.address, lead?.city].filter(Boolean).join(', '), customerGstin: '', gstRate: 18, notes: '',
  });
  const [items, setItems] = useState([lead ? { description: lead.service || 'Pest control service', qty: lead.area_sqft || 1, unit: lead.area_sqft ? 'sq.ft.' : 'nos', rate: lead.area_sqft ? '' : (lead.amount || '') } : { ...emptyItem }]);
  const [busy, setBusy] = useState(false);

  const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const gst = (subtotal * Number(form.gstRate)) / 100;
  const setItem = (i, k, v) => setItems((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const inv = await api('/invoices', { method: 'POST', body: { ...form, leadId: lead?.id, gstRate: Number(form.gstRate), items } });
      notify(`Invoice ${inv.number} created`);
      onCreated(inv);
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };

  return (
    <div className="drawer-scrim" onMouseDown={onClose}>
      <aside className="drawer wide" onMouseDown={(e) => e.stopPropagation()} data-lenis-prevent>
        <header className="drawer-head">
          <div><span className="mono">{lead ? lead.ref : 'New invoice'}</span><h3>Create invoice</h3></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <form className="inv-form" onSubmit={submit}>
          <div className="inv-grid">
            <label>Customer name<input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required /></label>
            <label>Mobile<input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} required /></label>
            <label>Email<input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></label>
            <label>Customer GSTIN <small>(optional)</small><input value={form.customerGstin} onChange={(e) => setForm({ ...form, customerGstin: e.target.value })} /></label>
            <label className="span-2">Billing address<input value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} /></label>
          </div>

          <h4>Line items</h4>
          <div className="inv-items">
            <div className="inv-item head"><span>Description</span><span>Qty</span><span>Unit</span><span>Rate (₹)</span><span>Amount</span><span /></div>
            {items.map((it, i) => (
              <div key={i} className="inv-item">
                <input value={it.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Service description" required />
                <input type="number" min="0" step="any" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} required />
                <input value={it.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} />
                <input type="number" min="0" step="any" value={it.rate} onChange={(e) => setItem(i, 'rate', e.target.value)} required />
                <span className="inv-amount">{inr((Number(it.qty) || 0) * (Number(it.rate) || 0))}</span>
                <button type="button" className="icon-btn danger" disabled={items.length === 1} onClick={() => setItems(items.filter((_, idx) => idx !== i))} aria-label="Remove line"><Trash2 size={14} /></button>
              </div>
            ))}
            <button type="button" className="link-btn" onClick={() => setItems([...items, { ...emptyItem }])}><Plus size={14} /> Add line</button>
          </div>

          <div className="inv-bottom">
            <label>Notes<textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Warranty terms, payment details…" /></label>
            <dl className="inv-totals">
              <div><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
              <div><dt>GST <select value={form.gstRate} onChange={(e) => setForm({ ...form, gstRate: e.target.value })}>{[18, 12, 5, 0].map((r) => <option key={r} value={r}>{r}%</option>)}</select></dt><dd>{inr(gst)}</dd></div>
              <div className="grand"><dt>Total</dt><dd>{inr(subtotal + gst)}</dd></div>
            </dl>
          </div>
          <div className="drawer-foot">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Creating…' : 'Create invoice'}</button>
          </div>
        </form>
      </aside>
    </div>
  );
};

const Invoices = ({ notify, prefillLead, clearPrefill }) => {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(Boolean(prefillLead));
  useEffect(() => { if (prefillLead) setCreating(true); }, [prefillLead]);
  useEffect(() => { const t = setTimeout(() => setQuery(q), 300); return () => clearTimeout(t); }, [q]);
  const qs = new URLSearchParams(Object.entries({ q: query, status }).filter(([, v]) => v)).toString();
  const { data, setData, error, loading } = useLoad(`/invoices${qs ? `?${qs}` : ''}`);

  const setStatusFor = async (inv, s) => {
    if (s === 'void' && !window.confirm(`Void invoice ${inv.number}? This cannot be undone.`)) return;
    try {
      const updated = await api(`/invoices/${inv.id}`, { method: 'PATCH', body: { status: s } });
      setData((rows) => rows.map((r) => (r.id === inv.id ? updated : r)));
      notify(`Invoice marked ${s}`);
    } catch (e) { notify(e.message, 'error'); }
  };

  const close = () => { setCreating(false); clearPrefill?.(); };
  const totals = (data || []).filter((i) => i.status !== 'void').reduce((a, i) => ({ all: a.all + i.total, due: a.due + (i.status === 'unpaid' ? i.total : 0) }), { all: 0, due: 0 });

  return (
    <>
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input placeholder="Search invoice no., customer, phone" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="void">Void</option>
        </select>
        <span className="toolbar-count">{inr(totals.all)} billed · {inr(totals.due)} due</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}><Plus size={16} /> New invoice</button>
      </div>
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No invoices yet. Create one from a completed booking or start a new one.'}>
        <div className="table-wrap">
          <table className="adm-table static">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th /></tr></thead>
            <tbody>{data?.map((inv) => (
              <tr key={inv.id}>
                <td className="mono">{inv.number}</td>
                <td><strong>{inv.customer_name}</strong><small>{inv.customer_phone}</small></td>
                <td className="nowrap">{fmtDay(inv.issued_at)}</td>
                <td><strong>{inr(inv.total)}</strong><small>incl. GST {inv.gst_rate}%</small></td>
                <td><Badge value={inv.status} /></td>
                <td className="row-actions">
                  <a className="icon-btn" href={`/print/invoice/${inv.id}`} target="_blank" rel="noopener noreferrer" title="Print / PDF"><Printer size={15} /></a>
                  {inv.status === 'unpaid' && <button type="button" className="text-btn" onClick={() => setStatusFor(inv, 'paid')}>Mark paid</button>}
                  {inv.status !== 'void' && <button type="button" className="text-btn danger" onClick={() => setStatusFor(inv, 'void')}>Void</button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </State>
      {creating && <InvoiceForm lead={prefillLead} notify={notify} onClose={close} onCreated={(inv) => { setData((rows) => [inv, ...(rows || [])]); close(); }} />}
    </>
  );
};

export default Invoices;
