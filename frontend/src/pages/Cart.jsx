import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { setCart(JSON.parse(localStorage.getItem('cart') || '[]')); }, []);

  const updateQty = (i, ch) => { const c = [...cart]; c[i].quantity = Math.max(1, c[i].quantity + ch); setCart(c); localStorage.setItem('cart', JSON.stringify(c)); };
  const remove = i => { const c = cart.filter((_, x) => x !== i); setCart(c); localStorage.setItem('cart', JSON.stringify(c)); };
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax + shipping;

  const checkout = async () => { try { const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: cart, subtotal, tax, shipping, total }) }); if (res.ok) { localStorage.removeItem('cart'); navigate('/dashboard'); } } catch (e) { console.error(e); } };

  if (cart.length === 0) return <div className="cart-page"><div className="container"><div className="empty-cart"><ShoppingCart size={48} style={{color:'#0E9F6E'}} /><h2>Your cart is empty</h2><p>Add some products</p><Link to="/shop" className="btn btn-primary">Browse Products</Link></div></div></div>;

  return (
    <div className="cart-page">
      <div className="container"><h1 className="page-title">Shopping Cart</h1><div className="cart-layout">
        <div className="cart-items">{cart.map((item, i) => (<div key={i} className="cart-item"><div className="item-image"></div><div className="item-details"><h3>{item.name}</h3><p>₹{item.price}</p></div><div className="item-quantity"><button onClick={() => updateQty(i, -1)}>-</button><span>{item.quantity}</span><button onClick={() => updateQty(i, 1)}>+</button></div><div className="item-total">₹{item.price * item.quantity}</div><button onClick={() => remove(i)}>×</button></div>))}</div>
        <div className="cart-summary"><h3>Order Summary</h3><div className="summary-row"><span>Subtotal</span><span>₹{subtotal}</span></div><div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `₹${shipping}`}</span></div><div className="summary-row"><span>Tax (18%)</span><span>₹{tax}</span></div><div className="summary-row total"><span>Total</span><span>₹{total}</span></div><button className="btn btn-primary" onClick={checkout}>Checkout</button></div>
      </div></div>
    </div>
  );
};
export default Cart;