import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { pests } from '../data/catalog';
import { pestMedia } from '../data/media';
import './Hub.css';

const PestLibrary = () => {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const list = q ? pests.filter((p) => `${p.name} ${p.tag} ${p.intro}`.toLowerCase().includes(q)) : pests;

  return (
    <div className="hub-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow light">Pest Library</span>
          <h1>Identify your <span className="text-gradient">pest problem</span></h1>
          <p>Learn how to recognise common pests, the signs they leave behind and the risks they bring, then see how we treat them.</p>
          <label className="hub-search">
            <Search size={18} />
            <input type="search" placeholder="Search pests, e.g. termites" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {list.length === 0 ? (
            <p className="empty-state">No pests match “{query}”. Try another name or <Link to="/contact">ask our experts</Link>.</p>
          ) : (
            <div className="pest-grid">
              {list.map(({ icon: Icon, ...p }) => (
                <Link key={p.slug} to={`/pests/${p.slug}`} className="pest-card has-photo">
                  <figure className="photo-frame pest-card-photo">
                    <img src={pestMedia[p.slug].src} alt={pestMedia[p.slug].alt} loading="lazy" />
                    <span className="pest-card-badge"><Icon size={18} /></span>
                    <ArrowUpRight size={18} className="pest-card-arrow" />
                  </figure>
                  <span className="pest-tag">{p.tag}</span>
                  <h2>{p.name}</h2>
                  <p>{p.intro.split('. ')[0]}.</p>
                  <span className="pest-card-signs">{p.signs.length} warning signs · {p.prevention.length} prevention tips</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PestLibrary;
