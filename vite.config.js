import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    target: 'es2019',
    // BodyTab is lazy-loaded and pulls in three+R3F+drei (~900 KB raw, 240 KB
    // gzipped). The initial bundle is still ~250 KB.
    chunkSizeWarningLimit: 1000,
  },
});
