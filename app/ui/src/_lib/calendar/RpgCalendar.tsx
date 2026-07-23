import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Skeleton,
  Tooltip,
} from '@mui/material';
import { Calendar, Components, SlotInfo, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { useTranslation } from 'react-i18next';
import 'moment/locale/pl';
import 'moment/locale/vi';
import { useRouter } from 'next/router';
import usePersistedState from '~/hooks/use-persisted-state';
import YearView from './views/YearView';
import CompactView from './views/CompactView';
import { DefaultTimeSlotWrapper } from '~/_lib/calendar/components/DefaultTimeSlotWrapper';
import { ResourceDataContext } from '~/_lib/calendar/components/ResourceDataContext';
import {
  localizer,
  maxCalendarTime,
  minCalendarTime,
} from '~/_lib/calendar/consts';
import {
  CustomEvent,
  CustomEventType,
} from '~/_lib/calendar/components/CustomEvent';
import { MonthEvent } from '~/_lib/calendar/components/MonthEvent';
import { MonthDateHeader } from '~/_lib/calendar/components/MonthDateHeader';
import { dayKey } from '~/_lib/calendar/utils/day-key';
import { getDisplayPalette } from '~/_lib/calendar/utils/display-palette';
import { CalendarEvent, ResourceMap } from '~/_lib/calendar/types';
import moment from 'moment';
import { AsyncQueryProvider, useAsync } from '~/utils/make-async-hook';
import { calendarBackend } from '~/ui-promise-clients/calendar';
import { UpdateEventRequest } from '@gen/core/v1/calendar_pb';
import { toast } from 'react-hot-toast';
import Toolbar from '~/_lib/calendar/components/Toolbar';

const DragAndDropCalendar = withDragAndDrop(
  Calendar<CalendarEvent, ResourceMap>
);

/**
 * Custom resource column header: a colour-coded initials badge above the full
 * resource name, matching the day-view card styling.
 */
const ResourceHeader: React.FC<{ resource: ResourceMap }> = ({ resource }) => {
  const palette = getDisplayPalette(resource.displayColor);
  return (
    <Tooltip title={resource.resourceTitle} arrow>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          py: 0.5,
          minWidth: 0,
        }}
      >
        {resource.displayAbbreviation && (
          <Box
            component="span"
            sx={{
              backgroundColor: palette.pillBg,
              color: palette.pillText,
              fontWeight: 700,
              fontSize: 11,
              lineHeight: 1.5,
              px: 0.75,
              borderRadius: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            {resource.displayAbbreviation}
          </Box>
        )}
        <Box
          component="span"
          sx={{
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(0, 0, 0, 0.65)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {resource.resourceTitle}
        </Box>
      </Box>
    </Tooltip>
  );
};

/** Format the time gutter labels in 24-hour format (e.g. "07:00", "13:00"). */
const formatTimeGutter = (date: Date): string =>
  `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

interface Props {
  getData: (
    startDate: number,
    endDate: number,
    filters?: object
  ) => Promise<{
    events: CalendarEvent[];
    resources?: ResourceMap[];
  }>;

  /**
   * Fetches per-day session counts for the year-view heatmap. When provided,
   * the year view fetches lightweight counts instead of the full event set.
   */
  getYearCounts?: (
    startDate: number,
    endDate: number,
    filters?: object
  ) => Promise<Array<{ date: string; count: number }>>;

  /**
   * Resource type for drag-and-drop ('therapist' or 'room')
   */
  resourceType: 'therapist' | 'room';

  /**
   * Optional ref to expose calendar methods (e.g., refetch, optimisticUpdate)
   */
  calendarRef?: React.MutableRefObject<{
    refetch: () => void;
    optimisticUpdate: (
      updater: (current: {
        events: CalendarEvent[];
        resources?: ResourceMap[];
      }) => {
        events: CalendarEvent[];
        resources?: ResourceMap[];
      },
      asyncFn: () => Promise<unknown>
    ) => Promise<unknown>;
  } | null>;

  /**
   * Optional card title
   */
  title?: string;

  /**
   * Optional card subtitle
   */
  subtitle?: string;

  /**
   * Initial view to display (default: 'day')
   */
  defaultView?: View;

  /**
   * Minimum time to display in day/week views (default: 07:00)
   */
  minTime?: Date;

  /**
   * Maximum time to display in day/week views (default: 23:00)
   */
  maxTime?: Date;

  /**
   * Time to scroll to initially (default: minTime)
   */
  scrollToTime?: Date;

  /**
   * Enable year view (default: true)
   */
  enableYearView?: boolean;

  /**
   * Enable compact view (default: true)
   */
  enableCompactView?: boolean;

  /**
   * Additional components to override react-big-calendar defaults
   */
  additionalComponents?: Components;

  /**
   * Unique identifier for persisting state in localStorage (optional)
   */
  persistenceKey?: string;

  /**
   * Called when the user double-clicks an existing event. Calendar views
   * are expected to open the edit form via openForm.
   */
  onEventDoubleClicked?: (event: CalendarEvent) => void;

  /**
   * Called when the user selects an empty slot. If absent, slot-selection
   * is disabled entirely.
   */
  onSlotSelected?: (slot: SlotInfo) => void;

  /**
   * Optional filter component to render in a popover
   * If provided, a filter button will appear in the toolbar
   */
  filterComponent?: React.FunctionComponent<{
    filters: object | undefined;
    setFilters: ((filters: object) => void) | undefined;
  }>;

  /**
   * Called when the user right-clicks an event. Default context menu is prevented when this is set.
   */
  onContextMenuEvent?: (event: CalendarEvent, e: React.MouseEvent) => void;
}

/**
 * RpgCalendar - A reusable calendar component built on react-big-calendar
 *
 * This component provides a common configuration for calendar views with support for:
 * - Day, Week, Month, and Year views
 * - Multi-resource scheduling (e.g., therapists, rooms)
 * - Custom time slot rendering
 * - Internationalization
 * - Customizable time ranges
 * - URL-based state persistence (view and date parameters)
 * - localStorage fallback for state persistence
 *
 * @example
 * ```tsx
 * <RpgCalendar
 *   events={events}
 *   resources={resources}
 *   title="Therapist Calendar"
 *   subtitle="View therapist schedules"
 *   timeSlotWrapper={CustomTimeSlotWrapper}
 *   persistenceKey="therapist-calendar"
 * />
 * ```
 */
export const RpgCalendar: React.FC<Props> = (props) => {
  const {
    title,
    subtitle,
    defaultView = 'day',
    minTime = minCalendarTime,
    maxTime = maxCalendarTime,
    scrollToTime,
    enableYearView = true,
    enableCompactView = true,
    additionalComponents = {},
    persistenceKey,
  } = props;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const calendarCulture = (i18n.language ?? 'en').split('-')[0];

  useEffect(() => {
    moment.locale(calendarCulture);
  }, [calendarCulture]);

  const [filters, setFilters, , filtersLoading] = usePersistedState<object>(
    {},
    props.persistenceKey + '_filters'
  );

  // Use ref to avoid recreating callbacks when router changes
  const routerRef = useRef(router);
  routerRef.current = router;

  // Use localStorage for persistence with optional key
  const localStorageKey = persistenceKey || 'rpg-calendar-state';

  const urlView = useMemo(() => {
    return router.query.view as View | undefined;
  }, [router.query.view]);

  // Initialize from URL params (priority) or use default, only on first render
  const getInitialView = useCallback((): View => {
    if (
      urlView &&
      ['day', 'week', 'month', 'year', 'compact'].includes(urlView)
    ) {
      return urlView;
    }
    return defaultView;
  }, [urlView, defaultView]);

  const urlDate = useMemo(() => {
    return router.query.date as string | undefined;
  }, [router.query.date]);

  const getInitialDate = (): string => {
    if (urlDate) {
      const parsed = new Date(urlDate);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }
    return new Date().toISOString();
  };

  // Use only persisted state (no regular useState)
  const [view, setView] = usePersistedState<View | 'compact' | 'year'>(
    getInitialView(),
    `${localStorageKey}-view`
  );

  useEffect(() => {
    if (urlView && urlView !== view) {
      setView(urlView);
    }
  }, [urlView, setView, view]);

  // Date is intentionally NOT persisted: visiting the calendar always starts
  // on today (or an explicit ?date= deep link), never a stale past date.
  const [dateString, setDateString] = useState<string>(getInitialDate);

  // Sync only when the URL date itself changes (deep link / back button).
  // Depending on `dateString` here caused a navigation race: clicking next/prev
  // updates `dateString` immediately, but `router.query.date` (urlDate) lags a
  // tick behind the shallow router replace — so the effect would fire on the
  // dateString change, see the *stale* urlDate, and revert the date until the
  // query caught up (toolbar label stuck on the previous day for ~seconds).
  useEffect(() => {
    if (!urlDate) return;
    const parsed = new Date(urlDate);
    if (!isNaN(parsed.getTime())) {
      setDateString(parsed.toISOString());
    }
  }, [urlDate, setDateString]);

  const date = useMemo(() => new Date(dateString), [dateString]);

  // Update URL and persisted state when view or date changes.
  // historyMode 'push' adds a back-able history entry (view changes and
  // drill-downs); 'replace' overwrites it (incidental date paging, so the
  // prev/next arrows don't flood browser history).
  const updateState = useCallback(
    (
      newView: View | 'compact' | 'year',
      newDate: Date,
      historyMode: 'push' | 'replace' = 'replace'
    ) => {
      const dateStr = newDate.toISOString().split('T')[0];

      // Update URL query params
      const currentRouter = routerRef.current;
      const query = {
        ...currentRouter.query,
        view: newView,
        date: dateStr,
      };
      currentRouter[historyMode](
        { pathname: currentRouter.pathname, query },
        undefined,
        { shallow: true }
      );

      // Update persisted state (which also updates component state)
      setView(newView);
      setDateString(newDate.toISOString());
    },
    [setView, setDateString]
  );

  const handleNavigate = useCallback(
    (newDate: Date) => {
      updateState(view, newDate);
    },
    [view, updateState]
  );

  const handleViewChange = useCallback(
    (newView: View) => {
      updateState(newView, date, 'push');
    },
    [date, updateState]
  );

  const handleNavigateToView = useCallback(
    (newDate: Date, newView: View) => {
      updateState(newView, newDate, 'push');
    },
    [updateState]
  );

  const handleDoubleClickEvent = (event: CalendarEvent) => {
    const currentRouter = routerRef.current;
    if (currentRouter.query.highlightEventId) {
      const { highlightEventId, ...restQuery } = currentRouter.query;
      currentRouter.replace(
        { pathname: currentRouter.pathname, query: restQuery },
        undefined,
        { shallow: true }
      );
    }
    props.onEventDoubleClicked?.(event);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (view === 'month') {
      // Set time to noon to avoid off-by-one when updateState converts to
      // UTC via toISOString (midnight local can roll back to the previous
      // day in UTC).
      const noon = new Date(slotInfo.start);
      noon.setHours(12, 0, 0, 0);
      updateState('day', noon);
      return;
    }
    // Day/Week: accidental clicks/drags must NOT open the form. The user
    // must explicitly click the hover "+" icon, which calls handleSlotCreate.
  };

  const handleSlotCreate = useCallback(
    (slotInfo: SlotInfo) => {
      props.onSlotSelected?.(slotInfo);
    },
    [props.onSlotSelected],
  );

  // Calculate start and end dates based on current view
  const { startDateMillis, endDateMillis } = useMemo(() => {
    let startUnit: 'year' | 'month' | 'week' | 'day' = 'month';
    let endUnit: 'year' | 'month' | 'week' | 'day' = 'month';

    if (view === 'year') {
      startUnit = 'year';
      endUnit = 'year';
    } else if (view === 'week' || view === 'compact') {
      startUnit = 'week';
      endUnit = 'week';
    } else if (view === 'day') {
      startUnit = 'day';
      endUnit = 'day';
    }

    const start = moment(date).startOf(startUnit);
    const end = moment(date).endOf(endUnit);

    return {
      startDateMillis: start.valueOf(),
      endDateMillis: end.valueOf(),
    };
  }, [date, view]);

  const isYear = view === 'year';

  const asyncCtx = useAsync(props.getData, {
    args: [startDateMillis, endDateMillis, filters],
    initialValue: {
      events: [],
      resources: [],
    },
    // The year view renders a count-only heatmap, so skip the heavy event fetch.
    enabled: !filtersLoading && !isYear,
  });
  const { data, loading, refetch, optimisticUpdate } = asyncCtx;

  const yearCountsCtx = useAsync(
    (startDate: number, endDate: number, f: object | undefined) =>
      props.getYearCounts
        ? props.getYearCounts(startDate, endDate, f)
        : Promise.resolve([]),
    {
      args: [startDateMillis, endDateMillis, filters],
      initialValue: [] as Array<{ date: string; count: number }>,
      enabled: !filtersLoading && isYear && !!props.getYearCounts,
    }
  );

  const yearDayCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const { date, count } of yearCountsCtx.data) {
      map.set(date, count);
    }
    return map;
  }, [yearCountsCtx.data]);

  // Expose refetch and optimisticUpdate via calendarRef
  useEffect(() => {
    if (props.calendarRef) {
      props.calendarRef.current = { refetch, optimisticUpdate };
    }
  }, [refetch, optimisticUpdate, props.calendarRef]);

  const resources = data.resources;
  const events = data.events;

  // React Big Calendar's time header does not reserve the body's vertical
  // scrollbar width. With horizontally-scrolling resource columns the body then
  // scrolls a few pixels further than the header, drifting the column dividers
  // apart. Pad the header so its scroll range matches the body's. Recomputed on
  // resize/zoom and data changes, so it is robust to any scrollbar width.
  const scrollSyncRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = scrollSyncRef.current;
    if (!root) return;

    let raf = 0;
    const syncHeaderScrollRange = () => {
      const header = root.querySelector<HTMLElement>('.rbc-time-header');
      const content = root.querySelector<HTMLElement>('.rbc-time-content');
      if (!header || !content) return;
      header.style.paddingRight = '0px';
      const gap =
        content.scrollWidth -
        content.clientWidth -
        (header.scrollWidth - header.clientWidth);
      header.style.paddingRight = gap > 0 ? `${gap}px` : '0px';
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(syncHeaderScrollRange);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(root);
    const content = root.querySelector('.rbc-time-content');
    if (content) observer.observe(content);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [view, date, resources, events, loading]);

  // Create a map of resource data for quick lookup in TimeSlotWrapper
  const resourceDataMap = useMemo(() => {
    const map = new Map<string, ResourceMap>();
    if (resources) {
      resources.forEach((resource) => {
        map.set(resource.resourceId, resource);
      });
    }
    return map;
  }, [resources]);

  // Get highlighted event IDs from URL parameter (comma-separated list)
  const highlightedEventIds = useMemo(() => {
    const highlightParam = router.query.highlightEventId as string | undefined;
    if (!highlightParam) return new Set<string>();
    return new Set(
      highlightParam
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id)
    );
  }, [router.query.highlightEventId]);

  // Scroll to highlighted event when data is loaded
  useEffect(() => {
    if (!loading && highlightedEventIds.size > 0 && events.length > 0) {
      // Find the first highlighted event
      const highlightedEvent = events.find((event) =>
        highlightedEventIds.has(event.id)
      );
      if (highlightedEvent) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          // Find the event element in the DOM
          const eventElements = document.querySelectorAll(
            '[data-type="' + CustomEventType + '"]'
          );
          const container = document.querySelector('.rbc-time-content');
          eventElements.forEach((element) => {
            const htmlElement = element as HTMLElement;
            const containerHtml = container as HTMLElement;
            if (htmlElement.dataset['eventId'] === highlightedEvent.id) {
              scrollToCenterInContainer(htmlElement, containerHtml);
            }
          });
        }, 500);
      }
    }
  }, [loading, highlightedEventIds, events]);

  const messages = useMemo(
    () => ({
      today: t('Today'),
      previous: t('Previous'),
      next: t('Next'),
      month: t('Month'),
      week: t('Week'),
      day: t('Day'),
      agenda: t('Agenda'),
      year: t('Year'), // Custom view not in default Messages type
      compact: t('Compact'), // Custom compact view
      showMore: (total: number) => `+ ${total} ${t('more')}`,
    }),
    [t]
  );

  // Total events per calendar day, for the month grid count badge.
  const monthDayEventCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      const key = dayKey(event.start);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  // Combine components - use default TimeSlotWrapper if no custom one provided
  const components = useMemo(() => {
    const baseComponents: Components<CalendarEvent, ResourceMap> = {
      // @ts-ignore TODO can't figure out the correct type for custom event
      event: CustomEvent,
      month: {
        // @ts-ignore custom compact row event for the month grid
        event: MonthEvent,
        dateHeader: MonthDateHeader as any,
      },
      toolbar: Toolbar as any,
      timeSlotWrapper: DefaultTimeSlotWrapper as React.FunctionComponent,
      resourceHeader: ResourceHeader as any,
      ...additionalComponents,
    };

    return baseComponents;
  }, [additionalComponents]);

  // Clicking a month date drills into that day. Done atomically (view + date
  // in one update) to avoid the stale-closure race of RBC's default
  // onView-then-onNavigate drilldown. Noon avoids a UTC previous-day roll-back
  // when the date is serialized.
  const handleDrillDown = useCallback(
    (drillDate: Date, drilldownView?: View) => {
      const noon = new Date(drillDate);
      noon.setHours(12, 0, 0, 0);
      handleNavigateToView(noon, drilldownView || 'day');
    },
    [handleNavigateToView]
  );

  // Tint month cells that contain events.
  const dayPropGetter = useCallback(
    (cellDate: Date) =>
      monthDayEventCounts.has(dayKey(cellDate))
        ? { className: 'rpg-month-day-has-events' }
        : {},
    [monthDayEventCounts]
  );

  // Configure views
  const views = useMemo(() => {
    const baseViews: any = {
      // Need 'any' because custom view 'year' is not in default ViewsProps type
      month: true,
      day: true,
      week: true,
    };

    if (enableYearView) {
      baseViews.year = YearView;
    }

    if (enableCompactView) {
      baseViews.compact = CompactView;
    }

    return baseViews;
  }, [enableYearView, enableCompactView]);

  // Drag and drop handlers - handle API calls internally
  const handleEventDrop = useCallback(
    async ({
      event,
      start,
      end,
      resourceId,
    }: {
      event: CalendarEvent;
      start: Date | string;
      end: Date | string;
      resourceId?: string | number | undefined;
    }) => {
      // Convert start and end to Date objects if they're strings
      const startDate = typeof start === 'string' ? new Date(start) : start;
      const endDate = typeof end === 'string' ? new Date(end) : end;

      const timeChanged =
        startDate.getTime() !== event.start.getTime() ||
        endDate.getTime() !== event.end.getTime();
      const resourceChanged =
        resourceId !== undefined && String(resourceId) !== event.resourceId;

      if (!timeChanged && !resourceChanged) {
        return;
      }

      try {
        // Use optimistic update to immediately update UI
        await optimisticUpdate(
          (currentData) => ({
            ...currentData,
            events: currentData.events.map((e) =>
              e.id === event.id
                ? {
                    ...e,
                    start: startDate,
                    end: endDate,
                    resourceId: resourceChanged
                      ? String(resourceId)
                      : e.resourceId,
                  }
                : e
            ),
          }),
          async () => {
            const request = new UpdateEventRequest({
              eventId: event.id,
              resourceType: props.resourceType,
            });

            if (timeChanged) {
              request.start = BigInt(startDate.getTime());
              request.end = BigInt(endDate.getTime());
            }

            if (resourceChanged) {
              request.resourceId = String(resourceId);
            }

            await calendarBackend.updateEvent(request);
            // Refetch to get the actual server state
            await refetch(false);
          }
        );
      } catch (error) {
        console.error('Failed to update event', error);
        toast.error('Failed to update event');
      }
    },
    [props.resourceType, refetch, optimisticUpdate]
  );

  const handleEventResize = useCallback(
    async ({
      event,
      start,
      end,
    }: {
      event: CalendarEvent;
      start: Date | string;
      end: Date | string;
    }) => {
      // Convert start and end to Date objects if they're strings
      const startDate = typeof start === 'string' ? new Date(start) : start;
      const endDate = typeof end === 'string' ? new Date(end) : end;

      if (
        startDate.getTime() === event.start.getTime() &&
        endDate.getTime() === event.end.getTime()
      ) {
        return;
      }

      try {
        // Use optimistic update to immediately update UI
        await optimisticUpdate(
          (currentData) => ({
            ...currentData,
            events: currentData.events.map((e) =>
              e.id === event.id ? { ...e, start: startDate, end: endDate } : e
            ),
          }),
          async () => {
            await calendarBackend.updateEvent(
              new UpdateEventRequest({
                eventId: event.id,
                start: BigInt(startDate.getTime()),
                end: BigInt(endDate.getTime()),
                resourceType: props.resourceType,
              })
            );
            // Refetch to get the actual server state
            await refetch(false);
          }
        );
      } catch (error) {
        console.error('Failed to resize event', error);
        toast.error('Failed to resize event');
      }
    },
    [props.resourceType, refetch, optimisticUpdate]
  );

  return (
    <AsyncQueryProvider value={asyncCtx}>
      <ResourceDataContext.Provider
        value={{
          resourceDataMap,
          handleNavigate,
          handleViewChange,
          handleNavigateToView,
          monthDayEventCounts,
          yearDayCounts,
          handleDoubleClickEvent,
          handleSelectSlot,
          handleSlotCreate,
          onContextMenuEvent: props.onContextMenuEvent,
          filterComponent: props.filterComponent,
          filters,
          setFilters,
          highlightedEventIds,
        }}
      >
        <Box sx={{ p: 1, height: '100%' }}>
          <Card sx={{ height: '100%' }}>
            {(title || subtitle) && (
              <CardHeader title={title} subheader={subtitle} />
            )}
            <CardContent sx={{ height: '100%' }}>
              <div ref={scrollSyncRef} style={{ height: '100%' }}>
                <DragAndDropCalendar
                  localizer={localizer}
                  culture={calendarCulture}
                  events={events}
                  resources={resources}
                  resourceIdAccessor={(resource: ResourceMap) =>
                    resource.resourceId
                  }
                  resourceTitleAccessor={(resource: ResourceMap) =>
                    resource.resourceTitle
                  }
                  startAccessor="start"
                  endAccessor="end"
                  min={minTime}
                  max={maxTime}
                  scrollToTime={scrollToTime || minTime}
                  view={view as View}
                  onView={handleViewChange}
                  date={date}
                  onNavigate={handleNavigate}
                  onDrillDown={handleDrillDown}
                  messages={messages as any}
                  formats={{
                    timeGutterFormat: formatTimeGutter,
                  }}
                  style={{
                    height: !loading ? '100%' : '50px',
                  }}
                  className={loading ? 'rpg-calendar-loading' : 'rpg-calendar'}
                  dayPropGetter={dayPropGetter}
                  components={components as any}
                  views={views}
                  onDoubleClickEvent={handleDoubleClickEvent}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={(event) => {
                    // Single click opens the session in every view.
                    // handleDoubleClickEvent also clears any highlightEventId
                    // from the URL.
                    handleDoubleClickEvent(event);
                  }}
                  selectable={view === 'month' && !!props.onSlotSelected}
                  onEventDrop={handleEventDrop}
                  onEventResize={handleEventResize}
                  resizable
                  step={10} // labels every 30 minutes
                  timeslots={6} // 30 / 6 = 5 minute resize steps
                  draggableAccessor={() => true}
                />
                {loading && (
                  <Box sx={{ width: '100%', height: 'calc(100% - 50px)' }}>
                    {/* Calendar grid skeleton */}
                    <Box
                      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                    >
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                      <Skeleton variant="rounded" width="100%" height={60} />
                    </Box>
                  </Box>
                )}
              </div>
            </CardContent>
          </Card>
        </Box>
      </ResourceDataContext.Provider>
    </AsyncQueryProvider>
  );
};

const scrollToCenterInContainer = (
  el: HTMLElement,
  container: HTMLElement,
  offsetX = 0,
  offsetY = 0
) => {
  const elRect = el.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();

  const targetTop =
    elRect.top -
    cRect.top +
    container.scrollTop -
    container.clientHeight / 2 +
    elRect.height / 2 +
    offsetY;

  const targetLeft =
    elRect.left -
    cRect.left +
    container.scrollLeft -
    container.clientWidth / 2 +
    elRect.width / 2 +
    offsetX;

  container.scrollTo({
    top: targetTop,
    left: targetLeft,
    behavior: 'smooth',
  });
};

export default RpgCalendar;
