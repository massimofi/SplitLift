import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,           // bind to 0.0.0.0 so LAN/ngrok can reach it
    allowedHosts: true,   // accept any Host header (ngrok rotates subdomains)
    hmr: { clientPort: 443 },  // ngrok terminates TLS on 443
  },
  build: { target: 'es2019' },
});
