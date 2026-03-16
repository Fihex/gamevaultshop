import path from "path"
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // This ensures the server always falls back to index.html for unknown routes
        historyApiFallback: true,
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('lucide-react')) return 'lucide';
                if (id.includes('write-excel-file')) return 'excel';
                if (id.includes('@tanstack')) return 'router'; // Separate router chunk

                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }

                if (id.includes('@radix-ui')) {
                  return 'ui-vendor';
                }
              }
            },
          },
        },
      }
    };
});
