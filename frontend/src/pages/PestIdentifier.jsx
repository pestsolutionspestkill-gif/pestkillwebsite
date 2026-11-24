import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat, BedDouble, DoorOpen, Archive, Trees, Wind, Bug, Route, Droplet, Hammer, Rat, Plane, Shield, Network, Bird, Utensils,
  Moon, Sun, Eye, AlertTriangle, ArrowLeft, ArrowRight, RotateCcw, MessageCircle, CalendarCheck, ScanSearch, Home, Building2,
} from 'lucide-react';
import { pests, getService } from '../data/catalog';
import { pestMedia } from '../data/media';
import businessConfig from '../data/businessConfig';
import { estimateFor } from './BookOnline';
import './PestIdentifier.css';

// Each answer adds points to the pests it points to. The highest total wins.
const QUESTIONS = [
  {
    id: 'where', title: 'Kahan dikha?', sub: 'Where did you notice it?',
    options: [
      { id: 'kitchen', label: 'Kitchen, bathroom or drains', icon: ChefHat, score: { cockroaches: 3, ants: 2, flies: 1, rodents: 1, lizards: 1 } },
      { id: 'bedroom', label: 'Bed, mattress or sofa', icon: BedDouble, score: { 'bed-bugs': 4, mosquitoes: 1, cockroaches: 1 } },
      { id: 'wood', label: 'Walls, door frames or wooden furniture', icon: DoorOpen, score: { termites: 4, ants: 1, spiders: 1 } },
      { id: 'store', label: 'Store room, ceiling or wiring', icon: Archive, score: { rodents: 4, cockroaches: 1, spiders: 1 } },
      { id: 'outside', label: 'Balcony, terrace or garden', icon: Trees, score: { pigeons: 3, mosquitoes: 2, ants: 1, flies: 1 } },
      { id: 'air', label: 'Flying around the house', icon: Wind, score: { mosquitoes: 3, flies: 3 } },
    ],
  },
  {
    id: 'look', title: 'Kaisa dikhta hai?', sub: 'What does it look like, or what did you see?',
    options: [
      { id: 'brown', label: 'Brown, shiny, runs fast', icon: Bug, score: { cockroaches: 5 } },
      { id: 'line', label: 'Tiny insects walking in a line', icon: Route, score: { ants: 5 } },
      { id: 'bites', label: 'Small flat bugs, blood spots or bites', icon: Droplet, score: { 'bed-bugs': 5, mosquitoes: 1 } },
      { id: 'mud', label: 'Mud lines on walls, hollow or powdery wood', icon: Hammer, score: { termites: 6 } },
      { id: 'droppings', label: 'Droppings, chewed wires or packets', icon: Rat, score: { rodents: 6 } },
      { id: 'buzz', label: 'Buzzing and itchy bites', icon: Plane, score: { mosquitoes: 5 } },
      { id: 'food', label: 'Flies sitting on food or waste', icon: Utensils, score: { flies: 5 } },
      { id: 'reptile', label: 'A small reptile on the walls', icon: Shield, score: { lizards: 6 } },
      { id: 'webs', label: 'Eight legs or cobwebs in corners', icon: Network, score: { spiders: 6 } },
      { id: 'birds', label: 'Birds nesting, droppings on ledges', icon: Bird, score: { pigeons: 6 } },
    ],
  },
  {
    id: 'when', title: 'Kab dikhta hai?', sub: 'When do you notice it most?',
    options: [
      { id: 'night', label: 'At night, when the lights go on', icon: Moon, score: { cockroaches: 2, rodents: 2, lizards: 1 } },
      { id: 'sleep', label: 'While sleeping — bites by morning', icon: BedDouble, score: { 'bed-bugs': 3, mosquitoes: 2 } },
      { id: 'day', label: 'During the day', icon: Sun, score: { flies: 2, ants: 2, pigeons: 1, mosquitoes: 1 } },
      { id: 'signs', label: 'Never seen it — only the damage or signs', icon: Eye, score: { termites: 3, rodents: 2, 'bed-bugs': 1 } },
    ],
  },
  {
    id: 'how', title: 'Kitna problem hai?', sub: 'How bad is it?',
    options: [
      { id: 'low', label: 'Seen once or twice', icon: Eye, level: 1 },
      { id: 'mid', label: 'Every few days', icon: AlertTriangle, level: 2 },
      { id: 'high', label: 'Daily, or many at once', icon: AlertTriangle, level: 3 },
    ],
  },
  {
    id: 'home', title: 'Property kaisi hai?', sub: 'So we can show the right price',
    options: [
      { id: '1BHK', label: '1 BHK', icon: Home },
      { id: '2BHK', label: '2 BHK', icon: Home },
      { id: '3BHK', label: '3 BHK or villa', icon: Home },
      { id: 'business', label: 'Shop, office or factory', icon: Building2 },
    ],
  },
];

// Pests that always need prompt action, whatever the count.
const ALWAYS_URGENT = new Set(['termites', 'rodents', 'bed-bugs']);
const LEVELS = [
  null,
  { label: 'Early stage', tone: 'low', text: 'Act now — treating early is quicker and cheaper.' },
  { label: 'Active infestation', tone: 'mid', text: 'It is breeding. Professional treatment is recommended this week.' },
  { label: 'Severe infestation', tone: 'high', text: 'Book a treatment as soon as possible to stop the spread.' },
];

const PestIdentifier = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const pick = (qid, oid) => {
    setAnswers((a) => ({ ...a, [qid]: oid }));
    setTimeout(() => setStep((s) => s + 1), 180);
  };

  const result = useMemo(() => {
    if (step < QUESTIONS.length) return null;
    const totals = {};
    QUESTIONS.slice(0, 3).forEach((q) => {
      const o = q.options.find((x) => x.id === answers[q.id]);
      Object.entries(o?.score || {}).forEach(([slug, pts]) => { totals[slug] = (totals[slug] || 0) + pts; });
    });
    const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    if (!ranked.length) return null;
    const [topSlug, top] = ranked[0];
    const second = ranked[1];
    const pest = pests.find((p) => p.slug === topSlug);
    const alt = second && second[1] >= top - 2 ? pests.find((p) => p.slug === second[0]) : null;
    const level = Math.max(QUESTIONS[3].options.find((o) => o.id === answers.how)?.level || 1, ALWAYS_URGENT.has(topSlug) ? 2 : 1);
    const service = getService(pest.service) || getService('general-pest-control');
    const property = answers.home === 'business' ? { type: 'business' } : { type: 'home', size: answers.home || '2BHK', area: '' };
    return { pest, alt, strong: !alt || top - (second?.[1] || 0) >= 3, level, service, estimate: estimateFor(service, property) };
  }, [step, answers]);

  const q = QUESTIONS[step];
  const restart = () => { setAnswers({}); setStep(0); };
  const wa = result && `https://wa.me/${businessConfig.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello PestKill, the Pest Identifier suggests ${result.pest.name} (${LEVELS[result.level].label}) at my ${answers.home === 'business' ? 'business' : answers.home}. I am sending a photo — please confirm and share the price.`,
  )}`;

  return (
    <div className="pid-page">
      <section className="pid-hero">
        <span className="pid-badge"><ScanSearch size={15} /> Pest Identifier</span>
        <h1>Kaunsa keeda hai?<br /><span className="text-gradient">Find out in 30 seconds.</span></h1>
        <p>Answer five quick questions. We'll tell you what it most likely is, how serious it is, and what it costs to treat.</p>
      </section>

      <div className="pid-card">
        {q && (
          <>
            <div className="pid-progress" aria-hidden="true"><span style={{ width: `${(step / QUESTIONS.length) * 100}%` }} /></div>
            <div className="pid-q">
              <span className="pid-step">Question {step + 1} of {QUESTIONS.length}</span>
              <h2>{q.title}</h2>
              <p>{q.sub}</p>
            </div>
            <div className={`pid-options ${q.options.length > 6 ? 'many' : ''}`} role="radiogroup" aria-label={q.sub}>
              {q.options.map(({ id, label, icon: Icon }) => (
                <button type="button" key={id} role="radio" aria-checked={answers[q.id] === id} className={answers[q.id] === id ? 'on' : ''} onClick={() => pick(q.id, id)}>
                  <span><Icon size={22} /></span>{label}
                </button>
              ))}
            </div>
            {step > 0 && <button type="button" className="pid-back" onClick={() => setStep(step - 1)}><ArrowLeft size={15} /> Back</button>}
          </>
        )}

        {result && (
          <div className="pid-result">
            <div className="pid-result-head">
              {pestMedia[result.pest.slug] && <img src={pestMedia[result.pest.slug].src} alt={pestMedia[result.pest.slug].alt} />}
              <div>
                <span className="pid-step">{result.strong ? 'Most likely' : 'Likely'}</span>
                <h2>{result.pest.name}</h2>
                <span className={`pid-level ${LEVELS[result.level].tone}`}><AlertTriangle size={14} /> {LEVELS[result.level].label}</span>
                <p>{LEVELS[result.level].text}</p>
              </div>
            </div>
            {result.alt && <p className="pid-alt">It could also be <Link to={`/pests/${result.alt.slug}`}>{result.alt.name}</Link> — a photo on WhatsApp lets our expert confirm.</p>}

            <div className="pid-cols">
              <div>
                <h3>Signs to confirm</h3>
                <ul>{result.pest.signs.slice(0, 3).map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div>
                <h3>Why it matters</h3>
                <ul>{result.pest.risks.slice(0, 3).map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
            </div>

            <div className="pid-price">
              <div>
                <span>Recommended treatment</span>
                <strong>{result.service.name}</strong>
              </div>
              <div>
                <span>{answers.home === 'business' ? 'Price' : `Price for ${answers.home === '3BHK' ? '3 BHK' : answers.home?.replace('BHK', ' BHK')}`}</span>
                <strong>{result.estimate?.text || 'Quote after inspection'}</strong>
                {result.estimate?.note && <small>{result.estimate.note}</small>}
              </div>
            </div>

            <div className="pid-actions">
              <Link to={`/book?service=${result.service.slug}`} className="btn btn-primary"><CalendarCheck size={17} /> Book this treatment</Link>
              <a href={wa} className="btn btn-outline" target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Send a photo for expert check</a>
            </div>
            <div className="pid-foot">
              <Link to={`/pests/${result.pest.slug}`} className="link-more">Learn about {result.pest.name.toLowerCase()} <ArrowRight size={14} /></Link>
              <button type="button" className="pid-back" onClick={restart}><RotateCcw size={15} /> Start again</button>
            </div>
            <p className="pid-disclaimer">This tool gives a likely answer from your inputs; our technician confirms on inspection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PestIdentifier;
