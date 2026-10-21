import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // ── Dev server ──────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    host: true,              // bind to 0.0.0.0 so ngrok can reach it
    allowedHosts: true,      // allow any tunnelled host (ngrok, etc.)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true,
      },
    },
  },

  // ── Production build optimisation ──────────────────────────────────────────
  build: {
    // Raise the chunk-size warning threshold to 600 kB (Recharts is large)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks — stable hashes improve long-term cache hits
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion':   ['framer-motion'],
          'vendor-charts':   ['recharts'],
          'vendor-dnd':      ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'vendor-icons':    ['react-icons'],
          'vendor-socket':   ['socket.io-client'],
        },
      },
    },
  },
});
