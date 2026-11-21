import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await fetch(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.log('Backend not connected, using demo mode');
          const savedUser = localStorage.getItem('demoUser');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
            setDemoMode(true);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      const savedUser = localStorage.getItem('demoUser');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.email === email) {
          setUser(userData);
          setDemoMode(true);
          return userData;
        }
      }
      throw new Error('Backend not connected. Please start MongoDB and backend.');
    }
  };

  const register = async (userData) => {
    try {
      const res = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      const newUser = { ...userData, id: Date.now().toString(), role: 'user' };
      localStorage.setItem('demoUser', JSON.stringify(newUser));
      localStorage.setItem('token', 'demo_' + newUser.id);
      setToken('demo_' + newUser.id);
      setUser(newUser);
      setDemoMode(true);
      return newUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setDemoMode(false);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
    demoMode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};