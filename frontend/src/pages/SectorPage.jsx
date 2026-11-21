import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertTriangle, CheckCircle, FileCheck2, Phone } from 'lucide-react';
import { sectors, getSector, getPest } from '../data/catalog';
import businessConfig from '../data/businessConfig';
import { sectorMedia, creditLine } from '../data/media';
import './Hub.css';

const SectorPage = () => {
  const { slug } = useParams();
  const sector = getSector(slug);
  if (!sector) return <Navigate to="/business" replace />;

  const Icon = sector.icon;
  const photo = sectorMedia[sector.slug];
  const sectorPests = sector.pests.map(getPest).filter(Boolean);

  return (
    <div className="hub-page">
      <section className="page-hero hub-hero-left">
        <div className="container hub-hero-split">
          <div>
            <Link to="/business" className="hub-back"><ArrowLeft size={16} /> All industries</Link>
            <div className="pest-hero">
              <span className="pest-hero-icon"><Icon size={32} /></span>
              <div>
                <span className="eyebrow light">Industry Solutions</span>
                <h1>{sector.name}</h1>
              </div>
            </div>
            <p>{sector.intro}</p>
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
              <h2><AlertTriangle size={22} /> Common challenges</h2>
              <div className="hub-cards">
                {sector.challenges.map((c, i) => (
                  <div key={c} className="hub-card"><span className="hub-num">{String(i + 1).padStart(2, '0')}</span><p>{c}</p></div>
                ))}
              </div>
            </div>
            <div className="hub-block">
              <h2><CheckCircle size={22} /> Our approach</h2>
              <ul className="hub-list check">{sector.approach.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
            <div className="hub-block">
              <h2><FileCheck2 size={22} /> Documentation</h2>
              <p className="hub-lead">{sector.compliance} We share service reports after every visit and keep chemical details on record.</p>
            </div>
            <div className="hub-block">
              <h2>Key pests in this sector</h2>
              <div className="chip-links">
                {sectorPests.map(({ icon: PIcon, ...p }) => (
                  <Link key={p.slug} to={`/pests/${p.slug}`} className="chip-link"><PIcon size={18} /> {p.name}</Link>
                ))}
              </div>
            </div>
          </div>

          <aside className="hub-aside">
            <div className="hub-aside-card dark">
              <span className="eyebrow light">Free site survey</span>
              <h3>Get a written proposal</h3>
              <p>Our specialist inspects your site and shares a programme with visit schedule and pricing.</p>
              <Link to="/contact" className="btn btn-primary btn-block">Request survey <ArrowRight size={16} /></Link>
              <a href={`tel:${businessConfig.phoneNumber}`} className="hub-aside-link"><Phone size={14} /> {businessConfig.phoneNumber}</a>
            </div>
            <div className="hub-aside-card">
              <h3>Other industries</h3>
              <ul className="hub-aside-list">
                {sectors.filter((s) => s.slug !== sector.slug).map((s) => (
                  <li key={s.slug}><Link to={`/business/${s.slug}`}>{s.name} <ArrowRight size={14} /></Link></li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default SectorPage;
