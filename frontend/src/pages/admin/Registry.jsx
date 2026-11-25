// Owner registers: business licences, technical standards (BIS references) and market reference prices.
import { useMemo, useState } from 'react';
import { BadgeCheck, Eye, FileText, Pencil, Plus, Search, ShieldAlert, Trash2, Upload, ExternalLink, Link2 } from 'lucide-react';
import { api, fileToDataUrl } from '../../lib/api';
import { useLoad, State, fmtDay, inr } from './shared';

const blankToNull = (f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === '' ? null : v]));

/* ======================= Licences ======================= */
const LicenceCard = ({ l, notify, reload }) => {
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn, msg) => {
    setBusy(true);
    try { await fn(); notify(msg); reload(); } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const save = (e) => {
    e.preventDefault();
    run(async () => { await api(`/licences/${l.id}`, { method: 'PATCH', body: blankToNull(edit) }); setEdit(null); }, 'Licence saved');
  };
  const upload = (file) => file && run(async () => {
    await api(`/licences/${l.id}/document`, { method: 'PUT', body: { dataUrl: await fileToDataUrl(file) } });
  }, 'Licence copy uploaded. Check it and mark the licence verified.');
  const verified = l.status === 'verified';
  // Open the tab first (on the click) so the browser does not block it, then load the short-lived link.
  const viewCopy = async () => {
    const tab = window.open('', '_blank');
    try {
      const { url } = await api(`/licences/${l.id}/document-link`, { method: 'POST' });
      if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
    } catch (err) { tab?.close(); notify(err.message, 'error'); }
  };
  return (
    <section className="panel lic-admin" data-licence={l.key}>
      <header>
        <div>
          <h3>{l.title}</h3>
          <p className="lic-admin-no">{l.number}</p>
        </div>
        <span className={`badge badge-${verified ? 'success' : 'warning'}`}>{verified ? 'Verified' : 'Not verified'}</span>
      </header>
      {edit ? (
        <form onSubmit={save} className="doc-form">
          <div className="inv-grid">
            <label>Title<input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} required minLength={3} maxLength={120} /></label>
            <label>Licence number<input value={edit.number} onChange={(e) => setEdit({ ...edit, number: e.target.value })} required minLength={3} maxLength={80} /></label>
            <label>Activity covered<input value={edit.activity} onChange={(e) => setEdit({ ...edit, activity: e.target.value })} required minLength={3} maxLength={200} /></label>
            <label>Issuing authority<input value={edit.issuingAuthority} onChange={(e) => setEdit({ ...edit, issuingAuthority: e.target.value })} maxLength={200} placeholder="Exactly as printed on the licence" /></label>
            <label>Valid from<input type="date" value={edit.validFrom} onChange={(e) => setEdit({ ...edit, validFrom: e.target.value })} /></label>
            <label>Valid until<input type="date" value={edit.validUntil} onChange={(e) => setEdit({ ...edit, validUntil: e.target.value })} /></label>
          </div>
          <p className="adm-muted">Changing the number, authority or dates needs a fresh verification. Authority and validity are shown publicly only after verification.</p>
          <div className="drawer-foot">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEdit(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save licence'}</button>
          </div>
        </form>
      ) : (
        <>
          <dl className="lic-admin-dl">
            <div><dt>Covers</dt><dd>{l.activity}</dd></div>
            <div><dt>Issuing authority</dt><dd>{l.issuing_authority || <em>Not entered</em>}</dd></div>
            <div><dt>Validity</dt><dd>{l.valid_from || l.valid_until ? `${fmtDay(l.valid_from)} – ${fmtDay(l.valid_until)}` : <em>Not entered</em>}</dd></div>
            <div><dt>Licence copy</dt><dd>{l.doc_size ? <button type="button" className="text-btn" onClick={viewCopy}><Eye size={14} /> View ({Math.max(1, Math.round(l.doc_size / 1024))} KB)</button> : <em>Not uploaded</em>}</dd></div>
            <div><dt>Access</dt><dd>Private. Opens with a 5-minute link for your account; every view is logged.</dd></div>
            <div><dt>On website</dt><dd>{l.display ? 'Shown' : 'Hidden'}</dd></div>
          </dl>
          <div className="lic-admin-actions">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setEdit({ title: l.title, number: l.number, activity: l.activity, issuingAuthority: l.issuing_authority || '', validFrom: l.valid_from || '', validUntil: l.valid_until || '' })}><Pencil size={14} /> Edit details</button>
            <label className="btn btn-outline btn-sm file-btn"><Upload size={14} /> {l.doc_size ? 'Replace copy' : 'Upload copy'}
              <input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => upload(e.target.files[0])} hidden />
            </label>
            {l.doc_size > 0 && <button type="button" className="text-btn danger" disabled={busy} onClick={() => window.confirm('Remove the licence copy? The licence becomes unverified.') && run(() => api(`/licences/${l.id}/document`, { method: 'DELETE' }), 'Licence copy removed')}><Trash2 size={14} /> Remove copy</button>}
            {verified
              ? <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => run(() => api(`/licences/${l.id}`, { method: 'PATCH', body: { status: 'unverified' } }), 'Marked not verified')}>Mark not verified</button>
              : <button type="button" className="btn btn-primary btn-sm" disabled={busy || !l.doc_size} title={l.doc_size ? '' : 'Upload the licence copy first'}
                  onClick={() => window.confirm('Confirm the number, authority and dates match the licence copy exactly.') && run(() => api(`/licences/${l.id}`, { method: 'PATCH', body: { status: 'verified' } }), 'Licence verified')}><BadgeCheck size={14} /> Mark verified</button>}
            <button type="button" className="text-btn" disabled={busy} onClick={() => run(() => api(`/licences/${l.id}`, { method: 'PATCH', body: { display: !l.display } }), l.display ? 'Hidden from website' : 'Shown on website')}>{l.display ? 'Hide from website' : 'Show on website'}</button>
          </div>
        </>
      )}
    </section>
  );
};

export const LicencesAdmin = ({ notify }) => {
  const { data, error, loading, reload } = useLoad('/licences/all');
  return (
    <>
      <p className="adm-muted reg-intro">These licences appear on the homepage, footer, About, service, shop, product, cart and contact pages. Enter the issuing authority and validity exactly as printed, upload the licence copy, then mark it verified. Nothing is shown that you have not entered.</p>
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No licences.'}>
        <div className="lic-admin-grid">{(data || []).map((l) => <LicenceCard key={l.id} l={l} notify={notify} reload={reload} />)}</div>
      </State>
    </>
  );
};

/* ======================= Technical standards ======================= */
export const STD_STATUS = {
  verified_official: 'Checked on the official BIS portal',
  archived_copy: 'Checked against an archived copy',
  not_confirmed: 'Not confirmed',
};
const STD_TONE = { verified_official: 'success', archived_copy: 'info', not_confirmed: 'warning' };
const EMPTY_STD = { code: '', title: '', edition: '', amendmentStatus: '', scope: '', appliesTo: '', sourceUrl: '', sourceNote: '', verificationStatus: 'not_confirmed', verifiedOn: '', display: false, sort: 0 };
const stdForm = (s) => ({ code: s.code, title: s.title, edition: s.edition || '', amendmentStatus: s.amendment_status || '', scope: s.scope || '', appliesTo: s.applies_to || '',
  sourceUrl: s.source_url || '', sourceNote: s.source_note || '', verificationStatus: s.verification_status, verifiedOn: s.verified_on || '', display: Boolean(s.display), sort: s.sort || 0 });

const StandardForm = ({ initial, onSubmit, onCancel, busy }) => {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <form className="doc-form" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
      <div className="inv-grid">
        <label>Standard number<input value={f.code} onChange={set('code')} required minLength={2} maxLength={80} placeholder="e.g. IS 6313 (Part 2) : 2001" /></label>
        <label>Edition<input value={f.edition} onChange={set('edition')} maxLength={120} /></label>
        <label>Status<select value={f.verificationStatus} onChange={set('verificationStatus')}>{Object.entries(STD_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Checked on<input type="date" value={f.verifiedOn} onChange={set('verifiedOn')} /></label>
        <label>Source URL (https)<input type="url" value={f.sourceUrl} onChange={set('sourceUrl')} maxLength={500} pattern="https://.*" /></label>
        <label>Sort order<input type="number" min="0" max="1000" value={f.sort} onChange={set('sort')} /></label>
      </div>
      <label>Title<input value={f.title} onChange={set('title')} required minLength={2} maxLength={300} /></label>
      <label>Scope<textarea rows="2" value={f.scope} onChange={set('scope')} maxLength={1500} /></label>
      <label>Applies to<input value={f.appliesTo} onChange={set('appliesTo')} maxLength={300} /></label>
      <label>Amendment status<input value={f.amendmentStatus} onChange={set('amendmentStatus')} maxLength={400} /></label>
      <label>Source note<textarea rows="2" value={f.sourceNote} onChange={set('sourceNote')} maxLength={600} /></label>
      <label className="check"><input type="checkbox" checked={f.display} onChange={set('display')} /> Show on the public Technical Standards page</label>
      <div className="drawer-foot">
        {onCancel && <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>}
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save reference'}</button>
      </div>
    </form>
  );
};

export const StandardsAdmin = ({ notify }) => {
  const { data, error, loading, reload } = useLoad('/standards/all');
  const [mode, setMode] = useState(null); // null | 'new' | id
  const [busy, setBusy] = useState(false);
  const save = async (f, id) => {
    setBusy(true);
    try {
      const body = { ...blankToNull(f), display: f.display, sort: Number(f.sort) || 0 };
      await api(id ? `/standards/${id}` : '/standards', { method: id ? 'PATCH' : 'POST', body });
      notify(id ? 'Reference updated' : 'Reference added'); setMode(null); reload();
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const remove = async (s) => {
    if (!window.confirm(`Delete ${s.code}? Dose records linked to it keep their label data.`)) return;
    try { await api(`/standards/${s.id}`, { method: 'DELETE' }); notify('Reference deleted'); reload(); } catch (err) { notify(err.message, 'error'); }
  };
  return (
    <>
      <div className="toolbar">
        <p className="adm-muted reg-intro">BIS and other technical references. Record only what you have checked, with the source. "Not confirmed" entries stay hidden unless you choose to show them.</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setMode('new')}><Plus size={15} /> Add reference</button>
      </div>
      {mode === 'new' && <section className="panel"><StandardForm initial={EMPTY_STD} busy={busy} onSubmit={(f) => save(f)} onCancel={() => setMode(null)} /></section>}
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No references yet.'}>
        <div className="std-admin-list">
          {(data || []).map((s) => (mode === s.id ? (
            <section key={s.id} className="panel"><StandardForm initial={stdForm(s)} busy={busy} onSubmit={(f) => save(f, s.id)} onCancel={() => setMode(null)} /></section>
          ) : (
            <section key={s.id} className="panel std-admin">
              <header>
                <div><h3>{s.code}</h3><p>{s.title}</p></div>
                <span className={`badge badge-${STD_TONE[s.verification_status] || 'neutral'}`}>{STD_STATUS[s.verification_status] || s.verification_status}</span>
              </header>
              <p className="adm-muted">{s.edition || 'Edition not entered'} · {s.display ? 'Shown publicly' : 'Hidden'}{s.verified_on ? ` · checked ${fmtDay(s.verified_on)}` : ''}</p>
              {s.source_note && <p className="adm-muted">{s.source_note}</p>}
              <div className="lic-admin-actions">
                {s.source_url && <a className="text-btn" href={s.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink size={14} /> Source</a>}
                <button type="button" className="text-btn" onClick={() => setMode(s.id)}><Pencil size={14} /> Edit</button>
                <button type="button" className="text-btn danger" onClick={() => remove(s)}><Trash2 size={14} /> Delete</button>
              </div>
            </section>
          )))}
        </div>
      </State>
    </>
  );
};

/* ======================= Reference prices ======================= */
const MATCH = { matched: 'Matched', review: 'Needs review', unmatched: 'No equivalent' };
const MATCH_TONE = { matched: 'success', review: 'warning', unmatched: 'neutral' };
const diffCell = (d) => (d == null ? '—' : <span className={d > 0 ? 'diff-up' : d < 0 ? 'diff-down' : ''}>{d > 0 ? '+' : ''}{inr(d)}</span>);

const RefEditor = ({ r, products, onSave, onCancel, busy }) => {
  const [f, setF] = useState({ productId: r.product_id || '', matchStatus: r.match_status, displayedPrice: r.displayed_price ?? '', displayedMrp: r.displayed_mrp ?? '', checkedOn: r.checked_on || '', notes: r.notes || '' });
  const [q, setQ] = useState(`${r.ref_brand} ${r.ref_name}`.split(' ').slice(0, 2).join(' '));
  const options = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => !t || `${p.brand} ${p.name} ${p.pack_size}`.toLowerCase().includes(t)).slice(0, 60);
  }, [products, q]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <form className="doc-form ref-editor" onSubmit={(e) => { e.preventDefault(); onSave(f); }}>
      <div className="inv-grid">
        <label>Find our product<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Brand or name" /></label>
        <label>Our product<select value={f.productId} onChange={set('productId')}>
          <option value="">— none —</option>
          {options.map((p) => <option key={p.id} value={p.id}>{p.brand} · {p.name} · {p.pack_size}</option>)}
          {f.productId && !options.some((p) => String(p.id) === String(f.productId)) && <option value={f.productId}>Current link (#{f.productId})</option>}
        </select></label>
        <label>Match<select value={f.matchStatus} onChange={set('matchStatus')}>{Object.entries(MATCH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label>Their price (₹)<input type="number" min="0" step="0.01" value={f.displayedPrice} onChange={set('displayedPrice')} /></label>
        <label>Their MRP (₹)<input type="number" min="0" step="0.01" value={f.displayedMrp} onChange={set('displayedMrp')} /></label>
        <label>Checked on<input type="date" value={f.checkedOn} onChange={set('checkedOn')} /></label>
      </div>
      <label>Notes<input value={f.notes} onChange={set('notes')} maxLength={500} /></label>
      <p className="adm-muted">Match only the same product, same formulation and same pack. This never changes our own MRP or selling price.</p>
      <div className="drawer-foot">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
};

export const ReferencePricesAdmin = ({ notify }) => {
  const { data, error, loading, reload } = useLoad('/reference-prices');
  const prods = useLoad('/products?all=1');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => (data || []).filter((r) => (!status || r.match_status === status)
    && (!q.trim() || `${r.ref_brand} ${r.ref_name} ${r.our_name || ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [data, status, q]);
  const counts = useMemo(() => (data || []).reduce((a, r) => ({ ...a, [r.match_status]: (a[r.match_status] || 0) + 1 }), {}), [data]);
  const save = async (r, f) => {
    setBusy(true);
    try {
      await api(`/reference-prices/${r.id}`, { method: 'PATCH', body: { ...blankToNull(f), productId: f.productId ? Number(f.productId) : null } });
      notify('Reference price saved'); setEditing(null); reload();
    } catch (err) { notify(err.message, 'error'); }
    setBusy(false);
  };
  const exportCsv = () => {
    const head = ['Source brand', 'Source product', 'Pack', 'Their price', 'Their MRP', 'Price shown', 'Checked on', 'Match', 'Our product', 'Our pack', 'Our MRP', 'Our selling', 'Difference', 'Source URL'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = rows.map((r) => [r.ref_brand, r.ref_name, r.ref_pack, r.displayed_price, r.displayed_mrp, r.price_status, r.checked_on, MATCH[r.match_status], r.our_name, r.our_pack, r.our_mrp, r.our_selling, r.difference, r.source_url].map(esc).join(','));
    const url = URL.createObjectURL(new Blob([[head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'reference-prices.csv' });
    a.click(); URL.revokeObjectURL(url);
  };
  return (
    <>
      <p className="adm-muted reg-intro"><ShieldAlert size={14} /> Market reference prices for comparison only. They are kept separate from our prices and are never applied automatically.</p>
      <div className="toolbar">
        <label className="search-field"><Search size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search product or brand" aria-label="Search reference prices" /></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Match status">
          <option value="">All ({data?.length ?? 0})</option>
          {Object.entries(MATCH).map(([k, v]) => <option key={k} value={k}>{v} ({counts[k] || 0})</option>)}
        </select>
        <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv} disabled={!rows.length}><FileText size={14} /> Export CSV</button>
      </div>
      <State loading={loading && !data} error={error} empty={data?.length === 0 && 'No reference prices recorded.'}>
        <div className="panel table-wrap">
          <table className="adm-table ref-table">
            <thead><tr><th>Reference product</th><th>Their price</th><th>Checked</th><th>Match</th><th>Our product</th><th>Our MRP</th><th>Our selling</th><th>Diff.</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (editing === r.id ? (
                <tr key={r.id}><td colSpan={9}><strong>{r.ref_brand} {r.ref_name} {r.ref_pack}</strong>
                  <RefEditor r={r} products={prods.data?.products || []} busy={busy} onSave={(f) => save(r, f)} onCancel={() => setEditing(null)} /></td></tr>
              ) : (
                <tr key={r.id}>
                  <td><a href={r.source_url} target="_blank" rel="noopener noreferrer nofollow">{r.ref_brand} {r.ref_name} <ExternalLink size={12} /></a><small>{r.ref_pack || 'Pack not shown'}{r.notes ? ` · ${r.notes}` : ''}</small></td>
                  <td>{r.displayed_price != null ? inr(r.displayed_price) : <em>{r.price_status === 'enquiry' ? 'On enquiry' : 'Not shown'}</em>}{r.displayed_mrp != null && <small>MRP {inr(r.displayed_mrp)}</small>}</td>
                  <td>{fmtDay(r.checked_on)}</td>
                  <td><span className={`badge badge-${MATCH_TONE[r.match_status]}`}>{MATCH[r.match_status]}</span></td>
                  <td>{r.our_name ? <>{r.our_name}<small>{r.our_pack}</small></> : '—'}</td>
                  <td>{r.our_mrp != null ? inr(r.our_mrp) : '—'}</td>
                  <td>{r.our_selling != null ? inr(r.our_selling) : '—'}</td>
                  <td>{diffCell(r.difference)}</td>
                  <td><button type="button" className="text-btn" onClick={() => setEditing(r.id)}><Link2 size={14} /> Review</button></td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </State>
    </>
  );
};
