import { useEffect, useState } from 'react'

/**
 * Read a value from localStorage once, without crashing if it is missing or
 * contains broken JSON (for example if the user cleared it by hand).
 */
function readValue(key, initialValue) {
  try {
    const stored = window.localStorage.getItem(key)
    return stored === null ? initialValue : JSON.parse(stored)
  } catch (error) {
    console.warn(`Could not read "${key}" from localStorage.`, error)
    return initialValue
  }
}

/**
 * A drop-in replacement for `useState` that also saves the value in
 * localStorage, so the data is still there after a page refresh.
 *
 * @param {string} key  localStorage key, e.g. "todo-list.tasks"
 * @param {*} initialValue  used when nothing has been saved yet
 * @param {(value: *) => *} sanitize  optional clean-up for loaded data
 */
export function useLocalStorage(key, initialValue, sanitize = (value) => value) {
  const [value, setValue] = useState(() => sanitize(readValue(key, initialValue)))

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      // Most likely the browser storage is full or blocked in private mode.
      console.warn(`Could not save "${key}" to localStorage.`, error)
    }
  }, [key, value])

  return [value, setValue]
}
