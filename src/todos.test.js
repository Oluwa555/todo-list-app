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

  it('has no dates by default', () => {
    const todo = createTodo('No dates')

    expect(todo.startDate).toBeNull()
    expect(todo.endDate).toBeNull()
  })

  it('stores a start and end date', () => {
    const todo = createTodo('Trip', {
      startDate: '2026-09-28',
      endDate: '2026-10-03',
    })

    expect(todo.startDate).toBe('2026-09-28')
    expect(todo.endDate).toBe('2026-10-03')
  })

  it('swaps dates given in the wrong order', () => {
    const todo = createTodo('Trip', {
      startDate: '2026-10-03',
      endDate: '2026-09-28',
    })

    expect(todo.startDate).toBe('2026-09-28')
    expect(todo.endDate).toBe('2026-10-03')
  })

  it('makes a one-sided range a single day', () => {
    const todo = createTodo('Call', { startDate: '2026-09-28' })

    expect(todo.startDate).toBe('2026-09-28')
    expect(todo.endDate).toBe('2026-09-28')
  })

  it('ignores impossible dates', () => {
    const todo = createTodo('Call', { startDate: '2026-02-30', endDate: 'oops' })

    expect(todo.startDate).toBeNull()
    expect(todo.endDate).toBeNull()
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

  it('sets both dates on a rescheduled task', () => {
    const next = todosReducer(makeTodos(), {
      type: 'rescheduled',
      id: 'a',
      startDate: '2026-09-28',
      endDate: '2026-09-30',
    })

    expect(next[0].startDate).toBe('2026-09-28')
    expect(next[0].endDate).toBe('2026-09-30')
  })

  it('does not mutate the previous list when rescheduling', () => {
    const todos = makeTodos()
    const next = todosReducer(todos, {
      type: 'rescheduled',
      id: 'a',
      startDate: '2026-09-28',
      endDate: '2026-09-30',
    })

    expect(next).not.toBe(todos)
    expect(next[0]).not.toBe(todos[0])
    expect(todos[0].startDate).toBeUndefined()
  })

  it('leaves other tasks alone when rescheduling', () => {
    const todos = makeTodos()
    const next = todosReducer(todos, {
      type: 'rescheduled',
      id: 'b',
      startDate: '2026-09-28',
      endDate: '2026-09-30',
    })

    expect(next[0]).toBe(todos[0]) // untouched row keeps its identity
  })

  it('swaps rescheduled dates given the wrong way round', () => {
    const next = todosReducer(makeTodos(), {
      type: 'rescheduled',
      id: 'a',
      startDate: '2026-09-30',
      endDate: '2026-09-28',
    })

    expect(next[0].startDate).toBe('2026-09-28')
    expect(next[0].endDate).toBe('2026-09-30')
  })

  it('clears the dates when rescheduled with empty values', () => {
    const withDates = [
      { ...makeTodos()[0], startDate: '2026-09-28', endDate: '2026-09-30' },
    ]
    const next = todosReducer(withDates, { type: 'rescheduled', id: 'a' })

    expect(next[0].startDate).toBeNull()
    expect(next[0].endDate).toBeNull()
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

  it('gives tasks saved before the calendar existed two null dates', () => {
    const [todo] = sanitizeTodos([{ id: 'a', title: 'Old task' }])

    expect(todo.startDate).toBeNull()
    expect(todo.endDate).toBeNull()
  })

  it('keeps a valid date range', () => {
    const [todo] = sanitizeTodos([
      { id: 'a', title: 'Trip', startDate: '2026-09-28', endDate: '2026-10-03' },
    ])

    expect(todo.startDate).toBe('2026-09-28')
    expect(todo.endDate).toBe('2026-10-03')
  })

  it('repairs a reversed or impossible stored range', () => {
    const [reversed] = sanitizeTodos([
      { id: 'a', title: 'Trip', startDate: '2026-10-03', endDate: '2026-09-28' },
    ])
    expect(reversed.startDate).toBe('2026-09-28')
    expect(reversed.endDate).toBe('2026-10-03')

    const [broken] = sanitizeTodos([
      { id: 'b', title: 'Trip', startDate: '2026-02-30', endDate: 'nonsense' },
    ])
    expect(broken.startDate).toBeNull()
    expect(broken.endDate).toBeNull()
  })

  it('keeps the good half of a partly broken range', () => {
    const [todo] = sanitizeTodos([
      { id: 'a', title: 'Trip', startDate: '2026-09-28', endDate: '2026-13-40' },
    ])

    expect(todo.startDate).toBe('2026-09-28')
    expect(todo.endDate).toBe('2026-09-28')
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
