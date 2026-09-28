# To-Do List

A small to-do list app built with **React 19 + Vite 8**, written to be readable
by someone who is learning. No state-management library, no CSS framework — just
React hooks and plain CSS, with the tricky logic separated out and unit tested.

## What it does

- ➕ Add a task, optionally with a **start date** and **end date**
- 📅 A **month calendar** that shows every dated task on the days it covers
- 👆 Click a day in the calendar to see only that day's tasks
- ✅ Tick a task as completed (click the checkbox)
- ✏️ Edit a task — **double-click** the text, <kbd>Enter</kbd> saves, <kbd>Esc</kbd> cancels
- 🔗 Change a task's dates by clicking its date badge in the list
- ⏰ Tasks whose end date has passed are flagged **Overdue**
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
    ├── lib/dates.js               # pure date/calendar logic — no React
    ├── todos.test.js              # unit tests for lib/todos.js
    ├── dates.test.js              # unit tests for lib/dates.js
    ├── hooks/
    │   └── useLocalStorage.js     # useState that also saves to localStorage
    ├── components/
    │   ├── Calendar.jsx           # month grid showing task date ranges
    │   ├── TodoForm.jsx           # text input, date inputs + Add button
    │   ├── TodoList.jsx           # the list (or the empty message)
    │   ├── TodoItem.jsx           # one row: checkbox, title, dates, delete
    │   └── TodoFilters.jsx        # All / Active / Completed + Clear completed
    └── styles/index.css           # all styling (CSS custom properties)
```

## How it works

Data flows in one direction, which is the core idea behind React:

```
TodoForm ──onAdd──▶ App (state) ──▶ Calendar / TodoList ──▶ TodoItem
                        ▲                                      │
                        └── onToggle / onEdit / onReschedule / onDelete ──┘
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

## Dates and the calendar

A task stores two optional dates, `startDate` and `endDate`. The calendar marks
each day a task covers, and the chip is shaped to show where the range begins
and ends: rounded on the **first** day, square while it continues, rounded again
on the **last** day. A one-day task is a single pill. The legend under the grid
spells this out.

Dates are saved as ISO calendar strings (`"2026-09-28"`), not timestamps. That
choice is deliberate and worth understanding:

- `"YYYY-MM-DD"` strings sort correctly with plain `<` and `>`, so checking
  whether a task covers a day needs no parsing at all.
- They describe a *calendar day*, not an instant, so there is no timezone to get
  wrong. `new Date().toISOString().slice(0, 10)` looks equivalent but is a bug:
  it returns the **UTC** day, which is already tomorrow for anyone east of
  Greenwich late in the evening.

`src/lib/dates.js` also refuses to trust dates blindly. `parseISODate()` rejects
impossible days such as `2026-02-30`, because `new Date(2026, 1, 30)` silently
rolls over to 2 March. `normalizeRange()` then guarantees every stored task has
either a valid `startDate <= endDate` pair or two `null`s, swapping dates that
arrive the wrong way round.

Two small but important details in that file:

- `addDays()` rebuilds a date from its parts rather than adding 86 400 000 ms,
  because a day is only 23 or 25 hours long when the clocks change.
- `shiftMonth()` always lands on the 1st, so stepping a month forward from 31
  January gives 1 February instead of skipping to 3 March.

### Where your data lives

Open your browser's DevTools → **Application → Local Storage** and you will see
three keys:

- `todo-list.tasks` — the tasks, including their date ranges
- `todo-list.filter` — the last filter you picked
- `todo-list.selectedDay` — the calendar day you last clicked, if any

Delete them to reset the app. `sanitizeTodos()` cleans up whatever it finds, so
old or hand-edited data can't break the UI — including tasks saved before the
calendar existed, which simply come back undated.

## Ideas for your next step

- Colour-code tasks by how many days their range covers.
- Repeat tasks weekly or monthly (a `repeat` field plus a `shiftMonth`-style helper).
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
