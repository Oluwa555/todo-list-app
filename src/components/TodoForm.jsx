import { useState } from 'react'
import { formatDate, todayISO } from '../lib/dates.js'

/**
 * The "add a task" form.
 *
 * It owns the text being typed plus the optional start/end dates, and reports
 * one complete task up to `onAdd` when the user submits.
 */
export default function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const trimmed = title.trim()
  // Tell the user what will happen instead of swapping their dates silently.
  const isReversed = startDate !== '' && endDate !== '' && endDate < startDate
  const today = formatDate(todayISO())

  function handleSubmit(event) {
    // Always stop the browser from reloading the page on submit.
    event.preventDefault()
    if (trimmed === '') return

    onAdd(trimmed, { startDate, endDate })

    setTitle('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="todo-form__row">
        <label className="sr-only" htmlFor="new-todo">
          New task
        </label>
        <input
          id="new-todo"
          className="todo-form__input"
          type="text"
          placeholder="What needs to be done?"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          autoComplete="off"
        />
        <button
          className="todo-form__button"
          type="submit"
          disabled={trimmed === ''}
        >
          Add
        </button>
      </div>

      <div className="todo-form__row todo-form__row--dates">
        <div className="todo-form__field">
          <label className="todo-form__label" htmlFor="new-todo-start">
            Starts
          </label>
          <input
            id="new-todo-start"
            className="todo-form__date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className="todo-form__field">
          <label className="todo-form__label" htmlFor="new-todo-end">
            Ends
          </label>
          <input
            id="new-todo-end"
            className="todo-form__date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <p className="todo-form__hint">
          {isReversed
            ? 'End is before start — they will be swapped.'
            : `Optional. Leave blank for a task with no dates. Today is ${today}.`}
        </p>
      </div>
    </form>
  )
}
