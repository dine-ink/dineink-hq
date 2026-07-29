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
    alias: {
      '@': path.resolve(__dirname, './src'),
      'utils': path.resolve(__dirname, './src/utils'),
      'components': path.resolve(__dirname, './src/components'),
      'hooks': path.resolve(__dirname, './src/hooks'),
      'store': path.resolve(__dirname, './src/store'),
      'routes': path.resolve(__dirname, './src/routes'),
      'pages': path.resolve(__dirname, './src/pages'),
      'types': path.resolve(__dirname, './src/types'),
      'context': path.resolve(__dirname, './src/context'),
      'layouts': path.resolve(__dirname, './src/layouts'),
    },
  },
})
