'use client';

import React from 'react';
import {useTranslation} from 'next-i18next';
import {useConfirm} from 'material-ui-confirm';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import StarOutlineRoundedIcon from '@mui/icons-material/StarOutlineRounded';
import GridViewNamePopover from './grid-view-name-popover';
import {useGridDispatch, useGridSelector} from '~/_lib/grid/state/hooks';
import {useGridSettings} from '~/_lib/grid/context/grid-settings-context';
import {
  viewDuplicate,
  viewRemove,
  viewRename,
  viewSetActive,
  viewSetFavourite,
} from '~/_lib/grid/state/grids-slice';
import {GridViewStoreEntry} from './types';

const menuItemSx = {
  minHeight: 32,
  py: 0.5,
  px: 1.25,
  gap: 0.75,
  '&& .MuiListItemIcon-root': {minWidth: 24},
};
const menuIconSize = {fontSize: 14};
const menuTextSx = {fontSize: 13};
const kbdHintSx = {
  fontSize: 10,
  color: 'text.disabled',
  border: '0.5px solid',
  borderColor: 'divider',
  borderRadius: 0.75,
  px: 0.5,
  py: 0.125,
  ml: 1,
};

interface Props {
  view: GridViewStoreEntry;
  onSelected: () => void;
}

const GridViewPopoverRow: React.FC<Props> = ({view, onSelected}) => {
  const {t} = useTranslation('common');
  const {gridName} = useGridSettings();
  const dispatch = useGridDispatch();
  const confirm = useConfirm();
  const views = useGridSelector(s => s?.grids?.views?.[gridName]) || [];

  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [renameAnchor, setRenameAnchor] = React.useState<HTMLElement | null>(null);
  const rowRef = React.useRef<HTMLDivElement | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };
  const closeMenu = () => setMenuAnchor(null);

  const onSelectView = () => {
    if (!view.isActive) {
      dispatch(viewSetActive({gridName, viewName: view.viewName}));
    }
    onSelected();
  };

  const onSetFavourite = () => {
    dispatch(viewSetFavourite({gridName, viewName: view.viewName}));
    closeMenu();
  };

  const onDuplicate = () => {
    dispatch(viewDuplicate({gridName, viewName: view.viewName}));
    closeMenu();
  };

  const onDelete = () => {
    closeMenu();
    confirm({
      title: t('Delete'),
      description: t('Are you sure you want to delete "{{name}}"?', {name: view.viewName}),
      confirmationText: t('Delete'),
      cancellationText: t('Cancel'),
    }).then(() => {
      dispatch(viewRemove({gridName, viewName: view.viewName}));
    }).catch(() => {/* cancelled */});
  };

  const openRename = () => {
    setRenameAnchor(rowRef.current);
    closeMenu();
  };

  const submitRename = (newName: string) => {
    dispatch(viewRename({gridName, previousName: view.viewName, newName}));
    setRenameAnchor(null);
  };

  const rowBg = view.isActive ? 'background.default' : 'transparent';

  return (
    <>
      <Box
        ref={rowRef}
        onClick={onSelectView}
        data-testid={`grid-view-row-${view.viewName}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          py: 0.875,
          borderRadius: 1,
          cursor: view.isActive ? 'default' : 'pointer',
          backgroundColor: rowBg,
          '&:hover': {backgroundColor: 'action.hover'},
        }}
      >
        <Box sx={{width: 13, display: 'inline-flex', justifyContent: 'center'}}>
          {view.isActive && (
            <CheckRoundedIcon sx={{fontSize: 14, color: 'primary.main'}} />
          )}
        </Box>
        <Box sx={{flex: 1, fontSize: 13, fontWeight: view.isActive ? 500 : 400, color: 'text.primary'}}>
          {view.viewName}
        </Box>
        {view.isFavourite && (
          <StarRoundedIcon sx={{fontSize: 13, color: 'primary.main'}} />
        )}
        <IconButton
          onClick={openMenu}
          size="small"
          data-testid={`grid-view-row-menu-${view.viewName}`}
          sx={{p: 0.25, color: 'text.secondary'}}
        >
          <MoreVertRoundedIcon sx={{fontSize: 16}} />
        </IconButton>
      </Box>


      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        onKeyDown={(e) => {
          if (e.key === 'F2') {
            e.preventDefault();
            openRename();
          }
        }}
        slotProps={{paper: {sx: {minWidth: 180}}}}
      >
        <MenuItem
          onClick={openRename}
          data-testid={`grid-view-rename-${view.viewName}`}
          sx={menuItemSx}
        >
          <ListItemIcon><EditOutlinedIcon sx={menuIconSize} /></ListItemIcon>
          <ListItemText primaryTypographyProps={menuTextSx}>{t('Rename')}</ListItemText>
          <Box sx={kbdHintSx}>F2</Box>
        </MenuItem>
        <MenuItem
          onClick={onDuplicate}
          data-testid={`grid-view-duplicate-${view.viewName}`}
          sx={menuItemSx}
        >
          <ListItemIcon><ContentCopyOutlinedIcon sx={menuIconSize} /></ListItemIcon>
          <ListItemText primaryTypographyProps={menuTextSx}>{t('Duplicate')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={onSetFavourite}
          data-testid={`grid-view-set-favourite-${view.viewName}`}
          sx={menuItemSx}
        >
          <ListItemIcon>
            {view.isFavourite
              ? <StarRoundedIcon sx={{fontSize: 14, color: 'primary.main'}} />
              : <StarOutlineRoundedIcon sx={menuIconSize} />}
          </ListItemIcon>
          <ListItemText primaryTypographyProps={menuTextSx}>
            {view.isFavourite ? t('Favourite') : t('Set as favourite')}
          </ListItemText>
          {view.isFavourite && <CheckRoundedIcon sx={{fontSize: 14, color: 'text.secondary'}} />}
        </MenuItem>
        <Divider sx={{my: 0.5}} />
        <MenuItem
          onClick={onDelete}
          data-testid={`grid-view-delete-${view.viewName}`}
          sx={[menuItemSx, {color: 'error.main'}]}
        >
          <ListItemIcon sx={{color: 'error.main'}}><DeleteOutlineIcon sx={menuIconSize} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{...menuTextSx, color: 'error.main'}}>
            {t('Delete view')}
          </ListItemText>
        </MenuItem>
      </Menu>

      <GridViewNamePopover
        anchorEl={renameAnchor}
        mode="rename"
        initialName={view.viewName}
        existingNames={views.map(v => v.viewName)}
        ignoreName={view.viewName}
        onClose={() => setRenameAnchor(null)}
        onSubmit={(name) => submitRename(name)}
      />
    </>
  );
};

export default GridViewPopoverRow;
