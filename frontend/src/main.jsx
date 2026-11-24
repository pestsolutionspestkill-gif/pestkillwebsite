import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './styles/index.css';

const app = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

const container = document.getElementById('root');
// Public pages arrive pre-rendered (see scripts/prerender.mjs): attach to that HTML instead of
// rebuilding it, so content is visible before JavaScript loads. Other pages start empty.
if (container.firstElementChild) {
  ReactDOM.hydrateRoot(container, app, {
    onRecoverableError: (err) => { if (import.meta.env.DEV) console.warn('Hydration fallback:', err); },
  });
} else {
  ReactDOM.createRoot(container).render(app);
}
