import React, { ReactElement, useMemo, useState } from 'react';
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
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';

import { Grid, GridFilter } from '@gen/grids';
import { filterBuilder, getFilterLabel } from '~/_lib/grid/filter/builder';
import useQuickFilters from '~/_lib/grid/hooks/use-quick-filters';

interface Props {
  grid: Grid;
}

interface Option {
  id: string;
  label: string;
}

const ACCENT = '#534AB7';

// *Label / *Labels are denormalised projections of *Id / *Ids columns
// (codegen defaults them to filterable). Hide them from the picker unless
// proto explicitly annotates them otherwise via filter.quick.
const isDenormProjection = (id: string): boolean =>
  id.endsWith('Label') || id.endsWith('Labels');

function QuickPanel({ grid }: Props): ReactElement {
  const { t } = useTranslation('common');
  const { quickFilters, setFilters } = useQuickFilters();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const renderedFilterChips = useMemo<ReactElement[]>(() => {
    const out: ReactElement[] = [];
    quickFilters.forEach((id, idx) => {
      const f = grid.filters.find((gf) => gf.id === id);
      if (!f) return;
      const groups = filterBuilder([f], t, true);
      Object.values(groups).forEach((g) => {
        g.elements.forEach((el, ei) => {
          out.push(React.cloneElement(el, { key: `${idx}-${id}-${ei}` }));
        });
      });
    });
    return out;
  }, [quickFilters, grid.filters, t]);

  const labelById = useMemo<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    grid.filters.forEach((f) => {
      m[f.id] = t(getFilterLabel(f, true));
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.filters, t]);

  const activeIds = useMemo<string[]>(
    () => quickFilters.filter((id) => grid.filters.some((f) => f.id === id)),
    [quickFilters, grid.filters]
  );

  const availableOptions = useMemo<Option[]>(() => {
    const q = search.trim().toLowerCase();
    return grid.filters
      .filter(
        (f) =>
          (f.form || f.quick) &&
          !isDenormProjection(f.id) &&
          !quickFilters.includes(f.id)
      )
      .map((f) => ({ id: f.id, label: t(getFilterLabel(f, true)) }))
      .filter((o) => !q || o.label.toLowerCase().includes(q))
      .sort((a, b) => a.label.localeCompare(b.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid.filters, quickFilters, search, t]);

  const handleAdd = (id: string) => setFilters([...quickFilters, id]);
  const handleRemove = (id: string) =>
    setFilters(quickFilters.filter((qf) => qf !== id));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(String(e.active.id));
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = activeIds.indexOf(String(active.id));
    const newIdx = activeIds.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    setFilters(arrayMove(activeIds, oldIdx, newIdx));
  };

  const open = !!anchorEl;

  return (
    <div style={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          marginBottom: 1,
          alignItems: 'center',
        }}
      >
        <Tooltip title={t('Edit Quick Filters')}>
          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            data-testid="edit-quick-filters-btn"
            sx={{ flexShrink: 0 }}
          >
            <TuneIcon />
          </IconButton>
        </Tooltip>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { height: 6 },
            // Scoped chip styling: smaller adornment icons, no focus halo.
            '& .MuiFilledInput-root, & .MuiAutocomplete-inputRoot': {
              boxShadow: 'none !important',
            },
            '& .MuiFilledInput-root.Mui-focused': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
            '& .MuiInputAdornment-root svg': {
              fontSize: '14px',
              width: '14px',
              height: '14px',
            },
            '& .MuiInputAdornment-root .MuiIconButton-root svg': {
              fontSize: '14px',
            },
          }}
        >
          {renderedFilterChips}
        </Box>
      </Box>

      <Popper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-start"
        transition
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={120}>
            <Paper
              sx={{
                width: 320,
                p: 0.5,
                mt: 0.5,
                borderRadius: '8px',
                border: '0.5px solid #E0DED5',
                boxShadow: '0 12px 24px -6px rgba(16,24,40,0.15)',
              }}
            >
              <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                <Box>
                  <Box sx={{ p: '12px 14px 10px' }}>
                    <Typography
                      sx={{ fontSize: 13, fontWeight: 500, color: '#2C2C2A' }}
                    >
                      {t('Quick Filters')}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11, color: '#5F5E5A', mt: '1px' }}
                    >
                      {t('Pick which filters appear on the bar.')}
                    </Typography>
                  </Box>

                  <Box sx={{ px: 0.75, pb: 0.5 }}>
                    <Box
                      sx={{
                        px: 1,
                        pb: '6px',
                        pt: '4px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        fontWeight: 500,
                        color: '#888780',
                        letterSpacing: '0.6px',
                      }}
                    >
                      <span>{t('On Bar').toUpperCase()}</span>
                      <span style={{ color: ACCENT }}>{activeIds.length}</span>
                    </Box>

                    {activeIds.length === 0 ? (
                      <Box
                        sx={{
                          p: '8px 10px',
                          fontSize: 12,
                          color: '#888780',
                          fontStyle: 'italic',
                        }}
                      >
                        {t('No filters on bar yet.')}
                      </Box>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={activeIds}
                          strategy={verticalListSortingStrategy}
                        >
                          <Box>
                            {activeIds.map((id) => (
                              <ActiveRow
                                key={id}
                                id={id}
                                label={labelById[id] ?? id}
                                onRemove={() => handleRemove(id)}
                                removeAria={t('Remove from bar')}
                                locked={
                                  draggingId !== null && draggingId !== id
                                }
                              />
                            ))}
                          </Box>
                        </SortableContext>
                      </DndContext>
                    )}
                  </Box>

                  <Box
                    sx={{
                      height: '0.5px',
                      bgcolor: '#E0DED5',
                      mx: 1,
                      my: 1,
                    }}
                  />

                  <Box sx={{ px: 0.75, pb: 1 }}>
                    <Box
                      sx={{
                        px: 1,
                        pb: '6px',
                        fontSize: 10,
                        fontWeight: 500,
                        color: '#888780',
                        letterSpacing: '0.6px',
                      }}
                    >
                      {t('Available').toUpperCase()}
                    </Box>

                    <TextField
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('Search field...')}
                      fullWidth
                      variant="filled"
                      size="small"
                      hiddenLabel
                      sx={{
                        mx: '2px',
                        mb: '4px',
                        width: 'calc(100% - 4px)',
                        '& .MuiFilledInput-root': {
                          minHeight: 0,
                          bgcolor: '#F6F4EE',
                        },
                        '& .MuiFilledInput-input': {
                          padding: '6px 10px',
                          fontSize: 12,
                        },
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ ml: '4px' }}>
                            <SearchIcon
                              sx={{ fontSize: 14, color: '#888780' }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                      {availableOptions.length === 0 ? (
                        <Box
                          sx={{
                            p: '7px 10px',
                            fontSize: 12,
                            color: '#888780',
                            fontStyle: 'italic',
                          }}
                        >
                          {t('No filters available')}
                        </Box>
                      ) : (
                        availableOptions.map((opt) => (
                          <Box
                            key={opt.id}
                            onClick={() => handleAdd(opt.id)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: '7px 10px',
                              borderRadius: '5px',
                              cursor: 'pointer',
                              fontSize: 13,
                              color: '#2C2C2A',
                              '&:hover': { bgcolor: '#F6F4EE' },
                            }}
                          >
                            <AddIcon sx={{ fontSize: 14, color: ACCENT }} />
                            <Box sx={{ flex: 1 }}>{opt.label}</Box>
                          </Box>
                        ))
                      )}
                    </Box>
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </div>
  );
}

interface ActiveRowProps {
  id: string;
  label: string;
  onRemove: () => void;
  removeAria: string;
  locked: boolean;
}

const ActiveRow: React.FC<ActiveRowProps> = ({
  id,
  label,
  onRemove,
  removeAria,
  locked,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: '#FFFFFF',
    position: 'relative',
    zIndex: isDragging ? 1 : 0,
    opacity: locked ? 0.4 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          p: '7px 8px',
          borderRadius: '5px',
          userSelect: 'none',
          '&:hover': { bgcolor: locked ? 'transparent' : '#F6F4EE' },
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
            color: '#888780',
            p: '2px',
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 14 }} />
        </Box>
        <Box sx={{ flex: 1, fontSize: 13, color: '#2C2C2A' }}>{label}</Box>
        <IconButton
          size="small"
          onClick={onRemove}
          disabled={locked}
          sx={{ p: 0.25 }}
          aria-label={removeAria}
        >
          <CloseIcon sx={{ fontSize: 14, color: '#888780' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default QuickPanel;
