import { Link } from 'react-router-dom';
import { ArrowRight, Search, ScanSearch, DoorClosed, Target, Activity, FileBarChart, CheckCircle } from 'lucide-react';
import './Hub.css';

const stages = [
  { icon: Search, title: 'Inspect', text: 'A detailed survey of the site, its layout, hygiene conditions and existing pest activity.' },
  { icon: ScanSearch, title: 'Identify', text: 'Correct identification of the pest species, because the right treatment depends on it.' },
  { icon: DoorClosed, title: 'Exclude & prevent', text: 'Proofing gaps, drains and entry points and recommending housekeeping changes to remove food and shelter.' },
  { icon: Target, title: 'Treat precisely', text: 'Targeted use of the least-hazardous effective product, only where and when it is needed.' },
  { icon: Activity, title: 'Monitor', text: 'Bait stations, traps and regular checks to measure activity and catch problems early.' },
  { icon: FileBarChart, title: 'Report & review', text: 'Service records and trends reviewed with your team, and the plan adjusted as conditions change.' },
];

const IPM = () => (
  <div className="hub-page">
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow light">Integrated Pest Management</span>
        <h1>Smarter control, <span className="text-gradient">less chemistry</span></h1>
        <p>IPM combines inspection, prevention, monitoring and targeted treatment to control pests over the long term, using chemicals only where they are truly needed.</p>
      </div>
    </section>

    <section className="section">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">The IPM Cycle</span>
          <h2 className="section-title">Six stages, <span className="text-gradient">repeated every visit</span></h2>
        </div>
        <div className="ipm-grid">
          {stages.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="ipm-stage">
              <span className="ipm-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="icon-tile"><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="section bg-surface">
      <div className="container hub-split">
        <div>
          <span className="eyebrow">Why IPM</span>
          <h2>Better results for sensitive environments</h2>
          <p className="hub-lead">Spraying on a calendar treats symptoms. IPM removes the reasons pests are present, which is why food businesses, hospitals and pharmaceutical sites rely on it.</p>
          <Link to="/business" className="btn btn-navy">Explore business solutions <ArrowRight size={16} /></Link>
        </div>
        <ul className="hub-list check large">
          <li>Lower chemical use around people, food and products</li>
          <li>Fewer repeat infestations because causes are fixed</li>
          <li>Documented evidence for audits and inspections</li>
          <li>Early warning through monitoring devices</li>
          <li>Plans that adapt to seasons and site changes</li>
        </ul>
      </div>
    </section>

    <section className="section">
      <div className="container hub-cta">
        <CheckCircle size={30} />
        <h2>Start with a free IPM site survey</h2>
        <p>We assess your premises and recommend a programme with a clear visit schedule.</p>
        <Link to="/contact" className="btn btn-primary btn-lg">Request survey <ArrowRight size={18} /></Link>
      </div>
    </section>
  </div>
);

export default IPM;
