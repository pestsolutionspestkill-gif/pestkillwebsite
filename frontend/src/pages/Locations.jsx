import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Clock, Mail, ArrowUpRight, Search, Navigation } from 'lucide-react';
import businessConfig from '../data/businessConfig';
import { CITIES, cityPath } from '../data/rajasthan';
import './Hub.css';

const cityPages = Object.fromEntries(CITIES.map((c) => [c.name, cityPath(c.slug)]));

// serviceCoverage is ordered Rajasthan → Delhi NCR → Uttar Pradesh
const REGION_BOUNDS = [
  { name: 'Rajasthan', from: 'Jaipur' },
  { name: 'Delhi NCR', from: 'New Delhi' },
  { name: 'Uttar Pradesh', from: 'Lucknow' },
];

const Locations = () => {
  const { serviceCoverage, officeAddress, phoneNumber, email, workingHours, googleMapLink } = businessConfig;
  const [query, setQuery] = useState('');

  const regions = REGION_BOUNDS.map((r, i) => {
    const start = serviceCoverage.indexOf(r.from);
    const end = REGION_BOUNDS[i + 1] ? serviceCoverage.indexOf(REGION_BOUNDS[i + 1].from) : serviceCoverage.length;
    // Rajasthan lists every city that has its own page.
    if (r.name === 'Rajasthan') return { name: r.name, cities: CITIES.map((c) => c.name) };
    return { name: r.name, cities: serviceCoverage.slice(start, end) };
  });

  const q = query.trim().toLowerCase();

  return (
    <div className="hub-page">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow light">Locations</span>
          <h1>Pest control in <span className="text-gradient">every city of Rajasthan</span></h1>
          <p>Head office in Jaipur. {CITIES.length} Rajasthan cities have their own page with local pests, prices and areas, and we serve locations across India with teams dispatched from Jaipur.</p>
          <label className="hub-search">
            <Search size={18} />
            <input type="search" placeholder="Check your city" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
        </div>
      </section>

      <section className="section">
        <div className="container hub-two-col">
          <div className="hub-main">
            {regions.map((r) => {
              const cities = q ? r.cities.filter((c) => c.toLowerCase().includes(q)) : r.cities;
              if (!cities.length) return null;
              return (
                <div key={r.name} className="hub-block">
                  <h2><MapPin size={22} /> {r.name} <small className="hub-count">{r.cities.length} cities</small></h2>
                  <div className="city-chips">
                    {cities.map((c) => cityPages[c]
                      ? <Link key={c} to={cityPages[c]} className="city-chip linked">{c} <ArrowUpRight size={14} /></Link>
                      : <span key={c} className="city-chip">{c}</span>)}
                  </div>
                </div>
              );
            })}
            {q && regions.every((r) => !r.cities.some((c) => c.toLowerCase().includes(q))) && (
              <p className="empty-state">We don't list “{query}” yet. Call us, as we often serve nearby towns too.</p>
            )}
          </div>

          <aside className="hub-aside">
            <div className="hub-aside-card dark">
              <span className="eyebrow light">Head Office</span>
              <h3>Jaipur, Rajasthan</h3>
              <ul className="office-list">
                <li><MapPin size={16} /> {officeAddress}</li>
                <li><Phone size={16} /> <a href={`tel:${phoneNumber}`}>{phoneNumber}</a></li>
                <li><Mail size={16} /> <a href={`mailto:${email}`}>{email}</a></li>
                <li><Clock size={16} /> {workingHours}</li>
              </ul>
              <a href={googleMapLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-block"><Navigation size={16} /> Get directions</a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default Locations;
