import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Search, AlertTriangle, ShieldCheck, Eye, Phone } from 'lucide-react';
import { pests, getPest, getService } from '../data/catalog';
import businessConfig from '../data/businessConfig';
import { pestMedia, creditLine } from '../data/media';
import './Hub.css';

const PestDetail = () => {
  const { slug } = useParams();
  const pest = getPest(slug);
  if (!pest) return <Navigate to="/pests" replace />;

  const service = getService(pest.service);
  const Icon = pest.icon;
  const photo = pestMedia[pest.slug];
  const related = pests.filter((p) => p.slug !== pest.slug && p.tag === pest.tag).slice(0, 3);
  const others = related.length ? related : pests.filter((p) => p.slug !== pest.slug).slice(0, 3);

  return (
    <div className="hub-page">
      <section className="page-hero hub-hero-left">
        <div className="container hub-hero-split">
          <div>
            <Link to="/pests" className="hub-back"><ArrowLeft size={16} /> Pest library</Link>
            <div className="pest-hero">
              <span className="pest-hero-icon"><Icon size={34} /></span>
              <div>
                <span className="eyebrow light">{pest.tag}</span>
                <h1>{pest.name}</h1>
              </div>
            </div>
            <p>{pest.intro}</p>
          </div>
          <figure className="photo-frame hub-hero-photo">
            <img src={photo.src} alt={photo.alt} />
            <figcaption className="photo-credit">{creditLine(photo)}</figcaption>
          </figure>
        </div>
      </section>

      <section className="section">
        <div className="container hub-two-col">
          <div className="hub-main">
            <div className="hub-block">
              <h2><Eye size={22} /> How to identify them</h2>
              <ul className="hub-list">{pest.identify.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="hub-block">
              <h2><Search size={22} /> Signs of an infestation</h2>
              <div className="hub-cards">
                {pest.signs.map((x, i) => (
                  <div key={x} className="hub-card"><span className="hub-num">{String(i + 1).padStart(2, '0')}</span><p>{x}</p></div>
                ))}
              </div>
            </div>
            <div className="hub-block">
              <h2><AlertTriangle size={22} /> Why they are a problem</h2>
              <ul className="hub-list risk">{pest.risks.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
            <div className="hub-block">
              <h2><ShieldCheck size={22} /> Prevention tips</h2>
              <ul className="hub-list check">{pest.prevention.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          </div>

          <aside className="hub-aside">
            <div className="hub-aside-card dark">
              <span className="eyebrow light">Recommended treatment</span>
              <h3>{service?.name}</h3>
              <p>{service?.summary}</p>
              <Link to={`/book?service=${service?.slug}`} className="btn btn-primary btn-block">Book online <ArrowRight size={16} /></Link>
              <Link to={service?.path || '/services'} className="hub-aside-link">How the treatment works <ArrowRight size={14} /></Link>
            </div>
            <div className="hub-aside-card">
              <h3>Not sure what you're seeing?</h3>
              <p>Send us a photo on WhatsApp and our specialist will identify it for free.</p>
              <a href={`tel:${businessConfig.phoneNumber}`} className="btn btn-outline btn-block"><Phone size={16} /> {businessConfig.phoneNumber}</a>
            </div>
          </aside>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="section-head"><span className="eyebrow">Keep Exploring</span><h2 className="section-title">Related pests</h2></div>
          <div className="pest-grid three">
            {others.map(({ icon: OIcon, ...p }) => (
              <Link key={p.slug} to={`/pests/${p.slug}`} className="pest-card has-photo">
                <figure className="photo-frame pest-card-photo">
                  <img src={pestMedia[p.slug].src} alt={pestMedia[p.slug].alt} loading="lazy" />
                  <span className="pest-card-badge"><OIcon size={18} /></span>
                </figure>
                <span className="pest-tag">{p.tag}</span>
                <h2>{p.name}</h2>
                <p>{p.intro.split('. ')[0]}.</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PestDetail;
