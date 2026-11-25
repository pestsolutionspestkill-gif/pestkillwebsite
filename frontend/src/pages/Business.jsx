import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, ClipboardCheck, FileText, UserCheck, CalendarClock, Building, LineChart } from 'lucide-react';
import { sectors, services } from '../data/catalog';
import { sectorMedia } from '../data/media';
import './Hub.css';

const pillars = [
  { icon: ClipboardCheck, title: 'Site survey & risk map', text: 'A specialist surveys your premises and marks risk zones, entry points and monitoring locations.' },
  { icon: CalendarClock, title: 'Scheduled service plan', text: 'Fixed visit frequency agreed in writing, with treatments planned around your operating hours.' },
  { icon: FileText, title: 'Audit-ready records', text: 'Service reports, chemical details and pest sighting logs kept ready for audits and inspections.' },
  { icon: UserCheck, title: 'Single point of contact', text: 'One supervisor responsible for your account, quality checks and escalations.' },
  { icon: LineChart, title: 'Trend reporting', text: 'Monitoring results reviewed over time so recurring problems are fixed at the source.' },
  { icon: Building, title: 'Multi-site coverage', text: 'One agreement and consistent standards across your locations, with teams dispatched from Jaipur.' },
];

const Business = () => {
  const bizServices = services.filter((s) => s.segment.includes('business'));

  return (
    <div className="hub-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow light">For Business</span>
          <h1>Commercial pest management <span className="text-gradient">you can audit</span></h1>
          <p>Documented, scheduled pest control programmes for food businesses, healthcare, hospitality, warehouses and offices.</p>
          <div className="hub-hero-actions">
            <Link to="/book?service=general-pest-control" className="btn btn-primary btn-lg">Request a site survey <ArrowRight size={18} /></Link>
            <Link to="/integrated-pest-management" className="btn btn-ghost btn-lg">Our IPM approach</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Industries</span>
            <h2 className="section-title">Programmes built for <span className="text-gradient">your sector</span></h2>
          </div>
          <div className="sector-grid">
            {sectors.map(({ icon: Icon, ...s }) => (
              <Link key={s.slug} to={`/business/${s.slug}`} className="sector-card has-photo">
                <figure className="photo-frame sector-photo">
                  <img src={sectorMedia[s.slug].src} alt={sectorMedia[s.slug].alt} loading="lazy" />
                  <span className="pest-card-badge"><Icon size={18} /></span>
                </figure>
                <h3>{s.name}</h3>
                <p>{s.intro}</p>
                <span className="sector-link">Explore <ArrowUpRight size={15} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">How We Work</span>
            <h2 className="section-title">What every commercial client <span className="text-gradient">receives</span></h2>
          </div>
          <div className="pillar-grid">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div key={title} className="pillar">
                <span className="pillar-icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Services</span>
            <h2 className="section-title">Commercial services</h2>
          </div>
          <div className="chip-links">
            {bizServices.map(({ icon: Icon, ...s }) => (
              <Link key={s.slug} to={s.path} className="chip-link"><Icon size={18} /> {s.name}</Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Business;
