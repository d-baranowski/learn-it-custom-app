import React, { useContext, useMemo } from 'react';
import { DateLocalizer, Navigate, ViewProps, Views } from 'react-big-calendar';
import Calendar from 'react-calendar';
import { Box, Typography } from '@mui/material';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { ResourceDataContext } from '~/_lib/calendar/components/ResourceDataContext';
import { dayKey } from '~/_lib/calendar/utils/day-key';

const HEAT_LEVELS = 5;

function heatLevel(count: number, max: number): number {
  if (count <= 0 || max <= 0) return 0;
  return Math.min(HEAT_LEVELS, Math.max(1, Math.ceil((count / max) * HEAT_LEVELS)));
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function YearView(props: ViewProps) {
  const { date, localizer } = props;
  const { i18n, t } = useTranslation();
  const locale = i18n.language || 'en';
  const { handleNavigateToView, yearDayCounts } = useContext(ResourceDataContext);

  const year = (date as Date).getFullYear();
  const months = YearView.range(date as Date, { localizer });

  const { monthTotals, yearTotal, maxDayCount } = useMemo(() => {
    const monthTotals = new Array(12).fill(0);
    let yearTotal = 0;
    let maxDayCount = 0;
    yearDayCounts.forEach((count, key) => {
      const parsed = moment(key, 'YYYY-MM-DD');
      if (parsed.year() !== year) return;
      monthTotals[parsed.month()] += count;
      yearTotal += count;
      if (count > maxDayCount) maxDayCount = count;
    });
    return { monthTotals, yearTotal, maxDayCount };
  }, [yearDayCounts, year]);

  return (
    <Box className="rpg-year-view" sx={{ height: '100%', overflowY: 'auto', p: 1 }}>
      <Box className="rpg-year-legend">
        <Box className="rpg-year-legend-scale">
          <Typography component="span" className="rpg-year-legend-label">
            {t('Fewer sessions')}
          </Typography>
          {Array.from({ length: HEAT_LEVELS }, (_, i) => (
            <Box
              key={i}
              component="span"
              className={`rpg-year-swatch rpg-year-heat-${i + 1}`}
            />
          ))}
          <Typography component="span" className="rpg-year-legend-label">
            {t('More sessions')}
          </Typography>
        </Box>
        <Box className="rpg-year-legend-scale">
          <Box component="span" className="rpg-year-swatch rpg-year-today-swatch" />
          <Typography component="span" className="rpg-year-legend-label">
            {t('Today')}
          </Typography>
        </Box>
        <Typography className="rpg-year-total">
          <strong>{yearTotal.toLocaleString(locale)}</strong>{' '}
          {t('sessions in {{year}}', { year })}
        </Typography>
      </Box>

      <Box className="rpg-year-grid">
        {months.map((month, index) => (
          <Box key={index} className="rpg-year-month-card">
            <Box className="rpg-year-month-header">
              <Typography component="span" className="rpg-year-month-name">
                {capitalize(moment(month).format('MMMM'))}
              </Typography>
              <Typography component="span" className="rpg-year-month-total">
                {monthTotals[index]}
              </Typography>
            </Box>
            <Calendar
              locale={locale}
              calendarType="iso8601"
              showNavigation={false}
              showNeighboringMonth={false}
              maxDetail="month"
              minDetail="month"
              activeStartDate={month}
              formatShortWeekday={(_l, d) => moment(d).format('dd').toUpperCase()}
              tileClassName={({ date: tileDate, view }) => {
                if (view !== 'month') return null;
                const level = heatLevel(
                  yearDayCounts.get(dayKey(tileDate)) ?? 0,
                  maxDayCount
                );
                return `rpg-year-tile rpg-year-heat-${level}`;
              }}
              onClickDay={(day) => {
                const noon = new Date(day);
                noon.setHours(12, 0, 0, 0);
                handleNavigateToView(noon, Views.DAY);
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

YearView.range = (date: Date, { localizer }: { localizer: DateLocalizer }) => {
  const start = localizer.startOf(date, 'year');
  const end = localizer.endOf(date, 'year');

  const range = [];
  let current = start;

  while (localizer.lte(current, end, 'year')) {
    range.push(current);
    current = localizer.add(current, 1, 'month');
  }

  return range;
};

YearView.navigate = (
  date: Date,
  action: 'PREV' | 'NEXT' | 'TODAY' | 'DATE' | Date,
  { localizer }: { localizer: DateLocalizer }
) => {
  if (action instanceof Date) return action;

  switch (action) {
    case Navigate.NEXT:
      return localizer.add(date, 1, 'year');
    case Navigate.PREVIOUS:
      return localizer.add(date, -1, 'year');
    default:
      return date;
  }
};

YearView.title = (date: Date, { localizer }: { localizer: DateLocalizer }) => {
  return localizer.format(date, 'YYYY');
};
