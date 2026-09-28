import { describe, expect, it } from 'vitest'
import {
  countActive,
  createTodo,
  filterTodos,
  sanitizeFilter,
  sanitizeTodos,
  todosReducer,
} from './lib/todos.js'

/** Small helper so every test starts from a known list. */
function makeTodos() {
  return [
    { id: 'a', title: 'Buy milk', completed: false, createdAt: '2026-01-01' },
    { id: 'b', title: 'Walk the dog', completed: true, createdAt: '2026-01-02' },
  ]
}

describe('createTodo', () => {
  it('trims the title and starts incomplete', () => {
    const todo = createTodo('  Write tests  ')

    expect(todo.title).toBe('Write tests')
    expect(todo.completed).toBe(false)
    expect(typeof todo.id).toBe('string')
    expect(todo.id.length).toBeGreaterThan(0)
  })

  it('gives every task a unique id', () => {
    const ids = new Set([createTodo('one').id, createTodo('two').id, createTodo('three').id])

    expect(ids.size).toBe(3)
  })
})

describe('todosReducer', () => {
  it('appends an added task', () => {
    const todos = makeTodos()
    const next = todosReducer(todos, { type: 'added', todo: createTodo('Ship it') })

    expect(next).toHaveLength(3)
    expect(next.at(-1).title).toBe('Ship it')
  })

  it('does not mutate the previous list when adding', () => {
    const todos = makeTodos()
    const next = todosReducer(todos, { type: 'added', todo: createTodo('Ship it') })

    expect(next).not.toBe(todos)
    expect(todos).toHaveLength(2)
  })

  it('toggles only the matching task', () => {
    const todos = makeTodos()
    const next = todosReducer(todos, { type: 'toggled', id: 'a' })

    expect(next[0].completed).toBe(true)
    expect(next[1].completed).toBe(true) // still completed
    expect(todos[0].completed).toBe(false) // original untouched
  })

  it('edits a title and trims it', () => {
    const next = todosReducer(makeTodos(), { type: 'edited', id: 'a', title: '  Buy oat milk ' })

    expect(next[0].title).toBe('Buy oat milk')
  })

  it('ignores an edit that would leave the title empty', () => {
    const todos = makeTodos()

    expect(todosReducer(todos, { type: 'edited', id: 'a', title: '   ' })).toBe(todos)
  })

  it('records edits as new objects (immutably)', () => {
    const todos = makeTodos()
    const next = todosReducer(todos, { type: 'edited', id: 'a', title: 'Buy oat milk' })

    expect(next[0]).not.toBe(todos[0])
    expect(next[1]).toBe(todos[1]) // untouched rows keep their identity
  })

  it('deletes a task by id', () => {
    const next = todosReducer(makeTodos(), { type: 'deleted', id: 'b' })

    expect(next.map((todo) => todo.id)).toEqual(['a'])
  })

  it('clears only the completed tasks', () => {
    const next = todosReducer(makeTodos(), { type: 'cleared' })

    expect(next.map((todo) => todo.id)).toEqual(['a'])
  })

  it('throws on an unknown action so bugs are loud', () => {
    expect(() => todosReducer(makeTodos(), { type: 'exploded' })).toThrow(
      /Unknown action type/,
    )
  })
})

describe('sanitizeTodos', () => {
  it('returns an empty list for anything that is not an array', () => {
    expect(sanitizeTodos(null)).toEqual([])
    expect(sanitizeTodos('nope')).toEqual([])
    expect(sanitizeTodos({})).toEqual([])
  })

  it('drops entries without a usable title', () => {
    const cleaned = sanitizeTodos([
      { id: 'a', title: 'Keep me' },
      { id: 'b', title: '   ' },
      { id: 'c' },
      null,
      'not a task',
    ])

    expect(cleaned).toHaveLength(1)
    expect(cleaned[0].title).toBe('Keep me')
  })

  it('fills in missing fields and fixes types', () => {
    const [todo] = sanitizeTodos([{ title: '  From an old version  ', completed: 'yes' }])

    expect(todo.title).toBe('From an old version')
    expect(todo.completed).toBe(false) // only real booleans count
    expect(typeof todo.id).toBe('string')
    expect(typeof todo.createdAt).toBe('string')
  })
})

describe('filterTodos', () => {
  it('returns every task for "all"', () => {
    expect(filterTodos(makeTodos(), 'all')).toHaveLength(2)
  })

  it('returns only unfinished tasks for "active"', () => {
    expect(filterTodos(makeTodos(), 'active').map((todo) => todo.id)).toEqual(['a'])
  })

  it('returns only finished tasks for "completed"', () => {
    expect(filterTodos(makeTodos(), 'completed').map((todo) => todo.id)).toEqual(['b'])
  })
})

describe('countActive', () => {
  it('counts the unfinished tasks', () => {
    expect(countActive(makeTodos())).toBe(1)
    expect(countActive([])).toBe(0)
  })
})

describe('sanitizeFilter', () => {
  it('keeps valid filters and falls back to "all"', () => {
    expect(sanitizeFilter('active')).toBe('active')
    expect(sanitizeFilter('completed')).toBe('completed')
    expect(sanitizeFilter('nonsense')).toBe('all')
    expect(sanitizeFilter(undefined)).toBe('all')
  })
})
