import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: '/',
  build: {
    outDir: 'dist',
    minify: 'esbuild', // Default, avoids terser dependency
    sourcemap: false,
    rollupOptions: {
      // Clean up chunks
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
