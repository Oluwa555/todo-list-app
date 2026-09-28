# To-Do List

A small to-do list app built with **React 19 + Vite 8**, written to be readable
by someone who is learning. No state-management library, no CSS framework — just
React hooks and plain CSS, with the tricky logic separated out and unit tested.

## What it does

- ➕ Add a task (empty or whitespace-only input is ignored)
- ✅ Tick a task as completed (click the checkbox)
- ✏️ Edit a task — **double-click** the text, <kbd>Enter</kbd> saves, <kbd>Esc</kbd> cancels
- 🗑️ Delete a task with the `×` button
- 🔍 Filter by **All / Active / Completed**, with counts on each button
- 🧹 "Clear completed" removes every finished task at once
- 🧮 A running "X of Y tasks left" summary
- 💾 Everything is saved in `localStorage`, so a refresh keeps your list

## Requirements

- **Node.js 22.12 or newer** (created and tested on Node 22.22) and npm.
  Check with `node --version`.

## Getting started

```bash
# 1. Go into the project
cd todo-list-app

# 2. Install dependencies (only needed once)
npm install

# 3. Start the dev server
npm run dev
```

Vite prints a URL such as `http://localhost:5173/` — open it in your browser.
Edit any file and the page updates instantly (this is *hot module replacement*).
Stop the server with <kbd>Ctrl</kbd>+<kbd>C</kbd>.

### Other commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Re-run tests automatically while you edit |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the built `dist/` folder to check it locally |

## Project structure

```
todo-list-app/
├── index.html                     # the single HTML page React renders into
├── package.json                   # dependencies + npm scripts
├── vite.config.js                 # Vite build config and Vitest test config
└── src/
    ├── main.jsx                   # entry point: mounts <App /> onto the page
    ├── App.jsx                    # holds the state, wires the pieces together
    ├── lib/todos.js               # pure logic (reducer + helpers) — no React
    ├── todos.test.js              # unit tests for lib/todos.js
    ├── hooks/
    │   └── useLocalStorage.js     # useState that also saves to localStorage
    ├── components/
    │   ├── TodoForm.jsx           # input + Add button
    │   ├── TodoList.jsx           # the list (or the empty message)
    │   ├── TodoItem.jsx           # one row: checkbox, title, delete
    │   └── TodoFilters.jsx        # All / Active / Completed + Clear completed
    └── styles/index.css           # all styling (CSS custom properties)
```

## How it works

Data flows in one direction, which is the core idea behind React:

```
TodoForm ──onAdd──▶ App (state) ──▶ TodoList ──▶ TodoItem
                        ▲                            │
                        └───onToggle / onEdit / onDelete──┘
```

1. **`App.jsx`** is the only component that owns the list of tasks.
2. Children never change state themselves — they call the callbacks they were
   given (`onAdd`, `onToggle`, …).
3. `App` turns each callback into an **action** and passes it to
   `todosReducer()` in `src/lib/todos.js`.
4. The reducer returns a **new** array (never a mutated one), React re-renders,
   `useLocalStorage` writes the new list to `localStorage`.

Why a reducer? Because the rules of the app live in one small pure function
(`(todos, action) => todos`), which means they can be tested without a browser —
see `src/todos.test.js`.

### Where your data lives

Open your browser's DevTools → **Application → Local Storage** and you will see
two keys:

- `todo-list.tasks` — the tasks
- `todo-list.filter` — the last filter you picked

Delete them to reset the app. `sanitizeTodos()` cleans up whatever it finds, so
old or hand-edited data can't break the UI.

## Ideas for your next step

- Add due dates and sort by them.
- Drag to reorder (look at `@dnd-kit/core`).
- Add a "priority" field to `createTodo()` and render it as a coloured dot.
- Test the components too, with `@testing-library/react` and a `jsdom` environment.
- Add ESLint with `npm install -D eslint @eslint/js eslint-plugin-react-hooks` so
  the editor warns about common mistakes.

## Troubleshooting

- **Port 5173 is busy** → run `npm run dev -- --port 3000`.
- **The page is blank** → open the browser console; a red error there will name
  the file and line.
- **`Unsupported engine` on install** → your Node.js is older than 22.12; update
  it (e.g. with `nvm install 22`) and run `npm install` again.
- **Your changes don't stick** → you are probably in a private window, where
  `localStorage` is cleared when the window closes.
- **`Bus error (core dumped)` when running `npm run build` or `npm test`** → a
  native dependency was corrupted, almost always by an `npm install` that got
  interrupted (a network timeout is enough). The error looks nothing like a
  network problem. Fix it with:

  ```bash
  rm -rf node_modules
  npm install
  ```

## Git

The repository is already initialised on the `main` branch, and `.gitignore`
keeps `node_modules/` and `dist/` out of version control. To save your work:

```bash
git add .
git commit -m "Describe what you changed"
```
