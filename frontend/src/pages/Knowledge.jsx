import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { BookOpen, ArrowLeft, ArrowRight, Microscope, Search as SearchIcon, RefreshCcw, Activity, Home as HomeIcon, Eye, AlertTriangle, ShieldCheck, Hand, Stethoscope, ShoppingBag, CalendarCheck } from 'lucide-react';
import { GUIDES, UI, getGuide, GROUP_ORDER } from '../data/knowledge';
import { pestMedia } from '../data/media';
import './Knowledge.css';

/** EN / हिन्दी switch. The language lives in the URL (?lang=hi), so it can be shared and bookmarked. */
const LangSwitch = ({ lang }) => {
  const [params, setParams] = useSearchParams();
  const choose = (l) => { const next = new URLSearchParams(params); if (l === 'hi') next.set('lang', 'hi'); else next.delete('lang'); setParams(next, { replace: true }); };
  return (
    <div className="kc-lang" role="group" aria-label={UI[lang].language}>
      <button type="button" className={lang === 'en' ? 'on' : ''} aria-pressed={lang === 'en'} onClick={() => choose('en')} lang="en">English</button>
      <button type="button" className={lang === 'hi' ? 'on' : ''} aria-pressed={lang === 'hi'} onClick={() => choose('hi')} lang="hi">हिन्दी</button>
    </div>
  );
};

const useLang = () => (useSearchParams()[0].get('lang') === 'hi' ? 'hi' : 'en');
const q = (lang) => (lang === 'hi' ? '?lang=hi' : '');

export const KnowledgeIndex = () => {
  const lang = useLang();
  const t = UI[lang];
  return (
    <div className="kc-page" lang={lang}>
      <section className="kc-hero">
        <div className="container">
          <span className="eyebrow"><BookOpen size={15} /> {t.title}</span>
          <h1>{t.title}</h1>
          <p>{t.lead}</p>
          <LangSwitch lang={lang} />
        </div>
      </section>
      <div className="container kc-index">
        {GROUP_ORDER.map((g) => (
          <section key={g} className="kc-group">
            <h2>{t.groups[g]}</h2>
            <div className="kc-cards">
              {GUIDES.filter((x) => x.group === g).map((x) => {
                const photo = pestMedia[x.image];
                return (
                  <Link key={x.slug} to={`/knowledge/${x.slug}${q(lang)}`} className="kc-card">
                    {photo && <img src={photo.src} alt={photo.alt} loading="lazy" width="480" height="300" />}
                    <div>
                      <h3>{x[lang].name}</h3>
                      <em>{x.scientific}</em>
                      <p>{x[lang].summary}</p>
                      <span className="kc-more">{t.read} <ArrowRight size={14} /></span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

const Block = ({ icon: Icon, title, items, text }) => (
  <section className="kc-block">
    <h2><Icon size={18} /> {title}</h2>
    {text ? <p>{text}</p> : <ul>{items.map((x) => <li key={x}>{x}</li>)}</ul>}
  </section>
);

export const KnowledgeGuide = () => {
  const { slug } = useParams();
  const lang = useLang();
  const g = getGuide(slug);
  if (!g) return <Navigate to="/knowledge" replace />;
  const t = UI[lang];
  const c = g[lang];
  const photo = pestMedia[g.image];
  const related = GUIDES.filter((x) => x.group === g.group && x.slug !== g.slug);

  return (
    <div className="kc-page" lang={lang}>
      <section className="kc-hero kc-hero-guide">
        <div className="container kc-guide-head">
          <div>
            <Link to={`/knowledge${q(lang)}`} className="kc-back"><ArrowLeft size={16} /> {t.all}</Link>
            <h1>{c.name}</h1>
            <p className="kc-sci"><Microscope size={15} /> {t.scientific}: <em lang="la">{g.scientific}</em></p>
            <p>{c.summary}</p>
            <LangSwitch lang={lang} />
          </div>
          {photo && <figure className="kc-photo"><img src={photo.src} alt={photo.alt} width="640" height="420" /></figure>}
        </div>
      </section>

      <div className="container kc-guide">
        <div className="kc-grid">
          <Block icon={SearchIcon} title={t.identify} items={c.identify} />
          <Block icon={RefreshCcw} title={t.lifecycle} text={c.lifecycle} />
          <Block icon={Activity} title={t.behaviour} items={c.behaviour} />
          <Block icon={HomeIcon} title={t.habitat} items={c.habitat} />
          <Block icon={Eye} title={t.signs} items={c.signs} />
          <Block icon={AlertTriangle} title={t.risks} items={c.risks} />
          <Block icon={ShieldCheck} title={t.prevention} items={c.prevention} />
          <Block icon={Hand} title={t.physical} items={c.physical} />
          <Block icon={Stethoscope} title={t.professional} items={c.professional} />
        </div>
        <p className="kc-note">{t.note}</p>
        <div className="kc-actions">
          <Link to={g.service} className="btn btn-primary"><CalendarCheck size={17} /> {t.service}</Link>
          {g.shopPest && <Link to={`/shop/pest/${g.shopPest}`} className="btn btn-white"><ShoppingBag size={17} /> {t.products}</Link>}
        </div>
        {related.length > 0 && (
          <div className="kc-related">
            {related.map((x) => <Link key={x.slug} to={`/knowledge/${x.slug}${q(lang)}`}>{x[lang].name} <ArrowRight size={14} /></Link>)}
          </div>
        )}
      </div>
    </div>
  );
};
