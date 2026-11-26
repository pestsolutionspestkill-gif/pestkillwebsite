import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Calculator, Printer, ShieldAlert, FileText, Info, Ruler, FlaskConical, ArrowLeft, BadgeCheck, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';
import { termitePreGeometry, calculate, packPlan, costOf, toSqm, toMetres, UNITS } from '../lib/doseEngine';
import { referenceDose, unitFor } from '../lib/doseReference';
import { priceInfo } from '../lib/shop';
import businessConfig from '../data/businessConfig';
import './DosageCalculator.css';

// Mirrors backend/src/routes/doseRoutes.js ACTIVITIES (kept here so the page renders before data loads).
export const ACTIVITIES = [
  { key: 'termite_pre', label: 'Termite: pre-construction', hint: 'Soil treatment before the floor is laid' },
  { key: 'termite_post', label: 'Termite: post-construction', hint: 'Existing buildings, along walls and floors' },
  { key: 'cockroach', label: 'Cockroach', hint: 'Residual spray on surfaces' },
  { key: 'bedbug', label: 'Bed bug', hint: 'Residual spray in rooms' },
  { key: 'general', label: 'General pests', hint: 'Residual spray on surfaces' },
  { key: 'mosquito_residual', label: 'Mosquito: indoor residual spray', hint: 'Walls and ceilings' },
  { key: 'larvicide', label: 'Mosquito: larvicide', hint: 'Water in tanks, drains and ponds' },
  { key: 'rodent', label: 'Rodent', hint: 'Bait placement' },
];
const SURFACE = ['cockroach', 'bedbug', 'general', 'mosquito_residual'];
// Which catalogue products to offer for each activity ('' = all).
const PEST_OF = { termite_pre: 'termite', termite_post: 'termite', cockroach: 'cockroach', bedbug: 'bedbug', general: '', mosquito_residual: 'mosquito', larvicide: 'mosquito', rodent: 'rodent' };
// Dose figures each activity needs, in the order shown.
const DOSE_FIELDS = {
  termite_pre: ['product_per_litre', 'rate_horizontal', 'rate_vertical', 'rate_running'],
  termite_post: ['product_per_litre', 'rate_running', 'rate_per_hole', 'rate_horizontal'],
  cockroach: ['product_per_litre', 'rate_horizontal'], bedbug: ['product_per_litre', 'rate_horizontal'],
  general: ['product_per_litre', 'rate_horizontal'], mosquito_residual: ['product_per_litre', 'rate_horizontal'],
  larvicide: ['product_per_1000l'], rodent: ['bait_per_point'],
};
const DOSE_LABEL = {
  product_per_litre: (u) => `Dilution: product per litre of solution (${u})`,
  rate_horizontal: () => 'Solution per m² of horizontal surface (L)', rate_vertical: () => 'Solution per m² of vertical surface (L)',
  rate_running: () => 'Solution per running metre (L)', rate_per_hole: () => 'Solution per drill hole, maximum (L)',
  product_per_1000l: (u) => `Product per 1000 L of water (${u})`, bait_per_point: () => 'Bait per point (g)',
};
const fmt = (n, d = 2) => (n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: d }));
const inr = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const Field = ({ label, unit, value, onChange, hint }) => (
  <label className="dc-field">
    <span>{label}{unit && <em> ({unit})</em>}</span>
    <input type="number" min="0" step="any" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} />
    {hint && <small>{hint}</small>}
  </label>
);

const DosageCalculator = () => {
  const [params, setParams] = useSearchParams();
  const activity = ACTIVITIES.some((a) => a.key === params.get('activity')) ? params.get('activity') : 'termite_pre';
  const [system, setSystem] = useState('metric');
  const [m, setM] = useState({ length: '', width: '', plinthArea: '', perimeter: '', floorArea: '', junction: '', surface: '', water: '', points: '',
    foundation: 'strip', trenchLength: '', trenchWidth: '', trenchDepth: '', pits: '', pitLength: '', pitWidth: '', pitDepth: '' });
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [recordId, setRecordId] = useState(params.get('record') || '');
  const [packId, setPackId] = useState('');
  // "Any product" mode: the user picks from the catalogue and sees/edits every dose figure.
  const [modeChoice, setMode] = useState(null); // null = automatic: verified data when it exists
  const [catalogue, setCatalogue] = useState(null);
  const [brand, setBrand] = useState('');
  const [itemKey, setItemKey] = useState('');
  const [anyPackId, setAnyPackId] = useState('');
  const [dose, setDose] = useState({});
  const [doseSrc, setDoseSrc] = useState({});
  const set = (k) => (v) => setM((s) => ({ ...s, [k]: v }));
  const u = UNITS[system];

  useEffect(() => {
    let live = true;
    setData(null); setError(''); setMode(null);
    api(`/doses/calculator?activity=${activity}`).then((d) => {
      if (!live) return;
      setData(d);
      setRecordId((cur) => (d.records.some((r) => String(r.id) === String(cur)) ? cur : d.records[0] ? String(d.records[0].id) : ''));
    }).catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [activity]);

  useEffect(() => {
    let live = true;
    setCatalogue(null);
    const pest = PEST_OF[activity];
    api(`/products?sort=name${pest ? `&pest=${pest}` : ''}`).then((d) => { if (live) setCatalogue(d.products); }).catch(() => live && setCatalogue([]));
    return () => { live = false; };
  }, [activity]);

  // One entry per product (all its pack sizes together), grouped by brand.
  const items = useMemo(() => {
    const map = new Map();
    for (const p of catalogue || []) {
      const key = `${p.brand}|${p.name}`;
      if (!map.has(key)) map.set(key, { key, brand: p.brand, name: p.name, technical: p.technical, formulation: p.formulation, slug: p.slug, packs: [] });
      map.get(key).packs.push(p);
    }
    return [...map.values()];
  }, [catalogue]);
  const brands = useMemo(() => [...new Set(items.map((i) => i.brand))].sort(), [items]);
  useEffect(() => {
    if (!items.length) { setItemKey(''); return; }
    const b = brands.includes(brand) ? brand : brands[0];
    setBrand(b);
    if (!items.some((i) => i.key === itemKey && i.brand === b)) setItemKey(items.find((i) => i.brand === b)?.key || '');
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps
  const item = items.find((i) => i.key === itemKey) || null;
  // Reset the dose figures to the reference starting points whenever the product or activity changes.
  useEffect(() => {
    if (!item) { setDose({}); setDoseSrc({}); return; }
    const ref = referenceDose(activity, item);
    setDose({ amount_unit: unitFor(item), ...Object.fromEntries(DOSE_FIELDS[activity].map((k) => [k, ref.fields[k] ?? ''])) });
    setDoseSrc(ref.sources);
    setAnyPackId(String(item.packs.find((p) => !priceInfo(p).onRequest)?.id || item.packs[0]?.id || ''));
  }, [item?.key, activity]); // eslint-disable-line react-hooks/exhaustive-deps
  const resetDose = () => {
    const ref = referenceDose(activity, item);
    setDose((d) => ({ ...d, ...Object.fromEntries(DOSE_FIELDS[activity].map((k) => [k, ref.fields[k] ?? ''])) }));
    setDoseSrc(ref.sources);
  };
  const editDose = (k) => (v) => { setDose((d) => ({ ...d, [k]: v })); setDoseSrc((x) => { const n = { ...x }; delete n[k]; return n; }); };

  const record = data?.records.find((r) => String(r.id) === String(recordId)) || null;
  // Default to the pack the verified label belongs to; otherwise the first listed pack.
  useEffect(() => {
    const own = record?.packs?.find((x) => x.id === record.product_id);
    setPackId(own ? String(own.id) : record?.packs?.[0] ? String(record.packs[0].id) : '');
  }, [record?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const verifiedPack = record?.packs.find((p) => String(p.id) === String(packId)) || null;
  const anyPack = item?.packs.find((p) => String(p.id) === String(anyPackId)) || null;
  const manual = item ? {
    status: 'manual', amount_unit: dose.amount_unit || 'ml',
    ...Object.fromEntries(DOSE_FIELDS[activity].map((k) => [k, Number(dose[k]) > 0 ? Number(dose[k]) : null])),
    product: { name: item.name, technical: item.technical, brand: item.brand },
  } : null;
  const mode = modeChoice || (data ? (data.records.length ? 'verified' : 'any') : error ? 'any' : null);
  const active = mode === 'verified' ? record : mode === 'any' ? manual : null;
  const anyPrice = anyPack ? priceInfo(anyPack) : null;
  const pack = mode === 'verified' ? verifiedPack : anyPack ? { ...anyPack, price: anyPrice.onRequest ? null : anyPrice.pay } : null;

  // Measurements → metric quantities used by the engine.
  const measures = useMemo(() => {
    if (activity === 'termite_pre') {
      const foundation = m.foundation === 'strip'
        ? { type: 'strip', trenchLength: m.trenchLength || undefined, trenchWidth: m.trenchWidth, trenchDepth: m.trenchDepth }
        : m.foundation === 'pits' ? { type: 'pits', count: m.pits, pitLength: m.pitLength, pitWidth: m.pitWidth, pitDepth: m.pitDepth } : {};
      return termitePreGeometry({ system, length: m.length, width: m.width, plinthArea: m.plinthArea || undefined, perimeter: m.perimeter || undefined, foundation });
    }
    if (activity === 'termite_post') {
      const g = termitePreGeometry({ system, length: m.length, width: m.width, perimeter: m.perimeter || undefined });
      const junctionM = toMetres(m.junction, system);
      // IS 6313 (Part 3) cl. 5.3.1.3: holes about 300 mm apart along floor–wall junctions and joints.
      const holes = junctionM ? Math.ceil(junctionM / 0.3) + 1 : null;
      return { perimeterM: g.perimeterM, floorSqm: toSqm(m.floorArea, system), holes, derived: holes ? [...g.derived, `${holes} drill holes at 300 mm spacing`] : g.derived };
    }
    if (SURFACE.includes(activity)) return { surfaceSqm: toSqm(m.surface, system), derived: [] };
    if (activity === 'larvicide') return { waterLitres: Number(m.water) || null, derived: [] };
    return { baitPoints: Number(m.points) || null, derived: [] };
  }, [activity, m, system]);

  const result = active ? calculate({ activity, record: active, measures }) : null;
  const plan = result && !result.error && pack ? packPlan(result.product.amount, result.product.unit, pack.pack_size) : null;
  const cost = plan ? costOf(plan.packs, pack.price) : null;
  const show = (sqm) => (system === 'imperial' && sqm != null ? sqm / 0.09290304 : sqm);
  const showLen = (mtr) => (system === 'imperial' && mtr != null ? mtr / 0.3048 : mtr);

  const chooseActivity = (key) => { const next = new URLSearchParams(params); next.set('activity', key); next.delete('record'); setParams(next, { replace: true }); };

  return (
    <div className="dc-page">
      <div className="container dc-wrap">
        <Link to="/shop" className="tools-back no-print"><ArrowLeft size={16} /> Back to shop</Link>
        <header className="dc-head">
          <span className="eyebrow"><Calculator size={15} /> Dosage calculator</span>
          <h1>How much product and solution do you need?</h1>
          <p>Pick any product from our shop and get the solution, product, water, packs and cost for the job. Termite figures start from the IS 6313 code of practice; every figure shows its source and can be changed, and label data verified by our team is marked. The label on the pack always takes precedence.</p>
        </header>

        <section className="dc-card no-print-break">
          <h2><span className="dc-step">1</span> Treatment activity</h2>
          <div className="dc-activities" role="radiogroup" aria-label="Treatment activity">
            {ACTIVITIES.map((a) => (
              <button key={a.key} type="button" role="radio" aria-checked={activity === a.key} className={activity === a.key ? 'on' : ''} onClick={() => chooseActivity(a.key)}>
                <strong>{a.label}</strong><span>{a.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="dc-card">
          <div className="dc-row-head">
            <h2><span className="dc-step">2</span> Measurements</h2>
            {activity !== 'larvicide' && activity !== 'rodent' && (
              <div className="dc-units" role="group" aria-label="Units">
                <button type="button" className={system === 'metric' ? 'on' : ''} aria-pressed={system === 'metric'} onClick={() => setSystem('metric')}>Metric (m)</button>
                <button type="button" className={system === 'imperial' ? 'on' : ''} aria-pressed={system === 'imperial'} onClick={() => setSystem('imperial')}>Imperial (ft)</button>
              </div>
            )}
          </div>

          {(activity === 'termite_pre' || activity === 'termite_post') && (
            <div className="dc-grid">
              <Field label="Building length" unit={u.length} value={m.length} onChange={set('length')} />
              <Field label="Building width" unit={u.length} value={m.width} onChange={set('width')} />
              {activity === 'termite_pre' && <Field label="Plinth area" unit={u.area} value={m.plinthArea} onChange={set('plinthArea')} hint="Leave empty to use length × width" />}
              <Field label="External perimeter" unit={u.length} value={m.perimeter} onChange={set('perimeter')} hint="Leave empty to use 2 × (length + width)" />
              {activity === 'termite_post' && <Field label="Inside floor–wall junctions and joints" unit={u.length} value={m.junction} onChange={set('junction')} hint="Total length to drill; holes every 300 mm" />}
              {activity === 'termite_post' && <Field label="Floor area to treat" unit={u.area} value={m.floorArea} onChange={set('floorArea')} hint="Optional, only if the label gives a rate" />}
            </div>
          )}
          {activity === 'termite_pre' && (
            <>
              <label className="dc-field dc-select">
                <span>Foundation type</span>
                <select value={m.foundation} onChange={(e) => set('foundation')(e.target.value)}>
                  <option value="strip">Strip / wall foundation (trench)</option>
                  <option value="pits">Isolated column footings (pits)</option>
                  <option value="none">Raft or not applicable</option>
                </select>
              </label>
              {m.foundation === 'strip' && (
                <div className="dc-grid">
                  <Field label="Trench length" unit={u.length} value={m.trenchLength} onChange={set('trenchLength')} hint="Empty = perimeter" />
                  <Field label="Trench width" unit={u.length} value={m.trenchWidth} onChange={set('trenchWidth')} />
                  <Field label="Trench depth" unit={u.length} value={m.trenchDepth} onChange={set('trenchDepth')} />
                </div>
              )}
              {m.foundation === 'pits' && (
                <div className="dc-grid">
                  <Field label="Number of pits" value={m.pits} onChange={set('pits')} />
                  <Field label="Pit length" unit={u.length} value={m.pitLength} onChange={set('pitLength')} />
                  <Field label="Pit width" unit={u.length} value={m.pitWidth} onChange={set('pitWidth')} />
                  <Field label="Pit depth" unit={u.length} value={m.pitDepth} onChange={set('pitDepth')} />
                </div>
              )}
            </>
          )}
          {SURFACE.includes(activity) && <div className="dc-grid"><Field label="Surface area to treat" unit={u.area} value={m.surface} onChange={set('surface')} hint="Walls, floors and other treated surfaces together" /></div>}
          {activity === 'larvicide' && <div className="dc-grid"><Field label="Water to treat" unit="litres" value={m.water} onChange={set('water')} hint="Tank, drain or pond volume" /></div>}
          {activity === 'rodent' && <div className="dc-grid"><Field label="Number of bait points" value={m.points} onChange={set('points')} /></div>}

          {(activity === 'termite_pre' || activity === 'termite_post') && (
            <div className="dc-derived" aria-live="polite">
              <Ruler size={16} />
              <dl>
                {activity === 'termite_pre' && <div><dt>Plinth area</dt><dd>{fmt(show(measures.plinthSqm))} {u.area}</dd></div>}
                <div><dt>Perimeter</dt><dd>{fmt(showLen(measures.perimeterM))} {u.length}</dd></div>
                {activity === 'termite_post' && measures.holes != null && <div><dt>Drill holes</dt><dd>{measures.holes}</dd></div>}
                {activity === 'termite_pre' && measures.foundationBottomSqm != null && <div><dt>Foundation bottom</dt><dd>{fmt(show(measures.foundationBottomSqm))} {u.area}</dd></div>}
                {activity === 'termite_pre' && measures.foundationSidesSqm != null && <div><dt>Foundation sides</dt><dd>{fmt(show(measures.foundationSidesSqm))} {u.area}</dd></div>}
              </dl>
              {measures.derived?.length > 0 && <small>{measures.derived.join(' · ')}</small>}
            </div>
          )}
        </section>

        <section className="dc-card">
          <div className="dc-row-head">
            <h2><span className="dc-step">3</span> Product and dose</h2>
            <div className="dc-units" role="group" aria-label="Dose source">
              <button type="button" className={mode === 'any' ? 'on' : ''} aria-pressed={mode === 'any'} onClick={() => setMode('any')}>Any product</button>
              <button type="button" className={mode === 'verified' ? 'on' : ''} aria-pressed={mode === 'verified'} onClick={() => setMode('verified')}>Verified label data{data ? ` (${data.records.length})` : ''}</button>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}

          {mode === 'any' && (
            <>
              {!catalogue && <span className="spinner" />}
              {catalogue && items.length === 0 && <p className="dc-muted">No products in the shop for this activity yet.</p>}
              {items.length > 0 && (
                <div className="dc-grid">
                  <label className="dc-field dc-select">
                    <span>Brand</span>
                    <select value={brand} onChange={(e) => { setBrand(e.target.value); setItemKey(items.find((i) => i.brand === e.target.value)?.key || ''); }}>
                      {brands.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </label>
                  <label className="dc-field dc-select">
                    <span>Product</span>
                    <select value={itemKey} onChange={(e) => setItemKey(e.target.value)}>
                      {items.filter((i) => i.brand === brand).map((i) => <option key={i.key} value={i.key}>{i.name}{i.technical ? ` · ${i.technical}` : ''}</option>)}
                    </select>
                  </label>
                  {item && (
                    <label className="dc-field dc-select">
                      <span>Pack size</span>
                      <select value={anyPackId} onChange={(e) => setAnyPackId(e.target.value)}>
                        {item.packs.map((p) => { const pi = priceInfo(p); return <option key={p.id} value={p.id}>{p.pack_size}{pi.onRequest ? ' · price on request' : ` · ${inr(pi.pay)}`}</option>; })}
                      </select>
                    </label>
                  )}
                </div>
              )}
              {item && (
                <div className="dc-dose">
                  <div className="dc-dose-head">
                    <strong>Dose figures for {item.name}</strong>
                    <button type="button" className="text-btn" onClick={resetDose}>Reset to reference</button>
                  </div>
                  <div className="dc-grid">
                    {DOSE_FIELDS[activity].map((k) => (
                      <label key={k} className={`dc-field ${doseSrc[k] ? 'is-ref' : dose[k] === '' || dose[k] == null ? 'is-empty' : 'is-own'}`}>
                        <span>{DOSE_LABEL[k](dose.amount_unit || 'ml')}</span>
                        <input type="number" min="0" step="any" inputMode="decimal" value={dose[k] ?? ''} onChange={(e) => editDose(k)(e.target.value)} placeholder="From the label" />
                        <small>{doseSrc[k] ? <><BadgeCheck size={12} /> {doseSrc[k].source}</> : dose[k] === '' || dose[k] == null ? 'Enter from the product label' : 'Your figure'}</small>
                      </label>
                    ))}
                    {['product_per_litre', 'product_per_1000l'].some((k) => DOSE_FIELDS[activity].includes(k)) && (
                      <label className="dc-field dc-select">
                        <span>Product measured in</span>
                        <select value={dose.amount_unit || 'ml'} onChange={(e) => setDose((d) => ({ ...d, amount_unit: e.target.value }))}>
                          <option value="ml">ml (liquid)</option><option value="g">g (powder, granules)</option>
                        </select>
                      </label>
                    )}
                  </div>
                  {Object.values(doseSrc).length > 0 && (
                    <ul className="dc-refs">{Object.entries(doseSrc).map(([k, v]) => <li key={k}><Info size={13} /> {v.note}</li>)}</ul>
                  )}
                  <p className="dc-label-note"><AlertTriangle size={15} /> Starting points only. Figures marked with a standard come from <Link to="/technical-standards">IS 6313</Link>; the rest are yours. Check the concentration, rate and method on the <Link to={`/shop/${item.slug}`}>product label and leaflet</Link> before use; the label always takes precedence.</p>
                </div>
              )}
            </>
          )}

          {mode === 'verified' && data && data.records.length === 0 && (
            <div className="dc-notice">
              <AlertTriangle size={18} />
              <div>
                <strong>No verified label data yet</strong>
                <p>Our team has not verified label data for this activity yet{data.pending ? ` (${data.pending} awaiting verification)` : ''}. Use <button type="button" className="link-more" onClick={() => setMode('any')}>Any product</button> to calculate with the reference figures and the label on your pack.</p>
              </div>
            </div>
          )}
          {mode === 'verified' && data && data.records.length > 0 && (
            <div className="dc-grid">
              <label className="dc-field dc-select">
                <span>Product</span>
                <select value={recordId} onChange={(e) => setRecordId(e.target.value)}>
                  {data.records.map((r) => <option key={r.id} value={r.id}>{r.product.brand} {r.product.name} · {r.method}</option>)}
                </select>
              </label>
              {record?.packs.length > 0 && (
                <label className="dc-field dc-select">
                  <span>Pack size</span>
                  <select value={packId} onChange={(e) => setPackId(e.target.value)}>
                    {record.packs.map((p) => <option key={p.id} value={p.id}>{p.pack_size}{p.price != null ? ` · ${inr(p.price)}` : ' · price on request'}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}
          {mode === 'verified' && record && (
            <p className="dc-source"><BadgeCheck size={15} /> {record.product.technical} · {record.method}. Verified{record.verified_at ? ` on ${new Date(record.verified_at).toLocaleDateString('en-IN')}` : ''} from {record.source_document ? <a href={record.source_document.url} target="_blank" rel="noopener noreferrer">{record.source_document.title}</a> : record.source_note}.{record.manufacturer ? ` Manufacturer: ${record.manufacturer}.` : ''}{record.standard ? <> Related code of practice: <Link to="/technical-standards">{record.standard.code}</Link>.</> : ''}</p>
          )}
        </section>

        {active && result && (
          <section className="dc-card dc-result" aria-live="polite">
            <div className="dc-row-head">
              <h2><FlaskConical size={18} /> Result</h2>
              {!result.error && <button type="button" className="btn btn-white btn-sm no-print" onClick={() => window.print()}><Printer size={15} /> Print report</button>}
            </div>
            {result.error ? <p className="dc-muted">{result.error}</p> : (
              <>
                <div className="dc-totals">
                  {result.solutionL != null && <div><span>Diluted solution</span><strong>{fmt(result.solutionL)} L</strong></div>}
                  <div><span>{active.product.name}</span><strong>{fmt(result.product.amount, 1)} {result.product.unit}</strong></div>
                  {result.waterL != null && <div><span>Water</span><strong>{fmt(result.waterL)} L</strong></div>}
                  {plan && <div><span>Packs of {pack.pack_size}</span><strong>{plan.packs}</strong></div>}
                  {cost != null && <div><span>Estimated product cost</span><strong>{inr(cost)}</strong></div>}
                </div>
                <table className="dc-table">
                  <caption>Calculation breakdown</caption>
                  <thead><tr><th scope="col">Part</th><th scope="col">Quantity</th><th scope="col">Rate used</th><th scope="col">Result</th></tr></thead>
                  <tbody>
                    {result.components.map((c) => (
                      <tr key={c.key}>
                        <th scope="row">{c.label}</th>
                        <td>{fmt(c.unit === 'm²' ? show(c.quantity) : c.unit === 'm' ? showLen(c.quantity) : c.quantity)} {c.unit === 'm²' ? u.area : c.unit === 'm' ? u.length : c.unit}</td>
                        <td>{fmt(c.rate, 3)} {c.rateUnit}</td>
                        <td>{c.solutionL != null ? `${fmt(c.solutionL)} L solution` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {active.product_per_litre && result.solutionL != null && <p className="dc-muted">Dilution: {fmt(active.product_per_litre, 3)} {active.amount_unit} of product per litre of solution × {fmt(result.solutionL)} L = {fmt(result.product.amount, 1)} {result.product.unit}.</p>}
                {result.skipped?.length > 0 && <ul className="dc-skipped">{result.skipped.map((s) => <li key={s.key}><Info size={14} /> {s.label}: {s.reason}</li>)}</ul>}
                {!plan && pack && <p className="dc-muted">Pack count not shown: the pack size "{pack.pack_size}" could not be matched to the product unit.</p>}
                {pack && pack.price == null && <p className="dc-muted">No price is listed for this pack, so cost is not estimated.</p>}
              </>
            )}
          </section>
        )}

        <section className="dc-card dc-safety">
          <h2><ShieldAlert size={18} /> Assumptions and safety</h2>
          <ul>
            <li>Termite starting figures follow IS 6313 (Parts 2 and 3) : 2001: 5 L/m² on horizontal surfaces, 7.5 L/m² on vertical surfaces, 2.25 L per running metre along the perimeter and up to 1 L per drill hole. The standard lists chlorpyrifos 20 EC at 1.0% active ingredient; for other chemicals enter the dilution from the label.</li>
            <li>Always read the label and leaflet on the pack before use. If it differs from any figure here, the pack label is correct.</li>
            <li>Areas are calculated from the measurements you enter; site conditions (soil type, porosity, moisture) can change the quantity needed.</li>
            <li>Pack counts are rounded up to whole packs; cost uses the listed MRP or running offer and excludes delivery.</li>
            <li>For licensed pest control operators only. Wear protective equipment, keep people, pets and food away from treated areas, and dispose of containers as the label directs.</li>
          </ul>
          <p className="no-print"><FileText size={15} /> Labels, SDS and datasheets: <Link to="/shop/library">downloads library</Link>. Questions: <a href={`https://wa.me/${businessConfig.whatsappNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp our technical team</a>.</p>
        </section>
        <p className="dc-print-foot">PestKill Pest Solutions · {businessConfig.phoneNumber} · Calculation generated on {new Date().toLocaleDateString('en-IN')}</p>
      </div>
    </div>
  );
};

export default DosageCalculator;
