import { useMemo } from 'react'
import TodoFilters from './components/TodoFilters.jsx'
import TodoForm from './components/TodoForm.jsx'
import TodoList from './components/TodoList.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import {
  countActive,
  createTodo,
  filterTodos,
  sanitizeFilter,
  sanitizeTodos,
  todosReducer,
} from './lib/todos.js'

const TASKS_KEY = 'todo-list.tasks'
const FILTER_KEY = 'todo-list.filter'

export default function App() {
  // Both pieces of state are saved to localStorage, so a refresh keeps them.
  const [todos, setTodos] = useLocalStorage(TASKS_KEY, [], sanitizeTodos)
  const [filter, setFilter] = useLocalStorage(FILTER_KEY, 'all', sanitizeFilter)

  // `dispatch` sends an action to the reducer. We keep the handlers below small
  // so the components stay focused on rendering.
  function dispatch(action) {
    setTodos((previous) => todosReducer(previous, action))
  }

  const handleAdd = (title) => dispatch({ type: 'added', todo: createTodo(title) })
  const handleToggle = (id) => dispatch({ type: 'toggled', id })
  const handleEdit = (id, title) => dispatch({ type: 'edited', id, title })
  const handleDelete = (id) => dispatch({ type: 'deleted', id })
  const handleClearCompleted = () => dispatch({ type: 'cleared' })

  const remaining = countActive(todos)
  const counts = {
    all: todos.length,
    active: remaining,
    completed: todos.length - remaining,
  }

  // useMemo is optional here; it just avoids re-filtering on unrelated renders.
  const visibleTodos = useMemo(() => filterTodos(todos, filter), [todos, filter])

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">My To-Do List</h1>
        <p className="app__subtitle">
          {todos.length === 0
            ? 'Nothing here yet — add your first task below.'
            : `${remaining} of ${todos.length} ${todos.length === 1 ? 'task' : 'tasks'} left`}
        </p>
      </header>

      <TodoForm onAdd={handleAdd} />

      <TodoFilters
        filter={filter}
        counts={counts}
        onChange={setFilter}
        onClearCompleted={handleClearCompleted}
      />

      <TodoList
        todos={visibleTodos}
        filter={filter}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <footer className="app__footer">
        <p>
          Tip: double-click a task to edit it. Press <kbd>Enter</kbd> to save or{' '}
          <kbd>Esc</kbd> to cancel.
        </p>
      </footer>
    </main>
  )
}
