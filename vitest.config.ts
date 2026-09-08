import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Must stay identical to vite.config.ts, or a module resolves one way in
    // tests and another in the build.
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    // The API tests build request URLs from this. Pinning it here means the
    // suite does not depend on a developer's local .env, which is gitignored
    // and was missing on one machine when every fetch-based test failed.
    env: { VITE_API_URL: 'http://localhost:5500' },
    globals: true,
    setupFiles: ['./src/test/setupTests.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
      ],
    },
  },
})
