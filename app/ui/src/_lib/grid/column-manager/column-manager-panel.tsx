import React, { ReactNode, useMemo, useState } from 'react';
import { useTranslation } from 'next-i18next';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

export interface ColumnManagerItem {
  id: string;
  label: string;
  visible: boolean;
}

interface Props {
  columns: ColumnManagerItem[];
  onToggleVisibility: (id: string) => void;
  onReorderVisible: (orderedVisibleIds: string[]) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  onReset: () => void;
  onClose: () => void;
}

const ACCENT = '#534AB7';
const HIGHLIGHT = '#FFF5C2';
const TEXT_PRIMARY = '#2C2C2A';
const TEXT_SECONDARY = '#5F5E5A';
const TEXT_MUTED = '#888780';
const DIVIDER = '#E0DED5';
const FIELD_BG = '#F6F4EE';
const HOVER_BG = '#F6F4EE';

const matches = (label: string, query: string): boolean =>
  !query || label.toLowerCase().includes(query);

function highlight(label: string, query: string): ReactNode {
  if (!query) return label;
  const lower = label.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < label.length) {
    const idx = lower.indexOf(query, i);
    if (idx === -1) {
      out.push(label.slice(i));
      break;
    }
    if (idx > i) out.push(label.slice(i, idx));
    out.push(
      <Box
        key={key++}
        component="span"
        data-testid="column-match-highlight"
        sx={{ bgcolor: HIGHLIGHT, borderRadius: '2px' }}
      >
        {label.slice(idx, idx + query.length)}
      </Box>,
    );
    i = idx + query.length;
  }
  return out;
}

const sectionHeaderSx = {
  px: 1,
  pb: '6px',
  pt: '4px',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 10,
  fontWeight: 500,
  color: TEXT_MUTED,
  letterSpacing: '0.6px',
} as const;

const emptySx = {
  p: '8px 10px',
  fontSize: 12,
  color: TEXT_MUTED,
  fontStyle: 'italic',
} as const;

const footerBtnSx = {
  flex: 1,
  px: '10px',
  py: '7px',
  minWidth: 0,
  fontSize: 12,
  color: TEXT_SECONDARY,
  borderRadius: '5px',
  cursor: 'pointer',
  textTransform: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
  userSelect: 'none',
  '&:hover': { bgcolor: HOVER_BG },
} as const;

function ColumnManagerPanel(props: Props): React.ReactElement {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();

  const visible = useMemo(
    () => props.columns.filter((c) => c.visible),
    [props.columns],
  );
  const hidden = useMemo(
    () => props.columns.filter((c) => !c.visible),
    [props.columns],
  );

  const filteredVisible = useMemo(
    () => visible.filter((c) => matches(c.label, query)),
    [visible, query],
  );
  const filteredHidden = useMemo(
    () => hidden.filter((c) => matches(c.label, query)),
    [hidden, query],
  );

  const visibleIds = useMemo(() => visible.map((c) => c.id), [visible]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (e: DragStartEvent) =>
    setDraggingId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = visibleIds.indexOf(String(active.id));
    const newIdx = visibleIds.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    props.onReorderVisible(arrayMove(visibleIds, oldIdx, newIdx));
  };

  // Reordering only makes sense over the full visible list; while a search is
  // active we render a flat, non-draggable result set instead.
  const canReorder = query === '';

  const renderCount = (matched: number, total: number): string =>
    query ? t('{{count}} of {{total}}', { count: matched, total }) : String(total);

  return (
    <Box>
      <Box
        sx={{
          p: '12px 14px 10px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 500, color: TEXT_PRIMARY }}>
            {t('Columns')}
          </Typography>
          <Typography sx={{ fontSize: 11, color: TEXT_SECONDARY, mt: '1px' }}>
            {t('Drag visible columns to reorder.')}
          </Typography>
        </Box>
        <Tooltip title={t('Close')}>
          <IconButton
            size="small"
            onClick={props.onClose}
            data-testid="column-manager-close"
            aria-label={t('Close')}
            sx={{ p: 0.25, color: TEXT_MUTED }}
          >
            <CloseIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ px: 0.75, pb: 0.75 }}>
        <TextField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search columns...')}
          fullWidth
          variant="filled"
          size="small"
          hiddenLabel
          inputProps={{ 'data-testid': 'column-manager-search' }}
          sx={{
            mx: '2px',
            width: 'calc(100% - 4px)',
            '& .MuiFilledInput-root': { minHeight: 0, bgcolor: FIELD_BG },
            '& .MuiFilledInput-input': { padding: '6px 10px', fontSize: 12 },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: '4px' }}>
                <SearchIcon sx={{ fontSize: 14, color: TEXT_MUTED }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearch('')}
                  data-testid="column-manager-search-clear"
                  aria-label={t('Clear')}
                  sx={{ p: 0.25 }}
                >
                  <CloseIcon sx={{ fontSize: 13, color: TEXT_MUTED }} />
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
        />
      </Box>

      <Box sx={{ px: 0.75, pb: 0.5 }}>
        <Box sx={sectionHeaderSx}>
          <span>{t('Visible').toUpperCase()}</span>
          <span style={{ color: ACCENT }} data-testid="column-manager-visible-count">
            {renderCount(filteredVisible.length, visible.length)}
          </span>
        </Box>

        {filteredVisible.length === 0 ? (
          <Box sx={emptySx} data-testid="column-manager-visible-empty">
            {query
              ? t('No visible columns match "{{query}}".', { query: search.trim() })
              : t('No visible columns.')}
          </Box>
        ) : canReorder ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibleIds}
              strategy={verticalListSortingStrategy}
            >
              <Box>
                {filteredVisible.map((col) => (
                  <VisibleRow
                    key={col.id}
                    column={col}
                    query={query}
                    locked={draggingId !== null && draggingId !== col.id}
                    hideAria={t('Hide column')}
                    onToggle={() => props.onToggleVisibility(col.id)}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        ) : (
          <Box>
            {filteredVisible.map((col) => (
              <StaticVisibleRow
                key={col.id}
                column={col}
                query={query}
                hideAria={t('Hide column')}
                onToggle={() => props.onToggleVisibility(col.id)}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ height: '0.5px', bgcolor: DIVIDER, mx: 1, my: 0.5 }} />

      <Box sx={{ px: 0.75, pb: 0.5 }}>
        <Box sx={sectionHeaderSx}>
          <span>{t('Hidden').toUpperCase()}</span>
          <span style={{ color: TEXT_SECONDARY }} data-testid="column-manager-hidden-count">
            {renderCount(filteredHidden.length, hidden.length)}
          </span>
        </Box>

        {filteredHidden.length === 0 ? (
          <Box sx={emptySx} data-testid="column-manager-hidden-empty">
            {query
              ? t('No hidden columns match "{{query}}".', { query: search.trim() })
              : t('No hidden columns.')}
          </Box>
        ) : (
          <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: '2px' }}>
            {filteredHidden.map((col) => (
              <HiddenRow
                key={col.id}
                column={col}
                query={query}
                showAria={t('Show column')}
                onToggle={() => props.onToggleVisibility(col.id)}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ height: '0.5px', bgcolor: DIVIDER, mx: 0.5, my: 0.5 }} />

      <Box sx={{ display: 'flex', gap: 0.5, p: 0.5 }}>
        <Box
          component="button"
          type="button"
          onClick={props.onHideAll}
          data-testid="column-manager-hide-all"
          sx={{ ...footerBtnSx, border: 'none', bgcolor: 'transparent' }}
        >
          {t('Hide all')}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={props.onShowAll}
          data-testid="column-manager-show-all"
          sx={{ ...footerBtnSx, border: 'none', bgcolor: 'transparent' }}
        >
          {t('Show all')}
        </Box>
        <Box
          component="button"
          type="button"
          onClick={props.onReset}
          data-testid="column-manager-reset"
          sx={{ ...footerBtnSx, border: 'none', bgcolor: 'transparent' }}
        >
          <RestartAltIcon sx={{ fontSize: 13 }} />
          {t('Reset')}
        </Box>
      </Box>
    </Box>
  );
}

interface RowProps {
  column: ColumnManagerItem;
  query: string;
  onToggle: () => void;
}

const visibleRowSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 0.75,
  p: '7px 8px',
  borderRadius: '5px',
  userSelect: 'none',
} as const;

function VisibleRow({
  column,
  query,
  locked,
  hideAria,
  onToggle,
}: RowProps & { locked: boolean; hideAria: string }): React.ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: '#FFFFFF',
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
    opacity: locked ? 0.4 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} data-testid={`column-row-${column.id}`}>
      <Box
        sx={{
          ...visibleRowSx,
          '&:hover': { bgcolor: locked ? 'transparent' : HOVER_BG },
        }}
      >
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none',
            color: TEXT_MUTED,
            p: '2px',
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 14 }} />
        </Box>
        <Box sx={{ flex: 1, fontSize: 13, color: TEXT_PRIMARY }}>
          {highlight(column.label, query)}
        </Box>
        <IconButton
          size="small"
          onClick={onToggle}
          disabled={locked}
          data-testid={`column-toggle-${column.id}`}
          aria-label={hideAria}
          sx={{ p: 0.25 }}
        >
          <VisibilityOffOutlinedIcon sx={{ fontSize: 14, color: TEXT_MUTED }} />
        </IconButton>
      </Box>
    </Box>
  );
}

function StaticVisibleRow({
  column,
  query,
  hideAria,
  onToggle,
}: RowProps & { hideAria: string }): React.ReactElement {
  return (
    <Box data-testid={`column-row-${column.id}`}>
      <Box sx={{ ...visibleRowSx, '&:hover': { bgcolor: HOVER_BG } }}>
        <Box sx={{ flex: 1, fontSize: 13, color: TEXT_PRIMARY, pl: '2px' }}>
          {highlight(column.label, query)}
        </Box>
        <IconButton
          size="small"
          onClick={onToggle}
          data-testid={`column-toggle-${column.id}`}
          aria-label={hideAria}
          sx={{ p: 0.25 }}
        >
          <VisibilityOffOutlinedIcon sx={{ fontSize: 14, color: TEXT_MUTED }} />
        </IconButton>
      </Box>
    </Box>
  );
}

function HiddenRow({
  column,
  query,
  showAria,
  onToggle,
}: RowProps & { showAria: string }): React.ReactElement {
  return (
    <Box
      role="button"
      onClick={onToggle}
      data-testid={`column-row-${column.id}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: '7px 10px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: 13,
        color: TEXT_PRIMARY,
        '&:hover': { bgcolor: HOVER_BG },
      }}
    >
      <AddIcon
        sx={{ fontSize: 14, color: ACCENT }}
        data-testid={`column-toggle-${column.id}`}
        aria-label={showAria}
      />
      <Box sx={{ flex: 1 }}>{highlight(column.label, query)}</Box>
    </Box>
  );
}

export default ColumnManagerPanel;
