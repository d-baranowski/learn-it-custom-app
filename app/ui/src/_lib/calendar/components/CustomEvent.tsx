import React, { useCallback, useContext } from 'react';
import { EventProps } from 'react-big-calendar';
import { CalendarEvent } from '~/_lib/calendar/types';
import moment from 'moment';
import { Box, Chip, Tooltip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import {
  ResourceDataContext,
  useResourceDataContext,
} from '~/_lib/calendar/components/ResourceDataContext';
import {
  isSessionMissingRoom,
  isSessionOutsideWorkingHours,
  isSessionWithinAbsence,
} from '~/_lib/calendar/utils/session-warnings';
import { useTranslation } from 'react-i18next';
import {
  cssColorToRgb,
  getContrastingColorCssRgb,
} from '~/_lib/color/get-contrasting-color';
import { getDisplayPalette } from '~/_lib/calendar/utils/display-palette';

function getHighlightStyles(backgroundColor: string) {
  const contractingColor = getContrastingColorCssRgb(backgroundColor, 5);
  const contrastingRgb = contractingColor && cssColorToRgb(contractingColor);

  return {
    borderColor: contrastingRgb,
    shadowColor:
      contrastingRgb &&
      `rgba(${contrastingRgb[0]}, ${contrastingRgb[1]}, ${contrastingRgb[2]}, 0.85)`,
  };
}

interface CustomEventProps extends EventProps<CalendarEvent> {
  highlightedEventIds?: Set<string>;
}

export const CustomEventType = 'rpg-custom-event-wrapper';

/**
 * Custom event component that displays abbreviation and uses display color
 */
export const CustomEvent: React.FC<
  React.PropsWithChildren<CustomEventProps>
> = ({ event }) => {
  const { t } = useTranslation();
  const { resourceDataMap } = useContext(ResourceDataContext);
  const backgroundColor = event.displayColor || undefined;

  // Get resource data for this event
  const resourceData = event.resourceId
    ? resourceDataMap.get(event.resourceId)
    : undefined;

  // Check for warnings
  const outsideAvailability = resourceData
    ? isSessionOutsideWorkingHours(event, resourceData.availabilitySlots || [])
    : false;
  const withinAbsence = resourceData
    ? isSessionWithinAbsence(event, resourceData.absenceSlots || [])
    : false;
  const missingRoom = isSessionMissingRoom(event);

  const isCancelled = event.cancelledAt != null;
  const hasWarnings = outsideAvailability || withinAbsence || missingRoom;
  const { highlightedEventIds, onContextMenuEvent } = useResourceDataContext();
  const isHighlighted = highlightedEventIds.has(event.id) || false;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (onContextMenuEvent) {
        e.preventDefault();
        onContextMenuEvent(event, e);
      }
    },
    [event, onContextMenuEvent],
  );

  const highlight = React.useMemo(() => {
    if (!backgroundColor) {
      return null;
    }

    return getHighlightStyles(backgroundColor);
  }, [backgroundColor]);

  const palette = React.useMemo(
    () => getDisplayPalette(backgroundColor),
    [backgroundColor],
  );

  return (
    <div
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
      style={{
        backgroundColor: '#FFFFFF',
        height: '100%',
        fontSize: 12,
        padding: '4px 6px 4px 10px',
        boxSizing: 'border-box',
        borderRadius: 8,
        border: isHighlighted && highlight
          ? '2px solid black'
          : '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow:
          '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden',
        animation: isHighlighted ? `pulse 0.5s ease-in` : undefined,
        position: 'relative',
        animationIterationCount: 5,
        opacity: isCancelled ? 0.55 : undefined,
      }}
    >
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          backgroundColor: palette.accent,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 4,
        }}
      >
        {event.displayAbbreviation ? (
          <span
            style={{
              display: 'inline-block',
              backgroundColor: palette.pillBg,
              color: palette.pillText,
              fontWeight: 700,
              fontSize: 10,
              lineHeight: 1.5,
              padding: '0 6px',
              borderRadius: 6,
              whiteSpace: 'nowrap',
            }}
          >
            {event.displayAbbreviation}
          </span>
        ) : (
          <span />
        )}
        {!isCancelled && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              lineHeight: 1.15,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10.5, fontWeight: 600, color: '#2C2C2A' }}>
              {moment(event.start).format('HH:mm')}
            </span>
            <span style={{ fontSize: 10.5, color: 'rgba(0, 0, 0, 0.45)' }}>
              {moment(event.end).format('HH:mm')}
            </span>
          </div>
        )}
      </div>
      <div
        style={{
          marginTop: 2,
          fontSize: 12,
          fontWeight: 500,
          color: '#2C2C2A',
          lineHeight: 1.25,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textDecoration: isCancelled ? 'line-through' : undefined,
        }}
      >
        {event.title}
      </div>
      {isCancelled && (
        <Chip
          size="small"
          label={t('Cancelled')}
          data-testid="calendar-event-cancelled-chip"
          sx={{
            position: 'absolute',
            top: 2,
            right: 4,
            height: 18,
            fontSize: '0.7em',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            color: '#d32f2f',
            textDecoration: 'none',
            '& .MuiChip-label': { padding: '0 6px' },
          }}
        />
      )}
      {hasWarnings && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 2.5,
            right: 4,
            display: 'flex',
            gap: 0.5,
            flexDirection: 'row',
            alignItems: 'flex-end',
          }}
        >
          {(outsideAvailability || withinAbsence) && (
            <Tooltip
              title={
                outsideAvailability && withinAbsence
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
                sx={{
                  fontSize: 16,
                  color: '#ff9800',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  padding: '2.5px',
                }}
              />
            </Tooltip>
          )}
          {missingRoom && (
            <Tooltip title={t('Session has no room assigned')} arrow>
              <MeetingRoomIcon
                sx={{
                  fontSize: 16,
                  color: '#f44336',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '50%',
                  padding: '2.5px',
                }}
              />
            </Tooltip>
          )}
        </Box>
      )}
    </div>
  );
};
