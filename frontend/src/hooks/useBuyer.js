import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// PCO buyer application status for the signed-in user: undefined while loading, null when none.
export const useBuyer = () => {
  const { user } = useAuth();
  const [buyer, setBuyer] = useState(undefined);
  useEffect(() => {
    if (!user) { setBuyer(null); return undefined; }
    let live = true;
    api('/buyers/me').then((b) => live && setBuyer(b)).catch(() => live && setBuyer(null));
    return () => { live = false; };
  }, [user]);
  // Mirrors the server rule: approved AND a recorded licence validity date that has not passed.
  const approved = buyer?.status === 'approved' && !buyer.licence_expired && !buyer.licence_validity_missing;
  return { buyer, setBuyer, approved };
};
