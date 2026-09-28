import TodoItem from './TodoItem.jsx'

const EMPTY_MESSAGES = {
  all: 'No tasks yet. Add your first one above.',
  active: 'No active tasks — nice work!',
  completed: 'Nothing completed yet.',
}

/** Renders the list of tasks, or a friendly message when there are none. */
export default function TodoList({ todos, filter, onToggle, onEdit, onDelete }) {
  if (todos.length === 0) {
    return <p className="todo-list__empty">{EMPTY_MESSAGES[filter]}</p>
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        // `key` lets React track each row between renders. It must be unique.
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}
