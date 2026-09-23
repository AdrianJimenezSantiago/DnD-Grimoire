import { defineConfig } from 'vite';

export default defineConfig({
  root: new URL('.', import.meta.url).pathname,
  base: './',                       // rutas relativas: funciona igual en Capacitor y en un servidor cualquiera
  build: {
    outDir: '../www',
    emptyOutDir: true,
    target: ['chrome100', 'safari15'],
    cssMinify: true,
    assetsInlineLimit: 0,
    reportCompressedSize: true,
  },
  server: { host: true },
});
