import { Session } from '@gen/core/v1/session_pb';
import { CalendarEvent } from './types';

/**
 * Builds an optimistic CalendarEvent from a freshly saved session. Server-derived
 * display fields (colour, abbreviation) are only partially known here — the caller
 * refetches afterwards to fill them in.
 */
export function sessionToCalendarEvent(
  session: Session,
  resourceId: string,
  display: { displayName?: string; displayAbbreviation?: string }
): CalendarEvent {
  return {
    id: session.id,
    title: session.therapyLabel ?? '',
    start: new Date(`${session.date}T${session.startTime}`),
    end: new Date(`${session.date}T${session.endTime}`),
    resourceId,
    displayName: display.displayName,
    displayAbbreviation: display.displayAbbreviation,
    roomId: session.roomId,
    isOnline: !session.roomId,
  };
}
