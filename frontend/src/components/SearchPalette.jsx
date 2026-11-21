import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft, X, Wrench, Bug, Building2, MapPin, FileText } from 'lucide-react';
import { services, pests, sectors } from '../data/catalog';
import './SearchPalette.css';

const cityPages = ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bharatpur'];

const INDEX = [
  ...services.map((s) => ({ type: 'Service', icon: Wrench, title: s.name, sub: s.summary, path: s.path })),
  ...pests.map((p) => ({ type: 'Pest', icon: Bug, title: p.name, sub: p.tag, path: `/pests/${p.slug}` })),
  ...sectors.map((s) => ({ type: 'Industry', icon: Building2, title: s.name, sub: 'Business solutions', path: `/business/${s.slug}` })),
  ...cityPages.map((c) => ({ type: 'City', icon: MapPin, title: `Pest control in ${c}`, sub: 'Local service page', path: `/${c.toLowerCase()}` })),
  ...[
    ['Book Online', 'Schedule a treatment', '/book'],
    ['For Business', 'Commercial pest management', '/business'],
    ['Pest Library', 'Identify your pest', '/pests'],
    ['Integrated Pest Management', 'Our IPM approach', '/integrated-pest-management'],
    ['All Locations', 'Cities we serve', '/locations'],
    ['Careers', 'Open positions', '/careers'],
    ['Blog', 'Guides and tips', '/blog'],
    ['About Us', 'Our story', '/about'],
    ['Contact', 'Get in touch', '/contact'],
  ].map(([title, sub, path]) => ({ type: 'Page', icon: FileText, title, sub, path })),
];

const SUGGESTED = ['/book', '/services/anti-termite-piping', '/pests/termites', '/pests/cockroaches', '/business'];

const SearchPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTED.map((p) => INDEX.find((r) => r.path === p)).filter(Boolean);
    const words = q.split(/\s+/);
    return INDEX
      .map((r) => {
        const hay = `${r.title} ${r.sub} ${r.type}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return null;
        return { ...r, score: r.title.toLowerCase().startsWith(q) ? 0 : r.title.toLowerCase().includes(q) ? 1 : 2 };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 9);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    const t = setTimeout(() => inputRef.current?.focus(), 20);
    document.body.style.overflow = 'hidden';
    return () => { clearTimeout(t); document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => setActive(0), [query]);

  if (!open) return null;

  const go = (r) => { onClose(); navigate(r.path); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && results[active]) go(results[active]);
  };

  return (
    <div className="sp-overlay" onMouseDown={onClose} role="presentation">
      <div className="sp-dialog" role="dialog" aria-modal="true" aria-label="Search the site" onMouseDown={(e) => e.stopPropagation()}>
        <div className="sp-input">
          <Search size={20} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="Search services, pests, industries, cities…" aria-label="Search" />
          <button type="button" onClick={onClose} aria-label="Close search"><X size={18} /></button>
        </div>
        <div className="sp-results" data-lenis-prevent>
          {!query && <p className="sp-label">Popular</p>}
          {results.length === 0 ? (
            <p className="sp-empty">No results for “{query}”.</p>
          ) : results.map((r, i) => {
            const Icon = r.icon;
            return (
              <button type="button" key={`${r.type}-${r.path}`} className={`sp-item ${i === active ? 'active' : ''}`} onMouseEnter={() => setActive(i)} onClick={() => go(r)}>
                <span className="sp-icon"><Icon size={17} /></span>
                <span className="sp-text"><strong>{r.title}</strong><small>{r.sub}</small></span>
                <span className="sp-type">{r.type}</span>
              </button>
            );
          })}
        </div>
        <div className="sp-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd><CornerDownLeft size={11} /></kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default SearchPalette;
