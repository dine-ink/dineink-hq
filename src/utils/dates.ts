/**
 * Date-input helpers for filters over historical data.
 *
 * `toISOString().slice(0, 10)` is the UTC date, which in India is yesterday
 * until 05:30. These build the string from local components so a filter's
 * "today" matches the calendar on the wall.
 */

/** Today as the "YYYY-MM-DD" a `<input type="date">` wants, in local time. */
export const todayISO = (now: Date = new Date()): string => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * A date typed or picked for a historical filter, pulled back to today if it
 * is later. The `max` attribute stops the picker offering future days, but a
 * typed value still lands in state, so the handler clamps too. Blank stays
 * blank (it means "no bound").
 */
export const clampToToday = (value: string, now: Date = new Date()): string => {
  if (!value) return value;
  const today = todayISO(now);
  return value > today ? today : value;
};
