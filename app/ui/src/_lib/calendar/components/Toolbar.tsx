import React, { useContext, useRef, useState } from 'react';
import { Navigate, NavigateAction } from 'react-big-calendar';
import moment from 'moment';
import { useTranslation } from 'next-i18next';
import { useAsyncCtx } from '~/utils/make-async-hook';
import { ResourceDataContext } from './ResourceDataContext';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RefreshIcon from '@mui/icons-material/Refresh';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Menu, MenuItem, Tooltip } from '@mui/material';

type ToolbarProps = {
  date?: Date;
  view: string;
  views: string[];
  label: React.ReactNode;
  localizer?: { messages: Record<string, string> };
  onNavigate: (action: NavigateAction) => void;
  onView: (view: string) => void;
};

// The period each view keeps in sight, so "Today" only disables when today is
// already visible. Compact is week-based; year spans a whole year.
const todayPeriodByView: Record<string, moment.unitOfTime.StartOf> = {
  day: 'day',
  week: 'week',
  month: 'month',
  year: 'year',
  compact: 'week',
};

export default function Toolbar(props: ToolbarProps) {
  const { date, localizer, label, views, view, onNavigate, onView } = props;
  const messages = localizer?.messages ?? {};

  const isOnToday = date
    ? moment(date).isSame(moment(), todayPeriodByView[view] ?? 'day')
    : false;

  const handleNavigate = (action: NavigateAction) => onNavigate(action);
  const handleView = (nextView: string) => onView(nextView);
  const { t } = useTranslation('common');
  const { refetch } = useAsyncCtx();
  const {
    filterComponent: Filter,
    filters,
    setFilters,
  } = useContext(ResourceDataContext);

  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="rbc-toolbar rbc-toolbar-redesign">
      <div className="rbc-toolbar-row-top">
        <span className="rbc-btn-group">
          {isOnToday ? (
            <button type="button" data-testid="calendar-today-btn" disabled>
              {messages.today}
            </button>
          ) : (
            <Tooltip title={messages.today} arrow>
              <button type="button" data-testid="calendar-today-btn" onClick={() => handleNavigate(Navigate.TODAY)}>
                {messages.today}
              </button>
            </Tooltip>
          )}
          <span className="rbc-nav-group">
            <Tooltip title={messages.previous} arrow>
              <button type="button" data-testid="calendar-prev-btn" className="rbc-nav-btn" onClick={() => handleNavigate(Navigate.PREVIOUS)}>
                <ChevronLeftIcon sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>
            <Tooltip title={messages.next} arrow>
              <button type="button" data-testid="calendar-next-btn" className="rbc-nav-btn" onClick={() => handleNavigate(Navigate.NEXT)}>
                <ChevronRightIcon sx={{ fontSize: 20 }} />
              </button>
            </Tooltip>
          </span>
        </span>

        <span className="rbc-toolbar-label">{label}</span>

        <span className="rbc-toolbar-actions">
          <Tooltip title={t('Refresh')} arrow>
            <button type="button" className="rbc-refresh-btn" onClick={() => refetch()}>
              <RefreshIcon sx={{ fontSize: 20 }} />
            </button>
          </Tooltip>

          {views.length > 1 && (
            <>
              <Tooltip title={t('Change view')} arrow>
                <button
                  type="button"
                  ref={viewBtnRef}
                  className="rbc-view-dropdown-btn"
                  onClick={() => setViewMenuOpen(true)}
                >
                  {messages[view] || view}
                  <KeyboardArrowDownIcon sx={{ fontSize: 18, ml: 0.5 }} />
                </button>
              </Tooltip>
              <Menu
                anchorEl={viewBtnRef.current}
                open={viewMenuOpen}
                onClose={() => setViewMenuOpen(false)}
              >
                {views.map((name) => (
                  <MenuItem
                    key={name}
                    selected={name === view}
                    onClick={() => {
                      handleView(name);
                      setViewMenuOpen(false);
                    }}
                  >
                    {messages[name]}
                  </MenuItem>
                ))}
              </Menu>
            </>
          )}
        </span>
      </div>

      {Filter && (
        <div className="rbc-toolbar-row-filters">
          <Filter filters={filters} setFilters={setFilters} />
        </div>
      )}
    </div>
  );
}
