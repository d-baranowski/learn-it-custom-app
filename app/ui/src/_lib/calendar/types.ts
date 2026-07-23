export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  displayAbbreviation?: string;
  displayColor?: string;
  displayName?: string;
  roomId?: string;
  isOnline?: boolean;
  cancelledAt?: number;
}

export interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  fromTime: string;
  tillTime: string;
}

export interface AbsenceSlot {
  id: string;
  fromTime: number;
  tillTime: number;
  reason?: string;
}

export interface ResourceMap {
  resourceId: string;
  resourceTitle: string;
  displayAbbreviation?: string;
  displayColor?: string;
  availabilitySlots?: AvailabilitySlot[];
  absenceSlots?: AbsenceSlot[];
}
