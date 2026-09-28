/**
 * Pure date helpers for the calendar and task date ranges.
 *
 * Like `todos.js`, nothing here imports React or touches the DOM, so every rule
 * below can be unit tested with plain Node.
 *
 * Dates are stored as ISO calendar strings ("YYYY-MM-DD") rather than Date
 * objects or timestamps, for three reasons:
 *
 *   1. `JSON.stringify` writes them straight to localStorage, no conversion.
 *   2. "YYYY-MM-DD" strings compare correctly with `<` and `>` (they are fixed
 *      width and zero padded), so ranges need no parsing.
 *   3. They describe a calendar day, not an instant, so there is no timezone to
 *      get wrong. `new Date().toISOString().slice(0, 10)` would be a bug here:
 *      it returns the UTC day, which is already "tomorrow" for anyone east of
 *      Greenwich late in the evening.
 */

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const SHORT_MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Format a Date as "YYYY-MM-DD" using the LOCAL calendar day. */
export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Today, as a local ISO calendar date. */
export function todayISO() {
  return toISODate(new Date())
}

/**
 * Turn "YYYY-MM-DD" into a Date at local midnight, or `null` if the string is
 * not a real calendar date.
 *
 * We check the pieces afterwards because JavaScript rolls invalid dates over
 * silently: `new Date(2026, 1, 30)` (30 February) becomes 2 March rather than
 * failing, so a range could quietly shift by days.
 */
export function parseISODate(value) {
  if (typeof value !== 'string' || !ISO_PATTERN.test(value)) return null

  const [year, month, day] = value.split('-').map(Number)

  // `new Date(26, ...)` would be interpreted as 1926, so insist on a real year.
  if (year < 1000) return null

  const date = new Date(year, month - 1, day)

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

/** Is this a real calendar date in "YYYY-MM-DD" form? */
export function isValidISODate(value) {
  return parseISODate(value) !== null
}
/**
 * Clean up a start/end pair.
 *
 * - missing or impossible values become `null`
 * - a one-sided range becomes a single-day range
 * - a reversed range is swapped, so `startDate <= endDate` is always true
 */
export function normalizeRange(startDate, endDate) {
  const start = isValidISODate(startDate) ? startDate : null
  const end = isValidISODate(endDate) ? endDate : null

  if (start === null && end === null) return { startDate: null, endDate: null }
  if (start === null) return { startDate: end, endDate: end }
  if (end === null) return { startDate: start, endDate: start }

  return start <= end
    ? { startDate: start, endDate: end }
    : { startDate: end, endDate: start }
}

/** The cleaned-up range of a task. Tasks without dates return two `null`s. */
export function todoRange(todo) {
  return normalizeRange(todo?.startDate, todo?.endDate)
}

/** Does this task happen on the given day? Untimed tasks never do. */
export function todoOccursOn(todo, isoDate) {
  if (!isValidISODate(isoDate)) return false

  const { startDate, endDate } = todoRange(todo)
  if (startDate === null) return false

  // Safe as a plain string comparison because of the fixed-width format.
  return startDate <= isoDate && isoDate <= endDate
}

/** Every task that covers the given day, in list order. */
export function todosOnDay(todos, isoDate) {
  if (!Array.isArray(todos)) return []
  return todos.filter((todo) => todoOccursOn(todo, isoDate))
}

/**
 * Add (or subtract) whole days.
 *
 * Deliberately rebuilds the date from its parts instead of adding 86 400 000 ms
 * to a timestamp: on the day a clock changes, a "day" is only 23 or 25 hours
 * long, and millisecond maths drifts onto the wrong date.
 */
export function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount)
}

/** Move `amount` months away, always landing on the 1st of the target month. */
export function shiftMonth(date, amount) {
  // Pinning to the 1st avoids overflow: 31 January + 1 month would otherwise
  // become 3 March, skipping February entirely.
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

/**
 * The 6x7 block of days to draw for a month.
 *
 * Always six weeks so the grid never changes height as you page through months,
 * and the first row starts on the Sunday on or before the 1st.
 */
export function monthGrid(year, month) {
  const first = new Date(year, month, 1)
  const gridStart = addDays(first, -first.getDay())

  const weeks = []
  for (let week = 0; week < 6; week += 1) {
    const days = []
    for (let day = 0; day < 7; day += 1) {
      const date = addDays(gridStart, week * 7 + day)
      const weekday = date.getDay()
      days.push({
        iso: toISODate(date),
        dayOfMonth: date.getDate(),
        inMonth: date.getFullYear() === year && date.getMonth() === month,
        isWeekend: weekday === 0 || weekday === 6,
      })
    }
    weeks.push(days)
  }

  return weeks
}

/** "28 Sep 2026" — spelled out here so the output is predictable in tests. */
export function formatDate(isoDate) {
  const date = parseISODate(isoDate)
  if (date === null) return ''
  return `${date.getDate()} ${SHORT_MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
}

/** "28 Sep 2026" for one day, or "28 Sep 2026 -> 3 Oct 2026" for a range. */
export function formatDateRange(todo) {
  const { startDate, endDate } = todoRange(todo)
  if (startDate === null) return ''
  if (startDate === endDate) return formatDate(startDate)
  return `${formatDate(startDate)} → ${formatDate(endDate)}`
}

/** How many days a range covers, counting both ends. 0 when it has no dates. */
export function rangeLengthDays(todo) {
  const { startDate, endDate } = todoRange(todo)
  if (startDate === null) return 0

  const start = parseISODate(startDate)
  const end = parseISODate(endDate)

  // Round rather than divide exactly, because a range crossing a daylight
  // saving change is 23 or 25 hours long for one of its days.
  return Math.round((end - start) / MS_PER_DAY) + 1
}

/** "Today" / "Tomorrow" / "Yesterday", or "" when it is none of them. */
export function describeDay(isoDate, reference = todayISO()) {
  if (!isValidISODate(isoDate) || !isValidISODate(reference)) return ''
  if (isoDate === reference) return 'Today'

  const referenceDate = parseISODate(reference)
  if (toISODate(addDays(referenceDate, 1)) === isoDate) return 'Tomorrow'
  if (toISODate(addDays(referenceDate, -1)) === isoDate) return 'Yesterday'

  return ''
}

/** An unfinished task whose last day has already passed. */
export function isOverdue(todo, reference = todayISO()) {
  if (todo?.completed === true) return false

  const { endDate } = todoRange(todo)
  if (endDate === null) return false

  return endDate < reference
}

/** Keep a stored day value only if it is still a real date. */
export function sanitizeDay(value) {
  return isValidISODate(value) ? value : null
}