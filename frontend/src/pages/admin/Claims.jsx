import { useState } from 'react';
import { Phone, MapPin, CalendarDays, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useLoad, State, Badge, fmtDate, fmtDay, label } from './shared';

const toLocalInput = (s) => {
  if (!s) return '';
  const d = new Date(s);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const ClaimCard = ({ c, onSaved, notify }) => {
  const { can } = useAuth();
  const [when, setWhen] = useState(toLocalInput(c.scheduled_at) || (c.preferred_date ? `${c.preferred_date}T10:00` : ''));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const update = async (status) => {
    if (status === 'rejected' && !note.trim()) { notify('Write a reason before declining.', 'error'); return; }
    setBusy(true);
    try {
      const body = { status, adminNote: note.trim() || undefined };
      if (status === 'scheduled') body.scheduledAt = when ? new Date(when).toISOString() : null;
      const row = await api(`/claims/${c.id}`, { method: 'PATCH', body });
      onSaved({ ...c, ...row });
      setNote('');
      notify(`Claim ${label(status).toLowerCase()}`);
    } catch (e) { notify(e.message, 'error'); }
    setBusy(false);
  };
  const closed = ['resolved', 'rejected'].includes(c.status);
  return (
    <article className="panel claim-card">
      <header>
        <div><span className="mono">{c.ref}</span><h3>{c.service}</h3><small>{c.name} · claimed {fmtDate(c.created_at)}</small></div>
        <Badge value={c.status} />
      </header>
      <p className="claim-issue">“{c.issue}”</p>
      <dl className="detail-list">
        <div><dt>Warranty</dt><dd>{c.warranty || '—'} · treated {fmtDay(c.completed_at)}</dd></div>
        <div><dt>Preferred</dt><dd>{c.preferred_date || 'Any day'}</dd></div>
        <div><dt>Technician</dt><dd>{c.technician_name || '—'}</dd></div>
        <div><dt>Address</dt><dd><MapPin size={13} /> {[c.address, c.city].filter(Boolean).join(', ') || '—'}</dd></div>
        {c.scheduled_at && <div><dt>Visit</dt><dd><CalendarDays size={13} /> {fmtDate(c.scheduled_at)}</dd></div>}
        {c.admin_note && <div><dt>Note</dt><dd>{c.admin_note}</dd></div>}
      </dl>
      <div className="drawer-docs"><a className="btn btn-sm btn-navy" href={`tel:${c.phone}`}><Phone size={14} /> {c.phone}</a></div>
      {!closed && can('services.manage') && (
        <div className="claim-actions">
          <label>Re-treatment visit<input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></label>
          <label>Note to customer <small>(required to decline)</small><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Technician Ravi will visit with gel bait" /></label>
          <div className="drawer-docs">
            <button type="button" className="btn btn-sm btn-primary" disabled={busy || !when} onClick={() => update('scheduled')}><RotateCcw size={14} /> {c.status === 'scheduled' ? 'Reschedule' : 'Schedule visit'}</button>
            {c.status === 'scheduled' && <button type="button" className="btn btn-sm btn-outline" disabled={busy} onClick={() => update('resolved')}><CheckCircle size={14} /> Mark resolved</button>}
            <button type="button" className="text-btn danger" disabled={busy} onClick={() => update('rejected')}><XCircle size={14} /> Decline</button>
          </div>
        </div>
      )}
    </article>
  );
};

const Claims = ({ notify }) => {
  const [status, setStatus] = useState('');
  const { data, setData, error, loading } = useLoad(`/claims${status ? `?status=${status}` : ''}`);
  const open = (data || []).filter((c) => c.status === 'open').length;
  return (
    <>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All claims</option><option value="open">Open</option><option value="scheduled">Scheduled</option><option value="resolved">Resolved</option><option value="rejected">Declined</option>
        </select>
        {open > 0 && <span className="toolbar-count">{open} waiting for a visit date</span>}
      </div>
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No warranty claims. Customers can request a free re-treatment from their dashboard while the warranty is active.'}>
        <div className="buyer-cards">{data?.map((c) => <ClaimCard key={c.id} c={c} notify={notify} onSaved={(row) => setData((rows) => rows.map((r) => (r.id === row.id ? row : r)))} />)}</div>
      </State>
    </>
  );
};

export default Claims;
