import React, {useContext, useMemo} from 'react';
import {DateLocalizer, Navigate, ViewProps} from 'react-big-calendar';
import {Box, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import moment from 'moment';
import {useTranslation} from 'react-i18next';
import {CalendarEvent, ResourceMap} from "~/_lib/calendar/types";
import {ResourceDataContext} from "~/_lib/calendar/components/ResourceDataContext";

// Type for time slots
type TimeSlot = {
  startTime: string;
  endTime: string;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

// Day names for translation lookup
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Border colors
const BORDER_COLOR_DARK = 'black'; // Between day groups
const BORDER_COLOR_LIGHT = '#e0e0e0'; // Between cells

// Virtual resource ID used for online sessions in the room calendar
const ONLINE_RESOURCE_ID = 'online';

// Generate time slots from 7:00 to 22:00 (50-minute slots matching the requirements)
const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let hour = 7; hour <= 21; hour++) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
    slots.push({
      startTime,
      endTime,
      label: `${startTime.substring(0, 2)}`,
      startHour: hour,
      startMinute: 0,
      endHour: hour + 1,
      endMinute: 0,
    });
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

/**
 * CompactView component for react-big-calendar
 * Displays a compact table layout with days as column groups, resources as columns within each day,
 * and time slots as rows showing event abbreviations
 */
export default function CompactView(props: ViewProps) {
  const {
    date,
    localizer,
    events = [],
    resources = [],
  } = props;

  const {i18n, t} = useTranslation();
  const locale = i18n.language || 'en';

  // Get event handlers from context
  const {handleDoubleClickEvent, handleSlotCreate, onContextMenuEvent} = useContext(ResourceDataContext);

  // Get week range for current date
  const currRange = CompactView.range(date as Date, {localizer});

  // Type resources to ResourceMap[]
  const typedResources = resources as ResourceMap[];

  // Enable horizontal scrolling only when there are too many resources to comfortably fit on
  // a laptop screen (threshold: 10). Below that limit the table uses a fixed layout that
  // distributes all columns evenly across the full viewport width with compact cells.
  const resourceCount = typedResources.length;
  const shouldScroll = resourceCount > 10;
  // Non-scrolling: small cells so the fixed layout can fit up to ~10 resources per day on
  // a standard 1366px laptop screen without horizontal scrolling.
  // Scrolling: wider cells for readability when there are many resources.
  const minCellWidth = shouldScroll ? 80 : 20;
  const maxCellWidth = shouldScroll ? 120 : 60;

  // Time column width: narrower in non-scrolling mode to free up space for resource columns
  const timeColumnMinWidth = shouldScroll ? '80px' : '50px';

  // Helper function to find events for a specific resource, day, and time slot
  // Note: This performs a linear search through all events for each slot.
  // Performance optimization opportunity: Create an index map of events by resourceId and day
  // for O(1) lookups instead of O(n) per slot. For typical use cases (week view with reasonable
  // event counts), current implementation is acceptable and keeps code simple.
  const getEventForSlot = useMemo(() => {
    return (resourceId: string, day: Date, slot: TimeSlot): CalendarEvent | null => {
    const slotStart = moment(day).hour(slot.startHour).minute(slot.startMinute).second(0);
    const slotEnd = moment(day).hour(slot.endHour).minute(slot.endMinute).second(0);

    // Find events that overlap with this time slot
    const matchingEvents = (events as CalendarEvent[]).filter(event => {
      if (event.resourceId !== resourceId) return false;

      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);

      // Check if event overlaps with this time slot
      return eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
    });

    // Return the first matching event (if any)
    return matchingEvents.length > 0 ? matchingEvents[0] : null;
    };
  }, [events]);

  // Helper to return ALL events for a resource, day, and time slot (used for the Online column)
  const getEventsForSlot = useMemo(() => {
    return (resourceId: string, day: Date, slot: TimeSlot): CalendarEvent[] => {
      const slotStart = moment(day).hour(slot.startHour).minute(slot.startMinute).second(0);
      const slotEnd = moment(day).hour(slot.endHour).minute(slot.endMinute).second(0);

      return (events as CalendarEvent[]).filter(event => {
        if (event.resourceId !== resourceId) return false;
        const eventStart = moment(event.start);
        const eventEnd = moment(event.end);
        return eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
      });
    };
  }, [events]);

  return (
    <Box
      sx={{
        marginTop: 1,
        paddingRight: 1,
        height: '100%',
        overflowX: shouldScroll ? 'auto' : 'hidden',
        overflowY: 'auto',
      }}
    >
      <TableContainer component={Paper}>
        <Table
          size="small"
          sx={{
            minWidth: shouldScroll ? 'auto' : 650,
            width: shouldScroll ? 'max-content' : '100%',
            tableLayout: shouldScroll ? 'auto' : 'fixed',
            borderCollapse: 'collapse',
            '& .MuiTableCell-root': {
              boxSizing: 'border-box',
            }
          }}
        >
          <TableHead>
            {/* First row: Day names with dates */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: timeColumnMinWidth, boxSizing: 'border-box' }}></TableCell>
              {currRange.map((day, dayIndex) => {
                // Get day name using translation key instead of moment locale
                const dayOfWeek = moment(day).day();
                const dayName = t(DAY_NAMES[dayOfWeek]).toUpperCase();
                const dateStr = moment(day).format('DD.MM');
                return (
                  <TableCell
                    key={dayIndex}
                    colSpan={typedResources.length}
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      borderLeft: dayIndex > 0 ? `2px solid ${BORDER_COLOR_DARK}` : 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {dayName} {dateStr}
                  </TableCell>
                );
              })}
            </TableRow>

            {/* Second row: Resource abbreviations */}
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold',  minWidth: timeColumnMinWidth, boxSizing: 'border-box', textAlign:  "center"}}>
              </TableCell>
              {currRange.map((day, dayIndex) => (
                typedResources.map((resource, resourceIndex) => {
                  // Determine border style: black between days, gray between resources, none on first column
                  let borderLeft = 'none';
                  if (dayIndex > 0 && resourceIndex === 0) {
                    borderLeft = `2px solid ${BORDER_COLOR_DARK}`;
                  } else if (dayIndex > 0 || resourceIndex > 0) {
                    borderLeft = `1px solid ${BORDER_COLOR_LIGHT}`;
                  }

                  return (
                    <TableCell
                      key={`${dayIndex}-${resourceIndex}`}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        fontSize: '0.85em',
                        borderLeft,
                        boxSizing: 'border-box',
                        minWidth: `${minCellWidth}px`,
                        maxWidth: `${maxCellWidth}px`,
                        width: shouldScroll ? `${minCellWidth}px` : 'auto',
                      }}
                    >
                      {resource.displayAbbreviation ? (
                        <Tooltip title={resource.resourceTitle} arrow>
                          <span>
                            {resource.resourceId === ONLINE_RESOURCE_ID && !shouldScroll
                              ? resource.displayAbbreviation.charAt(0)
                              : resource.displayAbbreviation}
                          </span>
                        </Tooltip>
                      ) : (
                        resource.resourceTitle
                      )}
                    </TableCell>
                  );
                })
              ))}
            </TableRow>
          </TableHead>
          <TableBody style={{ overflowY: 'scroll'  }}>
            {/* Time slot rows */}
            {TIME_SLOTS.map((slot, slotIndex) => (
              <TableRow key={slotIndex}>
                <TableCell sx={{ fontWeight: 'bold', fontSize: '0.7em', boxSizing: 'border-box' }}>
                  {slot.label}
                </TableCell>
                {currRange.map((day, dayIndex) => (
                  typedResources.map((resource, resourceIndex) => {
                    const isOnlineResource = resource.resourceId === ONLINE_RESOURCE_ID;
                    const event = isOnlineResource ? null : getEventForSlot(resource.resourceId, day, slot);
                    const onlineEvents = isOnlineResource ? getEventsForSlot(resource.resourceId, day, slot) : [];

                    // Determine border style: black between days, gray between resources, none on first column
                    let borderLeft = 'none';
                    if (dayIndex > 0 && resourceIndex === 0) {
                      borderLeft = `2px solid ${BORDER_COLOR_DARK}`;
                    } else if (dayIndex > 0 || resourceIndex > 0) {
                      borderLeft = `1px solid ${BORDER_COLOR_LIGHT}`;
                    }

                    // Create SlotInfo for empty slot create button
                    const slotStart = moment(day).hour(slot.startHour).minute(slot.startMinute).second(0).toDate();
                    const slotEnd = moment(day).hour(slot.endHour).minute(slot.endMinute).second(0).toDate();
                    const isCancelled = !!event && event.cancelledAt != null;

                    const handleEventDoubleClick = () => {
                      if (event && handleDoubleClickEvent) {
                        handleDoubleClickEvent(event);
                      }
                    };

                    const handleSlotCreateClick = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (!handleSlotCreate || isOnlineResource) return;
                      handleSlotCreate({
                        start: slotStart,
                        end: slotEnd,
                        resourceId: resource.resourceId,
                        slots: [slotStart],
                        action: 'click' as const,
                      });
                    };

                    const handleContextMenu = (e: React.MouseEvent) => {
                      if (event && onContextMenuEvent) {
                        e.preventDefault();
                        onContextMenuEvent(event, e);
                      }
                    };

                    const cellSx = {
                      fontSize: '0.55em',
                      backgroundColor: 'white',
                      color: event?.displayColor || 'inherit',
                      fontWeight: (isOnlineResource ? onlineEvents.length > 0 : !!event) ? 'bold' : 'normal',
                      textAlign: 'center' as const,
                      borderLeft,
                      borderBottom: `1px solid ${BORDER_COLOR_LIGHT}`,
                      boxSizing: 'border-box' as const,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      minWidth: `${minCellWidth}px`,
                      maxWidth: `${maxCellWidth}px`,
                      width: shouldScroll ? `${minCellWidth}px` : 'auto',
                      cursor: event && handleDoubleClickEvent ? 'pointer' : 'default',
                      position: 'relative' as const,
                      opacity: isCancelled ? 0.5 : undefined,
                      textDecoration: isCancelled ? 'line-through' : undefined,
                      '&:hover .rpg-slot-create-btn': { opacity: 0.5 },
                    };

                    if (isOnlineResource) {
                      // Online column: render each therapist abbreviation as a separate clickable element
                      return (
                        <TableCell
                          key={`${dayIndex}-${resourceIndex}`}
                          align="center"
                          sx={cellSx}
                        >
                          {onlineEvents.length > 0 ? (
                            onlineEvents.map((onlineEvent, eventIdx) => (
                              <React.Fragment key={onlineEvent.id}>
                                {eventIdx > 0 && <span>,</span>}
                                <Tooltip
                                  title={
                                    onlineEvent.displayName
                                      ? `${onlineEvent.displayName} - ${onlineEvent.title}`
                                      : onlineEvent.title
                                  }
                                  arrow
                                >
                                  <span
                                    style={{ color: onlineEvent.displayColor || 'inherit', cursor: 'pointer' }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      if (handleDoubleClickEvent) handleDoubleClickEvent(onlineEvent);
                                    }}
                                    onContextMenu={(e) => {
                                      if (onContextMenuEvent) {
                                        e.preventDefault();
                                        onContextMenuEvent(onlineEvent, e);
                                      }
                                    }}
                                  >
                                    {onlineEvent.displayAbbreviation || onlineEvent.title}
                                  </span>
                                </Tooltip>
                              </React.Fragment>
                            ))
                          ) : (
                            ''
                          )}
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={`${dayIndex}-${resourceIndex}`}
                        align="center"
                        onDoubleClick={event ? handleEventDoubleClick : undefined}
                        onContextMenu={handleContextMenu}
                        sx={cellSx}
                      >
                        {event?.displayAbbreviation ? (
                          <Tooltip
                            title={
                              event.displayName
                                ? `${event.displayName} - ${event.title}`
                                : event.title
                            }
                            arrow
                          >
                            <span>{event.displayAbbreviation}</span>
                          </Tooltip>
                        ) : (
                          ''
                        )}
                        {!event && !isOnlineResource && handleSlotCreate && (
                          <IconButton
                            className="rpg-slot-create-btn"
                            onClick={handleSlotCreateClick}
                            data-testid="calendar-slot-create"
                            aria-label={t('Create Session')}
                            disableRipple
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              padding: 0,
                              opacity: 0,
                              borderRadius: 0,
                              backgroundColor: 'rgba(25, 118, 210, 0.9)',
                              color: '#fff',
                              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 1)' },
                              transition: 'opacity 120ms ease',
                              zIndex: 2,
                            }}
                          >
                            <AddIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        )}
                      </TableCell>
                    );
                  })
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// Define the week range (Monday to Saturday, excluding Sunday)
CompactView.range = (date: Date, {localizer}: { localizer: DateLocalizer }) => {
  const start = localizer.startOf(date, 'week' as any);
  const end = localizer.endOf(date, 'week' as any);

  const range = [];
  let current = start;

  while (localizer.lte(current, end, 'day')) {
    // Exclude Sunday (day 0 in moment.js)
    if (moment(current).day() !== 0) {
      range.push(current);
    }
    current = localizer.add(current, 1, 'day');
  }

  return range;
};

// Navigation for compact view (week-based)
CompactView.navigate = (
  date: Date,
  action: "PREV" | "NEXT" | "TODAY" | "DATE" | Date,
  {localizer}: { localizer: DateLocalizer }
) => {
  if (action instanceof Date) return action;

  switch (action) {
    case Navigate.NEXT:
      return localizer.add(date, 1, 'week');
    case Navigate.PREVIOUS:
      return localizer.add(date, -1, 'week');
    case Navigate.TODAY:
      return new Date();
    default:
      return date;
  }
};

// Title for compact view toolbar
CompactView.title = (date: Date, {localizer}: { localizer: DateLocalizer }) => {
  const start = localizer.startOf(date, 'week' as any);
  const end = localizer.endOf(date, 'week' as any);

  // Use locale-aware date format
  return `${localizer.format(start, 'L')} - ${localizer.format(end, 'L')}`;
};
