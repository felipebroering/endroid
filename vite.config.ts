import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  css: {
    postcss: {},
  },
  server: {
    port: 5180,
    strictPort: true,
    open: false,
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});

