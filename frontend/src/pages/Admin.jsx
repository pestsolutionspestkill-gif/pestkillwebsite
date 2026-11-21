import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import './Admin.css';

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('services');
  const [items, setItems] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => { fetchItems(); }, [activeTab]);

  const fetchItems = async () => { setFetching(true); try { const res = await fetch(`${API_URL}/${activeTab}`); if (res.ok) setItems(await res.json()); } catch (e) { console.error(e); } setFetching(false); };
  const updateStatus = async (id, status) => { try { await fetch(`${API_URL}/${activeTab}/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); fetchItems(); } catch (e) { console.error(e); } };
  const deleteItem = async (id) => { if (!confirm('Delete?')) return; try { await fetch(`${API_URL}/${activeTab}/${id}`, { method: 'DELETE' }); fetchItems(); } catch (e) { console.error(e); } };
  const badge = s => ({ pending: 'warning', confirmed: 'info', 'in-progress': 'info', completed: 'success', cancelled: 'danger', open: 'warning', resolved: 'success' }[s] || 'info');

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/login" />;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar"><div className="sidebar-header"><h2>Admin Panel</h2></div><nav><button className={`nav-item ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Services</button><button className={`nav-item ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>Complaints</button><button className={`nav-item ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>Products</button><button className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Orders</button></nav></aside>
      <main className="admin-main">
        <div className="admin-content"><h2>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>{fetching ? <p>Loading...</p> : items.length === 0 ? <p className="empty-state">No {activeTab}.</p> : (<div className="admin-table"><table><thead><tr><th>ID</th><th>Details</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>{items.map(i => (<tr key={i._id}><td>{i._id?.slice(0, 8)}</td><td>{activeTab === 'services' && <div>{i.serviceType}<br/>{i.city}</div>}{activeTab === 'orders' && <div>{i.orderNumber}<br/>₹{i.total}</div>}{activeTab === 'products' && <div>{i.name}<br/>₹{i.price}</div>}</td><td><span className={`badge badge-${badge(i.status || i.orderStatus)}`}>{i.status || i.orderStatus}</span></td><td>{new Date(i.createdAt).toLocaleDateString()}</td><td>{(activeTab === 'services' || activeTab === 'complaints') && <select onChange={e => updateStatus(i._id, e.target.value)} value={i.status || ''}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="in-progress">In Progress</option><option value="completed">Completed</option></select>}<button onClick={() => deleteItem(i._id)}>Delete</button></td></tr>))}</tbody></table></div>)}</div>
      </main>
    </div>
  );
};
export default Admin;