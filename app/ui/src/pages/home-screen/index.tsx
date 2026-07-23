import type {NextPage} from 'next';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import {Seo} from 'src/components/seo';
import {Layout} from 'src/layouts';
import React, {useState, useMemo, useEffect, useRef, type ReactNode} from 'react';
import {useRouter} from 'next/router';
import {withTranslations} from '~/utils/with-translations';
import {useTranslation} from 'next-i18next';
import {useSections} from '~/layouts/config';
import type {Section, Item} from '~/layouts/config';
import Stack from '@mui/material/Stack';
import CardActionArea from '@mui/material/CardActionArea';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  CalendarToday as CalendarTodayIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import Fuse from 'fuse.js';
import {paths} from '~/paths';
import {snakeCase} from 'change-case';
import {BugBountyBanner} from '~/components/bug-bounty-banner';
import {useSession} from '~/auth/session-provider';
import {useOpenSessionForm} from '~/sections/core/session/session_form';
import {useAsync} from '~/utils/make-async-hook';
import {useQuery} from '@connectrpc/connect-query';
import {
  getNextSession,
  list as listSessions,
} from '@gen/core/v1/session-SessionService_connectquery';
import {GetRoomCalendarEventsRequest} from '@gen/core/v1/calendar_pb';
import {GetNextSessionRequest} from '@gen/core/v1/session_pb';
import {GetSessionIssuesRequest} from '@gen/core/v1/session_validation_pb';
import {sessionValidationBackend} from '~/ui-promise-clients/session-validation';
import {calendarBackend} from '~/ui-promise-clients/calendar';
import {Pagination, SelectRequest} from '@gen/request/v1/base_pb';
import {WhereBuilder} from '~/request';
import {formatDateLong, formatTimeShort, minutesUntil, toDateString} from '~/utils/date';
import {durationMinutes, parseSessionStart} from '~/utils/session';
import moment from 'moment';

interface FlattenedItem {
  item: Item;
  sectionTitle?: string;
  parentTitle?: string;
  translatedTitle: string;
  translatedSection?: string;
  translatedParent?: string;
}

interface CardData {
  title: string;
  description: string;
  path?: string;
  icon?: ReactNode;
}

interface GroupedCards {
  heading: string | null;
  headingDescription?: string;
  cards: CardData[];
}

interface HomeWidgetData {
  openIssuesCount: number;
  urgentIssuesCount: number;
  oldestIssueDays?: number;
  totalRooms: number;
  freeRoomsNow: number;
  roomBookedUntilLabel?: string;
}

const ONLINE_RESOURCE_ID = 'online';

const flattenItems = (sections: Section[], t: (key: string) => string): FlattenedItem[] => {
  const result: FlattenedItem[] = [];

  const processItems = (items: Item[], sectionTitle?: string, parentTitle?: string) => {
    items.forEach(item => {
      if (item.path) {
        result.push({
          item,
          sectionTitle,
          parentTitle,
          translatedTitle: t(item.title),
          translatedSection: sectionTitle ? t(sectionTitle) : undefined,
          translatedParent: parentTitle ? t(parentTitle) : undefined,
        });
      }
      if (item.items) {
        processItems(item.items, sectionTitle, item.title);
      }
    });
  };

  sections.forEach(section => {
    processItems(section.items, section.subheader);
  });

  return result;
};

const formatSessionEta = (totalMinutes: number, t: (key: string, options?: Record<string, unknown>) => string): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (hours > 0) {
    parts.push(t(hours === 1 ? '{{count}} hour' : '{{count}} hours', {count: hours}));
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(t(minutes === 1 ? '{{count}} minute' : '{{count}} minutes', {count: minutes}));
  }

  return t('in {{duration}}', {duration: parts.join(' ')});
};

const getHomeWidgetData = async (): Promise<HomeWidgetData> => {
  const now = new Date();

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const startOfWeek = moment().startOf('week').format('YYYY-MM-DD');
  const endOfWeek = moment().endOf('week').format('YYYY-MM-DD');

  const [issuesResponse, roomsResponse] = await Promise.all([
    sessionValidationBackend.getSessionIssues(
      new GetSessionIssuesRequest({
        startDate: startOfWeek,
        endDate: endOfWeek,
      })
    ),
    calendarBackend.getRoomCalendarEvents(
      new GetRoomCalendarEventsRequest({
        startDate: BigInt(startOfDay.getTime()),
        endDate: BigInt(endOfDay.getTime()),
        roomIds: [],
      })
    ),
  ]);

  const issues = issuesResponse.issues ?? [];
  const urgentIssueTypes = new Set(['room_overlap', 'therapist_overlap', 'therapist_absence_overlap']);
  const urgentIssuesCount = issues.filter((issue: {issueType: string}) => urgentIssueTypes.has(issue.issueType)).length;

  let oldestIssueDays: number | undefined;
  if (issues.length > 0) {
    const oldestDate = issues
      .map((issue: {date: string}) => new Date(`${issue.date}T00:00:00`))
      .filter((d: Date) => !Number.isNaN(d.getTime()))
      .sort((a: Date, b: Date) => a.getTime() - b.getTime())[0];

    if (oldestDate) {
      oldestDate.setHours(0, 0, 0, 0);
      const nowDay = new Date(now);
      nowDay.setHours(0, 0, 0, 0);
      oldestIssueDays = Math.max(
        0,
        Math.floor((nowDay.getTime() - oldestDate.getTime()) / (24 * 60 * 60 * 1000))
      );
    }
  }

  const resources = roomsResponse.resourceMap ?? [];
  const events = roomsResponse.events ?? [];

  const roomResources = resources.filter((resource: {resourceId: string}) =>
    resource.resourceId && resource.resourceId !== ONLINE_RESOURCE_ID
  );
  const totalRooms = roomResources.length;

  const activeRoomEvents = events
    .filter((event: {resourceId: string; start: bigint; end: bigint}) => {
      if (!event.resourceId || event.resourceId === ONLINE_RESOURCE_ID) return false;
      const start = Number(event.start);
      const end = Number(event.end);
      return now.getTime() >= start && now.getTime() < end;
    })
    .sort((a: {end: bigint}, b: {end: bigint}) => Number(a.end) - Number(b.end));
  const bookedRoomIds = new Set(activeRoomEvents.map((event: {resourceId: string}) => event.resourceId));
  const freeRoomsNow = Math.max(totalRooms - bookedRoomIds.size, 0);

  const roomTitleMap = new Map(
    roomResources.map((resource: {resourceId: string; resourceTitle: string}) => [resource.resourceId, resource.resourceTitle])
  );
  const soonestBusyRoom = activeRoomEvents[0];
  const roomBookedUntilLabel = soonestBusyRoom
    ? `${roomTitleMap.get(soonestBusyRoom.resourceId) || soonestBusyRoom.resourceId} booked until ${formatTimeShort(new Date(Number(soonestBusyRoom.end)))}`
    : undefined;

  return {
    openIssuesCount: issues.length,
    urgentIssuesCount,
    oldestIssueDays,
    totalRooms,
    freeRoomsNow,
    roomBookedUntilLabel,
  };
};

const Page: NextPage = () => {
  const {t, i18n} = useTranslation('common');
  const router = useRouter();
  const sections = useSections();
  const {session} = useSession();
  const openSession = useOpenSessionForm();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const today = toDateString(new Date()) || '';

  const todaySessionsRequest = useMemo(
    () =>
      new SelectRequest({
        where: new WhereBuilder<'Session'>().eq('date', today).build(),
        pagination: new Pagination({take: 0, skip: 0}),
      }),
    [today]
  );

  const {data: nextSessionData, isLoading: nextSessionLoading} = useQuery(
    getNextSession,
    new GetNextSessionRequest()
  );
  const {data: todaySessionsData, isLoading: todaySessionsLoading} = useQuery(
    listSessions,
    todaySessionsRequest,
    {
      callOptions: {
        headers: {
          'x-utro-list-count-only': 'true',
        },
      },
    }
  );

  const {data: widgetData, loading: widgetLoading} = useAsync(getHomeWidgetData, {
    args: [],
    initialValue: {
      openIssuesCount: 0,
      urgentIssuesCount: 0,
      totalRooms: 0,
      freeRoomsNow: 0,
    },
  });

  const now = new Date();
  const greetingName = session?.user?.displayName || session?.user?.username || 'there';

  const nextSession = nextSessionData?.session;

  const sessionsTodayCount = Number(todaySessionsData?.pagination?.total ?? 0);

  const nextSessionStart = nextSession ? parseSessionStart(nextSession) : undefined;
  const nextSessionDuration = nextSession ? durationMinutes(nextSession) : undefined;
  const nextSessionEta = nextSessionStart
    ? formatSessionEta(minutesUntil(nextSessionStart, now), t)
    : undefined;

  const homeScreenPath = paths.homeScreen.index();

  const fuse = useMemo(() => {
    const flatItems = flattenItems(sections, t);
    return new Fuse(flatItems, {
      keys: ['translatedTitle', 'translatedSection', 'translatedParent'],
      threshold: 0.4,
      includeMatches: true,
      ignoreLocation: true,
    });
  }, [sections, t]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) {
      return sections;
    }

    const searchResults = fuse.search(searchQuery);
    const matchedItems = new Set(searchResults.map(r => r.item.item));

    const filterItems = (items: Item[]): Item[] => {
      return items
        .map(item => {
          const hasMatch = matchedItems.has(item);
          const filteredChildren = item.items ? filterItems(item.items) : undefined;
          const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

          if (hasMatch || hasMatchingChildren) {
            return {
              ...item,
              ...(filteredChildren ? { items: filteredChildren } : {}),
            } as Item;
          }
          return null;
        })
        .filter((item): item is NonNullable<typeof item> => item !== null) as Item[];
    };

    return sections
      .map(section => {
        const filteredItems = filterItems(section.items);
        if (filteredItems.length > 0) {
          return {
            ...section,
            items: filteredItems,
          };
        }
        return null;
      })
      .filter((section): section is Section => section !== null);
  }, [searchQuery, sections, fuse]);

  const handleCardClick = (path: string | undefined) => {
    if (path) {
      router.push(path);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleOpenCalendar = () => {
    router.push(paths.core.therapistCalendar());
  };

  const handleNewSession = () => {
    openSession({
      entityId: null,
      title: t('Create Session'),
      maxWidth: 'md',
      initialHeight: 780,
      initialWidth: 800,
    });
  };

  return (
    <>
      <Seo title={t('Home Screen')} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 4,
          overflowY: "auto",
        }}
      >
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Box data-testid="home-screen-welcome-widget">
              <Stack spacing={2.5}>
                  <Stack
                    direction={{xs: 'column', md: 'row'}}
                    justifyContent="space-between"
                    alignItems={{xs: 'flex-start', md: 'center'}}
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="h4" sx={{fontWeight: 700}}>
                        {t('Good morning, {{name}}', {name: greetingName})}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{mt: 0.5}}>
                        {t('{{date}} · {{count}} sessions on the books today', {
                          date: formatDateLong(now, i18n.language),
                          count: sessionsTodayCount,
                        })}
                      </Typography>
                    </Box>

                    <Stack direction="row" spacing={1.5}>
                      <Button
                        variant="outlined"
                        startIcon={<CalendarTodayIcon />}
                        onClick={handleOpenCalendar}
                      >
                        {t("Today's calendar")}
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewSession}
                      >
                        {t('New session')}
                      </Button>
                    </Stack>
                  </Stack>

                  <Divider />

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={3}>
                      <Card variant="outlined" sx={{height: '100%'}}>
                        <CardContent>
                          <Typography variant="overline" color="text.secondary" sx={{fontWeight: 700}}>
                            {t('Next Session')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{float: 'right'}}>
                            {nextSessionEta || '-'}
                          </Typography>
                          <Typography variant="h5" sx={{fontWeight: 700, mt: 1}}>
                            {nextSession?.startTime || '--:--'}
                            {' · '}
                            {nextSession?.displayName || nextSession?.therapyLabel || t('No upcoming sessions')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {nextSession
                              ? [
                                  nextSession.roomLabel || t('Online'),
                                  nextSession.therapistLabel,
                                  nextSessionDuration ? `${nextSessionDuration} min` : undefined,
                                ].filter(Boolean).join(' · ')
                              : '-'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Card variant="outlined" sx={{height: '100%'}}>
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="overline" color="text.secondary" sx={{fontWeight: 700}}>
                              {t('Open Issues')}
                            </Typography>
                            {widgetData.urgentIssuesCount > 0 && (
                              <Chip
                                size="small"
                                color="warning"
                                label={t('{{count}} urgent', {count: widgetData.urgentIssuesCount})}
                              />
                            )}
                          </Stack>
                          <Typography variant="h4" sx={{fontWeight: 700, mt: 1}}>
                            {widgetLoading ? '...' : widgetData.openIssuesCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {typeof widgetData.oldestIssueDays === 'number'
                              ? t('Oldest: {{count}} days ago', {count: widgetData.oldestIssueDays})
                              : t('No open issues')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Card variant="outlined" sx={{height: '100%'}}>
                        <CardContent>
                          <Typography variant="overline" color="text.secondary" sx={{fontWeight: 700}}>
                            {t('Rooms Free Now')}
                          </Typography>
                          <Typography
                            variant="h4"
                            sx={{fontWeight: 700, mt: 1}}
                            data-testid="home-screen-rooms-free-count"
                          >
                            {widgetLoading
                              ? '...'
                              : `${widgetData.freeRoomsNow} / ${widgetData.totalRooms}`}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {widgetData.roomBookedUntilLabel || t('All rooms available now')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Card variant="outlined" sx={{height: '100%'}}>
                        <CardContent>
                          <Typography variant="overline" color="text.secondary" sx={{fontWeight: 700}}>
                            {t('Sessions Today')}
                          </Typography>
                          <Typography variant="h4" sx={{fontWeight: 700, mt: 1}}>
                            {nextSessionLoading || todaySessionsLoading ? '...' : sessionsTodayCount}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{mt: 1}}>
                            {t('Scheduled for today')}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  <Divider />

                  <Box data-testid="home-screen-search">
                    <TextField
                      fullWidth
                      size="small"
                      value={searchQuery}
                      placeholder={t('Search anywhere — clients, sessions, settings...')}
                      variant="outlined"
                      onChange={handleSearchChange}
                      inputRef={searchInputRef}
                      inputProps={{ 'data-testid': 'home-screen-search-input' }}
                      InputProps={{
                        sx: {backgroundColor: '#F6F4EE', '&:hover': {backgroundColor: '#F0EEE3'}},
                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        endAdornment: searchQuery ? (
                          <IconButton
                            size="small"
                            onClick={handleClearSearch}
                            data-testid="home-screen-search-clear"
                            sx={{ p: 0.5 }}
                          >
                            <ClearIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.disabled',
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 0.5,
                              px: 0.75,
                              py: 0.25,
                              fontSize: '0.7rem',
                              lineHeight: 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            ⌘K
                          </Typography>
                        ),
                      }}
                    />
                  </Box>
                </Stack>
            </Box>

            {filteredSections.map((section) => {
              const itemsWithoutGroup: CardData[] = [];
              const itemsWithGroup: GroupedCards[] = [];

              section.items.forEach((item) => {
                if (item.items && item.items.length > 0) {
                  const cards: CardData[] = item.items
                    .filter((subItem) => subItem.path && subItem.path !== homeScreenPath)
                    .map((subItem) => ({
                      title: subItem.title,
                      description: subItem.description || '',
                      path: subItem.path,
                      icon: subItem.icon || item.icon,
                    }));

                  if (cards.length > 0) {
                    itemsWithGroup.push({
                      heading: item.title,
                      headingDescription: item.description,
                      cards,
                    });
                  }
                } else if (item.path && item.path !== homeScreenPath) {
                  itemsWithoutGroup.push({
                    title: item.title,
                    description: item.description || '',
                    path: item.path,
                    icon: item.icon,
                  });
                }
              });

              return (
                <React.Fragment key={section.subheader ?? 'section'}>
                  {itemsWithoutGroup.length > 0 && (
                    <Box data-testid={`home-screen-section-${snakeCase(section.subheader ?? 'section')}`}>
                      <Grid container spacing={3} data-testid={`home-screen-section-${snakeCase(section.subheader ?? 'section')}-grid`}>
                        {itemsWithoutGroup.map((card) => (
                          <Grid item xs={12} sm={6} md={4} key={card.title} data-testid={`home-screen-card-${snakeCase(card.title)}`}>
                            <Card
                              variant="outlined"
                              sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <CardActionArea
                                onClick={() => handleCardClick(card.path)}
                                sx={{
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  p: 0,
                                }}
                              >
                                <CardContent sx={{width: '100%', flexGrow: 1}}>
                                  <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                    {card.icon && <Box sx={{mr: 1}}>{card.icon}</Box>}
                                    <Typography variant="h6">{t(card.title)}</Typography>
                                  </Box>
                                  {card.description && (
                                    <Typography variant="body2" color="textSecondary">
                                      {t(card.description)}
                                    </Typography>
                                  )}
                                </CardContent>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {itemsWithGroup.map((group) => (
                    <Box key={group.heading ?? 'group'} data-testid={`home-screen-group-${snakeCase(group.heading ?? 'group')}`}>
                      <Typography variant="h5" gutterBottom sx={{ mb: 1, mt: itemsWithoutGroup.length > 0 ? 2 : 0 }}>
                        {t(group.heading!)}
                      </Typography>
                      {group.headingDescription && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {t(group.headingDescription)}
                        </Typography>
                      )}
                      <Grid container spacing={3} data-testid={`home-screen-group-${snakeCase(group.heading ?? 'group')}-grid`}>
                        {group.cards.map((card) => (
                          <Grid item xs={12} sm={6} md={4} key={card.title} data-testid={`home-screen-group-${snakeCase(group.heading ?? 'group')}-card-${snakeCase(card.title)}`}>
                            <Card
                              variant="outlined"
                              sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                              }}
                            >
                              <CardActionArea
                                onClick={() => handleCardClick(card.path)}
                                sx={{
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-start',
                                  p: 0,
                                }}
                              >
                                <CardContent sx={{width: '100%', flexGrow: 1}}>
                                  <Box sx={{display: 'flex', alignItems: 'center', mb: 2}}>
                                    {card.icon && <Box sx={{mr: 1}}>{card.icon}</Box>}
                                    <Typography variant="h6">{t(card.title)}</Typography>
                                  </Box>
                                  {card.description && (
                                    <Typography variant="body2" color="textSecondary">
                                      {t(card.description)}
                                    </Typography>
                                  )}
                                </CardContent>
                              </CardActionArea>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </React.Fragment>
              );
            })}

            {/* Bug bounty banner */}
            <BugBountyBanner />
          </Stack>
        </Container>
      </Box>
    </>
  );
};

Page.getLayout = (page) => <Layout>{page}</Layout>;

export const getServerSideProps = withTranslations();

export default Page;
