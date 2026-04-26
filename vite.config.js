import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set NGROK=1 in the env when demoing via an HTTPS tunnel
// (e.g. NGROK=1 npm run dev). Without it, HMR uses the default
// websocket so local dev + Playwright tests work normally.
const NGROK = !!process.env.NGROK;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,           // bind to 0.0.0.0 so LAN/ngrok can reach it
    allowedHosts: true,   // accept any Host header (ngrok rotates subdomains)
    hmr: NGROK ? { clientPort: 443 } : true,  // ngrok terminates TLS on 443
  },
  build: { target: 'es2019' },
});
