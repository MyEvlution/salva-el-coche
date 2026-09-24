import { defineConfig } from 'vite';

// Sitio estatico puro: sin variables de entorno, sin backend y sin sourcemaps
// en produccion (ver las reglas de seguridad del taller).
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 8192,
  },
  server: {
    port: 5177,
    strictPort: true,
  },
});
