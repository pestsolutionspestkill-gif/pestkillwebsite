import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import './Shop.css';

const products = [
  { _id: 'p1', name: 'Fipronil Roach Gel', slug: 'fipronil-roach-gel', brand: 'Maxforce', category: 'Cockroach Control', formulation: 'Gel', price: 350, mrp: 450, packSize: '30g', stock: 50, description: 'Professional cockroach gel bait. Apply in kitchen cabinets, behind appliances. Kills on contact.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Roach+Gel' },
  { _id: 'p2', name: 'Ant Gel Bait', slug: 'ant-gel-bait', brand: 'Advion', category: 'Ant Control', formulation: 'Gel', price: 280, mrp: 350, packSize: '25g', stock: 50, description: 'Sweet-based gel for sugar ants. Apply along ant trails.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Ant+Gel' },
  { _id: 'p3', name: 'Mouse Trap (Catch & Release)', slug: 'mouse-trap-catch-release', brand: 'Victor', category: 'Rodent Control', formulation: 'Trap', price: 450, mrp: 550, packSize: '2-pack', stock: 30, description: 'Reusable mouse traps. Humane catch and release.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Mouse+Trap' },
  { _id: 'p4', name: 'Rat Bait Station', slug: 'rat-bait-station', brand: 'Bell', category: 'Rodent Control', formulation: 'Bait', price: 380, mrp: 480, packSize: '1 unit', stock: 40, description: 'Child-safe bait station for rats. Use with rodenticides.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Rat+Bait' },
  { _id: 'p5', name: 'Bed Bug Spray', slug: 'bed-bug-spray', brand: 'Tempo', category: 'Bed Bug Control', formulation: 'Spray', price: 420, mrp: 520, packSize: '500ml', stock: 40, description: 'Contact spray for bed bugs. Spray on mattress seams.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Bed+Bug+Spray' },
  { _id: 'p6', name: 'Mosquito Liquid Vaporizer', slug: 'mosquito-liquid-vaporizer', brand: 'GoodKnight', category: 'Mosquito Control', formulation: 'Liquid', price: 180, mrp: 250, packSize: '1 unit + refill', stock: 100, description: 'Electric vaporizer with liquid mat. Plugin and forget.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Mosquito+Vaporizer' },
  { _id: 'p7', name: 'Cockroach Spray', slug: 'cockroach-spray', brand: 'Hit', category: 'Cockroach Control', formulation: 'Spray', price: 150, mrp: 199, packSize: '400ml', stock: 60, description: 'Quick kill spray. Spray directly on insects.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Cockroach+Spray' },
  { _id: 'p8', name: 'Termite Wood Treatment', slug: 'termite-wood-treatment', brand: 'Woodguard', category: 'Termite Control', formulation: 'Liquid', price: 550, mrp: 700, packSize: '1L', stock: 25, description: 'Apply on wood surfaces. For pre-construction treatment.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Wood+Treatment' },
  { _id: 'p9', name: 'Spider Spray', slug: 'spider-spray', brand: 'Black Flag', category: 'Spider Control', formulation: 'Spray', price: 220, mrp: 299, packSize: '300ml', stock: 45, description: 'Long-lasting spider control. For corners and webs.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Spider+Spray' },
  { _id: 'p10', name: 'Pest Control Kit (Home Use)', slug: 'pest-control-kit-home', brand: 'Ortho', category: 'General Pest', formulation: 'Kit', price: 650, mrp: 850, packSize: '4 items', stock: 20, description: 'Complete home pest control kit. Gel, spray, traps included.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Pest+Kit' },
  { _id: 'p11', name: 'Fogger (Space Spray)', slug: 'fogger-space-spray', brand: 'CB80', category: 'General Pest', formulation: 'Aerosol', price: 280, mrp: 350, packSize: '400g', stock: 35, description: 'Space fogger for quick knockdown. Close doors and use.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Fogger' },
  { _id: 'p12', name: 'Fly Trap (Sticky)', slug: 'fly-trap-sticky', brand: 'Tape', category: 'Fly Control', formulation: 'Tape', price: 120, mrp: 160, packSize: '2 strips', stock: 80, description: 'Sticky fly strips. Hang near windows.', image: 'https://placehold.co/400x400/e8e8e8/333?text=Fly+Tape' }
];

const Shop = () => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const brands = [...new Set(products.map(p => p.brand))];

  const filteredProducts = products.filter(p => {
    if (filter !== 'all' && p.brand !== filter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="shop-page">
      <section className="shop-hero">
        <div className="container">
          <h1>Home Pest Control <span className="text-gradient">Products</span></h1>
          <p>Professional pest control products for home use. Available for purchase in Jaipur.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="shop-toolbar">
            <input type="text" placeholder="Search products..." className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} />
            <div className="filter-buttons">
              <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
              {brands.map(b => (
                <button key={b} className={filter === b ? 'active' : ''} onClick={() => setFilter(b)}>{b}</button>
              ))}
            </div>
          </div>

          <p className="results-count">{filteredProducts.length} products found</p>
          
          <div className="products-grid">
            {filteredProducts.map(p => (
              <div key={p._id} className="product-card">
                <div className="product-image">
                  <span className="product-badge">{p.formulation}</span>
                  <img src={p.image} alt={p.name} onError={(e) => e.target.src='https://5.imimg.com/data5/SELLER/Default/2020/11/DR/PS/MG/92326024/gel-bait-icm-500x500.jpg'} />
                </div>
                <div className="product-info">
                  <span className="product-brand">{p.brand}</span>
                  <h3>{p.name}</h3>
                  <p className="product-desc">{p.description}</p>
                  <div className="product-meta">
                    <span className="pack-size">{p.packSize}</span>
                    <span className="stock">{p.stock > 0 ? <><Check size={12} style={{verticalAlign:'middle',marginRight:'2px'}} />In Stock</> : <><X size={12} style={{verticalAlign:'middle',marginRight:'2px'}} />Out of Stock</>}</span>
                  </div>
                  <div className="product-price">
                    <span className="price">₹{p.price}</span>
                    <span className="mrp">₹{p.mrp}</span>
                    <span className="discount">{Math.round((1 - p.price/p.mrp) * 100)}% OFF</span>
                  </div>
                  <Link to={`/shop/${p.slug}`} className="btn btn-primary">View Details</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;