// In development Vite proxies /api to the backend (see vite.config.js).
// In production set VITE_API_URL if the API lives on a different domain.
export const API_URL = import.meta.env.VITE_API_URL || '/api';
