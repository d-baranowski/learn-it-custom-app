import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import Link from 'next/link';
import { paths } from '~/paths';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PersonIcon from '@mui/icons-material/Person';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useAsync } from '~/utils/make-async-hook';
import { sessionValidationBackend } from '~/ui-promise-clients/session-validation';
import { GetSessionIssuesRequest } from '@gen/core/v1/session_validation_pb';
import PureGrid from '~/_lib/grid/pure-grid';
import { GridColumnDef } from '~/_lib/grid/types/column';

interface SessionIssue {
  id: string;
  sessionId: string;
  issueType: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  therapistId?: string;
  therapistLabel?: string;
  roomId?: string;
  roomLabel?: string;
  therapyLabel?: string;
  conflictingSessionId?: string;
  conflictingSessionLabel?: string;
  absenceId?: string;
  absenceReason?: string;
}

const getIssueColor = (issueType: string): 'error' | 'warning' | 'info' => {
  switch (issueType) {
    case 'no_room':
      return 'warning';
    case 'room_overlap':
    case 'therapist_overlap':
      return 'error';
    case 'therapist_absence_overlap':
      return 'error';
    case 'outside_working_hours':
      return 'warning';
    default:
      return 'info';
  }
};

const getIssueLabel = (
  issueType: string,
  t: (key: string) => string
): string => {
  switch (issueType) {
    case 'no_room':
      return t('No Room Assigned');
    case 'room_overlap':
      return t('Room Overlap');
    case 'therapist_overlap':
      return t('Therapist Overlap');
    case 'therapist_absence_overlap':
      return t('Therapist Absent');
    case 'outside_working_hours':
      return t('Outside Working Hours');
    default:
      return issueType;
  }
};

export const SessionIssuesView: React.FC = () => {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [sorting, setSorting] = useState<{ desc: boolean; id: string }[]>([]);
  const [pagination, setPagination] = useState({ pageSize: 14, pageIndex: 0 });

  // Calculate the start and end of the current week + offset
  const { startOfWeek, endOfWeek } = useMemo(() => {
    const start = moment().add(weekOffset, 'weeks').startOf('week');
    const end = moment().add(weekOffset, 'weeks').endOf('week');
    return { startOfWeek: start, endOfWeek: end };
  }, [weekOffset]);

  // Fetch session issues from the API
  const {
    data: issues = [],
    loading,
    refetch,
  } = useAsync(
    async (startDate: string, endDate: string) => {
      const response = await sessionValidationBackend.getSessionIssues(
        new GetSessionIssuesRequest({
          startDate,
          endDate,
        })
      );

      // Convert proto response to our SessionIssue interface
      return response.issues.map((issue) => ({
        id: issue.sessionId,
        sessionId: issue.sessionId,
        issueType: issue.issueType,
        description: issue.description,
        date: issue.date,
        startTime: issue.startTime,
        endTime: issue.endTime,
        therapistId: issue.therapistId,
        therapistLabel: issue.therapistLabel,
        roomId: issue.roomId,
        roomLabel: issue.roomLabel,
        therapyLabel: issue.therapyLabel,
        conflictingSessionId: issue.conflictingSessionId,
        conflictingSessionLabel: issue.conflictingSessionLabel,
        absenceId: issue.absenceId,
        absenceReason: issue.absenceReason,
      }));
    },
    {
      args: [startOfWeek.format('YYYY-MM-DD'), endOfWeek.format('YYYY-MM-DD')],
      initialValue: [],
    }
  );

  const pagedIssues = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return issues.slice(start, end);
  }, [issues, pagination.pageIndex, pagination.pageSize]);

  const buildCalendarLink = (
    issue: SessionIssue,
    calendarType: 'therapist' | 'room'
  ): string => {
    const basePath =
      calendarType === 'therapist'
        ? paths.core.therapistCalendar()
        : paths.core.roomCalendar();
    return `${basePath}?date=${issue.date}&highlightEventId=${issue.sessionId}&view=day`;
  };

  const handlePreviousWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Define columns for the grid
  const columns = useMemo<GridColumnDef<SessionIssue>[]>(
    () => [
      {
        id: 'issueType',
        accessorKey: 'issueType',
        header: t('Issue Type'),
        size: 150,
        Cell: ({ cell }) => (
          <Chip
            label={getIssueLabel(cell.getValue() as string, t)}
            color={getIssueColor(cell.getValue() as string)}
            size="small"
          />
        ),
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: t('Description'),
        size: 300,
        Cell: ({ cell }) => (
          <Typography variant="body2">{cell.getValue() as string}</Typography>
        ),
      },
      {
        id: 'therapyLabel',
        accessorKey: 'therapyLabel',
        header: t('Therapy'),
        size: 150,
        Cell: ({ cell }) => (cell.getValue() as string) || '-',
      },
      {
        id: 'therapistLabel',
        accessorKey: 'therapistLabel',
        header: t('Therapist'),
        size: 150,
        Cell: ({ cell }) => (cell.getValue() as string) || '-',
      },
      {
        id: 'roomLabel',
        accessorKey: 'roomLabel',
        header: t('Room'),
        size: 120,
        Cell: ({ cell }) => (cell.getValue() as string) || '-',
      },
      {
        id: 'datetime',
        accessorFn: (row) => `${row.date} ${row.startTime}`,
        header: t('Date/Time'),
        size: 180,
        Cell: ({ row }) => (
          <Typography variant="body2">
            {row.original.date} {row.original.startTime} -{' '}
            {row.original.endTime}
          </Typography>
        ),
      },
      {
        id: 'actions',
        header: t('Actions'),
        size: 120,
        enableSorting: false,
        Cell: ({ row }) => (
          <Stack direction="row" spacing={0.5}>
            {row.original.therapistId && (
              <Link
                href={buildCalendarLink(row.original, 'therapist')}
                passHref
                legacyBehavior
              >
                <Tooltip title={t('Therapist Calendar')}>
                  <IconButton component="a" size="small" color="primary">
                    <PersonIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Link>
            )}
            {row.original.roomId && (
              <Link
                href={buildCalendarLink(row.original, 'room')}
                passHref
                legacyBehavior
              >
                <Tooltip title={t('Room Calendar')}>
                  <IconButton component="a" size="small" color="primary">
                    <MeetingRoomIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Link>
            )}
          </Stack>
        ),
      },
    ],
    [t]
  );

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Card>
        <CardHeader
          title={t('Session Issues')}
          subheader={`${startOfWeek.format(
            'MMMM D, YYYY'
          )} - ${endOfWeek.format('MMMM D, YYYY')}`}
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t('Refresh Data')}>
                <IconButton
                  onClick={() => void refetch()}
                  color="primary"
                  size="small"
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={handlePreviousWeek}
              >
                {t('Previous Week')}
              </Button>
              <Button size="small" onClick={handleCurrentWeek}>
                {t('Current Week')}
              </Button>
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={handleNextWeek}
              >
                {t('Next Week')}
              </Button>
            </Stack>
          }
        />
        <CardContent sx={{ height: '100%' }}>
          <PureGrid
            columns={columns}
            data={pagedIssues}
            rowCount={issues.length}
            isLoading={loading}
            rowSelection={rowSelection}
            selectRow={(id: string) => {
              setRowSelection((prev) => ({ ...prev, [id]: !prev[id] }));
            }}
            sorting={sorting}
            pagination={pagination}
            columnVisibility={columnVisibility}
            columnOrder={columnOrder}
            hasColumn={(id: string) => columnOrder.includes(id)}
            addColumn={(
              id: string,
              visible: boolean,
              position: string | null | undefined
            ) => {
              setColumnOrder((prev) => {
                if (prev.includes(id)) return prev;
                if (position === 'first') return [id, ...prev];
                if (position === 'last') return [...prev, id];
                return [...prev, id];
              });
              setColumnVisibility((prev) => ({ ...prev, [id]: visible }));
            }}
            onColumnOrderChange={(updater) => {
              if (typeof updater === 'function') {
                setColumnOrder(updater(columnOrder));
              } else {
                setColumnOrder(updater);
              }
            }}
            onColumnVisibilityChange={(updater) => {
              if (typeof updater === 'function') {
                setColumnVisibility(updater(columnVisibility));
              } else {
                setColumnVisibility(updater);
              }
            }}
            onRowSelectionChange={(updater) => {
              if (typeof updater === 'function') {
                setRowSelection(updater(rowSelection));
              } else {
                setRowSelection(updater);
              }
            }}
            onSortingChange={(updater) => {
              if (typeof updater === 'function') {
                setSorting(updater(sorting));
              } else {
                setSorting(updater);
              }
            }}
            onPaginationChange={(updater) => {
              if (typeof updater === 'function') {
                setPagination(updater(pagination));
              } else {
                setPagination(updater);
              }
            }}
            options={{
              enableRowSelection: false,
              enableTopToolbar: false,
              enableBottomToolbar: true,
              enableColumnActions: false,
              enableColumnFilters: false,
              enablePagination: true,
              enableSorting: true,
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );
};
