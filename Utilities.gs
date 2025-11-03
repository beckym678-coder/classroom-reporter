/**
 * Converts a Classroom API date/time pair into a JavaScript Date.
 *
 * @param {Object} date {year, month, day}
 * @param {Object} [time] {hours, minutes, seconds}
 * @return {Date}
 */
function toDateTime(date, time) {
  if (!date) {
    throw new Error('Date is required');
  }
  const hours = time && time.hours ? time.hours : 0;
  const minutes = time && time.minutes ? time.minutes : 0;
  const seconds = time && time.seconds ? time.seconds : 0;
  return new Date(Date.UTC(date.year, date.month - 1, date.day, hours, minutes, seconds));
}

/**
 * Returns the Date representing the end of the provided day in UTC.
 *
 * @param {string} isoDate Date string (YYYY-MM-DD).
 * @return {Date}
 */
function endOfDay(isoDate) {
  const date = new Date(isoDate);
  return new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Formats a Date object to YYYY-MM-DD string.
 *
 * @param {Date} date Date to format.
 * @return {string}
 */
function formatDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Formats date/time for UI display.
 *
 * @param {Date} date Date to format.
 * @return {string}
 */
function formatDisplayDate(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM d, yyyy');
}
