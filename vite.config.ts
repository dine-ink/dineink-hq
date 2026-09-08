import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://dineink-backend.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  resolve: {
    // One alias, matching tsconfig.json and vitest.config.ts.
    //
    // There were ten. Nine were bare names — 'utils', 'store', 'types',
    // 'pages' — and every one of them was unused. Bare aliases are worth
    // removing rather than leaving: each shadows any npm package of the same
    // name, so `npm i types` would silently resolve to ./src/types instead,
    // and the failure would look like the package being broken. 'context' also
    // pointed at a directory that no longer exists.
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
