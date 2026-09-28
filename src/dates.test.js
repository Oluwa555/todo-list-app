import { describe, expect, it } from 'vitest'
import {
  addDays,
  describeDay,
  formatDate,
  formatDateRange,
  isOverdue,
  isValidISODate,
  monthGrid,
  normalizeRange,
  parseISODate,
  rangeLengthDays,
  sanitizeDay,
  shiftMonth,
  toISODate,
  todayISO,
  todoOccursOn,
  todoRange,
  todosOnDay,
} from './lib/dates.js'

/** Build the string form of a local date without going through the helpers. */
function isoOf(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

describe('toISODate / todayISO', () => {
  it('formats using the local calendar day, not UTC', () => {
    // 1 Jan 2026 00:30 local. In any timezone behind UTC this is still 31 Dec
    // in UTC, which is exactly the bug this helper exists to avoid.
    expect(toISODate(new Date(2026, 0, 1, 0, 30))).toBe('2026-01-01')
    // 31 Dec 2026 23:30 local is already 1 Jan in UTC for timezones ahead.
    expect(toISODate(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31')
  })

  it('zero pads months and days', () => {
    expect(toISODate(new Date(2026, 2, 5))).toBe('2026-03-05')
  })

  it('todayISO matches a locally built date', () => {
    const now = new Date()
    expect(todayISO()).toBe(isoOf(now.getFullYear(), now.getMonth() + 1, now.getDate()))
  })
})

describe('parseISODate / isValidISODate', () => {
  it('parses a real date to local midnight', () => {
    const date = parseISODate('2026-09-28')

    expect(date).not.toBeNull()
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(8)
    expect(date.getDate()).toBe(28)
    expect(date.getHours()).toBe(0)
  })

  it('rejects impossible calendar dates instead of rolling them over', () => {
    // `new Date(2026, 1, 30)` silently becomes 2 March.
    expect(isValidISODate('2026-02-30')).toBe(false)
    expect(isValidISODate('2026-04-31')).toBe(false)
    expect(isValidISODate('2026-13-01')).toBe(false)
    expect(isValidISODate('2026-00-10')).toBe(false)
    expect(isValidISODate('2026-01-00')).toBe(false)
  })

  it('handles leap years correctly', () => {
    expect(isValidISODate('2024-02-29')).toBe(true) // leap
    expect(isValidISODate('2023-02-29')).toBe(false) // not leap
    expect(isValidISODate('2000-02-29')).toBe(true) // divisible by 400
    expect(isValidISODate('1900-02-29')).toBe(false) // divisible by 100 only
  })

  it('rejects wrong shapes and types', () => {
    expect(isValidISODate('2026-9-28')).toBe(false) // not zero padded
    expect(isValidISODate('28/09/2026')).toBe(false)
    expect(isValidISODate('')).toBe(false)
    expect(isValidISODate(null)).toBe(false)
    expect(isValidISODate(undefined)).toBe(false)
    expect(isValidISODate(20260928)).toBe(false)
    expect(isValidISODate(new Date())).toBe(false)
  })

  it('rejects years that Date would remap into the 1900s', () => {
    expect(isValidISODate('0026-01-01')).toBe(false)
  })
})

describe('normalizeRange', () => {
  it('keeps a well formed range', () => {
    expect(normalizeRange('2026-09-28', '2026-10-03')).toEqual({
      startDate: '2026-09-28',
      endDate: '2026-10-03',
    })
  })

  it('swaps a reversed range so start is never after end', () => {
    expect(normalizeRange('2026-10-03', '2026-09-28')).toEqual({
      startDate: '2026-09-28',
      endDate: '2026-10-03',
    })
  })

  it('turns a one sided range into a single day', () => {
    expect(normalizeRange('2026-09-28', '')).toEqual({
      startDate: '2026-09-28',
      endDate: '2026-09-28',
    })
    expect(normalizeRange(null, '2026-09-28')).toEqual({
      startDate: '2026-09-28',
      endDate: '2026-09-28',
    })
  })

  it('returns two nulls when there is nothing usable', () => {
    expect(normalizeRange('', '')).toEqual({ startDate: null, endDate: null })
    expect(normalizeRange('nonsense', '2026-02-30')).toEqual({
      startDate: null,
      endDate: null,
    })
    expect(normalizeRange(undefined, undefined)).toEqual({
      startDate: null,
      endDate: null,
    })
  })

  it('discards only the broken half of a pair', () => {
    expect(normalizeRange('2026-09-28', '2026-02-30')).toEqual({
      startDate: '2026-09-28',
      endDate: '2026-09-28',
    })
  })
describe('todoOccursOn / todosOnDay', () => {
  const spanning = {
    id: 'a',
    title: 'Trip',
    startDate: '2026-09-28',
    endDate: '2026-09-30',
  }
  const single = {
    id: 'b',
    title: 'Call',
    startDate: '2026-09-29',
    endDate: '2026-09-29',
  }
  const undated = { id: 'c', title: 'Someday', startDate: null, endDate: null }

  it('includes both end days of a range', () => {
    expect(todoOccursOn(spanning, '2026-09-28')).toBe(true) // first
    expect(todoOccursOn(spanning, '2026-09-29')).toBe(true) // middle
    expect(todoOccursOn(spanning, '2026-09-30')).toBe(true) // last
  })

  it('excludes the days either side of a range', () => {
    expect(todoOccursOn(spanning, '2026-09-27')).toBe(false)
    expect(todoOccursOn(spanning, '2026-10-01')).toBe(false)
  })

  it('matches a single-day task on that day only', () => {
    expect(todoOccursOn(single, '2026-09-29')).toBe(true)
    expect(todoOccursOn(single, '2026-09-28')).toBe(false)
  })

  it('never matches a task with no dates', () => {
    expect(todoOccursOn(undated, '2026-09-29')).toBe(false)
  })

  it('returns false for an invalid day instead of throwing', () => {
    expect(todoOccursOn(spanning, 'not-a-date')).toBe(false)
    expect(todoOccursOn(spanning, null)).toBe(false)
  })

  it('works when a range spans a month boundary', () => {
    const crossMonth = { startDate: '2026-09-30', endDate: '2026-10-02' }
    expect(todoOccursOn(crossMonth, '2026-09-30')).toBe(true)
    expect(todoOccursOn(crossMonth, '2026-10-01')).toBe(true)
    expect(todoOccursOn(crossMonth, '2026-10-02')).toBe(true)
    expect(todoOccursOn(crossMonth, '2026-11-01')).toBe(false)
  })

  it('selects every task on a day, in list order', () => {
    const found = todosOnDay([spanning, single, undated], '2026-09-29')
    expect(found.map((todo) => todo.id)).toEqual(['a', 'b'])
  })

  it('tolerates a non-array list', () => {
    expect(todosOnDay(null, '2026-09-29')).toEqual([])
  })
})

describe('todoRange', () => {
  it('is safe on a missing task', () => {
    expect(todoRange(null)).toEqual({ startDate: null, endDate: null })
    expect(todoRange(undefined)).toEqual({ startDate: null, endDate: null })
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(toISODate(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01')
    expect(toISODate(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01')
    expect(toISODate(addDays(new Date(2026, 0, 1), -1))).toBe('2025-12-31')
  })

  it('lands on 29 February in a leap year', () => {
    expect(toISODate(addDays(new Date(2024, 1, 28), 1))).toBe('2024-02-29')
  })

  it('steps over a daylight saving change without drifting', () => {
    // Whatever the timezone, one day forward is the next calendar day.
    let date = new Date(2026, 2, 7)
    for (let i = 0; i < 5; i += 1) date = addDays(date, 1)

    expect(toISODate(date)).toBe('2026-03-12')
  })
})

describe('shiftMonth', () => {
  it('moves forward and backward', () => {
    expect(toISODate(shiftMonth(new Date(2026, 8, 28), 1))).toBe('2026-10-01')
    expect(toISODate(shiftMonth(new Date(2026, 0, 15), -1))).toBe('2025-12-01')
  })

  it('wraps across a year boundary', () => {
    expect(toISODate(shiftMonth(new Date(2026, 11, 31), 1))).toBe('2027-01-01')
  })

  it('does not skip February when starting from the 31st', () => {
    // Plain date arithmetic would turn 31 Jan + 1 month into 3 March.
    expect(toISODate(shiftMonth(new Date(2026, 0, 31), 1))).toBe('2026-02-01')
  })
})
describe('monthGrid', () => {
  it('always returns six rows of seven days', () => {
    const weeks = monthGrid(2026, 8)
    expect(weeks).toHaveLength(6)
    weeks.forEach((week) => expect(week).toHaveLength(7))
  })

  it('starts each week on a Sunday', () => {
    const firstDay = monthGrid(2026, 8)[0][0]
    expect(parseISODate(firstDay.iso).getDay()).toBe(0)
  })

  it('starts on or before the 1st of the month', () => {
    const days = monthGrid(2026, 8).flat() // September 2026
    const isos = days.map((day) => day.iso)

    expect(isos).toContain('2026-09-01')
    expect(isos).toContain('2026-09-30')
    expect(isos.indexOf('2026-09-01')).toBeLessThan(7)
  })

  it('marks only the requested month as inMonth', () => {
    const inMonth = monthGrid(2026, 8)
      .flat()
      .filter((day) => day.inMonth)

    expect(inMonth).toHaveLength(30) // September has 30 days
    expect(inMonth.every((day) => day.iso.startsWith('2026-09'))).toBe(true)
  })

  it('handles 31 day months and February', () => {
    expect(monthGrid(2026, 0).flat().filter((day) => day.inMonth)).toHaveLength(31)
    expect(monthGrid(2026, 1).flat().filter((day) => day.inMonth)).toHaveLength(28)
    expect(monthGrid(2024, 1).flat().filter((day) => day.inMonth)).toHaveLength(29)
  })

  it('covers a month whose 1st is a Saturday', () => {
    // August 2026 starts on a Saturday: 6 leading days + 31 = 37, inside 42.
    const days = monthGrid(2026, 7).flat()
    expect(days).toHaveLength(42)
    expect(days.map((day) => day.iso)).toContain('2026-08-31')
  })

  it('marks weekends', () => {
    const days = monthGrid(2026, 8).flat()
    expect(days.find((day) => day.iso === '2026-09-26').isWeekend).toBe(true) // Saturday
    expect(days.find((day) => day.iso === '2026-09-25').isWeekend).toBe(false)
  })
})

describe('formatDate / formatDateRange', () => {
  it('formats a day without a leading zero', () => {
    expect(formatDate('2026-09-28')).toBe('28 Sep 2026')
    expect(formatDate('2026-01-05')).toBe('5 Jan 2026')
  })

  it('returns an empty string for invalid input', () => {
    expect(formatDate('2026-02-30')).toBe('')
    expect(formatDate('')).toBe('')
  })

  it('shows a single date for a one-day task', () => {
    const single = { startDate: '2026-09-28', endDate: '2026-09-28' }
    expect(formatDateRange(single)).toBe('28 Sep 2026')
  })

  it('shows both ends for a multi-day task', () => {
    const multi = { startDate: '2026-09-28', endDate: '2026-10-03' }
    expect(formatDateRange(multi)).toBe('28 Sep 2026 → 3 Oct 2026')
  })

  it('shows nothing for an undated task', () => {
    expect(formatDateRange({})).toBe('')
  })
})

describe('rangeLengthDays', () => {
  it('counts both end days', () => {
    expect(rangeLengthDays({ startDate: '2026-09-28', endDate: '2026-09-28' })).toBe(1)
    expect(rangeLengthDays({ startDate: '2026-09-28', endDate: '2026-09-30' })).toBe(3)
  })

  it('counts across a month boundary', () => {
    expect(rangeLengthDays({ startDate: '2026-09-30', endDate: '2026-10-02' })).toBe(3)
  })

  it('is 0 for an undated task', () => {
    expect(rangeLengthDays({})).toBe(0)
  })
})

describe('describeDay', () => {
  it('names the days around a reference date', () => {
    expect(describeDay('2026-09-28', '2026-09-28')).toBe('Today')
    expect(describeDay('2026-09-29', '2026-09-28')).toBe('Tomorrow')
    expect(describeDay('2026-09-27', '2026-09-28')).toBe('Yesterday')
  })

  it('is empty for any other day', () => {
    expect(describeDay('2026-09-25', '2026-09-28')).toBe('')
  })

  it('works across a month boundary', () => {
    expect(describeDay('2026-10-01', '2026-09-30')).toBe('Tomorrow')
    expect(describeDay('2026-09-30', '2026-10-01')).toBe('Yesterday')
  })

  it('is empty for invalid input', () => {
    expect(describeDay('nonsense', '2026-09-28')).toBe('')
    expect(describeDay('2026-09-28', 'nonsense')).toBe('')
  })
})

describe('isOverdue', () => {
  it('is true when an unfinished task ended before the reference day', () => {
    const past = { completed: false, startDate: '2026-09-01', endDate: '2026-09-10' }
    expect(isOverdue(past, '2026-09-28')).toBe(true)
  })

  it('is false while the last day is still today', () => {
    const dueToday = { completed: false, startDate: '2026-09-28', endDate: '2026-09-28' }
    expect(isOverdue(dueToday, '2026-09-28')).toBe(false)
  })

  it('is false for a completed task', () => {
    const done = { completed: true, startDate: '2026-09-01', endDate: '2026-09-10' }
    expect(isOverdue(done, '2026-09-28')).toBe(false)
  })

  it('is false for a task with no dates', () => {
    expect(isOverdue({ completed: false }, '2026-09-28')).toBe(false)
  })
})

describe('sanitizeDay', () => {
  it('keeps a valid date and nulls anything else', () => {
    expect(sanitizeDay('2026-09-28')).toBe('2026-09-28')
    expect(sanitizeDay('2026-02-30')).toBeNull()
    expect(sanitizeDay('')).toBeNull()
    expect(sanitizeDay(null)).toBeNull()
    expect(sanitizeDay(42)).toBeNull()
  })
})
})