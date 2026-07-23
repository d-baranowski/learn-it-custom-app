import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'next-i18next';
import Box from '@mui/material/Box';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Tooltip from '@mui/material/Tooltip';
import { SxProps } from '@mui/material/styles';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';

import { useGridDispatch, useGridSelector } from '~/_lib/grid/state/hooks';
import { useGridSettings } from '~/_lib/grid/context/grid-settings-context';
import { useColumnOrder, useColumnVisibility } from '~/_lib/grid/hooks/use-grid-state';
import {
  columnChangeOrder,
  columnChangeVisibility,
  columnManagerToggle,
  columnsReset,
} from '~/_lib/grid/state/grids-slice';
import ColumnManagerPanel, {
  ColumnManagerItem,
} from '~/_lib/grid/column-manager/column-manager-panel';

interface Props {
  sx?: SxProps;
}

const ColumnManagerBtn: React.FunctionComponent<Props> = function ColumnManagerBtn(
  props,
) {
  const { t } = useTranslation('common');
  const { gridName } = useGridSettings();
  const dispatch = useGridDispatch();

  const columnVisibility = useColumnVisibility(gridName);
  const columnOrder = useColumnOrder(gridName);
  const storeColumns = useGridSelector(
    (state) => state?.grids?.byName[gridName]?.columns,
  );

  const btnRef = useRef<HTMLButtonElement>(null);
  const columnManagerOpen = useGridSelector(
    (state) => state?.grids?.byName[gridName]?.columnManagerOpen ?? false,
  );

  const byId = useMemo(
    () => new Map((storeColumns ?? []).map((c) => [c.id, c])),
    [storeColumns],
  );

  // Manageable columns (everything except MRT's internal display columns) in
  // their persisted order, with translated labels and current visibility.
  const items = useMemo<ColumnManagerItem[]>(() => {
    const seen = new Set<string>();
    const out: ColumnManagerItem[] = [];
    const push = (id: string) => {
      if (seen.has(id) || id.startsWith('mrt-')) return;
      const col = byId.get(id);
      if (!col) return;
      seen.add(id);
      out.push({ id, label: t(col.header), visible: columnVisibility[id] !== false });
    };
    columnOrder.forEach(push);
    (storeColumns ?? []).forEach((c) => push(c.id));
    return out;
  }, [columnOrder, storeColumns, byId, columnVisibility, t]);

  const manageableIds = useMemo(() => items.map((i) => i.id), [items]);

  const handleToggle = useCallback(
    (id: string) => {
      const visible = columnVisibility[id] !== false;
      dispatch(
        columnChangeVisibility({
          name: gridName,
          columnVisibility: { ...columnVisibility, [id]: !visible },
        }),
      );
    },
    [columnVisibility, dispatch, gridName],
  );

  const handleReorderVisible = useCallback(
    (newVisibleIds: string[]) => {
      const visibleSet = new Set(
        items.filter((i) => i.visible).map((i) => i.id),
      );
      const queue = [...newVisibleIds];
      // Permute only the visible slots within the full order; hidden and
      // display columns keep their positions.
      const newOrder = columnOrder.map((id) =>
        visibleSet.has(id) ? queue.shift() ?? id : id,
      );
      dispatch(columnChangeOrder({ name: gridName, updater: newOrder }));
    },
    [columnOrder, items, dispatch, gridName],
  );

  const setAllVisibility = useCallback(
    (visible: boolean) => {
      const next = { ...columnVisibility };
      manageableIds.forEach((id) => {
        next[id] = visible;
      });
      dispatch(columnChangeVisibility({ name: gridName, columnVisibility: next }));
    },
    [columnVisibility, manageableIds, dispatch, gridName],
  );

  const handleReset = useCallback(
    () => dispatch(columnsReset({ name: gridName })),
    [dispatch, gridName],
  );

  const close = useCallback(() => {
    dispatch(columnManagerToggle({ name: gridName, open: false }));
  }, [dispatch, gridName]);

  return (
    <>
      <Tooltip arrow title={t('Manage columns')} placement="top">
        <IconButton
          ref={btnRef}
          sx={{
            ...props.sx,
            color: columnManagerOpen ? 'primary.main' : 'text.secondary',
            transition: 'color 0.2s ease',
            '&:hover': {
              color: 'primary.main',
            },
          }}
          onClick={() => dispatch(columnManagerToggle({ name: gridName }))}
          data-testid="column-manager-btn"
          aria-label={t('Manage columns')}
        >
          <ViewColumnOutlinedIcon />
        </IconButton>
      </Tooltip>

      <Popper
        open={columnManagerOpen}
        anchorEl={btnRef.current}
        placement="bottom-end"
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
              <ClickAwayListener onClickAway={close}>
                <Box>
                  <ColumnManagerPanel
                    columns={items}
                    onToggleVisibility={handleToggle}
                    onReorderVisible={handleReorderVisible}
                    onShowAll={() => setAllVisibility(true)}
                    onHideAll={() => setAllVisibility(false)}
                    onReset={handleReset}
                    onClose={close}
                  />
                </Box>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
};

export default ColumnManagerBtn;
