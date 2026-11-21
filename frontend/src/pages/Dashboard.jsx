import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => { if (activeTab === 'services') fetchData('services/my-services', setServices); if (activeTab === 'complaints') fetchData('complaints/my-complaints', setComplaints); if (activeTab === 'orders') fetchData('orders/my-orders', setOrders); }, [activeTab]);

  const fetchData = async (url, setter) => { try { const res = await fetch(`${API_URL}/${url}`); if (res.ok) setter(await res.json()); } catch (e) { console.error(e); } };

  if (loading) return <div className="dashboard-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (isAdmin) return <Navigate to="/admin" />;

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar"><div className="sidebar-header"><h2>My Account</h2></div><nav className="sidebar-nav"><button className={`nav-item ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>My Services</button><button className={`nav-item ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>Complaints</button><button className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button><button className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button></nav></aside>
      <main className="dashboard-main">
        <div className="dashboard-content">
          {activeTab === 'profile' && <><h2>My Profile</h2><div className="profile-card"><div className="profile-field"><label>Name</label><p>{user.name}</p></div><div className="profile-field"><label>Email</label><p>{user.email}</p></div><div className="profile-field"><label>Phone</label><p>{user.phone}</p></div></div></>}
          {activeTab === 'services' && <><h2>My Services</h2><div className="items-list">{services.length === 0 ? <p className="empty-state">No services. <Link to="/services">Book a service</Link></p> : services.map(s => (<div key={s._id} className="item-card"><h3>{s.serviceType}</h3><p>{s.city} - {s.status}</p></div>))}</div></>}
          {activeTab === 'complaints' && <><h2>My Complaints</h2><div className="items-list">{complaints.length === 0 ? <p className="empty-state">No complaints.</p> : complaints.map(c => (<div key={c._id} className="item-card"><h3>{c.subject}</h3><p>{c.status}</p></div>))}</div></>}
          {activeTab === 'orders' && <><h2>My Orders</h2><div className="items-list">{orders.length === 0 ? <p className="empty-state">No orders. <Link to="/shop">Shop now</Link></p> : orders.map(o => (<div key={o._id} className="item-card"><h3>Order #{o.orderNumber}</h3><p>₹{o.total} - {o.orderStatus}</p></div>))}</div></>}
        </div>
      </main>
    </div>
  );
};
export default Dashboard;