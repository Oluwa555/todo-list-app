import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a project site from a subpath such as
// https://oluwa555.github.io/todo-list-app/, so that build has to know its own
// folder name or every asset URL would point at the wrong place.
// GitHub Actions sets GITHUB_ACTIONS=true automatically, so we only use the
// subpath there. Everywhere else (npm run dev, Netlify, `npm run preview`)
// the site lives at the root, so the base stays "/".
const REPO_NAME = 'todo-list-app'
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig(({ command }) => ({
  base: command === 'build' && isGitHubPagesBuild ? `/${REPO_NAME}/` : '/',
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
