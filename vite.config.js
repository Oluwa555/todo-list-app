import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a project site from a subpath such as
// https://oluwa555.github.io/todo-list-app/, so the production build has to
// know its own folder name or every asset URL would point at the wrong place.
// Development stays at "/" so `npm run dev` keeps working on localhost:5173.
const REPO_NAME = 'todo-list-app'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  plugins: [react()],
  server: {
    open: false,
  },
  test: {
    // Our tests only cover plain JavaScript, so we do not need a DOM.
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
}))
