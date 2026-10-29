import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, strictPort: true,
    proxy: Object.fromEntries(['/auth', '/specialists', '/doctor-profile', '/activities'].map(prefix => [prefix, {
      target: 'http://localhost:3000', changeOrigin: true,
    }])),
  },
});
