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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'utils': path.resolve(__dirname, './src/utils'),
      'components': path.resolve(__dirname, './src/components'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'themes': path.resolve(__dirname, './src/themes'),
      'store': path.resolve(__dirname, './src/store'),
      'routes': path.resolve(__dirname, './src/routes'),
      'pages': path.resolve(__dirname, './src/pages'),
      'types': path.resolve(__dirname, './src/types'),
      'menu-items': path.resolve(__dirname, './src/menu-items'),
      'context': path.resolve(__dirname, './src/context'),
      'layouts': path.resolve(__dirname, './src/layouts'),
    },
  },
})
