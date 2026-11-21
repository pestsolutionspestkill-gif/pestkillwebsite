import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import './ProductDetail.css';

const products = [
  { _id: '1', name: 'Tempester SC 100ml', slug: 'tempester-sc-100', brand: 'Envu', category: 'Insecticide', formulation: 'SC', price: 185, mrp: 220, packSize: '100 ml', packUnit: 'ml', stock: 500, description: 'Fast-acting synthetic pyrethroid for general pest control. Effective against cockroaches, ants, mosquitoes, flies and spiders.', usage: 'Spray in cracks and crevices, along baseboards and around windows', dosage: '5ml per liter of water' },
  { _id: '2', name: 'Fendona 10% SC', slug: 'fendona-10-sc', brand: 'Envu', category: 'Insecticide', formulation: 'SC', price: 340, mrp: 400, packSize: '100 ml', packUnit: 'ml', stock: 350, description: 'Alpha-cypermethrin based insecticide for public health pests. Long lasting residual effect.', usage: 'Surface spray application', dosage: '10ml per liter of water' },
  { _id: '3', name: 'Fendona 10% WP', slug: 'fendona-10-wp', brand: 'Envu', category: 'Insecticide', formulation: 'WP', price: 290, mrp: 350, packSize: '100 g', packUnit: 'g', stock: 280, description: 'Wettable powder for cockroach and ant control. Easy to mix and apply.', usage: 'Spray or dust application', dosage: '10g per liter of water' },
  { _id: '4', name: 'Fipronil Gel 5g', slug: 'fipronil-gel-5g', brand: 'Envu', category: 'Insecticide', formulation: 'Gel', price: 95, mrp: 120, packSize: '5 g', packUnit: 'g', stock: 800, description: 'Fipronil-based gel bait for cockroach control. Kills in 24 hours.', usage: 'Apply in cracks and crevices', dosage: 'Spot treatment' },
  { _id: '5', name: 'Actara 25% WG', slug: 'actara-25-wg', brand: 'Syngenta', category: 'Insecticide', formulation: 'WG', price: 850, mrp: 1000, packSize: '200 g', packUnit: 'g', stock: 150, description: 'Thiamethoxam-based systemic insecticide for sucking pests like aphids, whiteflies, jassids.', usage: 'Foliar spray', dosage: '2g per liter of water' },
  { _id: '6', name: 'Amistar 50% WG', slug: 'amistar-50-wg', brand: 'Syngenta', category: 'Fungicide', formulation: 'WG', price: 720, mrp: 850, packSize: '200 g', packUnit: 'g', stock: 180, description: 'Azoxystrobin-based fungicide for crop protection. Controls powdery mildew, rust, leaf spots.', usage: 'Foliar spray', dosage: '2g per liter of water' },
  { _id: '7', name: 'Confidor 17.8% SL', slug: 'confidor-178-sl', brand: 'Syngenta', category: 'Insecticide', formulation: 'SL', price: 420, mrp: 500, packSize: '100 ml', packUnit: 'ml', stock: 220, description: 'Imidacloprid-based systemic insecticide. Perfect for sucking and biting insects.', usage: 'Soil drench or spray', dosage: '3ml per liter of water' },
  { _id: '8', name: 'Karate 2.5% EC', slug: 'karate-25-ec', brand: 'Syngenta', category: 'Insecticide', formulation: 'EC', price: 380, mrp: 450, packSize: '100 ml', packUnit: 'ml', stock: 300, description: 'Lambda-cyhalothrin for broad-spectrum pest control. Fast knockdown.', usage: 'Foliar spray', dosage: '2ml per liter of water' },
  { _id: '9', name: 'Heranba Fipronil 5% SC', slug: 'heranba-fipronil-5-sc', brand: 'Heranba Industries', category: 'Insecticide', formulation: 'SC', price: 350, mrp: 420, packSize: '100 ml', packUnit: 'ml', stock: 400, description: 'Fipronil 5% suspension concentrate for pest control. Termite and pest control.', usage: 'Soil treatment or spray', dosage: '4ml per liter of water' },
  { _id: '10', name: 'Heranba Cypermethrin 25% EC', slug: 'heranba-cypermethrin-25-ec', brand: 'Heranba Industries', category: 'Insecticide', formulation: 'EC', price: 320, mrp: 380, packSize: '100 ml', packUnit: 'ml', stock: 450, description: 'High concentration pyrethroid for pest control. Broad spectrum action.', usage: 'Spray application', dosage: '2ml per liter of water' },
  { _id: '11', name: 'Heranba Chlorpyrifos 20% EC', slug: 'heranba-chlorpyrifos-20-ec', brand: 'Heranba Industries', category: 'Insecticide', formulation: 'EC', price: 280, mrp: 340, packSize: '100 ml', packUnit: 'ml', stock: 380, description: 'Organophosphate insecticide for wide range of field and storage pests.', usage: 'Foliar spray', dosage: '2.5ml per liter of water' },
  { _id: '12', name: 'Heranba MIPC 20% EC', slug: 'heranba-mipc-20-ec', brand: 'Heranba Industries', category: 'Insecticide', formulation: 'EC', price: 240, mrp: 290, packSize: '100 ml', packUnit: 'ml', stock: 320, description: 'Carbamate insecticide for crop pests including borers and sucking insects.', usage: 'Foliar spray', dosage: '3ml per liter of water' },
  { _id: '13', name: 'Heranba Bromadiolone 0.005% Bait', slug: 'heranba-bromadiolone-bait', brand: 'Heranba Industries', category: 'Rodenticide', formulation: 'Bait', price: 85, mrp: 110, packSize: '200 g', packUnit: 'g', stock: 600, description: 'Single-dose anticoagulant rodenticide. Kills rats in 4-5 days.', usage: 'Place in bait stations', dosage: '20g per station' },
  { _id: '14', name: 'Arbuda Imidacloprid 70% WG', slug: 'arbuda-imidacloprid-70-wg', brand: 'Arbuda Agrochemicals', category: 'Insecticide', formulation: 'WG', price: 680, mrp: 820, packSize: '250 g', packUnit: 'g', stock: 200, description: 'Systemic insecticide for sucking and chewing insects. High potency.', usage: 'Soil or foliar application', dosage: '2g per liter of water' },
  { _id: '15', name: 'Arbuda Acetamiprid 20% SP', slug: 'arbuda-acetamiprid-20-sp', brand: 'Arbuda Agrochemicals', category: 'Insecticide', formulation: 'SP', price: 420, mrp: 520, packSize: '100 g', packUnit: 'g', stock: 180, description: 'Neonicotinoid for sucking pest management. Effective on aphids.', usage: 'Foliar spray', dosage: '2.5g per liter of water' },
  { _id: '16', name: 'Arbuda Cartap 50% SP', slug: 'arbuda-cartap-50-sp', brand: 'Arbuda Agrochemicals', category: 'Insecticide', formulation: 'SP', price: 380, mrp: 460, packSize: '100 g', packUnit: 'g', stock: 160, description: 'Ideal for leaf folder and borers in rice. Safe to beneficial insects.', usage: 'Foliar spray', dosage: '3g per liter of water' },
  { _id: '17', name: 'Arbuda Fipronil 0.3% GR', slug: 'arbuda-fipronil-03-gr', brand: 'Arbuda Agrochemicals', category: 'Insecticide', formulation: 'GR', price: 180, mrp: 220, packSize: '1 kg', packUnit: 'kg', stock: 400, description: 'Granular fipronil for soil application. Termite control.', usage: 'Soil application', dosage: '10kg per hectare' },
  { _id: '18', name: 'Arbuda Glyphosate 41% SL', slug: 'arbuda-glyphosate-41-sl', brand: 'Arbuda Agrochemicals', category: 'Herbicide', formulation: 'SL', price: 280, mrp: 350, packSize: '1 L', packUnit: 'L', stock: 250, description: 'Post-emergence herbicide for weed control. Non-selective.', usage: 'Directed spray', dosage: '80ml per liter of water' },
  { _id: '19', name: 'Arbuda Paraquat 24% SL', slug: 'arbuda-paraquat-24-sl', brand: 'Arbuda Agrochemicals', category: 'Herbicide', formulation: 'SL', price: 320, mrp: 390, packSize: '1 L', packUnit: 'L', stock: 200, description: 'Non-selective contact herbicide. Fast action.', usage: 'Directed spray', dosage: '120ml per liter of water' },
  { _id: '20', name: 'Arbuda Pretilachlor 50% EC', slug: 'arbuda-pretilachlor-50-ec', brand: 'Arbuda Agrochemicals', category: 'Herbicide', formulation: 'EC', price: 240, mrp: 290, packSize: '500 ml', packUnit: 'ml', stock: 280, description: 'Herbicide for grassy weeds in rice. Early weed control.', usage: 'Pre-emergence application', dosage: '40ml per liter of water' },
  { _id: '21', name: 'Cypermethrin 10% EC', slug: 'cypermethrin-10-ec', brand: 'Generic', category: 'Insecticide', formulation: 'EC', price: 220, mrp: 270, packSize: '100 ml', packUnit: 'ml', stock: 500, description: 'Broad-spectrum pyrethroid. Effective on most insects.', usage: 'Spray application', dosage: '2ml per liter of water' },
  { _id: '22', name: 'Deltamethrin 2.8% EC', slug: 'deltamethrin-28-ec', brand: 'Generic', category: 'Insecticide', formulation: 'EC', price: 180, mrp: 220, packSize: '100 ml', packUnit: 'ml', stock: 450, description: 'Knockdown insecticide for flying and crawling insects.', usage: 'Space spray', dosage: '3ml per liter of water' },
  { _id: '23', name: 'Boric Acid Powder', slug: 'boric-acid-powder', brand: 'Generic', category: 'Insecticide', formulation: 'DP', price: 85, mrp: 100, packSize: '500 g', packUnit: 'g', stock: 800, description: 'Slow-acting stomach poison for cockroaches. Safe for humans.', usage: 'Dust application in cracks', dosage: 'Light dusting' },
  { _id: '24', name: 'Pheromone Trap', slug: 'pheromone-trap', brand: 'Generic', category: 'Trap', formulation: 'Trap', price: 145, mrp: 180, packSize: '1 piece', packUnit: 'pc', stock: 350, description: 'Pheromone trap for monitoring and mass trapping of moths.', usage: 'Hang in area', dosage: '1 per 100sqft' }
];

const brandImages = {
  'Envu': 'https://www.svgresources.com/wp-content/uploads/2021/1/Bayer-Envu-Solutions-Logo.png',
  'Syngenta': 'https://www.syngentagreencare.com/themes/syngenta/logo.png',
  'Heranba Industries': 'https://www.heranba.com/wp-content/uploads/2022/03/Heranba-Logo.png',
  'Arbuda Agrochemicals': 'https://arbuda.in/wp-content/uploads/2023/01/arbuda-logo.png',
  'Generic': 'https://cdn-icons-png.flaticon.com/512/2921/2921226.png'
};

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setTimeout(() => {
      setProduct(products.find(p => p.slug === slug));
      setLoading(false);
    }, 200);
  }, [slug]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(i => i.productId === product._id);
    if (existing) existing.quantity += quantity;
    else cart.push({ productId: product._id, name: product.name, price: product.price, quantity });
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
  };

  if (loading) return <div className="product-detail-page"><div className="container">Loading...</div></div>;
  if (!product) return <div className="product-detail-page"><div className="container"><div className="not-found">Product not found</div></div></div>;

  const discount = product.mrp ? Math.round((1 - product.price / product.mrp) * 100) : 0;

  return (
    <div className="product-detail-page">
      <section className="product-detail-section section">
        <div className="container">
          <div className="breadcrumb"><Link to="/shop">Shop</Link> / {product.name}</div>
          <div className="product-detail-grid">
            <div className="product-images">
              <div className="main-image">
                <img src={brandImages[product.brand] || brandImages['Generic']} alt={product.brand} onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/512/2921/2921226.png'} />
                <span className="formulation-badge">{product.formulation}</span>
              </div>
            </div>
            <div className="product-detail-info">
              <span className="product-brand">{product.brand}</span>
              <h1 className="product-title">{product.name}</h1>
              <div className="product-category">{product.category}</div>
              <div className="product-price-section">
                <span className="price">₹{product.price}</span>
                {product.mrp && <span className="mrp">₹{product.mrp}</span>}
                {discount > 0 && <span className="discount">{discount}% OFF</span>}
              </div>
              <div className="product-pack"><strong>Pack Size:</strong> {product.packSize} {product.packUnit}</div>
              <div className="product-stock">
                {product.stock > 0 ? <span className="in-stock"><Check size={14} style={{verticalAlign:'middle',marginRight:'4px'}} />In Stock ({product.stock} available)</span> : <span className="out-of-stock"><X size={14} style={{verticalAlign:'middle',marginRight:'4px'}} />Out of Stock</span>}
              </div>
              <div className="product-desc">{product.description}</div>
              <div className="quantity-section">
                <label>Quantity:</label>
                <div className="quantity-controls">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" max={product.stock} />
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>+</button>
                </div>
              </div>
              <div className="product-actions">
                <button className="btn btn-primary" onClick={addToCart} disabled={!product.stock}>Add to Cart</button>
                <Link to="/shop" className="btn btn-secondary">Back to Shop</Link>
              </div>
            </div>
          </div>
          <div className="product-tabs">
            <div className="tab-content">
              <h3>Product Description</h3>
              <p>{product.description}</p>
              <h3>Usage Instructions</h3>
              <p>{product.usage}</p>
              <h3>Dosage</h3>
              <p>{product.dosage}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetail;