import { useEffect, useRef, useState } from 'react'
import { describeDay, formatDateRange, isOverdue, rangeLengthDays } from '../lib/dates.js'

/**
 * One row in the list: checkbox, title, date badge and a delete button.
 *
 * Double-clicking the title edits the text. Clicking the date badge opens two
 * date inputs for setting the start and end of the task.
 */
export default function TodoItem({ todo, onToggle, onEdit, onReschedule, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)
  const [isEditingDates, setIsEditingDates] = useState(false)
  const [draftStart, setDraftStart] = useState(todo.startDate ?? '')
  const [draftEnd, setDraftEnd] = useState(todo.endDate ?? '')
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

  function openDateEditor() {
    // Re-read the task first: another render may have changed its dates.
    setDraftStart(todo.startDate ?? '')
    setDraftEnd(todo.endDate ?? '')
    setIsEditingDates(true)
  }

  function saveDates() {
    onReschedule(todo.id, draftStart, draftEnd)
    setIsEditingDates(false)
  }

  function clearDates() {
    setDraftStart('')
    setDraftEnd('')
    onReschedule(todo.id, '', '')
    setIsEditingDates(false)
  }

  const rangeLabel = formatDateRange(todo)
  const dayCount = rangeLengthDays(todo)
  const overdue = isOverdue(todo)
  const startLabel = describeDay(todo.startDate)
  const endLabel = describeDay(todo.endDate)

  return (
    <li className={`todo-item${todo.completed ? ' todo-item--completed' : ''}`}>
      <div className="todo-item__main">
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
          className="todo-item__dates"
          type="button"
          onClick={openDateEditor}
          aria-expanded={isEditingDates}
          title="Set the start and end dates"
        >
          {rangeLabel === '' ? '+ dates' : rangeLabel}
        </button>

        {overdue && <span className="todo-item__badge">Overdue</span>}

        <button
          className="todo-item__delete"
          type="button"
          onClick={() => onDelete(todo.id)}
          aria-label={`Delete "${todo.title}"`}
        >
          ×
        </button>
      </div>

      {rangeLabel !== '' && (
        <p className="todo-item__meta">
          {dayCount === 1 ? '1 day' : `${dayCount} days`}
          {startLabel !== '' && ` · starts ${startLabel.toLowerCase()}`}
          {endLabel !== '' && ` · ends ${endLabel.toLowerCase()}`}
        </p>
      )}

      {isEditingDates && (
        <div className="todo-item__date-editor">
          <label className="todo-form__field">
            <span className="todo-form__label">Starts</span>
            <input
              className="todo-form__date"
              type="date"
              value={draftStart}
              onChange={(event) => setDraftStart(event.target.value)}
            />
          </label>

          <label className="todo-form__field">
            <span className="todo-form__label">Ends</span>
            <input
              className="todo-form__date"
              type="date"
              value={draftEnd}
              onChange={(event) => setDraftEnd(event.target.value)}
            />
          </label>

          <div className="todo-item__date-actions">
            <button
              className="todo-item__save"
              type="button"
              onClick={saveDates}
            >
              Save dates
            </button>
            <button
              className="todo-item__cancel"
              type="button"
              onClick={clearDates}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </li>
  )
}
