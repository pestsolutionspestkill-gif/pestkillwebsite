import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play, ArrowRight, Bug, Bird, Hexagon, PawPrint } from 'lucide-react';
import { pestMedia, media } from '../data/media';
import './PestSlider.css';

// Categories shown in the home slider. `to` is a real page: a service page, or the contact form
// pre-filled with the subject for services handled on enquiry.
export const SLIDES = [
  { key: 'termite', title: 'Termite Control', hi: 'दीमक नियंत्रण', text: 'Pre- and post-construction anti-termite treatment with a written warranty.', photo: pestMedia.termites, to: '/termite-control' },
  { key: 'cockroach', title: 'Cockroach Control', hi: 'कॉकरोच नियंत्रण', text: 'Odourless gel treatment for kitchens, homes, hotels and restaurants.', photo: pestMedia.cockroaches, to: '/cockroach-control' },
  { key: 'mosquito', title: 'Mosquito Control', hi: 'मच्छर नियंत्रण', text: 'Larviciding, residual spray and fogging for homes, societies and campuses.', photo: pestMedia.mosquitoes, to: '/services/mosquito-control' },
  { key: 'rodent', title: 'Rodent Control', hi: 'चूहा नियंत्रण', text: 'Bait stations, trapping and proofing for homes, shops and godowns.', photo: pestMedia.rodents, to: '/rodent-control' },
  { key: 'bedbug', title: 'Bed Bug Control', hi: 'खटमल नियंत्रण', text: 'Two-visit bed bug treatment for homes, hostels, PGs and hotels.', photo: pestMedia['bed-bugs'], to: '/bed-bug-treatment' },
  { key: 'fly', title: 'Fly Control', hi: 'मक्खी नियंत्रण', text: 'Source control, baits and residual treatment for kitchens and dairies.', photo: pestMedia.flies, to: '/services/fly-control' },
  { key: 'ant', title: 'Ant Control', hi: 'चींटी नियंत्रण', text: 'Colony-targeted gel baits instead of sprays that scatter ants.', photo: pestMedia.ants, to: '/services/general-pest-control' },
  { key: 'general', title: 'General Pest Control', hi: 'सामान्य कीट नियंत्रण', text: 'Annual protection against crawling and flying pests.', photo: media.technician, to: '/services/general-pest-control' },
  { key: 'netting', title: 'Bird Netting', hi: 'बर्ड नेटिंग', text: 'UV-stabilised nets for balconies, ducts and building shafts.', photo: pestMedia.pigeons, to: '/services/bird-control', icon: Bird },
  { key: 'spikes', title: 'Bird Spikes', hi: 'बर्ड स्पाइक्स', text: 'Humane spikes that stop pigeons sitting on ledges and parapets.', photo: null, to: '/services/bird-control', icon: Bird },
  { key: 'bees', title: 'Bee Hive Removal', hi: 'मधुमक्खी छत्ता हटाना', text: 'Site visit and safe removal of hives from buildings.', photo: null, to: '/contact?subject=Bee%20hive%20removal', icon: Hexagon },
  { key: 'wildlife', title: 'Wildlife Management', hi: 'वन्यजीव प्रबंधन', text: 'Assessment and advice for wildlife entering homes and premises.', photo: null, to: '/contact?subject=Wildlife%20management', icon: PawPrint },
];

const AUTOPLAY_MS = 4500;
const n = SLIDES.length;
const wrap = (i) => ((i % n) + n) % n;
// Shortest signed distance from the active slide (so the ring loops both ways).
const offset = (i, active) => { let d = i - active; if (d > n / 2) d -= n; if (d < -n / 2) d += n; return d; };

const Slide = ({ s, d, onSelect }) => {
  const [broken, setBroken] = useState(false);
  const Icon = s.icon || Bug;
  const visible = Math.abs(d) <= 2;
  return (
    <article
      className={`ps-slide${d === 0 ? ' is-active' : ''}`}
      style={{ '--d': d, '--ad': Math.abs(d), zIndex: 10 - Math.abs(d) }}
      aria-hidden={d !== 0}
      data-hidden={!visible || undefined}
      onClick={d !== 0 ? () => onSelect(d) : undefined}
    >
      <div className="ps-media">
        {s.photo && !broken
          ? <img src={s.photo.src} alt={d === 0 ? s.photo.alt : ''} loading={Math.abs(d) <= 1 ? 'eager' : 'lazy'} onError={() => setBroken(true)} draggable="false" />
          : <div className="ps-fallback" aria-hidden="true"><Icon size={64} strokeWidth={1.4} /></div>}
        <div className="ps-shade" />
      </div>
      <div className="ps-body">
        <span className="ps-hi" lang="hi">{s.hi}</span>
        <h3>{s.title}</h3>
        <p>{s.text}</p>
        <Link to={s.to} className="ps-cta" tabIndex={d === 0 ? 0 : -1}>Explore <ArrowRight size={16} /></Link>
      </div>
    </article>
  );
};

/** Home page pest category carousel. */
const PestSlider = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false); // user pressed pause
  const [hold, setHold] = useState(false); // hovering or focused inside
  const [reduced, setReduced] = useState(false);
  const drag = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener?.('change', set);
    return () => mq.removeEventListener?.('change', set);
  }, []);

  const go = useCallback((step) => setActive((a) => wrap(a + step)), []);
  const running = !paused && !hold && !reduced;
  useEffect(() => {
    if (!running) return undefined;
    const t = setInterval(() => { if (!document.hidden) go(1); }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [running, go]);

  const onPointerDown = (e) => { drag.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  };

  return (
    <section className="ps-section" aria-roledescription="carousel" aria-label="Pest control services">
      <div className="container ps-head">
        <div>
          <span className="eyebrow">What we treat</span>
          <h2>Choose your pest problem</h2>
        </div>
        <div className="ps-controls">
          <button type="button" className="ps-btn" onClick={() => go(-1)} aria-label="Previous service"><ChevronLeft size={20} /></button>
          {!reduced && (
            <button type="button" className="ps-btn" onClick={() => setPaused((p) => !p)} aria-label={paused ? 'Resume automatic sliding' : 'Pause automatic sliding'} aria-pressed={paused}>
              {paused ? <Play size={18} /> : <Pause size={18} />}
            </button>
          )}
          <button type="button" className="ps-btn" onClick={() => go(1)} aria-label="Next service"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div
        className="ps-stage"
        tabIndex={0}
        role="group"
        aria-label={`${SLIDES[active].title}, ${active + 1} of ${n}. Use left and right arrow keys to move.`}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; }}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setHold(false); }}
      >
        {SLIDES.map((s, i) => <Slide key={s.key} s={s} d={offset(i, active)} onSelect={go} />)}
      </div>

      <div className="ps-dots" role="tablist" aria-label="Choose a service">
        {SLIDES.map((s, i) => (
          <button key={s.key} type="button" role="tab" aria-selected={i === active} aria-label={s.title} className={i === active ? 'on' : ''} onClick={() => setActive(i)} />
        ))}
      </div>
      <p className="ps-live" aria-live="polite">{SLIDES[active].title}</p>
    </section>
  );
};

export default PestSlider;
