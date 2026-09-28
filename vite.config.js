import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Vite powers the dev server and the production build.
// The `test` block is read by Vitest (our test runner).
export default defineConfig({
  plugins: [react()],
  server: {
    open: false,
  },
  test: {
    // Our tests only cover plain JavaScript, so we do not need a DOM.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
