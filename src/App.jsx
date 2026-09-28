import { useMemo, useState } from 'react'
import Calendar from './components/Calendar.jsx'
import TodoFilters from './components/TodoFilters.jsx'
import TodoForm from './components/TodoForm.jsx'
import TodoList from './components/TodoList.jsx'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { formatDate, sanitizeDay, todayISO, todosOnDay } from './lib/dates.js'
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
const DAY_KEY = 'todo-list.selectedDay'

export default function App() {
  // Every piece of state here is saved to localStorage, so a refresh keeps it.
  const [todos, setTodos] = useLocalStorage(TASKS_KEY, [], sanitizeTodos)
  const [filter, setFilter] = useLocalStorage(FILTER_KEY, 'all', sanitizeFilter)
  const [selectedDay, setSelectedDay] = useLocalStorage(DAY_KEY, null, sanitizeDay)
  const [isCalendarOpen, setIsCalendarOpen] = useState(true)

  // `dispatch` sends an action to the reducer. We keep the handlers below small
  // so the components stay focused on rendering.
  function dispatch(action) {
    setTodos((previous) => todosReducer(previous, action))
  }

  const handleAdd = (title, dates) =>
    dispatch({ type: 'added', todo: createTodo(title, dates) })
  const handleToggle = (id) => dispatch({ type: 'toggled', id })
  const handleEdit = (id, title) => dispatch({ type: 'edited', id, title })
  const handleReschedule = (id, startDate, endDate) =>
    dispatch({ type: 'rescheduled', id, startDate, endDate })
  const handleDelete = (id) => dispatch({ type: 'deleted', id })
  const handleClearCompleted = () => dispatch({ type: 'cleared' })

  const remaining = countActive(todos)
  const counts = {
    all: todos.length,
    active: remaining,
    completed: todos.length - remaining,
  }

  const scheduledCount = useMemo(
    () => todos.filter((todo) => todo.startDate !== null).length,
    [todos],
  )

  // A chosen calendar day narrows the list first, then the status filter runs
  // on the result, so "Active" on a day means active tasks on that day.
  const dayTodos = useMemo(
    () => (selectedDay ? todosOnDay(todos, selectedDay) : todos),
    [todos, selectedDay],
  )
  const visibleTodos = useMemo(() => filterTodos(dayTodos, filter), [dayTodos, filter])

  const isToday = selectedDay === todayISO()

  return (
    <main className="app">
      <header className="app__header">
        <div className="app__heading">
          <h1 className="app__title">My To-Do List</h1>
          <button
            className="app__toggle"
            type="button"
            aria-expanded={isCalendarOpen}
            onClick={() => setIsCalendarOpen((open) => !open)}
          >
            {isCalendarOpen ? 'Hide calendar' : 'Show calendar'}
          </button>
        </div>
        <p className="app__subtitle">
          {todos.length === 0
            ? 'Nothing here yet — add your first task below.'
            : `${remaining} of ${todos.length} ${todos.length === 1 ? 'task' : 'tasks'} left`}
          {scheduledCount > 0 && ` · ${scheduledCount} on the calendar`}
        </p>
      </header>

      {isCalendarOpen && (
        <Calendar
          todos={todos}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      <TodoForm onAdd={handleAdd} />

      {selectedDay && (
        <div className="day-banner">
          <h2 className="day-banner__title">
            Tasks on {formatDate(selectedDay)}
            {isToday && <span className="day-banner__today">today</span>}
          </h2>
          <button
            className="day-banner__clear"
            type="button"
            onClick={() => setSelectedDay(null)}
          >
            Show all tasks
          </button>
        </div>
      )}

      <TodoFilters
        filter={filter}
        counts={counts}
        onChange={setFilter}
        onClearCompleted={handleClearCompleted}
      />

      <TodoList
        todos={visibleTodos}
        filter={filter}
        emptyMessage={
          selectedDay
            ? `Nothing scheduled for ${formatDate(selectedDay)}.`
            : undefined
        }
        onToggle={handleToggle}
        onEdit={handleEdit}
        onReschedule={handleReschedule}
        onDelete={handleDelete}
      />

      <footer className="app__footer">
        <p>
          Tip: double-click a task to edit it, or click its date badge to set a
          start and end date. Click a day in the calendar to see just that day.
        </p>
        <p className="app__footer-note">
          Tasks without dates stay in the list but do not appear on the calendar.
        </p>
      </footer>
    </main>
  )
}
