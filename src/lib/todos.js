/**
 * Pure helpers for the to-do list.
 *
 * Nothing in this file imports React or touches the DOM. Keeping the rules in
 * plain functions means we can unit test them without a browser, and it makes
 * the components easier to read.
 */

/** The three views the user can switch between. */
export const FILTERS = ['all', 'active', 'completed']

const FILTER_SET = new Set(FILTERS)

/**
 * Build a unique id for a task.
 * `crypto.randomUUID()` exists in every modern browser and in Node 19+.
 */
export function newId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Create a brand new (incomplete) task. */
export function createTodo(title) {
  return {
    id: newId(),
    title: title.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  }
}

/**
 * The single place where tasks change.
 *
 * A reducer always returns a NEW array instead of editing the old one, which is
 * what lets React notice the change and re-render. Never mutate `todos` here.
 *
 * @param {Array} todos  current list of tasks
 * @param {{type: string}} action  what happened
 */
export function todosReducer(todos, action) {
  switch (action.type) {
    case 'added':
      return [...todos, action.todo]

    case 'toggled':
      return todos.map((todo) =>
        todo.id === action.id ? { ...todo, completed: !todo.completed } : todo,
      )

    case 'edited': {
      const title = action.title.trim()
      if (title === '') return todos
      return todos.map((todo) =>
        todo.id === action.id ? { ...todo, title } : todo,
      )
    }

    case 'deleted':
      return todos.filter((todo) => todo.id !== action.id)

    case 'cleared':
      return todos.filter((todo) => !todo.completed)

    default:
      throw new Error(`Unknown action type: ${action.type}`)
  }
}

/**
 * Turn anything we loaded from localStorage into a trustworthy list of tasks.
 * Data in localStorage can be missing, outdated or hand-edited, so we never
 * trust it. After this function runs, every item is guaranteed to have a
 * string id, a non-empty title and a boolean `completed`.
 */
export function sanitizeTodos(value) {
  if (!Array.isArray(value)) return []

  return value
    .filter(
      (todo) =>
        todo !== null &&
        typeof todo === 'object' &&
        typeof todo.title === 'string' &&
        todo.title.trim() !== '',
    )
    .map((todo) => ({
      id: typeof todo.id === 'string' && todo.id !== '' ? todo.id : newId(),
      title: todo.title.trim(),
      completed: todo.completed === true,
      createdAt:
        typeof todo.createdAt === 'string'
          ? todo.createdAt
          : new Date().toISOString(),
    }))
}

/** Keep only the tasks that belong in the current view. */
export function filterTodos(todos, filter) {
  if (filter === 'active') return todos.filter((todo) => !todo.completed)
  if (filter === 'completed') return todos.filter((todo) => todo.completed)
  return todos
}

/** How many tasks are still to be done. */
export function countActive(todos) {
  return todos.filter((todo) => !todo.completed).length
}

/** Fall back to "all" if the stored filter is missing or not a real filter. */
export function sanitizeFilter(value) {
  return FILTER_SET.has(value) ? value : 'all'
}
