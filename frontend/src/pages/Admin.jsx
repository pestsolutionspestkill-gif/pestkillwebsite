import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, MessageSquareWarning, Briefcase, Users, UserCog, KeyRound, ScrollText,
  LogOut, Search, X, Phone, MessageCircle, Mail, MapPin, RefreshCw, Trash2, Plus, Lock, ShieldCheck, CheckCircle,
  BarChart3, CalendarDays, Wrench, ReceiptText, Award, Package, ShoppingBag, Store, RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, waLink } from '../lib/api';
import { fmtDate, label, STATUS_TONE, LEAD_STATUSES, Badge, useLoad, State } from './admin/shared';
import { Logo } from '../components/Navbar';
import Analytics from './admin/Analytics';
import Schedule from './admin/Schedule';
import MyJobs from './admin/MyJobs';
import Invoices from './admin/Invoices';
import { ShopProducts, ShopOrders, Buyers } from './admin/Shop';
import Claims from './admin/Claims';
import JobPhotos from './admin/JobPhotos';
import './Admin.css';

const COMPLAINT_STATUSES = ['pending', 'in_progress', 'resolved', 'closed'];
const APP_STATUSES = ['new', 'shortlisted', 'interview', 'hired', 'rejected'];

/* ---------- Overview ---------- */
const Overview = ({ go }) => {
  const { data, error, loading } = useLoad('/admin/stats');
  const s = data;
  return (
    <State loading={loading} error={error}>
      {s && (
        <>
          <div className="kpi-grid">
            <div className="kpi"><span>New today</span><strong>{s.leads.today}</strong><small>{s.leads.last7} in the last 7 days</small></div>
            <div className="kpi"><span>Open bookings</span><strong>{s.leads.byStatus.new + s.leads.byStatus.contacted + s.leads.byStatus.scheduled + s.leads.byStatus.in_progress}</strong><small>{s.leads.unassigned != null ? `${s.leads.unassigned} unassigned` : 'Assigned to you'}</small></div>
            {s.complaintsOpen != null && <div className="kpi"><span>Open complaints</span><strong>{s.complaintsOpen}</strong><small>Awaiting resolution</small></div>}
            {s.revenue ? (
              <div className="kpi dark"><span>Shop revenue</span><strong>₹{Math.round(s.revenue.total).toLocaleString('en-IN')}</strong><small>{s.revenue.orders} orders</small></div>
            ) : s.clients != null && <div className="kpi"><span>Customers</span><strong>{s.clients}</strong><small>Registered accounts</small></div>}
          </div>

          <div className="adm-grid-2">
            <section className="panel">
              <header className="panel-head"><h3>Recent bookings</h3><button type="button" className="link-btn" onClick={() => go('bookings')}>View all</button></header>
              {s.recent.length === 0 ? <p className="adm-muted">No bookings yet. They will appear here as soon as a customer books on the website.</p> : (
                <ul className="recent-list">
                  {s.recent.map((l) => (
                    <li key={l.id}>
                      <div><strong>{l.name}</strong><small>{l.service || label(l.type)} · {l.city || '—'}</small></div>
                      <div className="recent-meta"><Badge value={l.status} /><small>{fmtDate(l.created_at)}</small></div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="panel">
              <header className="panel-head"><h3>Pipeline</h3></header>
              <ul className="pipeline">
                {LEAD_STATUSES.map((st) => {
                  const n = s.leads.byStatus[st];
                  const pct = s.leads.total ? Math.round((n / s.leads.total) * 100) : 0;
                  return (
                    <li key={st}>
                      <div className="pipeline-row"><span>{label(st)}</span><strong>{n}</strong></div>
                      <div className="pipeline-bar"><span className={`tone-${STATUS_TONE[st]}`} style={{ width: `${pct}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      )}
    </State>
  );
};

/* ---------- Bookings ---------- */
const Bookings = ({ notify, onInvoice }) => {
  const { can, isOwner } = useAuth();
  const [filters, setFilters] = useState({ status: '', type: '', q: '' });
  const [query, setQuery] = useState('');
  const qs = new URLSearchParams(Object.entries({ ...filters, q: query }).filter(([, v]) => v)).toString();
  const { data, setData, error, loading, reload } = useLoad(`/leads${qs ? `?${qs}` : ''}`);
  const staff = useLoad(can('services.assign') ? '/admin/staff' : null);
  const [openId, setOpenId] = useState(null);
  const open = data?.find((l) => l.id === openId);

  useEffect(() => { const t = setTimeout(() => setQuery(filters.q), 300); return () => clearTimeout(t); }, [filters.q]);

  const save = async (id, body) => {
    try {
      const updated = await api(`/leads/${id}`, { method: 'PATCH', body });
      setData((rows) => rows.map((r) => (r.id === id ? updated : r)));
      notify('Booking updated');
    } catch (e) { notify(e.message, 'error'); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this booking permanently?')) return;
    try {
      await api(`/leads/${id}`, { method: 'DELETE' });
      setData((rows) => rows.filter((r) => r.id !== id));
      setOpenId(null);
      notify('Booking deleted');
    } catch (e) { notify(e.message, 'error'); }
  };

  return (
    <>
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input placeholder="Search name, phone, ref, city" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></label>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All types</option>
          {['booking', 'inspection', 'quote', 'contact'].map((s) => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <button type="button" className="icon-btn" onClick={reload} aria-label="Refresh"><RefreshCw size={16} /></button>
      </div>

      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No bookings match these filters.'}>
        <div className="table-wrap">
          <table className="adm-table">
            <thead><tr><th>Ref</th><th>Customer</th><th>Service</th><th>Visit</th><th>Team</th><th>Status</th><th>Received</th></tr></thead>
            <tbody>
              {data?.map((l) => (
                <tr key={l.id} onClick={() => setOpenId(l.id)} className={openId === l.id ? 'selected' : ''}>
                  <td className="mono">{l.ref}</td>
                  <td><strong>{l.name}</strong><small>{l.phone}</small></td>
                  <td>{l.service || <span className="adm-muted">{label(l.type)}</span>}<small>{l.property}</small></td>
                  <td>{l.scheduled_at ? <><strong>{fmtDate(l.scheduled_at)}</strong><small>Scheduled</small></> : <>{l.preferred_date || '—'}<small>{l.preferred_slot || 'Requested'}</small></>}</td>
                  <td>{l.assigned_name || <span className="adm-muted">Unassigned</span>}<small>{l.technician_name ? `Tech: ${l.technician_name}` : ''}</small></td>
                  <td><Badge value={l.status} /></td>
                  <td className="nowrap">{fmtDate(l.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </State>

      {open && (
        <LeadDrawer notify={notify}
          key={open.id}
          lead={open}
          staff={staff.data || []}
          canAssign={can('services.assign')}
          canManage={can('services.manage')}
          canDelete={isOwner}
          canInvoice={can('invoices.manage')}
          onInvoice={() => onInvoice?.(open)}
          onClose={() => setOpenId(null)}
          onSave={(body) => save(open.id, body)}
          onDelete={() => remove(open.id)}
        />
      )}
    </>
  );
};

const toLocalInput = (s) => { if (!s) return ''; const d = new Date(s); if (Number.isNaN(d)) return ''; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

const LeadDrawer = ({ lead, staff, canAssign, canManage, canDelete, canInvoice, onInvoice, onClose, onSave, onDelete, notify }) => {
  const [notes, setNotes] = useState(lead.internal_notes || '');
  const [when, setWhen] = useState(toLocalInput(lead.scheduled_at));
  const [job, setJob] = useState({ amount: lead.amount ?? '', areaSqft: lead.area_sqft ?? '', warranty: lead.warranty || '' });
  const jobDirty = String(job.amount) !== String(lead.amount ?? '') || String(job.areaSqft) !== String(lead.area_sqft ?? '') || job.warranty !== (lead.warranty || '');
  return (
    <div className="drawer-scrim" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={(e) => e.stopPropagation()} data-lenis-prevent>
        <header className="drawer-head">
          <div><span className="mono">{lead.ref}</span><h3>{lead.name}</h3></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="drawer-actions">
          <a className="btn btn-sm btn-navy" href={`tel:${lead.phone}`}><Phone size={14} /> Call</a>
          <a className="btn btn-sm btn-outline" href={waLink(`91${lead.phone}`, `Hello ${lead.name}, this is PestKill regarding your request ${lead.ref}.`)} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
          {lead.email && <a className="btn btn-sm btn-outline" href={`mailto:${lead.email}`}><Mail size={14} /> Email</a>}
        </div>
        <dl className="detail-list">
          <div><dt>Type</dt><dd>{label(lead.type)}</dd></div>
          <div><dt>Service</dt><dd>{lead.service || '—'}</dd></div>
          <div><dt>Property</dt><dd>{lead.property || '—'}</dd></div>
          <div><dt>Preferred</dt><dd>{lead.preferred_date || '—'} {lead.preferred_slot && `· ${lead.preferred_slot}`}</dd></div>
          <div><dt>Estimate</dt><dd>{lead.estimate || '—'}</dd></div>
          <div><dt>Phone</dt><dd>{lead.phone}</dd></div>
          <div><dt>Address</dt><dd><MapPin size={13} /> {[lead.address, lead.city].filter(Boolean).join(', ') || '—'}</dd></div>
          {lead.message && <div><dt>Message</dt><dd className="pre">{lead.message}</dd></div>}
          <div><dt>Source</dt><dd>{lead.source || '—'}</dd></div>
          <div><dt>Received</dt><dd>{fmtDate(lead.created_at)}</dd></div>
        </dl>

        <div className="drawer-form">
          <label>Status
            <select value={lead.status} disabled={!canManage} onChange={(e) => onSave({ status: e.target.value })}>
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </label>
          {canAssign && (
            <label>Assigned to
              <select value={lead.assigned_to || ''} onChange={(e) => onSave({ assignedTo: e.target.value ? Number(e.target.value) : null })}>
                <option value="">Unassigned</option>
                {staff.map((s) => <option key={s.id} value={s.id}>{s.name} ({label(s.role)})</option>)}
              </select>
            </label>
          )}
          {canAssign && (
            <div className="drawer-sub">
              <h4><CalendarDays size={15} /> Schedule visit</h4>
              <label>Technician
                <select value={lead.technician_id || ''} onChange={(e) => onSave({ technicianId: e.target.value ? Number(e.target.value) : null })}>
                  <option value="">Not assigned</option>
                  {staff.filter((s) => s.role !== 'owner').map((s) => <option key={s.id} value={s.id}>{s.name} ({label(s.role)})</option>)}
                </select>
              </label>
              <label>Visit date & time
                <span className="inline-row">
                  <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
                  <button type="button" className="btn btn-sm btn-navy" disabled={when === toLocalInput(lead.scheduled_at)} onClick={() => onSave({ scheduledAt: when ? new Date(when).toISOString() : null })}>Save</button>
                </span>
              </label>
            </div>
          )}
          {canManage && (
            <div className="drawer-sub">
              <h4><Wrench size={15} /> Job details</h4>
              <div className="inline-grid">
                <label>Area (sq.ft.)<input type="number" min="0" value={job.areaSqft} onChange={(e) => setJob({ ...job, areaSqft: e.target.value })} /></label>
                <label>Amount (₹)<input type="number" min="0" value={job.amount} onChange={(e) => setJob({ ...job, amount: e.target.value })} /></label>
              </div>
              <label>Warranty<input value={job.warranty} onChange={(e) => setJob({ ...job, warranty: e.target.value })} placeholder="e.g. 5 years, 90 days" /></label>
              <button type="button" className="btn btn-sm btn-primary" disabled={!jobDirty} onClick={() => onSave(job)}>Save job details</button>
              {lead.completion_notes && <p className="visit-report"><strong>Visit report:</strong> {lead.completion_notes}{lead.chemicals_used ? ` · ${lead.chemicals_used}` : ''}</p>}
            </div>
          )}
          {canManage && <JobPhotos jobId={lead.id} notify={notify} />}
          <div className="drawer-docs">
            {canInvoice && <button type="button" className="btn btn-sm btn-outline" onClick={onInvoice}><ReceiptText size={14} /> Create invoice</button>}
            {lead.status === 'completed' && <a className="btn btn-sm btn-outline" href={`/print/certificate/${lead.ref}`} target="_blank" rel="noopener noreferrer"><Award size={14} /> Certificate</a>}
          </div>
          {canManage && (
            <label>Internal notes
              <textarea rows="4" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visit details, chemicals used, follow-up date…" />
              <button type="button" className="btn btn-sm btn-primary" disabled={notes === (lead.internal_notes || '')} onClick={() => onSave({ internalNotes: notes })}>Save notes</button>
            </label>
          )}
        </div>
        {canDelete && <button type="button" className="danger-link" onClick={onDelete}><Trash2 size={14} /> Delete booking</button>}
      </aside>
    </div>
  );
};

/* ---------- Complaints ---------- */
const Complaints = ({ notify }) => {
  const { data, setData, error, loading } = useLoad('/complaints');
  const [drafts, setDrafts] = useState({});
  const save = async (id, body) => {
    try {
      const updated = await api(`/complaints/${id}`, { method: 'PATCH', body });
      setData((rows) => rows.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      notify('Complaint updated');
    } catch (e) { notify(e.message, 'error'); }
  };
  return (
    <State loading={loading} error={error} empty={data?.length === 0 && 'No complaints. That is a good sign.'}>
      <div className="card-list">
        {data?.map((c) => (
          <article key={c.id} className="panel complaint">
            <header className="panel-head">
              <div><h3>{c.subject}</h3><small>{c.user_name || 'Deleted user'} · {c.user_phone || ''} · {fmtDate(c.created_at)}</small></div>
              <select value={c.status} onChange={(e) => save(c.id, { status: e.target.value })}>
                {COMPLAINT_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}
              </select>
            </header>
            <p className="pre">{c.description}</p>
            <div className="reply">
              <textarea rows="2" placeholder="Reply to the customer (visible in their account)" value={drafts[c.id] ?? c.response ?? ''} onChange={(e) => setDrafts({ ...drafts, [c.id]: e.target.value })} />
              <button type="button" className="btn btn-sm btn-navy" disabled={(drafts[c.id] ?? c.response ?? '') === (c.response ?? '')} onClick={() => save(c.id, { response: drafts[c.id] })}>Send reply</button>
            </div>
          </article>
        ))}
      </div>
    </State>
  );
};

/* ---------- Applications ---------- */
const Applications = ({ notify }) => {
  const { data, setData, error, loading } = useLoad('/careers/applications');
  const save = async (id, status) => {
    try {
      const updated = await api(`/careers/applications/${id}`, { method: 'PATCH', body: { status } });
      setData((rows) => rows.map((r) => (r.id === id ? updated : r)));
      notify('Application updated');
    } catch (e) { notify(e.message, 'error'); }
  };
  return (
    <State loading={loading} error={error} empty={data?.length === 0 && 'No applications yet.'}>
      <div className="table-wrap">
        <table className="adm-table static">
          <thead><tr><th>Applicant</th><th>Role</th><th>Experience</th><th>City</th><th>Message</th><th>Received</th><th>Status</th></tr></thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong><small><a href={`tel:${a.phone}`}>{a.phone}</a></small></td>
                <td>{a.role}</td>
                <td>{a.experience || 'Fresher'}</td>
                <td>{a.city || '—'}</td>
                <td className="clip">{a.message || '—'}</td>
                <td className="nowrap">{fmtDate(a.created_at)}</td>
                <td><select value={a.status} onChange={(e) => save(a.id, e.target.value)}>{APP_STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </State>
  );
};

/* ---------- Users (customers & team) ---------- */
const UserTable = ({ rows, me, canEdit, canDelete, canRoles, onUpdate, onDelete, onPermissions }) => (
  <div className="table-wrap">
    <table className="adm-table static">
      <thead><tr><th>Name</th><th>Contact</th><th>Role</th><th>Status</th><th>Last login</th><th>Joined</th><th /></tr></thead>
      <tbody>
        {rows.map((u) => {
          const self = u.id === me.id;
          const protectedOwner = u.role === 'owner' && !self;
          return (
            <tr key={u.id}>
              <td><strong>{u.name}</strong>{self && <small>You</small>}</td>
              <td>{u.email}<small>{u.phone}</small></td>
              <td>
                {canRoles && !self && !protectedOwner ? (
                  <select value={u.role} onChange={(e) => onUpdate(u, { role: e.target.value })}>
                    <option value="client">Client</option><option value="manager">Manager</option><option value="owner">Owner</option>
                  </select>
                ) : <span className={`role role-${u.role}`}>{label(u.role)}</span>}
              </td>
              <td>{u.is_active ? <span className="badge badge-success">Active</span> : <span className="badge badge-danger">Suspended</span>}</td>
              <td className="nowrap">{fmtDate(u.last_login)}</td>
              <td className="nowrap">{fmtDate(u.created_at)}</td>
              <td className="row-actions">
                {u.role === 'manager' && onPermissions && <button type="button" className="icon-btn" title="Permissions" onClick={() => onPermissions(u)}><KeyRound size={15} /></button>}
                {canEdit && !self && !protectedOwner && (
                  <button type="button" className="text-btn" onClick={() => onUpdate(u, { isActive: !u.is_active })}>{u.is_active ? 'Suspend' : 'Activate'}</button>
                )}
                {canDelete(u) && !self && u.role !== 'owner' && (
                  <button type="button" className="icon-btn danger" title="Delete" onClick={() => onDelete(u)}><Trash2 size={15} /></button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const CreateUser = ({ roles, onCreated, notify }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: roles[0] });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await api('/admin/users', { method: 'POST', body: form });
      onCreated(u);
      notify(`${label(u.role)} account created`);
      setForm({ name: '', email: '', phone: '', password: '', role: roles[0] });
      setOpen(false);
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  if (!open) return <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}><Plus size={16} /> Add {roles.length === 1 ? label(roles[0]).toLowerCase() : 'user'}</button>;
  return (
    <form className="panel create-user" onSubmit={submit}>
      <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input type="tel" placeholder="Mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
      <input type="text" placeholder="Temporary password (8+)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
      {roles.length > 1 && <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{roles.map((r) => <option key={r} value={r}>{label(r)}</option>)}</select>}
      <div className="create-actions">
        <button type="button" className="btn btn-sm btn-outline" onClick={() => setOpen(false)}>Cancel</button>
        <button type="submit" className="btn btn-sm btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create'}</button>
      </div>
    </form>
  );
};

const People = ({ notify, team, onPermissions }) => {
  const { user, can, isOwner } = useAuth();
  const [q, setQ] = useState('');
  const { data, setData, error, loading } = useLoad(team ? '/admin/users' : '/admin/users?role=client');
  const rows = useMemo(() => (data || [])
    .filter((u) => (team ? u.role !== 'client' : u.role === 'client'))
    .filter((u) => !q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase())), [data, q, team]);

  const update = async (u, body) => {
    if (body.role && !window.confirm(`Change ${u.name}'s role to ${label(body.role)}?`)) return;
    try {
      const updated = await api(`/admin/users/${u.id}`, { method: 'PATCH', body });
      setData((all) => all.map((x) => (x.id === u.id ? updated : x)));
      notify('User updated');
    } catch (e) { notify(e.message, 'error'); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Delete ${u.name}'s account permanently? Their bookings are kept.`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      setData((all) => all.filter((x) => x.id !== u.id));
      notify('User deleted');
    } catch (e) { notify(e.message, 'error'); }
  };

  const createRoles = team ? (isOwner ? ['manager', 'technician', 'owner'] : []) : (can('users.create') ? ['client'] : []);
  return (
    <>
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <span className="toolbar-count">{rows.length} {team ? 'team members' : 'customers'}</span>
        {createRoles.length > 0 && <CreateUser roles={createRoles} notify={notify} onCreated={(u) => setData((all) => [u, ...(all || [])])} />}
      </div>
      <State loading={loading} error={error} empty={rows.length === 0 && (q ? 'No matches.' : team ? 'No managers yet. Add one to share the workload.' : 'No customers yet.')}>
        <UserTable
          rows={rows}
          me={user}
          canEdit={team ? isOwner : can('users.edit')}
          canRoles={isOwner}
          canDelete={(u) => (u.role === 'manager' ? isOwner : can('users.delete'))}
          onUpdate={update}
          onDelete={remove}
          onPermissions={team ? onPermissions : null}
        />
      </State>
    </>
  );
};

/* ---------- Permissions (owner) ---------- */
const Permissions = ({ notify, managerId, setManagerId }) => {
  const catalog = useLoad('/admin/permissions');
  const managers = useLoad('/admin/users?role=manager');
  const current = useLoad(managerId ? `/admin/managers/${managerId}/permissions` : null);
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!managerId && managers.data?.length) setManagerId(managers.data[0].id); }, [managers.data, managerId, setManagerId]);
  useEffect(() => { if (current.data) setSelected(current.data); }, [current.data]);

  const groups = useMemo(() => (catalog.data || []).reduce((acc, p) => { (acc[p.group] ||= []).push(p); return acc; }, {}), [catalog.data]);
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...(current.data || [])].sort());
  const toggle = (key) => setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));

  const save = async () => {
    setSaving(true);
    try {
      const result = await api(`/admin/managers/${managerId}/permissions`, { method: 'PUT', body: { permissions: selected } });
      current.setData(result);
      notify('Permissions saved. They apply immediately.');
    } catch (e) { notify(e.message, 'error'); }
    setSaving(false);
  };

  if (managers.data && managers.data.length === 0) {
    return <div className="adm-state">No managers yet. Create one under <strong>Team</strong>, then set their permissions here.</div>;
  }

  return (
    <State loading={catalog.loading || managers.loading} error={catalog.error || managers.error}>
      <div className="perm-layout">
        <aside className="perm-people">
          {managers.data?.map((m) => (
            <button key={m.id} type="button" className={m.id === managerId ? 'active' : ''} onClick={() => setManagerId(m.id)}>
              <span className="avatar-sm">{m.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
              <span><strong>{m.name}</strong><small>{m.is_active ? m.email : 'Suspended'}</small></span>
            </button>
          ))}
        </aside>
        <section className="panel perm-panel">
          <header className="panel-head">
            <div><h3>Access for {managers.data?.find((m) => m.id === managerId)?.name}</h3><small>Changes take effect on the manager's very next action.</small></div>
            <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
          </header>
          {current.loading ? <div className="adm-state"><span className="spinner" /></div> : Object.entries(groups).map(([group, perms]) => (
            <div key={group} className="perm-group">
              <h4>{group === 'Owner only' ? <><Lock size={13} /> {group}</> : group}</h4>
              {perms.map((p) => (
                <label key={p.key} className={`perm-row ${p.ownerOnly ? 'locked' : ''}`}>
                  <span><strong>{p.label}</strong><small>{p.description} · <code>{p.key}</code></small></span>
                  <input type="checkbox" className="switch" checked={!p.ownerOnly && selected.includes(p.key)} disabled={p.ownerOnly} onChange={() => toggle(p.key)} />
                </label>
              ))}
            </div>
          ))}
        </section>
      </div>
    </State>
  );
};

/* ---------- Audit ---------- */
const Audit = () => {
  const { data, error, loading } = useLoad('/admin/audit');
  return (
    <State loading={loading} error={error} empty={data?.length === 0 && 'No activity recorded yet.'}>
      <div className="table-wrap">
        <table className="adm-table static">
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Target</th><th>Details</th></tr></thead>
          <tbody>
            {data?.map((a) => (
              <tr key={a.id}>
                <td className="nowrap">{fmtDate(a.created_at)}</td>
                <td>{a.user_name || '—'}<small>{label(a.user_role)}</small></td>
                <td><code>{a.action}</code></td>
                <td>{a.target_type ? `${a.target_type} #${a.target_id}` : '—'}</td>
                <td className="clip mono">{a.details || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </State>
  );
};

/* ---------- Shell ---------- */
const Admin = () => {
  const { user, loading, logout, can, isOwner, isStaff, isTechnician } = useAuth();
  const [invoiceLead, setInvoiceLead] = useState(null);
  const location = useLocation();
  const [toast, setToast] = useState(null);
  const [permManager, setPermManager] = useState(null);

  const sections = useMemo(() => [
    { id: 'jobs', label: 'My jobs', icon: Wrench, show: isTechnician },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, show: can('reports.view') },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, show: can('reports.view') },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck, show: can('services.view') || can('services.assign') },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays, show: can('services.view') || can('services.assign') },
    { id: 'claims', label: 'Warranty claims', icon: RotateCcw, show: can('services.view') || can('services.assign') || can('services.manage') },
    { id: 'invoices', label: 'Invoices', icon: ReceiptText, show: can('invoices.manage') },
    { id: 'orders', label: 'Shop orders', icon: ShoppingBag, show: can('orders.view') || can('orders.manage') },
    { id: 'products', label: 'Products', icon: Package, show: can('products.view') || can('products.edit') || can('inventory.manage') },
    { id: 'buyers', label: 'PCO buyers', icon: Store, show: can('buyers.manage') },
    { id: 'complaints', label: 'Complaints', icon: MessageSquareWarning, show: can('complaints.manage') },
    { id: 'applications', label: 'Applications', icon: Briefcase, show: can('careers.manage') },
    { id: 'customers', label: 'Customers', icon: Users, show: can('users.view') },
    { id: 'team', label: 'Team', icon: UserCog, show: isOwner },
    { id: 'permissions', label: 'Permissions', icon: KeyRound, show: isOwner },
    { id: 'audit', label: 'Audit log', icon: ScrollText, show: isOwner },
  ].filter((s) => s.show), [can, isOwner, isTechnician]);

  // The open section lives in the URL hash so screens can be bookmarked and shared (e.g. /admin#analytics).
  const [active, setActiveState] = useState(() => window.location.hash.slice(1) || null);
  const setActive = useCallback((id) => {
    setActiveState(id);
    window.history.replaceState(null, '', `${window.location.pathname}${id ? `#${id}` : ''}`);
  }, []);
  const current = sections.find((s) => s.id === active) || sections[0];

  const notify = useCallback((message, tone = 'success') => {
    setToast({ message, tone, id: Date.now() });
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 3200); return () => clearTimeout(t); }, [toast]);

  if (loading) return <div className="adm-state full"><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (!isStaff) return <Navigate to="/dashboard" replace />;

  const go = (id) => setActive(id);
  const openPermissions = (m) => { setPermManager(m.id); setActive('permissions'); };

  return (
    <div className="admin-shell">
      <aside className="admin-side" data-lenis-prevent>
        <div className="admin-brand"><Logo /></div>
        <div className="admin-me">
          <span className="avatar-sm">{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
          <div><strong>{user.name}</strong><span className={`role role-${user.role}`}>{label(user.role)}</span></div>
        </div>
        <nav>
          {sections.map(({ id, label: l, icon: Icon }) => (
            <button key={id} type="button" className={current?.id === id ? 'active' : ''} onClick={() => go(id)}><Icon size={18} /> {l}</button>
          ))}
        </nav>
        <button type="button" className="admin-logout" onClick={logout}><LogOut size={16} /> Sign out</button>
      </aside>

      <main className="admin-main">
        {!current ? (
          <div className="adm-state">
            <ShieldCheck size={28} />
            <p>Your account has no permissions yet. Ask the owner to grant access.</p>
          </div>
        ) : (
          <>
            <header className="admin-head">
              <div>
                <span className="eyebrow">{isOwner ? 'Owner console' : isTechnician ? 'Technician app' : 'Manager console'}</span>
                <h1>{current.label}</h1>
              </div>
            </header>
            {current.id === 'overview' && <Overview go={go} />}
            {current.id === 'jobs' && <MyJobs notify={notify} />}
            {current.id === 'analytics' && <Analytics />}
            {current.id === 'bookings' && <Bookings notify={notify} onInvoice={(l) => { setInvoiceLead(l); setActive('invoices'); }} />}
            {current.id === 'schedule' && <Schedule onOpen={() => setActive('bookings')} />}
            {current.id === 'invoices' && <Invoices notify={notify} prefillLead={invoiceLead} clearPrefill={() => setInvoiceLead(null)} />}
            {current.id === 'claims' && <Claims notify={notify} />}
            {current.id === 'orders' && <ShopOrders notify={notify} />}
            {current.id === 'products' && <ShopProducts notify={notify} />}
            {current.id === 'buyers' && <Buyers notify={notify} />}
            {current.id === 'complaints' && <Complaints notify={notify} />}
            {current.id === 'applications' && <Applications notify={notify} />}
            {current.id === 'customers' && <People notify={notify} team={false} />}
            {current.id === 'team' && <People notify={notify} team onPermissions={openPermissions} />}
            {current.id === 'permissions' && <Permissions notify={notify} managerId={permManager} setManagerId={setPermManager} />}
            {current.id === 'audit' && <Audit />}
          </>
        )}
      </main>

      {toast && (
        <div key={toast.id} className={`toast toast-${toast.tone}`} role="status">
          {toast.tone === 'success' ? <CheckCircle size={18} /> : <X size={18} />} {toast.message}
        </div>
      )}
    </div>
  );
};

export default Admin;
