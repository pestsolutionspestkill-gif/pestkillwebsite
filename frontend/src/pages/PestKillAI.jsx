// /pestkill-ai – the PestKill AI product page.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquareText, Camera, Stethoscope, Calculator, ShieldCheck, BookOpenCheck, Languages, Lock, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import AiChat from '../components/ai/AiChat';
import { estimate, QUOTE_SERVICES, GST_NOTE } from '../data/pricing';
import './PestKillAI.css';

const TABS = [
  { key: 'assistant', label: 'Ask', icon: MessageSquareText, hint: 'Pests, services, prices, bookings, products' },
  { key: 'identify', label: 'Identify from photo', icon: Camera, hint: 'Upload a photo of the pest or damage' },
  { key: 'diagnose', label: 'Diagnose', icon: Stethoscope, hint: 'Guided questions, preliminary assessment' },
  { key: 'quote', label: 'Estimate price', icon: Calculator, hint: 'Official prices, GST shown separately' },
];

const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const PESTS = ['Termites / deemak', 'Cockroaches', 'Bed bugs', 'Rats or mice', 'Mosquitoes', 'Ants', 'Flies', 'Lizards', 'Not sure'];
const SIGNS = ['Live insects seen', 'Mud tubes on walls', 'Damaged / hollow wood', 'Droppings', 'Bites on skin', 'Bad smell', 'Gnaw marks or holes', 'Seen in daytime', 'Damp walls or leaks'];

const DiagnoseForm = ({ onSend, lang }) => {
  const [f, setF] = useState({ pest: 'Not sure', property: 'Apartment / flat', where: '', since: 'Less than a month', severity: 'A few times', signs: [], notes: '' });
  const toggle = (s) => setF({ ...f, signs: f.signs.includes(s) ? f.signs.filter((x) => x !== s) : [...f.signs, s] });
  const submit = (e) => {
    e.preventDefault();
    onSend(`Diagnosis questionnaire:
- Suspected pest: ${f.pest}
- Property: ${f.property}
- Where it is seen: ${f.where || 'not given'}
- Since: ${f.since}
- How often / how many: ${f.severity}
- Signs: ${f.signs.join(', ') || 'none ticked'}
- Notes: ${f.notes || 'none'}
Please give a preliminary assessment${lang === 'hi' ? ' in Hindi' : ''}.`);
  };
  return (
    <form className="pkai-form" onSubmit={submit}>
      <div className="pkai-grid">
        <label>What do you think it is?<select value={f.pest} onChange={(e) => setF({ ...f, pest: e.target.value })}>{PESTS.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Property<select value={f.property} onChange={(e) => setF({ ...f, property: e.target.value })}>{['Apartment / flat', 'Independent house', 'Villa / bungalow', 'Office / shop', 'Restaurant / kitchen', 'Warehouse / factory', 'Under construction'].map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>Where do you see it?<input value={f.where} onChange={(e) => setF({ ...f, where: e.target.value })} placeholder="Kitchen, door frames, bedroom…" maxLength={200} /></label>
        <label>Since when?<select value={f.since} onChange={(e) => setF({ ...f, since: e.target.value })}>{['Less than a month', '1–6 months', 'More than 6 months', 'Keeps coming back after treatment'].map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>How much?<select value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value })}>{['A few times', 'Every day', 'Many, in several rooms', 'Damage is visible'].map((p) => <option key={p}>{p}</option>)}</select></label>
      </div>
      <fieldset><legend>Signs you have noticed</legend><div className="pkai-chips">{SIGNS.map((s) => <button type="button" key={s} aria-pressed={f.signs.includes(s)} className={f.signs.includes(s) ? 'on' : ''} onClick={() => toggle(s)}>{s}</button>)}</div></fieldset>
      <label>Anything else<textarea rows="2" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={600} /></label>
      <button type="submit" className="btn btn-primary">Get preliminary assessment</button>
    </form>
  );
};

const QuoteForm = ({ onExplain, aiOn }) => {
  const [q, setQ] = useState({ service: 'general', size: '2BHK', areaSqft: '', propertyType: 'home' });
  const s = QUOTE_SERVICES[q.service];
  const e = estimate(q);
  return (
    <div className="pkai-quote">
      <div className="pkai-grid">
        <label>Service<select value={q.service} onChange={(ev) => setQ({ ...q, service: ev.target.value })}>{Object.entries(QUOTE_SERVICES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label>
        <label>Property<select value={q.propertyType} onChange={(ev) => setQ({ ...q, propertyType: ev.target.value })}><option value="home">Home</option><option value="business">Business / commercial</option></select></label>
        {s.unit === 'bhk'
          ? <label>Home size<select value={q.size} onChange={(ev) => setQ({ ...q, size: ev.target.value })}>{['1BHK', '2BHK', '3BHK', 'Larger'].map((x) => <option key={x}>{x}</option>)}</select></label>
          : <label>Area (sq.ft.)<input type="number" min="1" inputMode="numeric" value={q.areaSqft} onChange={(ev) => setQ({ ...q, areaSqft: ev.target.value })} placeholder="e.g. 1200" /></label>}
      </div>
      <div className="pkai-estimate" aria-live="polite">
        {e.ok ? (
          <>
            <div><span>Service ({e.basis})</span><strong>{e.subtotal.min === e.subtotal.max ? inr(e.subtotal.min) : `${inr(e.subtotal.min)} – ${inr(e.subtotal.max)}`}</strong></div>
            <div><span>GST @ {e.gst.rate}%</span><strong>{e.gst.min === e.gst.max ? inr(e.gst.min) : `${inr(e.gst.min)} – ${inr(e.gst.max)}`}</strong></div>
            <div className="total"><span>Estimated total</span><strong>{e.total.min === e.total.max ? inr(e.total.min) : `${inr(e.total.min)} – ${inr(e.total.max)}`}</strong></div>
            <p>{e.note}</p>
          </>
        ) : <p className="pkai-na">{e.reason} <Link to="/book">Request an inspection</Link></p>}
      </div>
      <div className="pkai-actions">
        <Link to="/book" className="btn btn-primary">Book this service</Link>
        {aiOn && <button type="button" className="btn btn-outline" onClick={() => onExplain(q)}>Ask PestKill AI about this estimate</button>}
      </div>
      <small className="pkai-muted">Prices come from PestKill’s official price list. {GST_NOTE}</small>
    </div>
  );
};

const PestKillAI = () => {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [lang, setLang] = useState(params.get('lang') === 'hi' ? 'hi' : 'en');
  const [prefill, setPrefill] = useState(null);
  const modes = status?.modes || ['assistant', 'identify', 'diagnose', 'quote'];
  const tab = modes.includes(params.get('mode')) ? params.get('mode') : 'assistant';
  const page = params.get('page') || undefined;
  const productSlug = params.get('product') || undefined;

  useEffect(() => { api('/ai/status').then(setStatus).catch(() => setStatus({ configured: false, modes: ['assistant', 'identify', 'diagnose', 'quote'] })); }, []);
  useEffect(() => { const q = params.get('q'); if (q && status?.configured) setPrefill({ text: q }); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps
  const setTab = (k) => { const n = new URLSearchParams(params); n.set('mode', k); n.delete('q'); setParams(n, { replace: true }); setPrefill(null); };

  return (
    <div className="pkai-page">
      <section className="pkai-hero">
        <div className="container">
          <span className="pkai-badge"><Sparkles size={14} /> PestKill AI</span>
          <h1>Intelligent Pest Management Assistant</h1>
          <p>Identify pests from a photo, get a preliminary assessment, estimate prices from our official list and get answers grounded in PestKill’s verified knowledge, in English or Hindi.</p>
          <div className="pkai-status">
            {status == null ? <span>Checking…</span> : status.configured
              ? <span className="on">● Online</span>
              : <span className="off">● AI answers are not switched on yet. Price estimates and verified knowledge search still work.</span>}
            <div className="pkai-lang" role="group" aria-label="Language">
              <Languages size={15} />
              <button type="button" aria-pressed={lang === 'en'} className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>English</button>
              <button type="button" aria-pressed={lang === 'hi'} className={lang === 'hi' ? 'on' : ''} onClick={() => setLang('hi')} lang="hi">हिन्दी</button>
            </div>
          </div>
        </div>
      </section>

      <section className="container pkai-wrap">
        <nav className="pkai-tabs" aria-label="PestKill AI tools">
          {TABS.filter((t) => modes.includes(t.key)).map(({ key, label, icon: Icon, hint }) => (
            <button key={key} type="button" aria-pressed={tab === key} className={tab === key ? 'on' : ''} onClick={() => setTab(key)}>
              <Icon size={18} /><span><strong>{label}</strong><small>{hint}</small></span>
            </button>
          ))}
        </nav>

        {tab === 'diagnose' && <DiagnoseForm lang={lang} onSend={(text) => setPrefill({ text })} />}
        {tab === 'quote' && <QuoteForm aiOn={status?.configured} onExplain={(q) => setPrefill({ text: 'Please explain this estimate and what is included.', extra: { quote: q } })} />}
        {(tab !== 'quote' || prefill) && (
          <AiChat key={tab} mode={tab} lang={lang} page={page} productSlug={productSlug} status={status} prefill={prefill} onPrefillSent={() => setPrefill(null)} />
        )}

        <div className="pkai-trust">
          <div><ShieldCheck size={18} /><p><strong>Grounded answers.</strong> PestKill AI answers from our verified records and cites them. It will not invent doses, prices, warranties or approvals.</p></div>
          <div><BookOpenCheck size={18} /><p><strong>Provisional, not final.</strong> Photo identification and diagnosis are preliminary. A technician’s inspection and the product label always come first.</p></div>
          <div><Lock size={18} /><p><strong>Private.</strong> Photos are used only to answer you and are not stored. Signed-in customers see their own bookings and orders, nobody else’s. <Link to="/privacy-policy">Privacy policy</Link></p></div>
        </div>
      </section>
    </div>
  );
};

export default PestKillAI;
