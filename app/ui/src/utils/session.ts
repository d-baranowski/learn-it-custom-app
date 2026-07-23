import type {Session} from '@gen/core/v1/session_pb';

export const parseSessionStart = (session: Session): Date | undefined => {
  if (!session.date || !session.startTime) return undefined;
  const dt = new Date(`${session.date}T${session.startTime}:00`);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
};

export const parseSessionEnd = (session: Session): Date | undefined => {
  if (!session.date || !session.endTime) return undefined;
  const dt = new Date(`${session.date}T${session.endTime}:00`);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
};

export const durationMinutes = (session: Session): number | undefined => {
  const start = parseSessionStart(session);
  const end = parseSessionEnd(session);
  if (!start || !end) return undefined;
  const diff = Math.round((end.getTime() - start.getTime()) / 60000);
  return diff > 0 ? diff : undefined;
};
