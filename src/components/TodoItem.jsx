import { useEffect, useRef, useState } from 'react'

/**
 * One row in the list: checkbox, title and a delete button.
 * Double-clicking the title switches the row into edit mode.
 */
export default function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const inputRef = useRef(null)
  // Remembers that Escape was pressed, so the blur that follows does not save.
  const cancelledRef = useRef(false)

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  function startEditing() {
    setDraft(todo.title)
    cancelledRef.current = false
    setIsEditing(true)
  }

  function save() {
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    const nextTitle = draft.trim()
    if (nextTitle !== '' && nextTitle !== todo.title) {
      onEdit(todo.id, nextTitle)
    }
    setIsEditing(false)
  }

  function cancel() {
    cancelledRef.current = true
    setIsEditing(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') save()
    if (event.key === 'Escape') cancel()
  }

  return (
    <li className={`todo-item${todo.completed ? ' todo-item--completed' : ''}`}>
      <input
        className="todo-item__checkbox"
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        aria-label={`Mark "${todo.title}" as ${
          todo.completed ? 'not completed' : 'completed'
        }`}
      />

      {isEditing ? (
        <input
          ref={inputRef}
          className="todo-item__edit"
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={save}
          aria-label="Edit task"
        />
      ) : (
        <span
          className="todo-item__title"
          onDoubleClick={startEditing}
          title="Double-click to edit"
        >
          {todo.title}
        </span>
      )}

      <button
        className="todo-item__delete"
        type="button"
        onClick={() => onDelete(todo.id)}
        aria-label={`Delete "${todo.title}"`}
      >
        ×
      </button>
    </li>
  )
}
