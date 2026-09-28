import { useState } from 'react'
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  formatDate,
  monthGrid,
  shiftMonth,
  todayISO,
  todoRange,
  todosOnDay,
} from '../lib/dates.js'

/** How many task chips fit in a day cell before we collapse the rest. */
const MAX_CHIPS_PER_DAY = 2

/**
 * Where does a task sit relative to one day of its range?
 *
 * The three cases get different styling, which is what makes a multi-day task
 * read as a bar: rounded on its first day, squared off in the middle and
 * rounded again on its last day.
 */
function chipRole(todo, isoDate) {
  const { startDate, endDate } = todoRange(todo)
  if (startDate === endDate) return 'single'
  if (isoDate === startDate) return 'start'
  if (isoDate === endDate) return 'end'
  return 'middle'
}

/**
 * A month view of every dated task.
 *
 * Each day is a real <button>, so the whole grid is keyboard and screen-reader
 * accessible without any extra work. Clicking a day selects it (click again to
 * clear), and App uses that to filter the list underneath.
 */
export default function Calendar({ todos, selectedDay, onSelectDay }) {
  // Which month is on screen. Kept here because nothing outside needs it.
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const today = todayISO()
  const weeks = monthGrid(cursor.year, cursor.month)

  function shift(amount) {
    const next = shiftMonth(new Date(cursor.year, cursor.month, 1), amount)
    setCursor({ year: next.getFullYear(), month: next.getMonth() })
  }

  function goToToday() {
    const now = new Date()
    setCursor({ year: now.getFullYear(), month: now.getMonth() })
  }

  return (
    <section className="calendar" aria-label="Task calendar">
      <div className="calendar__header">
        <h2 className="calendar__month">
          {MONTH_LABELS[cursor.month]} {cursor.year}
        </h2>
        <div className="calendar__nav">
          <button
            type="button"
            className="calendar__nav-button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            className="calendar__nav-button"
            onClick={goToToday}
          >
            Today
          </button>
          <button
            type="button"
            className="calendar__nav-button"
            onClick={() => shift(1)}
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="calendar__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="calendar__weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="calendar__grid">
        {weeks.flat().map((day) => {
          const dayTodos = todosOnDay(todos, day.iso)
          const shown = dayTodos.slice(0, MAX_CHIPS_PER_DAY)
          const hiddenCount = dayTodos.length - shown.length

          const classes = ['calendar__day']
          if (!day.inMonth) classes.push('calendar__day--outside')
          if (day.isWeekend) classes.push('calendar__day--weekend')
          if (day.iso === today) classes.push('calendar__day--today')
          if (day.iso === selectedDay) classes.push('calendar__day--selected')
          if (dayTodos.length > 0) classes.push('calendar__day--busy')

          return (
            <button
              key={day.iso}
              type="button"
              className={classes.join(' ')}
              aria-pressed={day.iso === selectedDay}
              aria-label={`${formatDate(day.iso)}, ${dayTodos.length} ${
                dayTodos.length === 1 ? 'task' : 'tasks'
              }`}
              onClick={() =>
                onSelectDay(day.iso === selectedDay ? null : day.iso)
              }
            >
              <span className="calendar__day-number">{day.dayOfMonth}</span>
              <span className="calendar__chips">
                {shown.map((todo) => (
                  <span
                    key={todo.id}
                    className={`calendar__chip calendar__chip--${chipRole(
                      todo,
                      day.iso,
                    )}${todo.completed ? ' calendar__chip--done' : ''}`}
                    title={todo.title}
                  >
                    {todo.title}
                  </span>
                ))}
                {hiddenCount > 0 && (
                  <span className="calendar__more">+{hiddenCount} more</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <p className="calendar__legend">
        <span className="calendar__legend-item">
          <span className="calendar__legend-swatch calendar__chip--start" />
          starts
        </span>
        <span className="calendar__legend-item">
          <span className="calendar__legend-swatch calendar__chip--middle" />
          lasts all day
        </span>
        <span className="calendar__legend-item">
          <span className="calendar__legend-swatch calendar__chip--end" />
          ends
        </span>
        <span className="calendar__legend-item">
          <span className="calendar__legend-swatch calendar__legend-swatch--today" />
          today
        </span>
      </p>
    </section>
  )
}