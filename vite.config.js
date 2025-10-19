import path from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  // Ensure SPA history fallback so deep links like /ai-content work
  appType: 'spa',
  plugins: [tailwindcss(), svelte()],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
      $components: path.resolve('./src/lib/components'),
      $pages: path.resolve('./src/pages'),
      $assets: path.resolve('./src/assets'),
      $stores: path.resolve('./src/lib/stores'),
      $utils: path.resolve('./src/lib/utils'),
      $ui: path.resolve('./src/lib/components/ui')
    }
  },
  server: {
    // Vite enables history fallback for SPA when appType is 'spa'
    // Use trailing slashes so '/ai-content' is NOT proxied to backend '/ai'
    proxy: {
      '/api/': 'http://localhost:8000'
    }
  }
});
