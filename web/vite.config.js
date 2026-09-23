import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// «npm run build»          → web para Android (Capacitor) en www/
// «npm run build:windows»  → un único grimorio.html que se abre con doble clic, sin servidor ni conexión
export default defineConfig(({ mode }) => {
  const windows = mode === 'windows';
  return {
    root: new URL('.', import.meta.url).pathname,
    base: './',
    plugins: windows ? [viteSingleFile({ removeViteModuleLoader: true })] : [],
    publicDir: windows ? false : 'public',       // en Windows el compendio va dentro del HTML
    build: {
      outDir: windows ? '../dist-windows' : '../www',
      emptyOutDir: true,
      target: ['chrome100', 'safari15'],
      cssMinify: true,
      assetsInlineLimit: windows ? 100_000_000 : 0,
      chunkSizeWarningLimit: windows ? 5000 : 500,
      reportCompressedSize: !windows,
    },
    server: { host: true },
  };
});
