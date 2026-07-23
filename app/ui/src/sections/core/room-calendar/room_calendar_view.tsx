import React, { useRef, useState } from 'react';
import type { SlotInfo } from 'react-big-calendar';
import {
  GetRoomCalendarEventsRequest,
  GetRoomSessionCountsRequest,
} from '@gen/core/v1/calendar_pb';
import { CalendarEvent, ResourceMap } from '~/_lib/calendar/types';
import { sessionToCalendarEvent } from '~/_lib/calendar/session-to-event';
import RpgCalendar from '~/_lib/calendar/RpgCalendar';
import { calendarBackend } from '~/ui-promise-clients/calendar';
import { Session } from '@gen/core/v1/session_pb';
import { useTranslation } from 'react-i18next';
import {
  Autocomplete,
  Box,
  IconButton,
  MenuItem,
  Menu,
  TextField,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import { autocomplete as roomAutocomplete } from '@gen/core/v1/room-RoomService_connectquery';
import { useAutocompleteOptions } from '~/components/form/elements/use-autocomplete-options';
import { useOpenSessionForm } from '~/sections/core/session/session_form';
import _ from 'lodash';
import { useMutation } from '@connectrpc/connect-query';
import toast from 'react-hot-toast';
import { DeleteRequest } from '@gen/request/v1/base_pb';
import { delete$ } from '@gen/core/v1/session-SessionService_connectquery';
import { SessionCancellationDialog } from '~/sections/core/session/session_cancellation_dialog';

function slotToDefaults(slot: SlotInfo | undefined): Partial<Session> {
  if (!slot) return {};
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return {
    roomId: slot.resourceId ? String(slot.resourceId) : undefined,
    date: `${slot.start.getFullYear()}-${pad2(slot.start.getMonth() + 1)}-${pad2(slot.start.getDate())}`,
    startTime: `${pad2(slot.start.getHours())}:${pad2(slot.start.getMinutes())}`,
    endTime: `${pad2(slot.end.getHours())}:${pad2(slot.end.getMinutes())}`,
  };
}

// Must match the virtual resource ID used in the backend (get_room_calendar_events.go).
const ONLINE_RESOURCE_ID = 'online';

const getCalendarEvents = async (
  startDate: number,
  endDate: number,
  filters: object | undefined
) => {
  const filtersTyped = filters as { roomIds?: string[] } | undefined;
  const selectedRoomIds = filtersTyped?.roomIds || [];

  const response = await calendarBackend.getRoomCalendarEvents(
    new GetRoomCalendarEventsRequest({
      startDate: BigInt(startDate),
      endDate: BigInt(endDate),
      roomIds: selectedRoomIds, // Use selected room IDs, empty array fetches all
    })
  );

  const events: CalendarEvent[] =
    response?.events?.map((event) => ({
      id: event.id,
      title: event.title,
      start: new Date(Number(event.start)),
      end: new Date(Number(event.end)),
      resourceId: event.resourceId,
      displayAbbreviation: event.displayAbbreviation,
      displayColor: event.displayColor,
      displayName: event.displayName,
      roomId: event.roomId,
      isOnline: event.isOnline,
      cancelledAt: event.cancelledAt != null ? Number(event.cancelledAt) : undefined,
    })) || [];

  const resources: ResourceMap[] =
    response?.resourceMap?.map((resource) => ({
      resourceId: resource.resourceId,
      resourceTitle: resource.resourceTitle,
      // The virtual "online" resource has no abbreviation from the backend — use "ON" as default.
      displayAbbreviation:
        resource.displayAbbreviation ||
        (resource.resourceId === ONLINE_RESOURCE_ID ? 'ON' : undefined),
      displayColor: resource.displayColor,
      // Rooms don't have working hours/absence slots
    })) || [];

  return { events, resources };
};

const getSessionCounts = async (
  startDate: number,
  endDate: number,
  filters: object | undefined
) => {
  const filtersTyped = filters as { roomIds?: string[] } | undefined;
  const response = await calendarBackend.getRoomSessionCounts(
    new GetRoomSessionCountsRequest({
      startDate: BigInt(startDate),
      endDate: BigInt(endDate),
      roomIds: filtersTyped?.roomIds || [],
    })
  );

  return response.counts.map((c) => ({ date: c.date, count: c.count }));
};





const calendarFilterAutocompleteSx = {
  flex: 1,
  minWidth: 0,
  '& .MuiFilledInput-root': {
    backgroundColor: '#F6F4EE',
    borderRadius: '6px',
    height: '48px !important',
    minHeight: '48px !important',
    position: 'relative',
    '&:before, &:after': {
      display: 'none',
    },
    '&:hover': {
      backgroundColor: '#F0EEE3',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#5F5E5A',
  },
  '& .MuiInputLabel-shrink': {
    transform: 'translate(12px, 5px) scale(0.75)',
    transformOrigin: 'top left',
  },
  '& .MuiAutocomplete-inputRoot': {
    flexWrap: 'nowrap !important',
    paddingRight: '30px !important',
  },
  '& .MuiAutocomplete-input': {
    minWidth: '0 !important',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  '& .MuiFilledInput-input': {
    paddingTop: '18px !important',
    paddingBottom: '5px !important',
  },
  '& .MuiAutocomplete-endAdornment': {
    top: '50%',
    transform: 'translateY(-50%)',
  },
};

const summarizeSelection = (
  labels: string[],
  t: (key: string, options?: Record<string, unknown>) => string
) => {
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  return t('{{count}} selected', { count: labels.length });
};

const RoomFilterComponent: React.FC<{
  filters: object | undefined;
  setFilters: ((filters: object) => void) | undefined;
}> = (props) => {
  const { t } = useTranslation();
  const { setFilters = _.noop } = props;
  const filters = props.filters as { roomIds?: string[] } | undefined;
  const { options } = useAutocompleteOptions(roomAutocomplete);

  const selected = (filters?.roomIds ?? []).map(
    (id) => options.find((o) => o.id === id) ?? { id, label: id }
  );

  return (
    <Box
      className="rbc-calendar-filter-row"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: { xs: 'wrap', lg: 'nowrap' },
      }}
    >
      <Autocomplete
        multiple
        size="small"
        disableCloseOnSelect
        disableClearable
        forcePopupIcon={false}
        options={options}
        value={selected}
        onChange={(_e, next) => setFilters({ roomIds: next.map((n) => n.id) })}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        getOptionLabel={(opt) => opt.label}
        renderTags={(value) => (
          <Box component="span" sx={{ display: 'block', lineHeight: '20px', mt: 0, ml: '2px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {summarizeSelection(value.map((item) => item.label), t)}
          </Box>
        )}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            variant="filled"
            label={t('Rooms')}
            InputLabelProps={{ shrink: true }}
            placeholder=" "
            InputProps={{
              ...params.InputProps,
              disableUnderline: true,
              endAdornment: (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}>
                  {selected.length > 0 && (
                    <CloseIcon
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilters({ roomIds: [] });
                      }}
                      sx={{ fontSize: 16, color: '#5F5E5A', cursor: 'pointer', '&:hover': { color: '#333' } }}
                    />
                  )}
                  <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#5F5E5A' }} />
                </Box>
              ),
            }}
            inputProps={{
              ...params.inputProps,
              'data-testid': 'room-ids',
            }}
          />
        )}
        sx={calendarFilterAutocompleteSx}
      />
    </Box>
  );
};

export const RoomCalendarView: React.FC = () => {
  const { t } = useTranslation();
  const openSession = useOpenSessionForm();
  const [contextMenu, setContextMenu] = useState<{
    event: CalendarEvent | null;
    mouseX: number;
    mouseY: number;
  }>({ event: null, mouseX: 0, mouseY: 0 });
  const [cancellationDialogOpen, setCancellationDialogOpen] = useState(false);
  const [cancellationMode, setCancellationMode] = useState<'cancel' | 'undo'>(
    'cancel'
  );
  const [selectedSessionId, setSelectedSessionId] = useState<
    string | undefined
  >();
  const calendarRef = useRef<{
    refetch: (showLoading?: boolean) => void;
    optimisticUpdate: (
      updater: (current: {
        events: CalendarEvent[];
        resources?: ResourceMap[];
      }) => { events: CalendarEvent[]; resources?: ResourceMap[] },
      asyncFn: () => Promise<unknown>
    ) => Promise<unknown>;
  } | null>(null);
  const { mutateAsync: deleteFn } = useMutation(delete$);

  const openSessionForm = React.useCallback(
    (existingEvent: CalendarEvent | undefined, slot: SlotInfo | undefined) => {
      const defaultValues = slotToDefaults(slot);
      const isEdit = !!existingEvent;
      openSession({
        entityId: existingEvent?.id ?? null,
        title: t(isEdit ? 'Edit Session' : 'Create Session'),
        maxWidth: 'md',
        initialHeight: 780,
        defaultValues,
        afterSave: async (savedSession: Session | undefined) => {
          if (!savedSession) {
            try {
              await calendarRef.current?.refetch?.();
            } catch (e) {
              console.error('Failed to refetch calendar data after save', e);
              toast.error('Failed to refresh calendar data');
            }
            return;
          }
          if (!existingEvent) {
            const newEvent = sessionToCalendarEvent(
              savedSession,
              savedSession.roomId ?? ONLINE_RESOURCE_ID,
              {
                displayName: savedSession.therapistLabel,
                displayAbbreviation: savedSession.therapistAbbreviationLabel,
              }
            );
            try {
              await calendarRef.current?.optimisticUpdate(
                (current) => ({
                  ...current,
                  events: [...current.events, newEvent],
                }),
                async () => {
                  await calendarRef.current?.refetch?.(false);
                }
              );
            } catch (e) {
              console.error('Failed to update calendar after create', e);
              toast.error('Failed to update calendar');
            }
            return;
          }
          const updatedEvent: CalendarEvent = {
            ...existingEvent,
            start: new Date(`${savedSession.date}T${savedSession.startTime}`),
            end: new Date(`${savedSession.date}T${savedSession.endTime}`),
          };
          if (savedSession.roomId) {
            updatedEvent.resourceId = savedSession.roomId;
          }
          try {
            await calendarRef.current?.optimisticUpdate(
              (current) => ({
                ...current,
                events: current.events.map((e) =>
                  e.id === existingEvent.id ? updatedEvent : e
                ),
              }),
              async () => {
                await calendarRef.current?.refetch?.(false);
              }
            );
          } catch (e) {
            console.error('Failed to update calendar after save', e);
            toast.error('Failed to update calendar');
          }
        },
      });
    },
    [openSession, t]
  );
  const handleContextMenu = React.useCallback(
    (event: CalendarEvent, e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({
        event,
        mouseX: e.clientX,
        mouseY: e.clientY,
      });
    },
    []
  );

  const handleCloseContextMenu = React.useCallback(() => {
    setContextMenu({ event: null, mouseX: 0, mouseY: 0 });
  }, []);

  const handleOpenCancellationDialog = React.useCallback(() => {
    const event = contextMenu.event;
    if (!event?.id) return;

    setSelectedSessionId(event.id);
    setCancellationMode(event.cancelledAt ? 'undo' : 'cancel');
    setCancellationDialogOpen(true);
    handleCloseContextMenu();
  }, [contextMenu.event, handleCloseContextMenu]);

  const handleCancellationSuccess = React.useCallback(async () => {
    try {
      await calendarRef.current?.refetch?.(false);
    } catch (e) {
      console.error('Failed to refresh calendar after session cancellation', e);
      toast.error('Failed to refresh calendar');
    }
  }, []);

  const handleDelete = React.useCallback(
    async (eventId: string) => {
      if (!eventId) return;

      try {
        await calendarRef.current?.optimisticUpdate(
          (currentData) => ({
            ...currentData,
            events: currentData.events.filter((e) => e.id !== eventId),
          }),
          async () => {
            await toast.promise(
              deleteFn(new DeleteRequest({ IDs: [eventId] })),
              {
                loading: t('Loading'),
                success: t('Deleted'),
                error: t('Error when deleting'),
              },
              { id: 'delete-session' }
            );
          }
        );
      } catch {
        // optimisticUpdate reverts state on error automatically
      } finally {
        handleCloseContextMenu();
      }
    },
    [deleteFn, handleCloseContextMenu, t]
  );

  return (
    <>
      <RpgCalendar
        getData={getCalendarEvents}
        getYearCounts={getSessionCounts}
        persistenceKey="room-calendar"
        resourceType="room"
        filterComponent={RoomFilterComponent}
        onContextMenuEvent={handleContextMenu}
        onEventDoubleClicked={(event) => openSessionForm(event, undefined)}
        onSlotSelected={(slot) => openSessionForm(undefined, slot)}
        calendarRef={calendarRef}
      />
      <Menu
        open={contextMenu.event !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu.event !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleOpenCancellationDialog}>
          {contextMenu.event?.cancelledAt
            ? t('Undo Cancellation')
            : t('Cancel Session')}
        </MenuItem>
        <MenuItem onClick={() => handleDelete(contextMenu.event?.id || '')}>
          {t('Delete')}
        </MenuItem>
      </Menu>
      <SessionCancellationDialog
        open={cancellationDialogOpen}
        mode={cancellationMode}
        sessionId={selectedSessionId}
        onClose={() => setCancellationDialogOpen(false)}
        onSuccess={handleCancellationSuccess}
      />
    </>
  );
};
