'use client';

import React from 'react';
import {useTranslation} from 'next-i18next';
import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import {viewAdd} from '~/_lib/grid/state/grids-slice';
import useGridView from '~/_lib/grid/hooks/use-grid-view';
import GridViewPopover from './grid-view-popover';
import GridViewNamePopover from './grid-view-name-popover';

const GridViewPill: React.FC = () => {
  const {t} = useTranslation('common');
  const {gridName} = useGridSettings();
  const dispatch = useGridDispatch();
  const {activeView, save, isDirty} = useGridView();
  const views = useGridSelector(s => s?.grids?.views?.[gridName]) || [];

  const pillRef = React.useRef<HTMLDivElement | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [nameAnchorEl, setNameAnchorEl] = React.useState<HTMLElement | null>(null);

  const isDefaultView = !activeView;
  const viewLabel = activeView?.viewName ?? t('Default');
  // Default is always treated as dirty: any current layout is implicitly
  // a candidate to be saved as a new view.
  const effectiveDirty = isDefaultView || isDirty;
  const showSaveIcon = effectiveDirty && !isDefaultView;
  const open = Boolean(anchorEl);

  const openPopover = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const closePopover = () => setAnchorEl(null);

  const onSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    save();
  };

  const openSaveAs = () => {
    closePopover();
    setNameAnchorEl(pillRef.current);
  };

  const submitSaveAs = (name: string, fromCurrent: boolean) => {
    dispatch(viewAdd({gridName, viewName: name, fromBase: !fromCurrent}));
    setNameAnchorEl(null);
  };

  return (
    <>
      <Box
        ref={pillRef}
        onClick={openPopover}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          height: 32,
          pl: 1.25,
          pr: 0.5,
          borderRadius: 1.5,
          backgroundColor: open ? 'primary.lighter' : 'background.default',
          border: '0.5px solid',
          borderColor: open ? 'primary.main' : 'divider',
          cursor: 'pointer',
          color: 'text.primary',
          fontSize: 13,
          userSelect: 'none',
          '&:hover': {borderColor: open ? 'primary.main' : 'text.secondary'},
        }}
        data-testid="grid-view-pill"
      >
        <BookmarkBorderRoundedIcon sx={{fontSize: 15, color: open ? 'primary.main' : 'text.secondary'}} />
        <Box component="span" sx={{color: 'text.secondary', fontSize: 11}}>{t('View:')}</Box>
        <Box component="span" sx={{fontWeight: 500, mr: 0.25}}>{viewLabel}</Box>

        {showSaveIcon && (
          <Tooltip
            title={t('Save changes in "{{name}}"', {name: viewLabel})}
            placement="bottom"
            arrow
          >
            <IconButton
              onClick={onSaveClick}
              data-testid="grid-view-save"
              size="small"
              sx={{
                width: 22,
                height: 22,
                borderRadius: 1,
                border: '0.5px solid',
                borderColor: 'primary.main',
                backgroundColor: 'primary.lighter',
                color: 'primary.main',
                p: 0,
                '&:hover': {backgroundColor: 'primary.light'},
              }}
            >
              <SaveOutlinedIcon sx={{fontSize: 14}} />
            </IconButton>
          </Tooltip>
        )}

        {/* Default view path: surface a quick "save as new" icon since there is nothing to save over */}
        {isDefaultView && effectiveDirty && (
          <Tooltip
            title={t('Save current changes as a new view')}
            placement="bottom"
            arrow
          >
            <IconButton
              onClick={(e) => {e.stopPropagation(); openSaveAs();}}
              data-testid="grid-view-save-as"
              size="small"
              sx={{
                width: 22,
                height: 22,
                borderRadius: 1,
                border: '0.5px solid',
                borderColor: 'primary.main',
                backgroundColor: 'primary.lighter',
                color: 'primary.main',
                p: 0,
              }}
            >
              <NoteAddOutlinedIcon sx={{fontSize: 14}} />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{display: 'inline-flex', color: open ? 'primary.main' : 'text.secondary'}}>
          {open
            ? <KeyboardArrowUpRoundedIcon sx={{fontSize: 16}} />
            : <KeyboardArrowDownRoundedIcon sx={{fontSize: 16}} />}
        </Box>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        transformOrigin={{vertical: 'top', horizontal: 'right'}}
        slotProps={{paper: {sx: {mt: 1, width: 320, borderRadius: 1, overflow: 'hidden'}}}}
      >
        <GridViewPopover
          onClose={closePopover}
          onSaveAs={openSaveAs}
          currentHref={typeof window !== 'undefined' ? window.location.href : ''}
        />
      </Popover>

      <GridViewNamePopover
        anchorEl={nameAnchorEl}
        mode="create"
        initialName=""
        existingNames={views.map(v => v.viewName)}
        onClose={() => setNameAnchorEl(null)}
        onSubmit={submitSaveAs}
      />
    </>
  );
};

export default GridViewPill;
