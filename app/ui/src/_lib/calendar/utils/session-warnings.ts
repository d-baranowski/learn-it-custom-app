import { CalendarEvent, AvailabilitySlot, AbsenceSlot } from '~/_lib/calendar/types';
import moment from 'moment';

/**
 * Check if a session falls outside of therapist working hours
 * 
 * Working hours are defined by weekly recurring time slots with a specific day of week and time range.
 * 
 * Design decision: If no working hours are defined for a therapist, we don't show a warning.
 * This is to avoid false positives for therapists who haven't configured their working hours yet.
 * Absence periods (which are explicit) will still trigger warnings when appropriate.
 * 
 * @param event - The calendar event representing the session
 * @param availabilitySlots - Array of working hours slots for the therapist
 *                            dayOfWeek uses ISO weekday format: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
 * @returns true if the session is outside working hours, false otherwise
 */
export function isSessionOutsideWorkingHours(
  event: CalendarEvent,
  availabilitySlots: AvailabilitySlot[]
): boolean {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    // No working hours constraints defined - don't show warning
    // This avoids false positives for therapists without configured schedules
    return false;
  }

  const sessionStart = moment(event.start);
  const sessionEnd = moment(event.end);
  // ISO weekday: 1 = Monday, 2 = Tuesday, ..., 7 = Sunday
  const dayOfWeek = sessionStart.isoWeekday();

  // Filter working hours slots for this specific day of the week
  const dayWorkingHours = availabilitySlots.filter(
    (slot) => slot.dayOfWeek === dayOfWeek
  );

  if (dayWorkingHours.length === 0) {
    // No working hours defined for this day of the week
    return true;
  }

  // Check if the session time falls within any working hours slot for this day
  const sessionStartTime = sessionStart.format('HH:mm:ss');
  const sessionEndTime = sessionEnd.format('HH:mm:ss');

  for (const slot of dayWorkingHours) {
    // Check if session falls completely within this working hours slot
    if (sessionStartTime >= slot.fromTime && sessionEndTime <= slot.tillTime) {
      return false; // Session is within working hours
    }
  }

  return true; // Session is outside all working hours slots
}

/**
 * Check if a session falls within a therapist absence period
 * 
 * Absence periods are specific date/time ranges when the therapist is not available.
 * 
 * @param event - The calendar event representing the session
 * @param absenceSlots - Array of absence periods for the therapist (timestamps in milliseconds)
 * @returns true if the session overlaps with any absence period, false otherwise
 */
export function isSessionWithinAbsence(
  event: CalendarEvent,
  absenceSlots: AbsenceSlot[]
): boolean {
  if (!absenceSlots || absenceSlots.length === 0) {
    return false;
  }

  const sessionStart = moment(event.start);
  const sessionEnd = moment(event.end);

  // Check if session overlaps with any absence period
  for (const absence of absenceSlots) {
    const absenceStart = moment(absence.fromTime); // fromTime is a timestamp in milliseconds
    const absenceEnd = moment(absence.tillTime); // tillTime is a timestamp in milliseconds

    // Check for overlap: session starts before absence ends AND session ends after absence starts
    if (sessionStart.isBefore(absenceEnd) && sessionEnd.isAfter(absenceStart)) {
      return true;
    }
  }

  return false;
}
/**
 * Check if a session has no room assigned
 * 
 * @param event - The calendar event representing the session
 * @returns true if the session has no room assigned, false otherwise
 */
export function isSessionMissingRoom(event: CalendarEvent): boolean {
  return !event.roomId || event.roomId === '';
}
