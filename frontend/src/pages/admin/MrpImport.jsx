// Paste a manufacturer MRP price list and apply it to the catalogue in one step.
// Lines: Brand, Product, Pack, MRP  (comma- or tab-separated, e.g. copied from Excel).
import { useState } from 'react';
import { X, FileSpreadsheet, CheckCircle, AlertTriangle } from 'lucide-react';
import { api } from '../../lib/api';

const ACTION = {
  update: 'Update MRP', 'set-pack': 'Set pack size + MRP', create: 'Add new pack', unmatched: 'No matching product', invalid: 'Incomplete row', conflict: 'Price conflict',
};
const parse = (text) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  .map((l) => l.includes('\t') ? l.split('\t') : l.split(/\s*,\s*/))
  .filter((c) => !/^brand$/i.test(String(c[0]).trim()))
  .map(([brand, name, pack, ...rest]) => ({ brand: brand?.trim(), name: name?.trim(), pack: pack?.trim(), mrp: rest.join('').trim() }));

const MrpImport = ({ onClose, onApplied, notify }) => {
  const [text, setText] = useState('');
  const [source, setSource] = useState('Manufacturer MRP price list');
  const [plan, setPlan] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const rows = parse(text);
  const preview = async () => {
    setBusy(true);
    try { setPlan(await api('/products/mrp-import', { method: 'POST', body: { rows, apply: false } })); } catch (e) { notify(e.message, 'error'); }
    setBusy(false);
  };
  const apply = async () => {
    setBusy(true);
    try {
      const r = await api('/products/mrp-import', { method: 'POST', body: { rows, apply: true, confirm, source } });
      const n = (r.counts.update || 0) + (r.counts['set-pack'] || 0) + (r.counts.create || 0);
      notify(`${n} MRPs saved`);
      onApplied();
    } catch (e) { notify(e.message, 'error'); }
    setBusy(false);
  };
  const applicable = plan ? plan.plan.filter((x) => ['update', 'set-pack', 'create'].includes(x.action)).length : 0;
  return (
    <div className="drawer-scrim" onMouseDown={onClose}>
      <aside className="drawer wide" onMouseDown={(e) => e.stopPropagation()} data-lenis-prevent>
        <header className="drawer-head">
          <div><span className="mono">Products</span><h3><FileSpreadsheet size={18} /> Import MRP list</h3></div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        <div className="mrp-import">
          <p className="adm-muted">Paste one line per pack: <b>Brand, Product, Pack, MRP</b> (copy columns straight from Excel works too). Names must match the shop, e.g. <code>Kalyani, Ozier, 1 L, 4200</code>. Nothing changes until you preview and confirm.</p>
          <textarea rows="10" value={text} onChange={(e) => { setText(e.target.value); setPlan(null); }} placeholder={'Brand, Product, Pack, MRP\nHeranba, Reprove, 1 L, 1700\nKalyani, Ozier, 250 ml, 1150'} aria-label="MRP list" />
          <label>Source<input value={source} onChange={(e) => setSource(e.target.value)} maxLength={120} placeholder="e.g. Heranba MRP list April 2026" /></label>
          <div className="drawer-foot">
            <span className="adm-muted">{rows.length} rows read</span>
            <button type="button" className="btn btn-outline btn-sm" disabled={!rows.length || busy} onClick={preview}>Preview</button>
          </div>
          {plan && (
            <>
              <p className="adm-muted">{Object.entries(plan.counts).map(([k, v]) => `${ACTION[k] || k}: ${v}`).join(' · ')}</p>
              <div className="table-wrap flat">
                <table className="adm-table">
                  <thead><tr><th>#</th><th>Product</th><th>Pack</th><th>MRP</th><th>Result</th></tr></thead>
                  <tbody>{plan.plan.map((x) => (
                    <tr key={x.row} className={`mrp-${x.action}`}>
                      <td>{x.row}</td>
                      <td>{x.brand} {x.name}</td>
                      <td>{x.pack}{x.action === 'set-pack' && <small>was “{x.currentPack}”</small>}</td>
                      <td>{x.mrp != null ? `₹${x.mrp.toLocaleString('en-IN')}` : '—'}{x.currentMrp != null && x.currentMrp !== x.mrp && <small>was ₹{x.currentMrp}</small>}</td>
                      <td>{['update', 'set-pack', 'create'].includes(x.action) ? <><CheckCircle size={13} /> {ACTION[x.action]}</> : <><AlertTriangle size={13} /> {ACTION[x.action]}<small>{x.reason}</small></>}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <label className="check-row"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /> Every MRP above is copied exactly from the manufacturer’s current MRP list or the printed pack.</label>
              <div className="drawer-foot">
                <button type="button" className="btn btn-primary btn-sm" disabled={!confirm || !applicable || busy} onClick={apply}>{busy ? 'Saving…' : `Apply ${applicable} MRPs`}</button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
};

export default MrpImport;
