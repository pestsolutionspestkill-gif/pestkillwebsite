import { NavLink } from 'react-router-dom';
import { Home, Store, Compass, BookOpen, Phone } from 'lucide-react';
import { openExplore } from './ExploreDrawer';
import businessConfig from '../data/businessConfig';
import './BottomNav.css';

/** Persistent bottom utility bar on phones. */
const BottomNav = () => (
  <nav className="bottom-nav" aria-label="Quick navigation">
    <NavLink to="/" end><Home size={20} /><span>Home</span></NavLink>
    <NavLink to="/shop"><Store size={20} /><span>Shop</span></NavLink>
    <button type="button" className="bn-explore" onClick={() => openExplore('brand')} aria-haspopup="dialog"><Compass size={22} /><span>Explore</span></button>
    <NavLink to="/knowledge"><BookOpen size={20} /><span>Guides</span></NavLink>
    <a href={`tel:${businessConfig.phoneNumber}`}><Phone size={20} /><span>Call</span></a>
  </nav>
);

export default BottomNav;
