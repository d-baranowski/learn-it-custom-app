import React, { useCallback } from 'react';
import { EventProps } from 'react-big-calendar';
import moment from 'moment';
import { Box, IconButton, Tooltip } from '@mui/material';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import { useTranslation } from 'react-i18next';
import { CalendarEvent } from '~/_lib/calendar/types';
import {
  useResourceDataContext,
} from '~/_lib/calendar/components/ResourceDataContext';
import {
  isSessionMissingRoom,
  isSessionOutsideWorkingHours,
  isSessionWithinAbsence,
} from '~/_lib/calendar/utils/session-warnings';
import { CustomEventType } from '~/_lib/calendar/components/CustomEvent';

export const MonthEvent: React.FC<
  React.PropsWithChildren<EventProps<CalendarEvent>>
> = ({ event }) => {
  const { t } = useTranslation();
  const {
    resourceDataMap,
    highlightedEventIds,
    onContextMenuEvent,
    handleDoubleClickEvent,
  } = useResourceDataContext();

  const resourceData = event.resourceId
    ? resourceDataMap.get(event.resourceId)
    : undefined;

  const outsideAvailability = resourceData
    ? isSessionOutsideWorkingHours(event, resourceData.availabilitySlots || [])
    : false;
  const withinAbsence = resourceData
    ? isSessionWithinAbsence(event, resourceData.absenceSlots || [])
    : false;
  const missingRoom = isSessionMissingRoom(event);
  const hasWarnings = outsideAvailability || withinAbsence || missingRoom;

  const isCancelled = event.cancelledAt != null;
  const isHighlighted = highlightedEventIds.has(event.id);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (onContextMenuEvent) {
        e.preventDefault();
        onContextMenuEvent(event, e);
      }
    },
    [event, onContextMenuEvent],
  );

  const handleOpen = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleDoubleClickEvent?.(event);
    },
    [event, handleDoubleClickEvent],
  );

  return (
    <Box
      onContextMenu={handleContextMenu}
      data-event-id={event.id}
      data-event-resource-id={event.resourceId}
      data-event-display-name={event.displayName}
      data-event-display-abbreviation={event.displayAbbreviation}
      data-event-start={event.start.toISOString()}
      data-event-end={event.end.toISOString()}
      data-test-id={'event_' + event.id}
      data-type={CustomEventType}
      data-event-cancelled={isCancelled ? 'true' : undefined}
      className="rpg-month-event"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        minWidth: 0,
        opacity: isCancelled ? 0.5 : 1,
        textDecoration: isCancelled ? 'line-through' : 'none',
        outline: isHighlighted ? '2px solid black' : undefined,
        animation: isHighlighted ? 'pulse 0.5s ease-in' : undefined,
        animationIterationCount: 5,
      }}
    >
      <Box
        component="span"
        className="rpg-month-event-dot"
        sx={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          flex: 'none',
          backgroundColor: event.displayColor || 'grey.500',
        }}
      />
      <Box
        component="span"
        className="rpg-month-event-time"
        sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}
      >
        {moment(event.start).format('HH:mm')}
      </Box>
      <Box
        component="span"
        className="rpg-month-event-label"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: '0 1 auto',
          minWidth: 0,
        }}
      >
        {event.displayAbbreviation || event.title}
      </Box>
      {event.isOnline && (
        <VideocamOutlinedIcon
          className="rpg-month-event-icon"
          sx={{ fontSize: 15, color: 'text.secondary', flex: 'none' }}
        />
      )}
      {hasWarnings && (
        <Tooltip
          title={
            missingRoom
              ? t('Session has no room assigned')
              : outsideAvailability && withinAbsence
                ? t(
                    'Session is outside therapist availability and within absence period',
                  )
                : outsideAvailability
                  ? t('Session is outside therapist availability')
                  : t('Session is within therapist absence period')
          }
          arrow
        >
          <WarningAmberIcon
            className="rpg-month-event-icon"
            sx={{
              fontSize: 15,
              color: missingRoom ? '#f44336' : '#ff9800',
              flex: 'none',
            }}
          />
        </Tooltip>
      )}
      <Tooltip title={t('Open')} arrow>
        <IconButton
          size="small"
          onClick={handleOpen}
          data-testid="calendar-event-open"
          className="rpg-month-event-open"
          sx={{ p: 0.125, ml: 'auto', flex: 'none' }}
        >
          <LaunchOutlinedIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
