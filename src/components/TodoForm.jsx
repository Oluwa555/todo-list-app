import { useState } from 'react'

/**
 * The "add a task" form. It owns one piece of state (the text being typed) and
 * reports up to `onAdd` when the user submits.
 */
export default function TodoForm({ onAdd }) {
  const [title, setTitle] = useState('')
  const trimmed = title.trim()

  function handleSubmit(event) {
    // Always stop the browser from reloading the page on submit.
    event.preventDefault()
    if (trimmed === '') return
    onAdd(trimmed)
    setTitle('')
  }

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
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
      <button className="todo-form__button" type="submit" disabled={trimmed === ''}>
        Add
      </button>
    </form>
  )
}
