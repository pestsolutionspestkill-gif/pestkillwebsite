import { Link, Navigate } from 'react-router-dom';
import { POLICIES, POLICY_UPDATED } from '../data/policies';
import { LEGAL } from '../components/Footer';
import './Policy.css';

const Policy = ({ slug }) => {
  const p = POLICIES[slug];
  if (!p) return <Navigate to="/" replace />;
  return (
    <div className="policy-page">
      <div className="container policy-wrap">
        <header>
          <span className="eyebrow">Policies</span>
          <h1>{p.title}</h1>
          <p>{p.intro}</p>
          <small>Last updated {new Date(`${POLICY_UPDATED}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
        </header>
        {p.sections.map(([h, items]) => (
          <section key={h}>
            <h2>{h}</h2>
            {items.length === 1 ? <p>{items[0]}</p> : <ul>{items.map((t) => <li key={t}>{t}</li>)}</ul>}
          </section>
        ))}
        <nav className="policy-nav" aria-label="Other policies">
          {LEGAL.filter((l) => l.path !== `/${slug}`).map((l) => <Link key={l.path} to={l.path}>{l.label}</Link>)}
        </nav>
      </div>
    </div>
  );
};

export default Policy;
