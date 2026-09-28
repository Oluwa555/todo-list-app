import { FILTERS } from '../lib/todos.js'

const LABELS = {
  all: 'All',
  active: 'Active',
  completed: 'Completed',
}

/** The "All / Active / Completed" buttons and the "Clear completed" action. */
export default function TodoFilters({
  filter,
  counts,
  onChange,
  onClearCompleted,
}) {
  return (
    <div className="todo-filters">
      <div className="todo-filters__group" role="group" aria-label="Filter tasks">
        {FILTERS.map((name) => (
          <button
            key={name}
            type="button"
            className={`todo-filters__button${
              filter === name ? ' todo-filters__button--active' : ''
            }`}
            aria-pressed={filter === name}
            onClick={() => onChange(name)}
          >
            {LABELS[name]}
            {counts[name] > 0 && (
              <span className="todo-filters__count">{counts[name]}</span>
            )}
          </button>
        ))}
      </div>

      {counts.completed > 0 && (
        <button
          className="todo-filters__clear"
          type="button"
          onClick={onClearCompleted}
        >
          Clear completed
        </button>
      )}
    </div>
  )
}
