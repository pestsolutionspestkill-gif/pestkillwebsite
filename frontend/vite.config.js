import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The server bundle (vite build --ssr) includes its dependencies so the API server can load
  // it for page metadata without needing the frontend's node_modules.
  ssr: { noExternal: true },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
