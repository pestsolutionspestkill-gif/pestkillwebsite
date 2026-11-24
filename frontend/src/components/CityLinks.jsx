import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { CITIES, cityPath } from '../data/rajasthan';

// Links to every Rajasthan city page. Used at the foot of service pages.
const CityLinks = ({ limit }) => (
  <div className="cities-grid">
    {(limit ? CITIES.slice(0, limit) : CITIES).map((c) => (
      <Link key={c.slug} to={cityPath(c.slug)} className="city-link"><MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{c.name}</Link>
    ))}
  </div>
);

export default CityLinks;
