import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';

export const parseDate = (s) => (s ? new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(s) || s.includes('T') ? s : `${s.replace(' ', 'T')}Z`) : null);
export const fmtDate = (s) => (s ? parseDate(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtDay = (s) => (s ? parseDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const label = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export const STATUS_TONE = {
  new: 'info', contacted: 'warning', scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
  pending: 'warning', resolved: 'success', closed: 'neutral',
  shortlisted: 'info', interview: 'warning', hired: 'success', rejected: 'danger',
  unpaid: 'warning', paid: 'success', void: 'neutral',
  confirmed: 'info', processing: 'warning', shipped: 'info', delivered: 'success', approved: 'success', active: 'success', hidden: 'neutral',
};
export const LEAD_STATUSES = ['new', 'contacted', 'scheduled', 'in_progress', 'completed', 'cancelled'];

export const Badge = ({ value }) => <span className={`badge badge-${STATUS_TONE[value] || 'neutral'}`}>{label(value)}</span>;

export const useLoad = (path) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    if (!path) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try { setData(await api(path)); } catch (e) { setError(e.message); }
    setLoading(false);
  }, [path]);
  useEffect(() => { reload(); }, [reload]);
  return { data, setData, error, loading, reload };
};

export const State = ({ loading, error, empty, children }) => {
  if (loading) return <div className="adm-state"><span className="spinner" /> Loading…</div>;
  if (error) return <div className="adm-state error">{error}</div>;
  if (empty) return <div className="adm-state">{empty}</div>;
  return children;
};
