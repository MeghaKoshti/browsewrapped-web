import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Link previews need absolute image URLs, so index.html says %SITE_URL% and
// this fills in VITE_PUBLIC_URL (empty: a root-relative URL, fine for local use).
function siteUrlPlugin(siteUrl) {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', siteUrl),
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), siteUrlPlugin(String(loadEnv(mode, process.cwd(), '').VITE_PUBLIC_URL || '').replace(/\/+$/, ''))],
  build: {
    rolldownOptions: {
      output: {
        // Vendor libraries change less often than app code, so their chunks
        // stay cached between deploys. React gets the top priority so the
        // chart groups (which also pull in their dependencies) can't absorb
        // it and drag Recharts onto the upload page.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 3 },
            { name: 'recharts', test: /node_modules[\\/]recharts[\\/]/, priority: 2 },
            { name: 'd3', test: /node_modules[\\/]d3[\\/]/, priority: 1 },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    // Keep test output readable: CSS isn't needed to assert on behaviour.
    css: false,
    // Full report pages render a lot of SVG; give slow CI runners headroom.
    testTimeout: 15000,
  },
}))
