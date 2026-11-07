import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';
import {defineConfig, type Plugin} from 'vite';

// index.html intentionally references review-friendly artwork paths at runtime.
// Emit those files explicitly because they are not JavaScript module imports.
const gameImagePaths = [
  'assets/Image/ground.webp',
  'assets/Image/Sheets/berserker_sheet.webp',
  'assets/Image/Sheets/tidecaller_sheet.webp',
  'assets/Image/Sheets/shadow_sheet.webp',
  'assets/Image/UI/portrait_berserker.webp',
  'assets/Image/UI/portrait_tidecaller.webp',
  'assets/Image/UI/portrait_shadow.webp',
];

function emitGameImages(): Plugin {
  return {
    name: 'emit-game-images',
    generateBundle() {
      for (const fileName of gameImagePaths) {
        this.emitFile({ type: 'asset', fileName, source: fs.readFileSync(fileName) });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), emitGameImages()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['.e2b.app'],
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
