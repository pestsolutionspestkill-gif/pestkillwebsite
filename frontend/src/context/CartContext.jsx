import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Cart lines are { id, qty } only; prices are always re-read from the server.
const KEY = 'pk_cart';
const CartContext = createContext(null);

const load = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((l) => Number.isInteger(l.id) && Number.isInteger(l.qty) && l.qty > 0).slice(0, 50) : [];
  } catch { return []; }
};

export const CartProvider = ({ children }) => {
  const [lines, setLines] = useState(load);
  const [bump, setBump] = useState(0); // drives the navbar badge animation

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ } }, [lines]);
  // Keep tabs in sync.
  useEffect(() => {
    const onStorage = (e) => { if (e.key === KEY) setLines(load()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((id, qty = 1) => {
    setLines((ls) => {
      const found = ls.find((l) => l.id === id);
      return found ? ls.map((l) => (l.id === id ? { ...l, qty: Math.min(999, l.qty + qty) } : l)) : [...ls, { id, qty }].slice(-50);
    });
    setBump((b) => b + 1);
  }, []);
  const setQty = useCallback((id, qty) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, qty: Math.max(1, Math.min(999, qty)) } : l))), []);
  const remove = useCallback((id) => setLines((ls) => ls.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(() => ({
    lines, add, setQty, remove, clear, bump,
    count: lines.reduce((s, l) => s + l.qty, 0),
    has: (id) => lines.some((l) => l.id === id),
  }), [lines, add, setQty, remove, clear, bump]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
