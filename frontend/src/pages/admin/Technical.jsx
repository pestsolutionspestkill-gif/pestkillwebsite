import { useEffect, useMemo, useState } from 'react';
import { FileText, Upload, Trash2, Eye, Pencil, BadgeCheck, ShieldAlert, Plus, Search, Tags } from 'lucide-react';
import { api, fileToDataUrl } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useLoad, State, fmtDay } from './shared';

export const DOC_TYPES = { msds: 'Safety data sheet (SDS / MSDS)', label: 'Label & leaflet', tds: 'Technical datasheet (TDS)', certificate: 'Certificate', other: 'Other document' };
const VISIBILITY = { public: 'Everyone', pco: 'Verified PCOs + staff', staff: 'Staff only' };
const EMPTY_DOC = { kind: 'msds', title: '', description: '', manufacturer: '', version: '', issueDate: '', revisionDate: '', visibility: 'public' };
const toForm = (d) => ({ kind: d.kind, title: d.title || '', description: d.description || '', manufacturer: d.manufacturer || '', version: d.version || '',
  issueDate: d.issue_date || '', revisionDate: d.revision_date || '', visibility: d.visibility });
const nullify = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v]));

/** Upload / edit form for one document. */
const DocForm = ({ initial, onSubmit, onCancel, busy, isNew }) => {
  const [f, setF] = useState(initial);
  const [file, setFile] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="doc-form" onSubmit={(e) => { e.preventDefault(); onSubmit(f, file); }}>
      <div className="inv-grid">
        <label>Type<select value={f.kind} onChange={set('kind')}>{Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Title<input value={f.title} onChange={set('title')} required minLength={3} maxLength={150} placeholder="e.g. Safety data sheet" /></label>
        <label>Manufacturer<input value={f.manufacturer} onChange={set('manufacturer')} maxLength={120} /></label>
        <label>Version<input value={f.version} onChange={set('version')} maxLength={40} placeholder="As printed on the document" /></label>
        <label>Issue date<input type="date" value={f.issueDate} onChange={set('issueDate')} /></label>
        <label>Revision date<input type="date" value={f.revisionDate} onChange={set('revisionDate')} /></label>
        <label>Visible to<select value={f.visibility} onChange={set('visibility')}>{Object.entries(VISIBILITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>{isNew ? 'File (PDF, JPG or PNG, max 5 MB)' : 'Replace file (optional)'}
          <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files[0] || null)} required={isNew} />
        </label>
      </div>
      <label>Description<textarea rows="2" value={f.description} onChange={set('description')} maxLength={1000} /></label>
      <div className="drawer-foot">
        {onCancel && <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Upload document' : 'Save changes'}</button>
      </div>
    </form>
  );
};

const DocRow = ({ d, onEdit, onDelete, canDelete }) => (
  <div className="doc-row">
    <FileText size={16} />
    <span>
      <strong>{d.title}</strong>
      <small> · {DOC_TYPES[d.kind]}{d.version ? ` · v${d.version}` : ''} · {VISIBILITY[d.visibility]} · updated {fmtDay(d.updated_at)} · {Math.max(1, Math.round(d.size / 1024))} KB</small>
    </span>
    <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-btn"><Eye size={14} /> View</a>
    <button type="button" className="text-btn" onClick={onEdit}><Pencil size={14} /> Edit</button>
    {canDelete && <button type="button" className="text-btn danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>}
  </div>
);

/** Documents of one product (inside the product drawer). */
export const DocumentManager = ({ product, notify, onChange }) => {
  const { can } = useAuth();
  const [docs, setDocs] = useState(null);
  const [mode, setMode] = useState(null); // null | 'new' | doc id
  const [busy, setBusy] = useState(false);
  const load = () => api(`/documents?productId=${product.id}`).then((d) => { setDocs(d); onChange?.(d); }).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (f, file, id) => {
    setBusy(true);
    try {
      const body = { ...nullify(f), ...(file ? { dataUrl: await fileToDataUrl(file) } : {}) };
      if (id) await api(`/documents/${id}`, { method: 'PATCH', body });
      else await api('/documents', { method: 'POST', body: { ...body, productId: product.id } });
      notify(id ? 'Document updated' : 'Document uploaded');
      setMode(null);
      await load();
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.title}"? This cannot be undone.`)) return;
    try { await api(`/documents/${d.id}`, { method: 'DELETE' }); notify('Document deleted'); await load(); } catch (err) { notify(err.message, 'error'); }
  };

  return (
    <div className="doc-manager">
      {docs?.length === 0 && mode !== 'new' && <p className="adm-muted">No documents yet. Upload the manufacturer's SDS and label so customers can download them.</p>}
      {docs?.map((d) => (mode === d.id
        ? <DocForm key={d.id} initial={toForm(d)} busy={busy} onSubmit={(f, file) => save(f, file, d.id)} onCancel={() => setMode(null)} />
        : <DocRow key={d.id} d={d} canDelete={can('products.delete')} onEdit={() => setMode(d.id)} onDelete={() => remove(d)} />))}
      {mode === 'new'
        ? <DocForm initial={EMPTY_DOC} isNew busy={busy} onSubmit={(f, file) => save(f, file)} onCancel={() => setMode(null)} />
        : <button type="button" className="btn btn-outline btn-sm" onClick={() => setMode('new')}><Upload size={14} /> Upload document</button>}
    </div>
  );
};

/* ---------------- Label dosage records ---------------- */

export const ACTIVITY_FIELDS = {
  termite_pre: ['productPerLitre', 'rateHorizontal', 'rateVertical', 'rateRunning'],
  termite_post: ['productPerLitre', 'rateRunning', 'rateHorizontal'],
  cockroach: ['productPerLitre', 'rateHorizontal'],
  bedbug: ['productPerLitre', 'rateHorizontal'],
  general: ['productPerLitre', 'rateHorizontal'],
  mosquito_residual: ['productPerLitre', 'rateHorizontal'],
  larvicide: ['productPer1000l'],
  rodent: ['baitPerPoint'],
};
const ACTIVITY_LABELS = {
  termite_pre: 'Termite: pre-construction', termite_post: 'Termite: post-construction', cockroach: 'Cockroach: residual spray',
  bedbug: 'Bed bug: residual spray', general: 'General pests: residual spray', mosquito_residual: 'Mosquito: indoor residual spray',
  larvicide: 'Mosquito: larvicide', rodent: 'Rodent: bait',
};
const FIELD_LABELS = {
  productPerLitre: 'Product per litre of water (ml or g)', rateHorizontal: 'Solution per m² (horizontal / surface), litres',
  rateVertical: 'Solution per m² (vertical / sides), litres', rateRunning: 'Solution per running metre, litres',
  productPer1000l: 'Product per 1000 L of water (ml or g)', baitPerPoint: 'Bait per point (g)',
};
const snake = (k) => k.replace(/[A-Z0-9]+/g, (c) => `_${c.toLowerCase()}`).replace('_1000l', '_1000l');
const EMPTY_DOSE = { activity: 'termite_pre', method: '', amountUnit: 'ml', notes: '', standardId: '', productPerLitre: '', rateHorizontal: '', rateVertical: '', rateRunning: '', productPer1000l: '', baitPerPoint: '' };

const VerifyForm = ({ record, docs, onDone, notify }) => {
  const [sourceDocumentId, setDoc] = useState('');
  const [sourceNote, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const usable = (docs || []).filter((d) => ['label', 'tds', 'msds'].includes(d.kind));
  const submit = async () => {
    try {
      await api(`/doses/${record.id}/verify`, { method: 'POST', body: { sourceDocumentId: sourceDocumentId || null, sourceNote: sourceNote || null, confirm } });
      notify('Dose record verified'); onDone();
    } catch (err) { notify(err.message, 'error'); }
  };
  return (
    <div className="verify-box">
      <p><ShieldAlert size={15} /> Check every number against the product label before verifying. Verified records are used by the public calculator.</p>
      <label>Source label / document<select value={sourceDocumentId} onChange={(e) => setDoc(e.target.value)}>
        <option value="">— choose an uploaded label, TDS or SDS —</option>
        {usable.map((d) => <option key={d.id} value={d.id}>{d.title}{d.version ? ` v${d.version}` : ''}</option>)}
      </select></label>
      <label>Or describe the source<input value={sourceNote} onChange={(e) => setNote(e.target.value)} maxLength={400} placeholder="e.g. Label printed on 1 L pack, batch …, revision …" /></label>
      <label className="check-row"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> I confirm every number matches the source exactly</label>
      <button type="button" className="btn btn-primary btn-sm" onClick={submit} disabled={!confirm}><BadgeCheck size={14} /> Verify</button>
    </div>
  );
};

/** Label dosage records of one product. */
export const DoseManager = ({ product, docs, notify }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const [verifying, setVerifying] = useState(null);
  const [standards, setStandards] = useState([]);
  useEffect(() => { api('/standards/all').then(setStandards).catch(() => setStandards([])); }, []);
  const load = () => api(`/doses?productId=${product.id}`).then(setRows).catch((e) => notify(e.message, 'error'));
  useEffect(() => { load(); }, [product.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const canVerify = ['owner', 'manager'].includes(user?.role);

  const save = async (e) => {
    e.preventDefault();
    const body = { activity: form.activity, method: form.method, amountUnit: form.amountUnit, notes: form.notes || null, standardId: form.standardId ? Number(form.standardId) : null };
    for (const k of Object.keys(FIELD_LABELS)) body[k] = ACTIVITY_FIELDS[form.activity].includes(k) && form[k] !== '' ? Number(form[k]) : null;
    try {
      if (form.id) await api(`/doses/${form.id}`, { method: 'PATCH', body });
      else await api('/doses', { method: 'POST', body: { ...body, productId: product.id } });
      notify(form.id ? 'Saved — verify it again before it is used' : 'Saved as unverified');
      setForm(null); load();
    } catch (err) { notify(err.message, 'error'); }
  };
  const edit = (r) => setForm({ id: r.id, activity: r.activity, method: r.method, amountUnit: r.amount_unit, notes: r.notes || '', standardId: r.standard?.id || '',
    ...Object.fromEntries(Object.keys(FIELD_LABELS).map((k) => [k, r[snake(k)] ?? ''])) });
  const act = async (path, method = 'POST', msg) => { try { await api(path, { method }); notify(msg); load(); } catch (err) { notify(err.message, 'error'); } };

  return (
    <div className="dose-manager">
      <p className="adm-muted">Enter rates exactly as printed on the label. Records stay unverified (and hidden from customers) until an owner or manager verifies them against the source.</p>
      {rows?.map((r) => (
        <div key={r.id} className={`dose-row ${r.status}`}>
          <div>
            <strong>{ACTIVITY_LABELS[r.activity]}</strong> · {r.method}
            <small>{ACTIVITY_FIELDS[r.activity].filter((k) => r[snake(k)] != null).map((k) => `${FIELD_LABELS[k].split(' (')[0].split(',')[0]}: ${r[snake(k)]}`).join(' · ')}</small>
            {r.standard && <small>Reference: {r.standard.code}</small>}
            <small>{r.status === 'verified' ? `Verified${r.verified_by_name ? ` by ${r.verified_by_name}` : ''} · source: ${r.source_document?.title || r.source_note}` : 'Unverified — not shown to customers'}</small>
          </div>
          <div className="dose-actions">
            {r.status !== 'verified' && canVerify && <button type="button" className="text-btn" onClick={() => setVerifying(verifying === r.id ? null : r.id)}><BadgeCheck size={14} /> Verify</button>}
            {r.status === 'verified' && canVerify && <button type="button" className="text-btn" onClick={() => act(`/doses/${r.id}/unverify`, 'POST', 'Marked unverified')}>Unverify</button>}
            <button type="button" className="text-btn" onClick={() => edit(r)}><Pencil size={14} /> Edit</button>
            <button type="button" className="text-btn danger" onClick={() => window.confirm('Delete this dose record?') && act(`/doses/${r.id}`, 'DELETE', 'Deleted')}><Trash2 size={14} /></button>
          </div>
          {verifying === r.id && <VerifyForm record={r} docs={docs} notify={notify} onDone={() => { setVerifying(null); load(); }} />}
        </div>
      ))}
      {form ? (
        <form className="doc-form" onSubmit={save}>
          <div className="inv-grid">
            <label>Activity<select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}>{Object.entries(ACTIVITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Application method (from label)<input value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} required minLength={3} maxLength={200} /></label>
            <label>Product measured in<select value={form.amountUnit} onChange={(e) => setForm({ ...form, amountUnit: e.target.value })}><option value="ml">ml (liquid)</option><option value="g">g (solid)</option></select></label>
            {ACTIVITY_FIELDS[form.activity].map((k) => (
              <label key={k}>{FIELD_LABELS[k]}<input type="number" min="0" step="any" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>
            ))}
          </div>
          <label>Notes<input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={600} /></label>
          <label>Related standard (reference only; rates still come from the label)<select value={form.standardId} onChange={(e) => setForm({ ...form, standardId: e.target.value })}>
            <option value="">— none —</option>
            {standards.map((s) => <option key={s.id} value={s.id}>{s.code}{s.verification_status === 'not_confirmed' ? ' (not confirmed)' : ''}</option>)}
          </select></label>
          <div className="drawer-foot">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm">Save</button>
          </div>
        </form>
      ) : <button type="button" className="btn btn-outline btn-sm" onClick={() => setForm({ ...EMPTY_DOSE })}><Plus size={14} /> Add label dosage</button>}
    </div>
  );
};

/* ---------------- All documents (admin section) ---------------- */
export const DocumentsAdmin = ({ notify }) => {
  const { can } = useAuth();
  const { data, error, loading, reload } = useLoad('/documents');
  const [q, setQ] = useState('');
  const [kind, setKind] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => (data || []).filter((d) => (!kind || d.kind === kind)
    && (!q.trim() || [d.title, d.product?.brand, d.product?.name].join(' ').toLowerCase().includes(q.trim().toLowerCase()))), [data, q, kind]);
  const save = async (d, f, file) => {
    setBusy(true);
    try {
      await api(`/documents/${d.id}`, { method: 'PATCH', body: { ...nullify(f), ...(file ? { dataUrl: await fileToDataUrl(file) } : {}) } });
      notify('Document updated'); setEditing(null); reload();
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const remove = async (d) => {
    if (!window.confirm(`Delete "${d.title}"?`)) return;
    try { await api(`/documents/${d.id}`, { method: 'DELETE' }); notify('Document deleted'); reload(); } catch (err) { notify(err.message, 'error'); }
  };
  return (
    <>
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, brand or product" aria-label="Search documents" /></label>
        <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Document type"><option value="">All types</option>{Object.entries(DOC_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <span className="toolbar-count">{rows.length} documents · upload new ones from Products → product → Technical documents</span>
      </div>
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No documents uploaded yet.'}>
        <div className="panel doc-admin-list">
          {rows.map((d) => (editing === d.id
            ? <div key={d.id}><p className="adm-muted">{d.product?.brand} {d.product?.name}</p><DocForm initial={toForm(d)} busy={busy} onSubmit={(f, file) => save(d, f, file)} onCancel={() => setEditing(null)} /></div>
            : <div key={d.id}><p className="adm-muted doc-product">{d.product?.brand} {d.product?.name} · {d.product?.pack_size}</p><DocRow d={d} canDelete={can('products.delete')} onEdit={() => setEditing(d.id)} onDelete={() => remove(d)} /></div>))}
        </div>
      </State>
    </>
  );
};

/* ---------------- Brands & categories (admin section) ---------------- */
export const CatalogueAdmin = ({ notify }) => {
  const { data, error, loading, reload } = useLoad('/products?all=1');
  const [edit, setEdit] = useState(null); // { field, from, to }
  const rename = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/products/rename', { method: 'PATCH', body: edit });
      notify(`${r.updated} products updated`); setEdit(null); reload();
    } catch (err) { notify(err.message, 'error'); }
  };
  const Group = ({ field, title, items }) => (
    <section className="panel cat-group">
      <h3><Tags size={16} /> {title}</h3>
      <ul>
        {items.map((x) => (
          <li key={x.name}>
            {edit?.field === field && edit.from === x.name ? (
              <form onSubmit={rename} className="cat-rename">
                <input value={edit.to} onChange={(e) => setEdit({ ...edit, to: e.target.value })} required minLength={2} maxLength={80} aria-label={`New name for ${x.name}`} autoFocus />
                <button type="submit" className="btn btn-primary btn-sm">Rename</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setEdit(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span>{x.name}</span><small>{x.n} products</small>
                <button type="button" className="text-btn" onClick={() => setEdit({ field, from: x.name, to: x.name })}><Pencil size={14} /> Rename</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <State loading={loading && !data} error={error}>
      {data && (
        <div className="cat-grid">
          <Group field="brand" title="Brands" items={data.brands} />
          <Group field="category" title="Categories" items={data.categories} />
          <p className="adm-muted">Renaming updates every product with that brand or category. To add a new brand or category, type it when adding a product.</p>
        </div>
      )}
    </State>
  );
};
